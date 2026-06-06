import urllib.request

url = "https://raw.githubusercontent.com/girlglock/cs2-crosshair/main/remote-assets/static/crosshair-preview.js"
text = urllib.request.urlopen(url, timeout=30).read().decode("utf-8")

idx = text.find("if (!settings.cl_crosshair_t)")
print(text[idx : idx + 1200])
