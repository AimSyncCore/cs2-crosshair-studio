import re
import urllib.request

url = "https://www.hltv.org/player/11893/zywoo"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", errors="replace")
# current team
for pat in [
    r'class="playerTeam[^"]*"[^>]*>.*?<span>([^<]+)</span>',
    r'"teamName":"([^"]+)"',
    r'/team/(\d+)/([^"]+)"',
]:
    m = re.search(pat, html, re.DOTALL | re.I)
    print(pat[:30], '->', m.group(1) if m else None)

idx = html.find("playerTeam")
print(html[idx:idx+500] if idx >= 0 else "no playerTeam")
