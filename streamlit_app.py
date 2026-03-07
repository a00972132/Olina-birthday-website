from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components


ROOT = Path(__file__).parent
STATIC_PREFIX = "/app/static"


def render_site() -> str:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "css" / "styles.css").read_text(encoding="utf-8")
    main_js = (ROOT / "js" / "main.js").read_text(encoding="utf-8")
    game_js = (ROOT / "js" / "game.js").read_text(encoding="utf-8")

    html = html.replace('<link rel="stylesheet" href="css/styles.css">', f"<style>{css}</style>")
    html = html.replace('<script src="js/main.js"></script>', f"<script>{main_js}</script>")
    html = html.replace('<script src="js/game.js"></script>', f"<script>{game_js}</script>")
    html = html.replace('fetch("data/photos.json")', 'fetch("/app/static/data/photos.json")')
    html = html.replace("fetch('data/photos.json')", "fetch('/app/static/data/photos.json')")
    html = html.replace("photos/", f"{STATIC_PREFIX}/photos/")

    return html


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

components.html(render_site(), height=5200, scrolling=True)
