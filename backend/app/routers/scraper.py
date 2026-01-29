from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.database import get_db
from app.scraper.boatrace_scraper import BoatRaceScraper

router = APIRouter()
scraper = BoatRaceScraper()


@router.post("/race")
async def scrape_race(
    venue_code: str,
    race_date: date,
    race_no: int,
    db: Session = Depends(get_db)
):
    """指定レースの出走表をスクレイピング"""
    try:
        result = await scraper.scrape_race_info(venue_code, race_date, race_no, db)
        return {"message": "Scraping completed", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/venue")
async def scrape_venue_races(
    venue_code: str,
    race_date: date,
    db: Session = Depends(get_db)
):
    """指定会場の全レースをスクレイピング"""
    try:
        result = await scraper.scrape_venue_races(venue_code, race_date, db)
        return {"message": "Scraping completed", "races": len(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/result")
async def scrape_race_result(
    venue_code: str,
    race_date: date,
    race_no: int,
    db: Session = Depends(get_db)
):
    """レース結果をスクレイピング"""
    try:
        result = await scraper.scrape_race_result(venue_code, race_date, race_no, db)
        return {"message": "Result scraping completed", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/historical")
async def scrape_historical_data(
    venue_code: str,
    start_date: date,
    end_date: date,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """過去データを一括スクレイピング（バックグラウンド実行）"""
    background_tasks.add_task(
        scraper.scrape_historical_data,
        venue_code, start_date, end_date, db
    )
    return {
        "message": "Historical data scraping started in background",
        "venue_code": venue_code,
        "start_date": str(start_date),
        "end_date": str(end_date)
    }
