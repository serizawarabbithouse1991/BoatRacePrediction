"""機械学習ベース予想エンジン"""
import os
import numpy as np
from typing import List, Optional
import joblib

from app.models.schemas import MLPrediction, BoatProbability


class MLPredictor:
    """機械学習による予想"""
    
    MODEL_PATH = "ml/models/boatrace_model.joblib"
    
    def __init__(self):
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """学習済みモデルを読み込み"""
        if os.path.exists(self.MODEL_PATH):
            try:
                self.model = joblib.load(self.MODEL_PATH)
            except Exception as e:
                print(f"Model loading failed: {e}")
                self.model = None
    
    def predict(self, entries: List) -> MLPrediction:
        """
        出走表から機械学習モデルで予想を生成
        
        モデルが存在しない場合は統計ベースの簡易予測を返す
        """
        probabilities = []
        
        if self.model is not None:
            # 学習済みモデルがある場合
            features = self._extract_features(entries)
            predictions = self.model.predict_proba(features)
            
            for i, entry in enumerate(entries):
                prob = BoatProbability(
                    boat_no=entry.boat_no,
                    prob_1st=float(predictions[i][0]),
                    prob_2nd=float(predictions[i][1]),
                    prob_3rd=float(predictions[i][2]),
                    expected_rank=self._calculate_expected_rank(predictions[i])
                )
                probabilities.append(prob)
        else:
            # モデルがない場合は簡易予測
            probabilities = self._simple_prediction(entries)
        
        # 1着確率でソート
        probabilities.sort(key=lambda x: x.prob_1st, reverse=True)
        
        # 予想順位を生成
        predicted_rank = "-".join(str(p.boat_no) for p in probabilities[:3])
        
        # モデル信頼度
        confidence = self._calculate_confidence(probabilities)
        
        return MLPrediction(
            race_id=entries[0].race_id if entries else 0,
            probabilities=probabilities,
            predicted_rank=predicted_rank,
            model_confidence=confidence
        )
    
    def _extract_features(self, entries: List) -> np.ndarray:
        """特徴量を抽出"""
        features = []
        
        for entry in entries:
            feat = [
                entry.boat_no,
                entry.win_rate_all or 0,
                entry.place_rate_2_all or 0,
                entry.win_rate_local or 0,
                entry.place_rate_2_local or 0,
                entry.motor_rate_2 or 0,
                entry.boat_rate_2 or 0,
                entry.avg_start_timing or 0,
                self._rank_to_numeric(entry.racer_rank),
                entry.weight or 52,  # デフォルト体重
            ]
            features.append(feat)
        
        return np.array(features)
    
    def _rank_to_numeric(self, rank: str) -> int:
        """級別を数値に変換"""
        rank_map = {"A1": 4, "A2": 3, "B1": 2, "B2": 1}
        return rank_map.get(rank, 2)
    
    def _simple_prediction(self, entries: List) -> List[BoatProbability]:
        """簡易予測（モデルがない場合）"""
        probabilities = []
        
        # 各艇の簡易スコアを計算
        scores = []
        for entry in entries:
            score = (
                (entry.win_rate_all or 0) * 2 +
                (entry.win_rate_local or 0) * 1.5 +
                (entry.motor_rate_2 or 0) +
                (entry.boat_rate_2 or 0) * 0.5 +
                self._get_course_bonus(entry.boat_no)
            )
            scores.append((entry, score))
        
        # スコアを確率に変換
        total_score = sum(s[1] for s in scores) or 1
        
        for entry, score in scores:
            prob_1st = score / total_score
            prob_2nd = prob_1st * 0.8  # 簡易計算
            prob_3rd = prob_1st * 0.7
            
            prob = BoatProbability(
                boat_no=entry.boat_no,
                prob_1st=round(prob_1st, 4),
                prob_2nd=round(prob_2nd, 4),
                prob_3rd=round(prob_3rd, 4),
                expected_rank=round(7 - 6 * prob_1st, 2)
            )
            probabilities.append(prob)
        
        return probabilities
    
    def _get_course_bonus(self, boat_no: int) -> float:
        """コースボーナス（インコースほど有利）"""
        bonuses = {1: 30, 2: 10, 3: 8, 4: 6, 5: 4, 6: 2}
        return bonuses.get(boat_no, 5)
    
    def _calculate_expected_rank(self, probs: np.ndarray) -> float:
        """期待順位を計算"""
        # probs: [prob_1st, prob_2nd, prob_3rd, prob_4th, prob_5th, prob_6th]
        ranks = np.arange(1, len(probs) + 1)
        return float(np.sum(probs * ranks))
    
    def _calculate_confidence(self, probabilities: List[BoatProbability]) -> float:
        """予測の信頼度を計算"""
        if not probabilities:
            return 0.0
        
        # 1着確率の最大値と2位の差で信頼度を計算
        probs = sorted([p.prob_1st for p in probabilities], reverse=True)
        if len(probs) >= 2:
            confidence = probs[0] - probs[1]
        else:
            confidence = probs[0] if probs else 0
        
        return round(min(confidence * 2, 1.0), 4)  # 0-1に正規化
