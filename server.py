"""
Minimal ASGI app to serve the Gaming Coin Hub preview site.
Run: uvicorn server:app --host 0.0.0.0 --port 8000 --reload
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Gaming Coin Hub")
PREVIEW_DIR = Path(__file__).resolve().parent / "preview"


@app.get("/")
async def root():
    """Serve index.html at /"""
    index = PREVIEW_DIR / "index.html"
    if index.exists():
        return FileResponse(index)
    return {"message": "Gaming Coin Hub", "docs": "/docs"}


# Mount static files (JS, CSS, images) from preview/
for subdir in ("js", "images"):
    d = PREVIEW_DIR / subdir
    if d.is_dir():
        app.mount(f"/{subdir}", StaticFiles(directory=d), name=subdir)

# Serve all HTML and other files from preview at root
@app.get("/{path:path}")
async def serve_preview(path: str):
    """Serve HTML and assets from preview folder."""
    full = PREVIEW_DIR / path
    if full.is_file():
        return FileResponse(full)
    # Try adding .html for clean URLs
    if not path.endswith(".html"):
        html_path = PREVIEW_DIR / f"{path}.html"
        if html_path.is_file():
            return FileResponse(html_path)
    return FileResponse(PREVIEW_DIR / "index.html")  # SPA-style fallback
