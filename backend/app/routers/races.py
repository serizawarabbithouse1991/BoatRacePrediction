from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models import schemas, db_models

router = APIRouter()


@router.get("/", response_model=List[schemas.Race])
def get_races(
    skip: int = 0,
    limit: int = 100,
    venue_code: Optional[str] = None,
    race_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """レース一覧を取得"""
    query = db.query(db_models.Race)
    
    if venue_code:
        query = query.filter(db_models.Race.venue_code == venue_code)
    if race_date:
        query = query.filter(db_models.Race.race_date == race_date)
    
    races = query.offset(skip).limit(limit).all()
    return races


@router.get("/{race_id}", response_model=schemas.RaceDetail)
def get_race(race_id: int, db: Session = Depends(get_db)):
    """レース詳細を取得"""
    race = db.query(db_models.Race).filter(db_models.Race.id == race_id).first()
    if race is None:
        raise HTTPException(status_code=404, detail="Race not found")
    return race


@router.post("/", response_model=schemas.Race)
def create_race(race: schemas.RaceCreate, db: Session = Depends(get_db)):
    """レースを作成"""
    db_race = db_models.Race(**race.model_dump())
    db.add(db_race)
    db.commit()
    db.refresh(db_race)
    return db_race


@router.put("/{race_id}", response_model=schemas.Race)
def update_race(race_id: int, race: schemas.RaceUpdate, db: Session = Depends(get_db)):
    """レースを更新"""
    db_race = db.query(db_models.Race).filter(db_models.Race.id == race_id).first()
    if db_race is None:
        raise HTTPException(status_code=404, detail="Race not found")
    
    update_data = race.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_race, key, value)
    
    db.commit()
    db.refresh(db_race)
    return db_race


@router.delete("/{race_id}")
def delete_race(race_id: int, db: Session = Depends(get_db)):
    """レースを削除"""
    db_race = db.query(db_models.Race).filter(db_models.Race.id == race_id).first()
    if db_race is None:
        raise HTTPException(status_code=404, detail="Race not found")
    
    db.delete(db_race)
    db.commit()
    return {"message": "Race deleted successfully"}
