from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import races, racers, predictions, results, scraper, ai_analysis

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ボートレース予想API",
    description="統計分析・機械学習によるボートレース予想支援システム",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(races.router, prefix="/api/races", tags=["races"])
app.include_router(racers.router, prefix="/api/racers", tags=["racers"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(results.router, prefix="/api/results", tags=["results"])
app.include_router(scraper.router, prefix="/api/scraper", tags=["scraper"])
app.include_router(ai_analysis.router, prefix="/api/ai", tags=["ai"])


@app.get("/")
async def root():
    return {"message": "ボートレース予想API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
