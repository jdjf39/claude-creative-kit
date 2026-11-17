/**
 * The iPhone's screen across the journey — one CanvasTexture, six states,
 * every frame a PURE function of (state, k) where k is the section's local
 * scroll progress. Scrubbing reveals transcript bubbles, texts, and
 * calendar fills; scrolling back rewinds them. No timers, no randomness —
 * poster and seam proofs stay exact.
 */
import * as THREE from 'three'
import { CALL_SCRIPT } from '../../data/business'

export type ScreenState = 'ring' | 'live' | 'sms' | 'flows' | 'calendar' | 'idle'

const W = 512
const H = 1024
const CYAN = '#2ef0f0'
const INK = '#070d11'

export function createScreenStory(): {
  texture: THREE.CanvasTexture
  draw: (state: ScreenState, k: number) => void
  dispose: () => void
} {
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!
  const texture = new THREE.CanvasTexture(cv)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4

  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
  }

  const bg = () => {
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H)
    g.addColorStop(0, '#0d151b')
    g.addColorStop(1, INK)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    // dynamic island
    ctx.fillStyle = '#020507'
    rr(W / 2 - 78, 26, 156, 44, 22)
    ctx.fill()
    ctx.fillStyle = 'rgba(233,240,242,0.55)'
    ctx.font = '600 22px "Geist Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText('9:41', 44, 56)
    ctx.textAlign = 'right'
    ctx.fillText('5G ▮▮▮', W - 44, 56)
  }

  function ring(k: number) {
    bg()
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(118,133,140,0.9)'
    ctx.font = '500 24px "Geist Mono", monospace'
    ctx.fillText('INCOMING CALL', W / 2, 220)

    // ripple rings — phase from k (scroll-scrubbed, reversible)
    ctx.strokeStyle = 'rgba(46,240,240,0.4)'
    ctx.lineWidth = 3
    for (let i = 0; i < 3; i++) {
      const rp = 80 + ((k * 260 + i * 34) % 102)
      ctx.globalAlpha = Math.max(0, 0.55 - rp / 240)
      ctx.beginPath()
      ctx.arc(W / 2, 408, rp, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = '#12333a'
    ctx.beginPath()
    ctx.arc(W / 2, 408, 74, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(160,200,205,0.35)'
    ctx.stroke()
    ctx.fillStyle = '#c8f4f4'
    ctx.font = '600 52px "Clash Display", sans-serif'
    ctx.fillText('NC', W / 2, 426)

    ctx.fillStyle = '#e9f0f2'
    ctx.font = '600 44px "Clash Display", sans-serif'
    ctx.fillText(CALL_SCRIPT.caller, W / 2, 566)
    ctx.fillStyle = 'rgba(118,133,140,0.9)'
    ctx.font = '400 24px "Geist Mono", monospace'
    ctx.fillText('Mobile · Lexington, KY', W / 2, 610)

    ctx.fillStyle = '#3a1216'
    ctx.beginPath()
    ctx.arc(W / 2 - 110, 856, 56, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = CYAN
    ctx.beginPath()
    ctx.arc(W / 2 + 110, 856, 56, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = '500 34px sans-serif'
    ctx.fillStyle = '#ff8a8a'
    ctx.fillText('✕', W / 2 - 110, 868)
    ctx.fillStyle = INK
    ctx.fillText('✓', W / 2 + 110, 868)
  }

  const bubble = (text: string, who: 'ai' | 'cust', y: number, reveal: number): number => {
    const maxW = W * 0.68
    ctx.font = '400 27px "Hanken Grotesk", sans-serif'
    const words = text.split(' ')
    const lines: string[] = []
    let line = ''
    for (const w2 of words) {
      const t = line ? line + ' ' + w2 : w2
      if (ctx.measureText(t).width > maxW - 56) {
        lines.push(line)
        line = w2
      } else line = t
    }
    lines.push(line)
    const bh = lines.length * 36 + 34
    const bw = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 56)
    const bx = who === 'ai' ? 44 : W - 44 - bw
    ctx.globalAlpha = Math.min(1, reveal)
    const rise = (1 - Math.min(1, reveal)) * 18
    ctx.fillStyle = who === 'ai' ? '#101a21' : '#12333a'
    rr(bx, y + rise, bw, bh, 22)
    ctx.fill()
    if (who === 'ai') {
      ctx.strokeStyle = 'rgba(160,200,205,0.16)'
      ctx.stroke()
    }
    ctx.fillStyle = who === 'ai' ? '#a7b6bc' : '#c8f4f4'
    ctx.textAlign = 'left'
    lines.forEach((l, li) => ctx.fillText(l, bx + 28, y + rise + 44 + li * 36))
    ctx.globalAlpha = 1
    return bh
  }

  function header(label: string, right: string) {
    ctx.fillStyle = CYAN
    ctx.beginPath()
    ctx.arc(52, 116, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(233,240,242,0.85)'
    ctx.font = '500 26px "Geist Mono", monospace'
    ctx.fillText(label, 76, 126)
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(118,133,140,0.9)'
    ctx.fillText(right, W - 44, 126)
    ctx.strokeStyle = 'rgba(160,200,205,0.14)'
    ctx.beginPath()
    ctx.moveTo(44, 152)
    ctx.lineTo(W - 44, 152)
    ctx.stroke()
  }

  function live(k: number) {
    bg()
    header(CALL_SCRIPT.agentName, `00:${String(Math.min(59, Math.round(6 + k * 40))).padStart(2, '0')}`)
    // each bubble reveals across its slice of k — scrubbed by scroll
    const N = CALL_SCRIPT.transcript.length
    let y = 210
    for (let i = 0; i < N; i++) {
      const reveal = (k * (N + 0.8) - i) / 0.8
      if (reveal <= 0) break
      const m = CALL_SCRIPT.transcript[i]
      y += bubble(m.text, m.who as 'ai' | 'cust', y, reveal) + 22
    }
    ctx.fillStyle = 'rgba(9,14,18,0.9)'
    rr(44, H - 118, W - 88, 66, 16)
    ctx.fill()
    ctx.strokeStyle = 'rgba(160,200,205,0.14)'
    ctx.stroke()
    ctx.fillStyle = CYAN
    ctx.beginPath()
    ctx.arc(76, H - 85, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(118,133,140,0.95)'
    ctx.font = '400 22px "Geist Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText('AI listening · booking in calendar…', 100, H - 77)
  }

  const SMS: [string, 'ai' | 'cust'][] = [
    ['Missed your call — this is Bluegrass Plumbing’s assistant. Want us to call back or book you in?', 'ai'],
    ['Book me in please', 'cust'],
    ['Done — tomorrow 9:30 AM. Confirmation on the way. 👍', 'ai'],
  ]

  function sms(k: number) {
    bg()
    header('Messages · AI Front Desk', 'now')
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(118,133,140,0.7)'
    ctx.font = '400 20px "Geist Mono", monospace'
    ctx.fillText('Missed call · 6:42 PM — text-back in 9s', W / 2, 196)
    let y = 232
    for (let i = 0; i < SMS.length; i++) {
      const reveal = (k * (SMS.length + 0.8) - i) / 0.8
      if (reveal <= 0) break
      y += bubble(SMS[i][0], SMS[i][1], y, reveal) + 20
    }
  }

  const FLOWS = ['Calendar synced', 'Reminder queued', 'Review request armed', 'Quote drafted']

  function flows(k: number) {
    bg()
    header('Acme · Automations', 'live')
    let y = 230
    for (let i = 0; i < FLOWS.length; i++) {
      const reveal = (k * (FLOWS.length + 0.8) - i) / 0.8
      if (reveal <= 0) break
      ctx.globalAlpha = Math.min(1, reveal)
      ctx.fillStyle = '#0d151b'
      rr(44, y, W - 88, 92, 18)
      ctx.fill()
      ctx.strokeStyle = 'rgba(160,200,205,0.16)'
      ctx.stroke()
      ctx.fillStyle = CYAN
      ctx.beginPath()
      ctx.arc(86, y + 46, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#e9f0f2'
      ctx.textAlign = 'left'
      ctx.font = '500 26px "Hanken Grotesk", sans-serif'
      ctx.fillText(FLOWS[i], 120, y + 56)
      ctx.globalAlpha = 1
      y += 116
    }
  }

  function calendar(k: number) {
    bg()
    header('Tuesday · Schedule', 'Week 29')
    const slots = ['8:00', '9:30', '11:00', '1:00', '2:30', '4:00']
    const booked = [true, true, false, true, false, true]
    let y = 210
    slots.forEach((t, i) => {
      const reveal = (k * (slots.length + 1.2) - i) / 1.0
      const on = booked[i] && reveal > 0.5
      ctx.fillStyle = on ? '#0e2f34' : '#0b1218'
      rr(44, y, W - 88, 88, 16)
      ctx.fill()
      ctx.strokeStyle = on ? 'rgba(46,240,240,0.4)' : 'rgba(160,200,205,0.12)'
      ctx.stroke()
      ctx.textAlign = 'left'
      ctx.fillStyle = 'rgba(118,133,140,0.95)'
      ctx.font = '500 24px "Geist Mono", monospace'
      ctx.fillText(t, 68, y + 54)
      ctx.fillStyle = on ? '#c8f4f4' : 'rgba(118,133,140,0.45)'
      ctx.font = '500 25px "Hanken Grotesk", sans-serif'
      ctx.fillText(on ? (i === 1 ? 'Water heater — NEW' : 'Booked') : 'Open', 170, y + 54)
      if (on && i === 1) {
        ctx.fillStyle = CYAN
        ctx.beginPath()
        ctx.arc(W - 84, y + 44, 8, 0, Math.PI * 2)
        ctx.fill()
      }
      y += 108
    })
    if (k > 0.75) {
      ctx.globalAlpha = Math.min(1, (k - 0.75) * 5)
      ctx.fillStyle = '#0e2f34'
      rr(44, y + 6, W - 88, 70, 16)
      ctx.fill()
      ctx.strokeStyle = 'rgba(46,240,240,0.5)'
      ctx.stroke()
      ctx.textAlign = 'center'
      ctx.fillStyle = '#c8f4f4'
      ctx.font = '500 24px "Geist Mono", monospace'
      ctx.fillText('Booked while you were on a job', W / 2, y + 50)
      ctx.globalAlpha = 1
    }
  }

  function idle(k: number) {
    bg()
    ctx.textAlign = 'center'
    ctx.fillStyle = CYAN
    ctx.beginPath()
    ctx.arc(W / 2, 380, 64 + 5 * Math.sin(k * Math.PI * 2), 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = INK
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(W / 2 - 28, 380)
    ctx.lineTo(W / 2 - 6, 404)
    ctx.lineTo(W / 2 + 32, 352)
    ctx.stroke()
    ctx.fillStyle = '#e9f0f2'
    ctx.font = '600 42px "Clash Display", sans-serif'
    ctx.fillText('0 missed calls', W / 2, 540)
    ctx.fillStyle = 'rgba(118,133,140,0.95)'
    ctx.font = '400 25px "Hanken Grotesk", sans-serif'
    ctx.fillText('Today · handled by Acme AI', W / 2, 586)
    ctx.fillStyle = CYAN
    ctx.font = '500 24px "Geist Mono", monospace'
    ctx.fillText('THE SIGNAL NEVER SLEEPS', W / 2, 700)
  }

  const draw = (state: ScreenState, k: number) => {
    if (state === 'ring') ring(k)
    else if (state === 'live') live(k)
    else if (state === 'sms') sms(k)
    else if (state === 'flows') flows(k)
    else if (state === 'calendar') calendar(k)
    else idle(k)
    texture.needsUpdate = true
  }

  return { texture, draw, dispose: () => texture.dispose() }
}
