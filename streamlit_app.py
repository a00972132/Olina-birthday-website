import base64
import json
import mimetypes
import re
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components


ROOT = Path(__file__).parent


def render_site() -> str:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "css" / "styles.css").read_text(encoding="utf-8")
    main_js = (ROOT / "js" / "main.js").read_text(encoding="utf-8")
    game_js = (ROOT / "js" / "game.js").read_text(encoding="utf-8")
    chess_js = (ROOT / "js" / "chess.js").read_text(encoding="utf-8")
    photo_data = json.loads((ROOT / "data" / "photos.json").read_text(encoding="utf-8"))

    inlined_photo_data = []

    for memory in photo_data:
        updated_memory = dict(memory)
        if memory.get("src"):
            updated_memory["src"] = to_data_uri(ROOT / memory["src"])
        inlined_photo_data.append(updated_memory)

    photo_json = json.dumps(inlined_photo_data, ensure_ascii=False)

    html = html.replace('<link rel="stylesheet" href="css/styles.css">', f"<style>{css}</style>")
    html = re.sub(
        r'<script id="photo-data" type="application/json">.*?</script>',
        f'<script id="photo-data" type="application/json">{photo_json}</script>',
        html,
        flags=re.DOTALL,
    )
    html = html.replace(
        'fetch("data/photos.json")',
        "Promise.resolve({ ok: true, json: async () => window.BirthdaySiteEmbeddedPhotos })",
    )
    html = html.replace(
        "fetch('data/photos.json')",
        "Promise.resolve({ ok: true, json: async () => window.BirthdaySiteEmbeddedPhotos })",
    )
    html = html.replace(
        '<script src="js/main.js"></script>',
        f"<script>window.BirthdaySiteEmbeddedPhotos = {photo_json};</script><script>{main_js}</script>",
    )
    html = html.replace('<script src="js/game.js"></script>', f"<script>{game_js}</script>")
    html = html.replace('<script src="js/chess.js"></script>', f"<script>{chess_js}</script>")

    for photo_path in (ROOT / "photos").glob("*"):
        if photo_path.is_file() and photo_path.name != "README.md":
            html = html.replace(f"photos/{photo_path.name}", to_data_uri(photo_path))

    return html


def to_data_uri(path: Path) -> str:
    mime_type, _ = mimetypes.guess_type(path.name)
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime_type or 'application/octet-stream'};base64,{encoded}"


st.set_page_config(page_title="Happy Birthday, Olina!", layout="wide")

st.markdown(
    """
    <style>
    .stApp {
        background: #f3e3ff;
    }
    header[data-testid="stHeader"],
    div[data-testid="stToolbar"],
    div[data-testid="stDecoration"],
    footer,
    #MainMenu {
        display: none !important;
    }
    .block-container {
        max-width: none;
        padding: 0;
    }
    iframe[title="streamlit-component"] {
        border: 0;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

components.html(render_site(), height=5600, scrolling=True)
