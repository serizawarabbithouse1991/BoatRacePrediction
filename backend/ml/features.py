"""特徴量エンジニアリング"""
import pandas as pd
import numpy as np
from typing import List, Tuple


class FeatureEngineer:
    """機械学習用の特徴量を生成"""
    
    def __init__(self):
        self.feature_names = [
            "boat_no",
            "win_rate_all",
            "place_rate_2_all",
            "win_rate_local",
            "place_rate_2_local",
            "motor_rate_2",
            "boat_rate_2",
            "avg_start_timing",
            "rank_numeric",
            "weight",
            "course_advantage",
            "relative_win_rate",
            "motor_boat_combined",
        ]
    
    def create_features(self, race_entries: List[dict]) -> pd.DataFrame:
        """レースエントリーから特徴量を生成"""
        features = []
        
        # 全体の統計を計算
        all_win_rates = [e.get("win_rate_all", 0) or 0 for e in race_entries]
        avg_win_rate = np.mean(all_win_rates) if all_win_rates else 5.0
        
        for entry in race_entries:
            feat = self._create_single_features(entry, avg_win_rate)
            features.append(feat)
        
        return pd.DataFrame(features, columns=self.feature_names)
    
    def _create_single_features(self, entry: dict, avg_win_rate: float) -> List[float]:
        """1艇分の特徴量を生成"""
        boat_no = entry.get("boat_no", 1)
        win_rate_all = entry.get("win_rate_all", 0) or 0
        place_rate_2_all = entry.get("place_rate_2_all", 0) or 0
        win_rate_local = entry.get("win_rate_local", 0) or 0
        place_rate_2_local = entry.get("place_rate_2_local", 0) or 0
        motor_rate_2 = entry.get("motor_rate_2", 0) or 0
        boat_rate_2 = entry.get("boat_rate_2", 0) or 0
        avg_st = entry.get("avg_start_timing", 0.15) or 0.15
        rank = entry.get("racer_rank", "B1")
        weight = entry.get("weight", 52) or 52
        
        # 派生特徴量
        rank_numeric = self._rank_to_numeric(rank)
        course_advantage = self._get_course_advantage(boat_no)
        relative_win_rate = win_rate_all - avg_win_rate
        motor_boat_combined = (motor_rate_2 + boat_rate_2) / 2
        
        return [
            float(boat_no),
            float(win_rate_all),
            float(place_rate_2_all),
            float(win_rate_local),
            float(place_rate_2_local),
            float(motor_rate_2),
            float(boat_rate_2),
            float(avg_st),
            float(rank_numeric),
            float(weight),
            float(course_advantage),
            float(relative_win_rate),
            float(motor_boat_combined),
        ]
    
    def _rank_to_numeric(self, rank: str) -> int:
        """級別を数値に変換"""
        rank_map = {"A1": 4, "A2": 3, "B1": 2, "B2": 1}
        return rank_map.get(rank, 2)
    
    def _get_course_advantage(self, boat_no: int) -> float:
        """コースアドバンテージを取得"""
        # 1コースが最も有利
        advantages = {1: 1.0, 2: 0.4, 3: 0.35, 4: 0.3, 5: 0.2, 6: 0.1}
        return advantages.get(boat_no, 0.2)
    
    def create_labels(self, race_results: List[dict]) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        レース結果からラベルを生成
        
        Returns:
            labels_1st: 1着フラグ (6要素)
            labels_2nd: 2着フラグ (6要素)
            labels_3rd: 3着フラグ (6要素)
        """
        labels_1st = []
        labels_2nd = []
        labels_3rd = []
        
        for result in race_results:
            place_1 = result.get("place_1", 0)
            place_2 = result.get("place_2", 0)
            place_3 = result.get("place_3", 0)
            
            for boat_no in range(1, 7):
                labels_1st.append(1 if boat_no == place_1 else 0)
                labels_2nd.append(1 if boat_no == place_2 else 0)
                labels_3rd.append(1 if boat_no == place_3 else 0)
        
        return (
            np.array(labels_1st),
            np.array(labels_2nd),
            np.array(labels_3rd)
        )
