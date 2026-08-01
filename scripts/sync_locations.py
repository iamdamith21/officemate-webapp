#!/usr/bin/env python3
"""
sync_locations.py — copy the robot's saved locations into the web app.

    node/python3 scripts/sync_locations.py                 # pull from the robot over ssh
    python3 scripts/sync_locations.py --dry                # show the diff, write nothing
    python3 scripts/sync_locations.py --file locations.json  # use a local copy

Why this exists
---------------
The robot is the single source of truth for poses: `loc.sh save <name>` writes
them to ~/maps/locations.json, keyed by map name. The web app needs the same
poses so it can draw the destinations and hand Nav2 a goal. Until now that copy
was done BY HAND, which means the app silently drifts from the robot the moment
anyone re-saves a location — and a stale pose is invisible until the robot
drives to the wrong place.

What is preserved vs regenerated
--------------------------------
Regenerated from the robot: x, y, yaw and the quaternion.
Preserved from the existing file, keyed by rosName: `label`, `isBase`, `note`.
Those are human decisions ("base_station" is displayed as "Dean Sir Office")
and the robot knows nothing about them.

A location on the robot with no known label is still written, with a label
derived from its name and a REVIEW marker, so it appears in the app rather than
being silently dropped.

Run loccost.py / nudge_locations.py on the robot FIRST
------------------------------------------------------
`dock` and `navSafe` are written identical here, which is only correct while the
stored poses sit on ground Nav2 will actually enter. Saving a location against a
wall produces a pose the planner accepts and the controller then refuses, with
"collision ahead" that never names the goal. This script warns but cannot check
that itself — it has no costmap.
"""
import argparse
import json
import math
import os
import re
import subprocess
import sys

PI = 'damith-raspberry@damith-Raspberry-4B.local'
REMOTE_JSON = '~/maps/locations.json'
DEFAULT_MAP = 'faculty_map'
CONSTANTS = os.path.join(os.path.dirname(__file__), '..', 'src', 'constants', 'index.js')

BEGIN = 'export const NAV_LOCATIONS = ['
END = '];'


def yaw_deg(z, w):
    return math.degrees(math.atan2(2.0 * w * z, 1.0 - 2.0 * z * z))


def slug(name):
    return re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')


def fetch(args):
    if args.file:
        with open(args.file) as f:
            return json.load(f)
    out = subprocess.run(['ssh', '-o', 'ConnectTimeout=8', PI, f'cat {REMOTE_JSON}'],
                         capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit(f'ERROR: could not read {REMOTE_JSON} from the robot.\n'
                 f'       {out.stderr.strip()}\n'
                 f'       Use --file if you have a local copy.')
    return json.loads(out.stdout)


def existing_meta(src):
    """Pull label / isBase / note out of the current file, keyed by rosName.

    Parsed rather than imported because this is a .js file; the fields are
    simple string/bool literals so a targeted regex is honest here.
    """
    meta = {}
    block = src[src.find(BEGIN):]
    for entry in re.findall(r'\{(.*?)\},\s*(?=\{|\])', block, re.S):
        m = re.search(r"rosName:\s*'([^']+)'", entry)
        if not m:
            continue
        e = {'label': None, 'isBase': 'isBase: true' in entry, 'note': None,
             'id': None, 'surveyedAt': None}
        lm = re.search(r"label:\s*'([^']*)'", entry)
        nm = re.search(r"note:\s*'([^']*)'", entry)
        im = re.search(r"id:\s*'([^']*)'", entry)
        if lm:
            e['label'] = lm.group(1)
        if nm:
            e['note'] = nm.group(1)
        # Keep the existing id. Regenerating it from the label would rename
        # dean_office -> dean_sir_office on the first sync, and ids are what the
        # UI keys and compares on.
        if im:
            e['id'] = im.group(1)
        # Carry the original parked pose through. It is history the robot no
        # longer has -- once nudge_locations relocates a location, the robot's
        # json only knows the new pose -- so regenerating without it would
        # silently destroy the record of where the spot actually was.
        sm = re.search(r'surveyedAt:\s*(\{[^}]*\})', entry)
        if sm:
            e['surveyedAt'] = sm.group(1)
        meta[m.group(1)] = e
    return meta


def render(locs, meta):
    lines = [BEGIN]
    review = []
    for ros_name in sorted(locs):
        p = locs[ros_name]
        o = p.get('orientation', {})
        z, w = float(o.get('z', 0.0)), float(o.get('w', 1.0))
        yaw = yaw_deg(z, w)
        m = meta.get(ros_name)
        if m and m['label']:
            label = m['label']
        else:
            label = ros_name.replace('_', ' ').title()
            review.append(ros_name)
        pose = ('{ x: %.3f, y: %.3f, yaw: %.1f, z: %.4f, w: %.4f }'
                % (float(p['x']), float(p['y']), yaw, z, w))
        lines.append('  {')
        lines.append("    id: '%s'," % ((m and m['id']) or slug(label)))
        lines.append("    label: '%s'," % label.replace("'", "\\'"))
        lines.append("    rosName: '%s'," % ros_name)
        if m and m['isBase']:
            lines.append('    isBase: true,')
        lines.append('    dock:    %s,' % pose)
        lines.append('    navSafe: %s,' % pose)
        lines.append('    dockCost: 0,')
        if m and m['surveyedAt']:
            lines.append('    surveyedAt: %s,' % m['surveyedAt'])
        if ros_name in review:
            lines.append("    note: 'REVIEW: auto-added by sync_locations; set a "
                         "proper label.',")
        elif m and m['note']:
            lines.append("    note: '%s'," % m['note'].replace("'", "\\'"))
        lines.append('  },')
    lines.append(END)
    return '\n'.join(lines), review


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--map', default=DEFAULT_MAP)
    ap.add_argument('--file', help='read a local locations.json instead of ssh')
    ap.add_argument('--dry', action='store_true')
    args = ap.parse_args()

    data = fetch(args)
    locs = data.get(args.map)
    if not locs:
        sys.exit(f'ERROR: no locations for map "{args.map}". '
                 f'Found: {", ".join(data) or "(none)"}')

    path = os.path.normpath(CONSTANTS)
    src = open(path).read()
    start = src.find(BEGIN)
    if start < 0:
        sys.exit(f'ERROR: {BEGIN!r} not found in {path}')
    end = src.find('\n' + END, start)
    if end < 0:
        sys.exit('ERROR: could not find the end of the NAV_LOCATIONS array')
    end += len('\n' + END)

    meta = existing_meta(src)
    block, review = render(locs, meta)

    print(f'map "{args.map}" — {len(locs)} location(s)')
    for n in sorted(locs):
        p = locs[n]
        o = p.get('orientation', {})
        lbl = (meta.get(n) or {}).get('label') or '(new)'
        print('  %-16s -> %-18s x=%+.3f y=%+.3f yaw=%+.1f'
              % (n, lbl, float(p['x']), float(p['y']),
                 yaw_deg(float(o.get('z', 0)), float(o.get('w', 1)))))

    gone = [r for r in meta if r not in locs]
    if gone:
        print('\nREMOVED (in the app, not on the robot): ' + ', '.join(gone))
    if review:
        print('\nNEW, labelled automatically — set a real label: ' + ', '.join(review))

    if args.dry:
        print('\n--- would write ---')
        print(block)
        return

    open(path, 'w').write(src[:start] + block + src[end:])
    print(f'\nwrote {path}')
    print('Rebuild/restart the web app (npm run dev picks it up on save).')
    print('Reminder: run loccost.py on the robot to confirm every pose is '
          'still reachable.')


if __name__ == '__main__':
    main()
