from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import schemas, db_models
from app.prediction.statistical import StatisticalPredictor
from app.prediction.ml_model import MLPredictor

router = APIRouter()
statistical_predictor = StatisticalPredictor()
ml_predictor = MLPredictor()


@router.get("/race/{race_id}", response_model=List[schemas.Prediction])
def get_predictions_for_race(race_id: int, db: Session = Depends(get_db)):
    """レースの予想一覧を取得"""
    predictions = db.query(db_models.Prediction).filter(
        db_models.Prediction.race_id == race_id
    ).all()
    return predictions


@router.post("/manual", response_model=schemas.Prediction)
def create_manual_prediction(
    prediction: schemas.PredictionCreate,
    db: Session = Depends(get_db)
):
    """手動予想を作成"""
    db_prediction = db_models.Prediction(**prediction.model_dump())
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    return db_prediction


@router.post("/statistical/{race_id}", response_model=schemas.StatisticalPrediction)
def get_statistical_prediction(
    race_id: int,
    weights: schemas.PredictionWeights = None,
    db: Session = Depends(get_db)
):
    """統計ベース予想を取得"""
    race = db.query(db_models.Race).filter(db_models.Race.id == race_id).first()
    if race is None:
        raise HTTPException(status_code=404, detail="Race not found")
    
    entries = db.query(db_models.RaceEntry).filter(
        db_models.RaceEntry.race_id == race_id
    ).all()
    
    if not entries:
        raise HTTPException(status_code=404, detail="No entries found for this race")
    
    # 重み設定（デフォルトまたはカスタム）
    if weights is None:
        weights = schemas.PredictionWeights()
    
    result = statistical_predictor.predict(entries, weights)
    return result


@router.post("/ml/{race_id}", response_model=schemas.MLPrediction)
def get_ml_prediction(race_id: int, db: Session = Depends(get_db)):
    """機械学習ベース予想を取得"""
    race = db.query(db_models.Race).filter(db_models.Race.id == race_id).first()
    if race is None:
        raise HTTPException(status_code=404, detail="Race not found")
    
    entries = db.query(db_models.RaceEntry).filter(
        db_models.RaceEntry.race_id == race_id
    ).all()
    
    if not entries:
        raise HTTPException(status_code=404, detail="No entries found for this race")
    
    result = ml_predictor.predict(entries)
    return result


@router.put("/{prediction_id}", response_model=schemas.Prediction)
def update_prediction(
    prediction_id: int,
    prediction: schemas.PredictionUpdate,
    db: Session = Depends(get_db)
):
    """予想を更新"""
    db_prediction = db.query(db_models.Prediction).filter(
        db_models.Prediction.id == prediction_id
    ).first()
    if db_prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    update_data = prediction.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_prediction, key, value)
    
    db.commit()
    db.refresh(db_prediction)
    return db_prediction


@router.delete("/{prediction_id}")
def delete_prediction(prediction_id: int, db: Session = Depends(get_db)):
    """予想を削除"""
    db_prediction = db.query(db_models.Prediction).filter(
        db_models.Prediction.id == prediction_id
    ).first()
    if db_prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    db.delete(db_prediction)
    db.commit()
    return {"message": "Prediction deleted successfully"}
