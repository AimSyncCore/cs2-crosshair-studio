"""Build docs/js/pro-crosshairs.js from procrosshairs.com data."""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_CACHE = ROOT / "scripts" / "procrosshairs_raw.json"
OUTPUT = ROOT / "docs" / "js" / "pro-crosshairs.js"

# Team assignments for players listed on procrosshairs.com (CS2 rosters).
PLAYER_TEAMS: dict[str, str] = {
    "donk": "Team Spirit",
    "sh1ro": "Team Spirit",
    "magixx": "Team Spirit",
    "zont1x": "Team Spirit",
    "zweih": "Team Spirit",
    "ZywOo": "Team Vitality",
    "apEX": "Team Vitality",
    "flameZ": "Team Vitality",
    "mezii": "Team Vitality",
    "ropz": "Team Vitality",
    "NiKo": "Team Falcons",
    "TeSeS": "Team Falcons",
    "m0NESY": "Team Falcons",
    "kyousuke": "Team Falcons",
    "kyxsan": "Team Falcons",
    "karrigan": "FaZe Clan",
    "frozen": "FaZe Clan",
    "broky": "FaZe Clan",
    "jcobbb": "FaZe Clan",
    "w0nderful": "Natus Vincere",
    "b1t": "Natus Vincere",
    "iM": "Natus Vincere",
    "jL": "Natus Vincere",
    "Aleksib": "Natus Vincere",
    "Brollan": "MOUZ",
    "Jimpphat": "MOUZ",
    "Spinx": "MOUZ",
    "xertioN": "MOUZ",
    "torzsi": "MOUZ",
    "huNter-": "G2 Esports",
    "Snax": "G2 Esports",
    "MATYS": "G2 Esports",
    "tenzy": "G2 Esports",
    "FalleN": "FURIA",
    "yuurih": "FURIA",
    "YEKINDAR": "FURIA",
    "KSCERATO": "FURIA",
    "molodoy": "FURIA",
    "XANTARES": "Aurora Gaming",
    "woxic": "Aurora Gaming",
    "MAJ3R": "Aurora Gaming",
    "Wicadia": "Aurora Gaming",
    "xfl0ud": "Aurora Gaming",
    "Staehr": "Astralis",
    "jabbi": "Astralis",
    "HooXi": "Astralis",
    "Twistzz": "Team Liquid",
    "NertZ": "Team Liquid",
    "S1ren": "BetBoom Team",
    "Magnojez": "BetBoom Team",
    "Jame": "PARIVISION",
    "AW": "PARIVISION",
    "nota": "PARIVISION",
    "BELCHONOKK": "PARIVISION",
    "xiELO": "PARIVISION",
    "bLitz": "The MongolZ",
    "Techno": "The MongolZ",
    "910": "The MongolZ",
    "mzinho": "The MongolZ",
    "latto": "Legacy",
    "dumau": "Legacy",
    "n1ssim": "Legacy",
    "saadzin": "Legacy",
    "luchov": "9z Team",
    "HUASOPEEK": "9z Team",
    "max": "9z Team",
    "npl": "B8",
    "esenthial": "B8",
    "kensizor": "B8",
    "alex666": "B8",
    "s1zzi": "B8",
    "Tauson": "GamerLegion",
    "PR": "GamerLegion",
    "REZ": "GamerLegion",
    "tN1R": "HEROIC",
    "nilo": "HEROIC",
    "HeavyGod": "Cloud9",
    "SunPayus": "M80",
    "phzy": "M80",
    "dgt": "paiN Gaming",
    "arT": "MIBR",
    "soulfly": "MIBR",
    "FL4MUS": "OG",
    "Neityu": "ENCE",
    "lauNX": "ENCE",
    "dziugss": "ENCE",
    "ryu": "Monte",
    "cmtry": "Monte",
    "cobrazera": "RED Canids",
    "makazze": "Gentle Mates",
    "Krabeni": "Inner Circle Esports",
    "dem0n": "Passion UA",
    "hypex": "ECSTATIC",
    "meyern": "Imperial",
    "sFade8": "Partizan",
    "MaSvAl": "SINNERS",
    "mo0N": "ESC",
    "zorte": "Nexus",
    "xelex": "JiJieHao",
    "misutaaa": "Free Agents",
}


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return cleaned or "item"


def fetch_players() -> list[dict[str, str]]:
    request = urllib.request.Request(
        "https://procrosshairs.com/",
        headers={"User-Agent": "Mozilla/5.0"},
    )
    html = urllib.request.urlopen(request, timeout=30).read().decode("utf-8", errors="replace")
    pattern = re.compile(
        r"&quot;steam_id&quot;:\[0,&quot;\d+&quot;\],"
        r"&quot;nickname&quot;:\[0,&quot;([^&]+)&quot;\],"
        r"&quot;hltv_id&quot;:\[0,&quot;(\d+)&quot;\],"
        r"&quot;rank_score&quot;:\[0,&quot;\d+&quot;\],"
        r"&quot;avatar&quot;:\[0,&quot;[^&]*&quot;\],"
        r"&quot;crosshair_code&quot;:\[0,&quot;(CSGO-[^&]+)&quot;\]",
    )

    players: list[dict[str, str]] = []
    seen: set[str] = set()
    for nickname, hltv_id, share_code in pattern.findall(html):
        key = nickname.lower()
        if key in seen:
            continue
        seen.add(key)
        players.append(
            {
                "name": nickname,
                "shareCode": share_code,
                "hltvId": hltv_id,
            }
        )
    return players


def load_players() -> list[dict[str, str]]:
    if RAW_CACHE.exists():
        return json.loads(RAW_CACHE.read_text(encoding="utf-8"))

    players = fetch_players()
    RAW_CACHE.write_text(json.dumps(players, indent=2), encoding="utf-8")
    return players


def build_groups(players: list[dict[str, str]]) -> list[dict]:
    grouped: dict[str, list[dict]] = {}

    for player in players:
        team = PLAYER_TEAMS.get(player["name"], "Other Pros")
        grouped.setdefault(team, []).append(
            {
                "id": slugify(player["name"]),
                "name": player["name"],
                "shareCode": player["shareCode"],
            }
        )

    priority = [
        "Team Spirit",
        "Team Vitality",
        "Team Falcons",
        "FaZe Clan",
        "Natus Vincere",
        "MOUZ",
        "G2 Esports",
        "FURIA",
        "Aurora Gaming",
        "Astralis",
        "Team Liquid",
    ]

    def sort_key(team_name: str) -> tuple[int, str]:
        if team_name in priority:
            return (priority.index(team_name), team_name)
        if team_name == "Other Pros":
            return (999, team_name)
        return (100, team_name)

    groups = []
    for team_name in sorted(grouped.keys(), key=sort_key):
        groups.append(
            {
                "id": slugify(team_name),
                "label": team_name,
                "players": sorted(grouped[team_name], key=lambda item: item["name"].lower()),
            }
        )
    return groups


def render_js(groups: list[dict]) -> str:
    payload = json.dumps(groups, indent=2)
    return (
        "// Source: https://procrosshairs.com/\n"
        "// Regenerate: python scripts/fetch_pro_crosshairs.py\n"
        f"export const PRO_CROSSHAIR_GROUPS = {payload};\n"
    )


def main() -> int:
    players = load_players()
    if not players:
        print("No players loaded.", file=sys.stderr)
        return 1

    groups = build_groups(players)
    OUTPUT.write_text(render_js(groups), encoding="utf-8")
    total = sum(len(group["players"]) for group in groups)
    print(f"Wrote {len(groups)} groups / {total} players -> {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
