"""Post real WindowServer mouse events; never use Chromium's input API."""
import ctypes
import sys
import time

core = ctypes.CDLL('/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics')
foundation = ctypes.CDLL('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')


class Point(ctypes.Structure):
    _fields_ = [('x', ctypes.c_double), ('y', ctypes.c_double)]


core.CGPreflightPostEventAccess.restype = ctypes.c_bool
core.CGEventCreateMouseEvent.argtypes = [ctypes.c_void_p, ctypes.c_uint32, Point, ctypes.c_uint32]
core.CGEventCreateMouseEvent.restype = ctypes.c_void_p
core.CGEventPost.argtypes = [ctypes.c_uint32, ctypes.c_void_p]
foundation.CFRelease.argtypes = [ctypes.c_void_p]
if not core.CGPreflightPostEventAccess():
    sys.exit('Native mouse injection requires macOS Accessibility permission for this terminal/Python.')

mode, x, y = sys.argv[1:4]
x, y = float(x), float(y)
events = [(5, x, y), (1, x, y)]  # moved, left down
if mode == 'drag':
    events += [(6, x + step * 4, y + step * 2) for step in range(1, 16)]
    x, y = x + 60, y + 30
elif mode != 'click':
    sys.exit('Expected click or drag')
events.append((2, x, y))  # left up
for kind, px, py in events:
    event = core.CGEventCreateMouseEvent(None, kind, Point(px, py), 0)
    if not event:
        sys.exit('CGEventCreateMouseEvent failed')
    core.CGEventPost(0, event)
    foundation.CFRelease(event)
    time.sleep(0.08)
