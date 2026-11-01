#!/usr/bin/env python3
"""Copy each app's homepage screenshots from its own website repo, so ozols.dev shows the same framed
shots (Apple's bezel since 2026-11-01). Run after an app site re-frames its images, then build.py.

    python3 _gen/sync_shots.py
"""
import os
import shutil

X = os.path.expanduser("~/Documents/Xcode")
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "apps")
SHOTS = {  # ozols.dev file -> source in the app's site repo (matched pixel for pixel on 2026-11-01)
    "alarm-shot-1.webp": "AlarmPlanner/website/assets/shot-list.webp",
    "alarm-shot-2.webp": "AlarmPlanner/website/assets/shot-calendar.webp",
    "charactersheet-shot.webp": "CharacterSheet/CharacterSheet/website/assets/shot-home.webp",
    "charactersheet-shot-2.webp": "CharacterSheet/CharacterSheet/website/assets/shot-quests.webp",
    "choru-shot.webp": "Choru/website/assets/shot-chores.webp",
    "choru-shot-2.webp": "Choru/website/assets/shot-rewards.webp",
    "remi-shot.webp": "Remi Reminders/RemiDomain/assets/guides/list.webp",
    "remi-shot-2.webp": "Remi Reminders/RemiDomain/assets/guides/yearly-orange.webp",
    "rise-shot.webp": "Rise Alarm & Focus/MorningRoutine/Domain/assets/shot-ringing.webp",
    "rise-shot-2.webp": "Rise Alarm & Focus/MorningRoutine/Domain/assets/shot-timer.webp",
    "scooch-shot.webp": "Scooch/website/assets/shot-plan.webp",
    "scooch-shot-2.webp": "Scooch/website/assets/shot-clash.webp",
}
for dst, src in SHOTS.items():
    shutil.copyfile(os.path.join(X, src), os.path.join(OUT, dst))
    print(f"{dst:28s} <- {src}")
