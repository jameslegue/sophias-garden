# Builds every 3D level file. Run from this folder:  python3 make-levels.py
# Each floor is a floating island with a white tower; platforms spiral up around it, and
# each floor swaps in its own trick blocks (same tricks as the 2D floors).
import json, math

W = D = 19
C = 9.5              # tower center (cells 7..11)
ISLAND_TOP = 4       # grass layer; you stand at y=5
R = 6.6              # how far the platforms are from the tower center
STEP = math.radians(36)
A0 = math.radians(90 + 36)
N = 24

FLOORS = {
    # name, sky color, next floor
    'rose': ('ROSE TOWER', '#41a6f6', 'carrot'),
    'carrot': ('CARROT TOWER', '#ffcd75', 'apple'),
    'apple': ('APPLE TOWER', '#73c2f6', 'melon'),
    'melon': ('MELON TOWER', '#29366f', 'strawberry'),
    'strawberry': ('STRAWBERRY TOWER', '#ff9dbd', 'battle'),
}


def island(blocks, top=ISLAND_TOP, x0=4, size=11):
    blocks.append([x0, top, x0, size, 1, size, 'grass'])
    for i, y in enumerate(range(top - 1, top - 5, -1)):
        s = size - 2 * (i + 1)
        if s > 0:
            blocks.append([x0 + i + 1, y, x0 + i + 1, s, 1, s, 'dirt'])


def footprint(cx, cz, s):
    return int(round(cx - s / 2)), int(round(cz - s / 2))


def tower_floor(theme):
    name, sky, nxt = FLOORS[theme]
    blocks, dynamic, apples, checkpoints = [], [], [], []
    island(blocks)
    y = ISLAND_TOP
    normal = 0
    for k in range(N):
        a = A0 + k * STEP
        y += 1
        cx, cz = C + R * math.cos(a), C + R * math.sin(a)
        if k % 6 == 5:                                   # checkpoint: 3x3 grass + flower
            x0, z0 = footprint(cx, cz, 3)
            blocks.append([x0, y, z0, 3, 1, 3, 'grass'])
            checkpoints.append([x0 + 1.5, y + 1, z0 + 1.5])
            continue
        if k % 6 == 2:                                   # 3x3 with a thorn to get around
            x0, z0 = footprint(cx, cz, 3)
            base = {'melon': 'juice'}.get(theme, 'branch' if theme == 'apple' else 'vine')
            blocks.append([x0, y, z0, 3, 1, 3, base])
            if theme == 'melon':                         # slippery juice: thorn on the far edge
                ox, oz = (cx - C) / R, (cz - C) / R
                tx = x0 + 1 + (1 if ox > 0.5 else -1 if ox < -0.5 else 0)
                tz = z0 + 1 + (1 if oz > 0.5 else -1 if oz < -0.5 else 0)
                blocks.append([tx, y + 1, tz, 1, 1, 1, 'thorn'])
            else:
                blocks.append([x0 + 1, y + 1, z0 + 1, 1, 1, 1, 'thorn'])
            continue
        x0, z0 = footprint(cx, cz, 2)
        normal += 1
        if theme == 'rose':
            blocks.append([x0, y, z0, 2, 1, 2, 'vine'])
        elif theme == 'carrot':
            dynamic.append([x0, y, z0, 2, 1, 2, 'carrot'])
            if k >= 3:                                   # stand too long and you sink into these
                blocks.append([x0, y - 2, z0, 2, 1, 2, 'thorn'])
        elif theme == 'apple':
            blocks.append([x0, y, z0, 2, 1, 2, 'branch'])
            blocks.append([x0, y + 5, z0, 2, 1, 2, 'leaves'])   # leafy canopy the apple hangs from
            apples.append([x0 + (normal % 2), y + 4, z0 + ((normal // 2) % 2)])
        elif theme == 'melon':
            blocks.append([x0, y, z0, 2, 1, 2, 'melon' if normal % 2 else 'vine'])   # bounce, then land on a vine
        elif theme == 'strawberry':
            if normal % 3 == 0:                          # tiny seed steps
                blocks.append([x0, y, z0, 1, 1, 1, 'seedstep'])
                blocks.append([x0 + 1, y, z0 + 1, 1, 1, 1, 'seedstep'])
            else:
                dynamic.append([x0, y, z0, 2, 1, 2, 'berry'])
    # One step in toward the tower, then the roof with the seed
    a = A0 + N * STEP
    y += 1
    x0, z0 = footprint(C + 4.6 * math.cos(a), C + 4.6 * math.sin(a), 2)
    blocks.append([x0, y, z0, 2, 1, 2, 'vine'])
    roof = y + 1
    blocks.append([7, ISLAND_TOP + 1, 7, 5, roof - ISLAND_TOP, 5, 'brick'])
    return {
        'name': name, 'fruit': theme, 'next': nxt, 'sky': sky,
        'size': [W, roof + 8, D], 'fallY': -4,
        'start': [C, ISLAND_TOP + 1, 13.5], 'startYaw': 0,
        'checkpoints': checkpoints, 'seed': [C, roof + 1.6, C],
        'dynamic': dynamic, 'apples': apples, 'blocks': blocks,
    }


def battle():
    blocks = []
    island(blocks, top=4, x0=3, size=15)
    blocks.append([3, 5, 3, 3, 1, 3, 'vine'])      # little hills to jump up on
    blocks.append([15, 5, 3, 3, 1, 3, 'vine'])
    patches = []
    for i in range(5):                              # Sophia's garden beds along the back
        x = 5 + i * 2.5
        patches.append([x + 0.5, 5, 16.5])
        blocks.append([int(x), 4, 16, 1, 1, 1, 'dirt'])
    return {
        'name': 'BATTLE VS SOPHIA', 'fruit': None, 'next': None, 'sky': '#3b5dc9',
        'size': [21, 16, 21], 'fallY': -4,
        'start': [10.5, 5, 14.5], 'startYaw': 0,
        'checkpoints': [], 'seed': None, 'dynamic': [], 'apples': [],
        'battle': {'spots': [[5.5, 5, 6.5], [10.5, 5, 5.5], [15.5, 5, 6.5]], 'patches': patches},
        'blocks': blocks,
    }


def write(name, level):
    with open(f'{name}.json', 'w') as f:
        f.write('{\n')
        keys = [k for k in level if k != 'blocks']
        for k in keys:
            f.write(f'  {json.dumps(k)}: {json.dumps(level[k])},\n')
        f.write('  "blocks": [\n' + ',\n'.join('    ' + json.dumps(b) for b in level['blocks']) + '\n  ]\n}\n')
    print(name, len(level['blocks']), 'blocks')


for theme in FLOORS:
    write(theme, tower_floor(theme))
write('battle', battle())
