from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import schemas, db_models

router = APIRouter()


@router.get("/", response_model=List[schemas.Racer])
def get_racers(
    skip: int = 0,
    limit: int = 100,
    rank: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """選手一覧を取得"""
    query = db.query(db_models.Racer)
    
    if rank:
        query = query.filter(db_models.Racer.rank == rank)
    
    racers = query.offset(skip).limit(limit).all()
    return racers


@router.get("/{racer_id}", response_model=schemas.Racer)
def get_racer(racer_id: int, db: Session = Depends(get_db)):
    """選手詳細を取得"""
    racer = db.query(db_models.Racer).filter(db_models.Racer.id == racer_id).first()
    if racer is None:
        raise HTTPException(status_code=404, detail="Racer not found")
    return racer


@router.get("/registration/{registration_no}", response_model=schemas.Racer)
def get_racer_by_registration(registration_no: str, db: Session = Depends(get_db)):
    """登録番号から選手を取得"""
    racer = db.query(db_models.Racer).filter(
        db_models.Racer.registration_no == registration_no
    ).first()
    if racer is None:
        raise HTTPException(status_code=404, detail="Racer not found")
    return racer


@router.post("/", response_model=schemas.Racer)
def create_racer(racer: schemas.RacerCreate, db: Session = Depends(get_db)):
    """選手を作成"""
    db_racer = db_models.Racer(**racer.model_dump())
    db.add(db_racer)
    db.commit()
    db.refresh(db_racer)
    return db_racer


@router.put("/{racer_id}", response_model=schemas.Racer)
def update_racer(racer_id: int, racer: schemas.RacerUpdate, db: Session = Depends(get_db)):
    """選手情報を更新"""
    db_racer = db.query(db_models.Racer).filter(db_models.Racer.id == racer_id).first()
    if db_racer is None:
        raise HTTPException(status_code=404, detail="Racer not found")
    
    update_data = racer.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_racer, key, value)
    
    db.commit()
    db.refresh(db_racer)
    return db_racer
