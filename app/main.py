import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from starlette.responses import RedirectResponse

from .services.analyze import analyze_video_and_summarize


app = FastAPI(title="AnimalCare API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", response_class=HTMLResponse)
async def index():
    return RedirectResponse(url="/static/index.html")


@app.post("/api/analyze")
async def analyze(video: UploadFile = File(...)):
    if not video.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    suffix = os.path.splitext(video.filename)[1].lower()
    if suffix not in [".mp4", ".mov", ".avi", ".mkv"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    temp_dir = os.path.join("/tmp", "animalcare")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, video.filename)
    with open(temp_path, "wb") as f:
        f.write(await video.read())

    try:
        result = await analyze_video_and_summarize(temp_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        try:
            os.remove(temp_path)
        except Exception:
            pass

    return JSONResponse(result)


def start():
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)


if __name__ == "__main__":
    start()

