from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Racer(Base):
    """選手マスター"""
    __tablename__ = "racers"
    
    id = Column(Integer, primary_key=True, index=True)
    registration_no = Column(String(10), unique=True, index=True)  # 登録番号
    name = Column(String(50))  # 選手名
    name_kana = Column(String(50))  # 選手名カナ
    branch = Column(String(20))  # 支部
    birthplace = Column(String(20))  # 出身地
    birth_date = Column(Date)  # 生年月日
    rank = Column(String(5))  # 級別 (A1, A2, B1, B2)
    
    # 全国成績
    win_rate_all = Column(Float, default=0.0)  # 全国勝率
    place_rate_2_all = Column(Float, default=0.0)  # 全国2連率
    place_rate_3_all = Column(Float, default=0.0)  # 全国3連率
    
    # コース別成績
    course_1_rate = Column(Float, default=0.0)
    course_2_rate = Column(Float, default=0.0)
    course_3_rate = Column(Float, default=0.0)
    course_4_rate = Column(Float, default=0.0)
    course_5_rate = Column(Float, default=0.0)
    course_6_rate = Column(Float, default=0.0)
    
    avg_start_timing = Column(Float, default=0.0)  # 平均ST
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Race(Base):
    """レース情報"""
    __tablename__ = "races"
    
    id = Column(Integer, primary_key=True, index=True)
    venue_code = Column(String(5), index=True)  # 会場コード
    venue_name = Column(String(20))  # 会場名
    race_date = Column(Date, index=True)  # 開催日
    race_no = Column(Integer)  # レース番号
    race_name = Column(String(100))  # レース名
    race_grade = Column(String(10))  # グレード (SG, G1, G2, G3, 一般)
    race_type = Column(String(20))  # レースタイプ (予選, 準優, 優勝戦)
    distance = Column(Integer, default=1800)  # 距離
    
    # 水面コンディション
    weather = Column(String(10))  # 天候
    wind_direction = Column(String(10))  # 風向
    wind_speed = Column(Float)  # 風速
    wave_height = Column(Float)  # 波高
    water_temp = Column(Float)  # 水温
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # リレーション
    entries = relationship("RaceEntry", back_populates="race", cascade="all, delete-orphan")
    result = relationship("RaceResult", back_populates="race", uselist=False, cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="race", cascade="all, delete-orphan")


class RaceEntry(Base):
    """出走表（各艇の情報）"""
    __tablename__ = "race_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey("races.id"), index=True)
    racer_id = Column(Integer, ForeignKey("racers.id"))
    
    boat_no = Column(Integer)  # 艇番 (1-6)
    racer_registration_no = Column(String(10))  # 選手登録番号
    racer_name = Column(String(50))  # 選手名
    racer_rank = Column(String(5))  # 級別
    
    # 成績
    win_rate_all = Column(Float, default=0.0)  # 全国勝率
    place_rate_2_all = Column(Float, default=0.0)  # 全国2連率
    win_rate_local = Column(Float, default=0.0)  # 当地勝率
    place_rate_2_local = Column(Float, default=0.0)  # 当地2連率
    
    # モーター・ボート
    motor_no = Column(String(10))  # モーター番号
    motor_rate_2 = Column(Float, default=0.0)  # モーター2連率
    boat_no_actual = Column(String(10))  # ボート番号
    boat_rate_2 = Column(Float, default=0.0)  # ボート2連率
    
    # 今節成績
    current_series_results = Column(String(50))  # 今節成績 (例: "1234")
    
    # スタート
    avg_start_timing = Column(Float, default=0.0)  # 平均ST
    
    # 体重
    weight = Column(Float)  # 体重
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # リレーション
    race = relationship("Race", back_populates="entries")
    racer = relationship("Racer")


class RaceResult(Base):
    """レース結果"""
    __tablename__ = "race_results"
    
    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey("races.id"), unique=True, index=True)
    
    # 着順
    place_1 = Column(Integer)  # 1着艇番
    place_2 = Column(Integer)  # 2着艇番
    place_3 = Column(Integer)  # 3着艇番
    place_4 = Column(Integer)  # 4着艇番
    place_5 = Column(Integer)  # 5着艇番
    place_6 = Column(Integer)  # 6着艇番
    
    # 決まり手
    winning_technique = Column(String(20))  # 決まり手 (逃げ, 差し, まくり, etc.)
    
    # 払戻金
    trifecta = Column(String(20))  # 3連単 組み合わせ
    trifecta_payout = Column(Integer)  # 3連単 払戻金
    trio = Column(String(20))  # 3連複 組み合わせ
    trio_payout = Column(Integer)  # 3連複 払戻金
    exacta = Column(String(20))  # 2連単 組み合わせ
    exacta_payout = Column(Integer)  # 2連単 払戻金
    quinella = Column(String(20))  # 2連複 組み合わせ
    quinella_payout = Column(Integer)  # 2連複 払戻金
    win = Column(Integer)  # 単勝 艇番
    win_payout = Column(Integer)  # 単勝 払戻金
    place_payout_1 = Column(Integer)  # 複勝 1
    place_payout_2 = Column(Integer)  # 複勝 2
    
    # スタートタイミング
    st_1 = Column(Float)  # 1号艇ST
    st_2 = Column(Float)  # 2号艇ST
    st_3 = Column(Float)  # 3号艇ST
    st_4 = Column(Float)  # 4号艇ST
    st_5 = Column(Float)  # 5号艇ST
    st_6 = Column(Float)  # 6号艇ST
    
    # 進入コース
    course_1 = Column(Integer)  # 1コース艇番
    course_2 = Column(Integer)  # 2コース艇番
    course_3 = Column(Integer)  # 3コース艇番
    course_4 = Column(Integer)  # 4コース艇番
    course_5 = Column(Integer)  # 5コース艇番
    course_6 = Column(Integer)  # 6コース艇番
    
    race_time = Column(String(20))  # レースタイム
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # リレーション
    race = relationship("Race", back_populates="result")


class Prediction(Base):
    """予想"""
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey("races.id"), index=True)
    
    prediction_type = Column(String(20))  # manual, statistical, ml
    
    # 予想内容
    predicted_rank = Column(String(50))  # 予想順位 (例: "1-3-4")
    bet_type = Column(String(20))  # 賭け式 (単勝, 2連単, 3連単, etc.)
    bet_numbers = Column(String(100))  # 買い目
    
    # 評価スコア（統計/ML予想の場合）
    score_boat_1 = Column(Float)
    score_boat_2 = Column(Float)
    score_boat_3 = Column(Float)
    score_boat_4 = Column(Float)
    score_boat_5 = Column(Float)
    score_boat_6 = Column(Float)
    
    # 確率（ML予想の場合）
    prob_1st_boat_1 = Column(Float)
    prob_1st_boat_2 = Column(Float)
    prob_1st_boat_3 = Column(Float)
    prob_1st_boat_4 = Column(Float)
    prob_1st_boat_5 = Column(Float)
    prob_1st_boat_6 = Column(Float)
    
    # 金額
    bet_amount = Column(Integer)  # 賭け金
    return_amount = Column(Integer)  # 払戻金
    
    # 結果
    is_hit = Column(Boolean, default=False)  # 的中したか
    
    # メモ
    memo = Column(Text)  # 予想理由・メモ
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # リレーション
    race = relationship("Race", back_populates="predictions")
