import json
import re
import urllib.request
from pathlib import Path

req = urllib.request.Request("https://procrosshairs.com/", headers={"User-Agent": "Mozilla/5.0"})
html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", errors="replace")
pattern = re.compile(
    r"&quot;steam_id&quot;:\[0,&quot;\d+&quot;\],"
    r"&quot;nickname&quot;:\[0,&quot;([^&]+)&quot;\],"
    r"&quot;hltv_id&quot;:\[0,&quot;(\d+)&quot;\],"
    r"&quot;rank_score&quot;:\[0,&quot;\d+&quot;\],"
    r"&quot;avatar&quot;:\[0,&quot;[^&]*&quot;\],"
    r"&quot;crosshair_code&quot;:\[0,&quot;(CSGO-[^&]+)&quot;\]",
)
players = []
seen = set()
for nickname, hltv_id, code in pattern.findall(html):
    key = nickname.lower()
    if key in seen:
        continue
    seen.add(key)
    players.append({"name": nickname, "shareCode": code, "hltvId": hltv_id})

out = Path(__file__).resolve().parents[1] / "scripts" / "procrosshairs_raw.json"
out.write_text(json.dumps(players, indent=2), encoding="utf-8")
print(len(players), "players ->", out)
