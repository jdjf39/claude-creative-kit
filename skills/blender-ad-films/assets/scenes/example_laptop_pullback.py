"""Shot 8 (2.9 s = 70 f), reference 22.3-25.2 s: close on the laptop showing Gemini, pull back to the wide desk, hold."""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector
from base import reset, render_settings, camera, key, render_shot
import desk_world as dw

reset()
render_settings(1920, 1080)
dw.grade(bpy.context.scene)
lap, scr = dw.build(screen_tex="gemini_home.png")
bpy.context.view_layer.update()
c = scr.matrix_world.translation.copy()

cam = camera(loc=(0.05, dw.WALL_Y - 1.75, 0.95), target=(0.03, dw.WALL_Y, 0.84), lens=36, fstop=2.8, focus_obj=scr)
bpy.ops.object.empty_add(location=tuple(c)); aim = bpy.context.active_object
tc = cam.constraints.new("TRACK_TO"); tc.target = aim; tc.track_axis = "TRACK_NEGATIVE_Z"; tc.up_axis = "UP_Y"
close_loc = (c.x + 0.005, c.y - 0.7, c.z - 0.035)
wide_loc = (0.05, dw.WALL_Y - 1.75, 0.95)
key(cam, 1, loc=close_loc); key(aim, 1, loc=(c.x, c.y, c.z - 0.02))
key(cam, 8, loc=(close_loc[0], close_loc[1] - 0.03, close_loc[2]))
key(cam, 56, loc=wide_loc); key(aim, 56, loc=(0.03, dw.WALL_Y, 0.84))
key(cam, 94, loc=(wide_loc[0], wide_loc[1] + 0.04, wide_loc[2])); key(aim, 94, loc=(0.03, dw.WALL_Y, 0.84))
render_shot("sh08_pullback", 94)
