# Run from this folder: python3 make-rose.py  (rewrites rose.json)
# Rose Tower 3D: floating island, white tower, blocky platforms spiraling up around it.
import json, math
W = D = 19
C = 9.5                     # tower center (cells 7..11)
ISLAND_TOP = 4              # grass layer cell y; you stand at y=5
blocks = []
def box(x, y, z, w, h, d, t): blocks.append([x, y, z, w, h, d, t])

# Floating island (grass on top, dirt tapering underneath)
box(4, 4, 4, 11, 1, 11, 'grass')
box(5, 3, 5, 9, 1, 9, 'dirt')
box(6, 2, 6, 7, 1, 7, 'dirt')
box(7, 1, 7, 5, 1, 5, 'dirt')
box(8, 0, 8, 3, 1, 3, 'dirt')

R = 6.6
STEP = math.radians(36)
a0 = math.radians(90 + 36)   # first step is just past the start, on the +z side
N = 24
checkpoints, y = [], ISLAND_TOP
cells = set()
def footprint(cx, cz, s):
    x0 = int(round(cx - s / 2)); z0 = int(round(cz - s / 2))
    return x0, z0
for k in range(N):
    a = a0 + k * STEP
    y += 1
    cx, cz = C + R * math.cos(a), C + R * math.sin(a)
    if k % 6 == 5:                       # checkpoint: 3x3 grass + flower
        x0, z0 = footprint(cx, cz, 3)
        box(x0, y, z0, 3, 1, 3, 'grass')
        checkpoints.append([x0 + 1.5, y + 1, z0 + 1.5])
    elif k % 6 == 2:                     # thorn in the middle of a 3x3 - go around it
        x0, z0 = footprint(cx, cz, 3)
        box(x0, y, z0, 3, 1, 3, 'vine')
        box(x0 + 1, y + 1, z0 + 1, 1, 1, 1, 'thorn')
    else:
        x0, z0 = footprint(cx, cz, 2)
        box(x0, y, z0, 2, 1, 2, 'vine')
# One step in toward the tower, then the roof
a = a0 + N * STEP
y += 1
x0, z0 = footprint(C + 4.6 * math.cos(a), C + 4.6 * math.sin(a), 2)
box(x0, y, z0, 2, 1, 2, 'vine')
roof = y + 1
box(7, ISLAND_TOP + 1, 7, 5, roof - ISLAND_TOP, 5, 'brick')   # tower from island to roof
level = {
    'name': 'ROSE TOWER',
    'size': [W, roof + 8, D],
    'fallY': -4,
    'start': [C, ISLAND_TOP + 1, 13.5],
    'startYaw': 0,
    'checkpoints': checkpoints,
    'seed': [C, roof + 1.6, C],
    'blocks': blocks,
}
with open('rose.json', 'w') as f:
    f.write('{\n')
    for k in ['name', 'size', 'fallY', 'start', 'startYaw', 'checkpoints', 'seed']:
        f.write(f'  {json.dumps(k)}: {json.dumps(level[k])},\n')
    f.write('  "blocks": [\n' + ',\n'.join('    ' + json.dumps(b) for b in blocks) + '\n  ]\n}\n')
print('roof', roof, 'blocks', len(blocks), 'checkpoints', checkpoints)
