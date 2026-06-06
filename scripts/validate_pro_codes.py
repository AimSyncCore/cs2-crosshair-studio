import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.crosshair import decode_share_code

text = Path("docs/js/pro-crosshairs.js").read_text()
codes = re.findall(r'"shareCode": "(CSGO-[^"]+)"', text)
failed = []
for code in codes:
    try:
        decode_share_code(code)
        print("OK", code)
    except Exception as error:
        failed.append((code, error))
        print("FAIL", code, error)

print("total", len(codes), "failed", len(failed))
if failed:
    raise SystemExit(1)
