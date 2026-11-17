/**
 * Spline camera rig — v2: a CLOSED circuit. Centripetal Catmull-Rom loops
 * through the waypoint cameras (control point k at t = k/N on a closed
 * curve), so getPointAt(0) === getPointAt(1) and the loop wrap is
 * seam-exact by construction. A second closed spline carries the look
 * targets; a look-ahead blend toward the path tangent peaks mid-travel.
 *
 * Pose is a pure function of (p, anchors) — no accumulated state; the
 * damping the user feels lives in the engine's p, not here.
 */
import * as THREE from 'three'
import { WAYPOINTS, segmentAt, type Anchors } from './timeline'

const LOOK_AHEAD = 3.2 // how far along the tangent the travel gaze leads
const LOOK_AHEAD_MIX = 0.45 // max blend toward tangent, mid-travel

export type Pose = {
  cam: THREE.Vector3
  look: THREE.Vector3
  fov: number
}

export function createRig() {
  const N = WAYPOINTS.length
  const camPts = WAYPOINTS.map((w) => new THREE.Vector3(...w.cam))
  const lookPts = WAYPOINTS.map((w) => new THREE.Vector3(...w.look))
  const camCurve = new THREE.CatmullRomCurve3(camPts, true, 'centripetal', 0.5)
  const lookCurve = new THREE.CatmullRomCurve3(lookPts, true, 'centripetal', 0.5)

  /** Arc-length fraction of each control point on its CLOSED curve —
   *  N+1 entries; control point k sits at t = k/N, us[N] = 1 ≡ point 0. */
  function controlUs(curve: THREE.CatmullRomCurve3): number[] {
    const DIV = 400
    const lengths = curve.getLengths(DIV)
    const total = lengths[DIV] || 1
    const us: number[] = []
    for (let k = 0; k <= N; k++) {
      const idx = Math.round((k / N) * DIV)
      us.push(lengths[idx] / total)
    }
    us[0] = 0
    us[N] = 1
    return us
  }

  const camUs = controlUs(camCurve)
  const lookUs = controlUs(lookCurve)

  const tmpTan = new THREE.Vector3()
  const tmpAhead = new THREE.Vector3()

  /** Compute the pose for p into `out` (allocation-free per frame). */
  function poseAt(p: number, anchors: Anchors, out: Pose): Pose {
    const { i, t } = segmentAt(p, anchors)
    const j = (i + 1) % N

    const u = camUs[i] + (camUs[i + 1] - camUs[i]) * t
    const ul = lookUs[i] + (lookUs[i + 1] - lookUs[i]) * t
    camCurve.getPointAt(u, out.cam)
    lookCurve.getPointAt(ul, out.look)

    // look-ahead: bell over the (already plateau-eased) segment t — the gaze
    // leans into the direction of travel between waypoints, frames the
    // authored target at every stop
    const bell = 4 * t * (1 - t) * LOOK_AHEAD_MIX
    if (bell > 0.001) {
      camCurve.getTangentAt(u, tmpTan)
      tmpAhead.copy(out.cam).addScaledVector(tmpTan, LOOK_AHEAD)
      out.look.lerp(tmpAhead, bell)
    }

    out.fov = WAYPOINTS[i].fov + (WAYPOINTS[j].fov - WAYPOINTS[i].fov) * t
    return out
  }

  return { poseAt, camCurve, lookCurve }
}

export const newPose = (): Pose => ({
  cam: new THREE.Vector3(),
  look: new THREE.Vector3(),
  fov: 45,
})
