import re
import urllib.request

req = urllib.request.Request("https://procrosshairs.com/", headers={"User-Agent": "Mozilla/5.0"})
html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", errors="replace")

# Find all unique keys near player records
keys = set(re.findall(r"&quot;([a-z_]+)&quot;:\[0,", html))
print("keys:", sorted(keys))

# Look for team-related chunks
for match in re.finditer(r"&quot;([a-zA-Z_]*team[a-zA-Z_]*)&quot;", html, re.I):
    print("team key:", match.group(1))

# Extract hltv_id with nickname
pairs = re.findall(
    r"&quot;nickname&quot;:\[0,&quot;([^&]+)&quot;\],&quot;hltv_id&quot;:\[0,&quot;(\d+)&quot;\]",
    html,
)
print("players with hltv", len(pairs))
print(pairs[:5])
