# CS2 Crosshair Studio

Crosshair studio for **Counter-Strike 2** with live preview, pro player configs, in-game share codes, and an autoexec builder.

## Features

- Live canvas preview with CS2 map backgrounds
- Drag the crosshair to test visibility on different surfaces
- **Pro Crosshairs** tab with 100 pro configs, grouped by team
- **Autoexec Generator** with categorized CS2 settings, descriptions, and `autoexec.cfg` export
- Export **CSGO- share code** (Settings → Game → Crosshair → Share or Import)
- Export **console commands** for `autoexec.cfg`
- Export **`apply_crosshair_code`** command for instant in-game application
- Import existing share codes
- Python core logic with tests
- Static web UI on GitHub Pages (`docs/`)

## Live demo

**https://aimsynccore.github.io/crosshair_generator/**

## Local development (web)

The frontend is static. For a local preview:

```bash
python -m http.server 8080 --directory docs
```

Open `http://localhost:8080`.

## Python CLI

```bash
pip install -r requirements-dev.txt

# Decode share code
python cli.py decode CSGO-WsnnD-eHaMw-QNDf9-oxuDh-ydOUD

# Encode from JSON settings
python cli.py encode "{\"length\": 2.5, \"gap\": -1, \"style\": 4}"

# Console commands from share code
python cli.py console CSGO-WsnnD-eHaMw-QNDf9-oxuDh-ydOUD --one-line
```

## Tests

```bash
pytest
python scripts/validate_pro_codes.py
```

## Update pro crosshairs

Pro player share codes:

```bash
python scripts/fetch_pro_crosshairs.py
python scripts/validate_pro_codes.py
```

## GitHub Pages setup

1. Push the repo to GitHub
2. Settings → Pages → Build and deployment → **GitHub Actions**
3. Push to `main`/`master` — the workflow in `.github/workflows/deploy-pages.yml` deploys `docs/`

## Project structure

```text
crosshair_generator/
├── docs/                 # GitHub Pages site
│   ├── index.html
│   ├── css/style.css
│   └── js/
├── src/crosshair.py      # Python share-code logic
├── tests/
├── cli.py
└── .github/workflows/
```

## CS2 usage

### Share code (in-game)

1. Settings → Game → Crosshair
2. Share or Import → paste the `CSGO-...` code

### Console

```text
apply_crosshair_code CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
```

Or paste the `cl_crosshair_*` commands into the console or `autoexec.cfg`.

## Notes

- The preview is an approximation of the in-game crosshair.

## License

MIT
