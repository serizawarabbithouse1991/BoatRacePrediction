from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ========== Racer Schemas ==========

class RacerBase(BaseModel):
    registration_no: str
    name: str
    name_kana: Optional[str] = None
    branch: Optional[str] = None
    birthplace: Optional[str] = None
    birth_date: Optional[date] = None
    rank: Optional[str] = None
    win_rate_all: Optional[float] = 0.0
    place_rate_2_all: Optional[float] = 0.0
    place_rate_3_all: Optional[float] = 0.0
    course_1_rate: Optional[float] = 0.0
    course_2_rate: Optional[float] = 0.0
    course_3_rate: Optional[float] = 0.0
    course_4_rate: Optional[float] = 0.0
    course_5_rate: Optional[float] = 0.0
    course_6_rate: Optional[float] = 0.0
    avg_start_timing: Optional[float] = 0.0


class RacerCreate(RacerBase):
    pass


class RacerUpdate(BaseModel):
    name: Optional[str] = None
    rank: Optional[str] = None
    win_rate_all: Optional[float] = None
    place_rate_2_all: Optional[float] = None
    place_rate_3_all: Optional[float] = None
    avg_start_timing: Optional[float] = None


class Racer(RacerBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ========== Race Entry Schemas ==========

class RaceEntryBase(BaseModel):
    boat_no: int
    racer_registration_no: str
    racer_name: str
    racer_rank: Optional[str] = None
    win_rate_all: Optional[float] = 0.0
    place_rate_2_all: Optional[float] = 0.0
    win_rate_local: Optional[float] = 0.0
    place_rate_2_local: Optional[float] = 0.0
    motor_no: Optional[str] = None
    motor_rate_2: Optional[float] = 0.0
    boat_no_actual: Optional[str] = None
    boat_rate_2: Optional[float] = 0.0
    current_series_results: Optional[str] = None
    avg_start_timing: Optional[float] = 0.0
    weight: Optional[float] = None


class RaceEntryCreate(RaceEntryBase):
    race_id: int
    racer_id: Optional[int] = None


class RaceEntry(RaceEntryBase):
    id: int
    race_id: int
    racer_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== Race Schemas ==========

class RaceBase(BaseModel):
    venue_code: str
    venue_name: str
    race_date: date
    race_no: int
    race_name: Optional[str] = None
    race_grade: Optional[str] = None
    race_type: Optional[str] = None
    distance: Optional[int] = 1800
    weather: Optional[str] = None
    wind_direction: Optional[str] = None
    wind_speed: Optional[float] = None
    wave_height: Optional[float] = None
    water_temp: Optional[float] = None


class RaceCreate(RaceBase):
    pass


class RaceUpdate(BaseModel):
    race_name: Optional[str] = None
    race_grade: Optional[str] = None
    weather: Optional[str] = None
    wind_direction: Optional[str] = None
    wind_speed: Optional[float] = None
    wave_height: Optional[float] = None
    water_temp: Optional[float] = None


class Race(RaceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RaceDetail(Race):
    entries: List[RaceEntry] = []
    
    class Config:
        from_attributes = True


# ========== Race Result Schemas ==========

class RaceResultBase(BaseModel):
    place_1: int
    place_2: int
    place_3: int
    place_4: Optional[int] = None
    place_5: Optional[int] = None
    place_6: Optional[int] = None
    winning_technique: Optional[str] = None
    trifecta: Optional[str] = None
    trifecta_payout: Optional[int] = None
    trio: Optional[str] = None
    trio_payout: Optional[int] = None
    exacta: Optional[str] = None
    exacta_payout: Optional[int] = None
    quinella: Optional[str] = None
    quinella_payout: Optional[int] = None
    win: Optional[int] = None
    win_payout: Optional[int] = None
    st_1: Optional[float] = None
    st_2: Optional[float] = None
    st_3: Optional[float] = None
    st_4: Optional[float] = None
    st_5: Optional[float] = None
    st_6: Optional[float] = None
    course_1: Optional[int] = None
    course_2: Optional[int] = None
    course_3: Optional[int] = None
    course_4: Optional[int] = None
    course_5: Optional[int] = None
    course_6: Optional[int] = None
    race_time: Optional[str] = None


class RaceResultCreate(RaceResultBase):
    race_id: int


class RaceResult(RaceResultBase):
    id: int
    race_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== Prediction Schemas ==========

class PredictionWeights(BaseModel):
    """統計予想の重み設定"""
    win_rate_all: float = 0.20  # 全国勝率
    win_rate_local: float = 0.15  # 当地勝率
    motor_rate: float = 0.15  # モーター2連率
    boat_rate: float = 0.10  # ボート2連率
    avg_st: float = 0.15  # 平均ST
    course_rate: float = 0.15  # コース別1着率
    current_series: float = 0.10  # 今節成績


class PredictionBase(BaseModel):
    prediction_type: str
    predicted_rank: Optional[str] = None
    bet_type: Optional[str] = None
    bet_numbers: Optional[str] = None
    score_boat_1: Optional[float] = None
    score_boat_2: Optional[float] = None
    score_boat_3: Optional[float] = None
    score_boat_4: Optional[float] = None
    score_boat_5: Optional[float] = None
    score_boat_6: Optional[float] = None
    bet_amount: Optional[int] = None
    memo: Optional[str] = None


class PredictionCreate(PredictionBase):
    race_id: int


class PredictionUpdate(BaseModel):
    predicted_rank: Optional[str] = None
    bet_type: Optional[str] = None
    bet_numbers: Optional[str] = None
    bet_amount: Optional[int] = None
    return_amount: Optional[int] = None
    is_hit: Optional[bool] = None
    memo: Optional[str] = None


class Prediction(PredictionBase):
    id: int
    race_id: int
    return_amount: Optional[int] = None
    is_hit: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ========== Statistical Prediction Response ==========

class BoatScore(BaseModel):
    boat_no: int
    score: float
    rank: int
    details: dict


class StatisticalPrediction(BaseModel):
    race_id: int
    scores: List[BoatScore]
    recommended_rank: str
    weights_used: PredictionWeights


# ========== ML Prediction Response ==========

class BoatProbability(BaseModel):
    boat_no: int
    prob_1st: float
    prob_2nd: float
    prob_3rd: float
    expected_rank: float


class MLPrediction(BaseModel):
    race_id: int
    probabilities: List[BoatProbability]
    predicted_rank: str
    model_confidence: float
