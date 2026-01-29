from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models import schemas, db_models

router = APIRouter()


@router.get("/", response_model=List[schemas.RaceResult])
def get_results(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """レース結果一覧を取得"""
    query = db.query(db_models.RaceResult)
    
    if start_date:
        query = query.join(db_models.Race).filter(
            db_models.Race.race_date >= start_date
        )
    if end_date:
        query = query.join(db_models.Race).filter(
            db_models.Race.race_date <= end_date
        )
    
    results = query.offset(skip).limit(limit).all()
    return results


@router.get("/race/{race_id}", response_model=schemas.RaceResult)
def get_result_by_race(race_id: int, db: Session = Depends(get_db)):
    """レースの結果を取得"""
    result = db.query(db_models.RaceResult).filter(
        db_models.RaceResult.race_id == race_id
    ).first()
    if result is None:
        raise HTTPException(status_code=404, detail="Result not found")
    return result


@router.post("/", response_model=schemas.RaceResult)
def create_result(result: schemas.RaceResultCreate, db: Session = Depends(get_db)):
    """レース結果を作成"""
    db_result = db_models.RaceResult(**result.model_dump())
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


@router.get("/statistics")
def get_statistics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """統計情報を取得（的中率・収支など）"""
    query = db.query(db_models.Prediction)
    
    if start_date or end_date:
        query = query.join(db_models.Race)
        if start_date:
            query = query.filter(db_models.Race.race_date >= start_date)
        if end_date:
            query = query.filter(db_models.Race.race_date <= end_date)
    
    predictions = query.all()
    
    total = len(predictions)
    hits = sum(1 for p in predictions if p.is_hit)
    
    total_bet = sum(p.bet_amount or 0 for p in predictions)
    total_return = sum(p.return_amount or 0 for p in predictions)
    
    return {
        "total_predictions": total,
        "hits": hits,
        "hit_rate": hits / total if total > 0 else 0,
        "total_bet": total_bet,
        "total_return": total_return,
        "profit": total_return - total_bet,
        "roi": (total_return / total_bet - 1) * 100 if total_bet > 0 else 0
    }
