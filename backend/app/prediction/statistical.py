"""統計ベース予想エンジン"""
from typing import List
from app.models.schemas import PredictionWeights, StatisticalPrediction, BoatScore


class StatisticalPredictor:
    """統計分析による予想"""
    
    def predict(self, entries: List, weights: PredictionWeights) -> StatisticalPrediction:
        """
        出走表から統計スコアを計算して予想を生成
        
        各項目を正規化してスコア化し、重み付けで総合スコアを算出
        """
        scores = []
        
        # 各艇のスコアを計算
        for entry in entries:
            score_details = self._calculate_score_details(entry, entries, weights)
            total_score = sum(score_details.values())
            
            scores.append({
                "boat_no": entry.boat_no,
                "score": round(total_score, 2),
                "details": score_details
            })
        
        # スコアでソートしてランク付け
        scores.sort(key=lambda x: x["score"], reverse=True)
        for rank, score in enumerate(scores, 1):
            score["rank"] = rank
        
        # BoatScoreオブジェクトに変換
        boat_scores = [
            BoatScore(
                boat_no=s["boat_no"],
                score=s["score"],
                rank=s["rank"],
                details=s["details"]
            )
            for s in scores
        ]
        
        # 推奨順位を生成
        recommended_rank = "-".join(str(s["boat_no"]) for s in scores[:3])
        
        return StatisticalPrediction(
            race_id=entries[0].race_id if entries else 0,
            scores=boat_scores,
            recommended_rank=recommended_rank,
            weights_used=weights
        )
    
    def _calculate_score_details(self, entry, all_entries, weights: PredictionWeights) -> dict:
        """各項目のスコアを計算"""
        details = {}
        
        # 全国勝率スコア（最大を100として正規化）
        max_win_rate = max(e.win_rate_all or 0 for e in all_entries) or 1
        details["win_rate_all"] = round(
            (entry.win_rate_all or 0) / max_win_rate * 100 * weights.win_rate_all, 2
        )
        
        # 当地勝率スコア
        max_local_rate = max(e.win_rate_local or 0 for e in all_entries) or 1
        details["win_rate_local"] = round(
            (entry.win_rate_local or 0) / max_local_rate * 100 * weights.win_rate_local, 2
        )
        
        # モーター2連率スコア
        max_motor = max(e.motor_rate_2 or 0 for e in all_entries) or 1
        details["motor_rate"] = round(
            (entry.motor_rate_2 or 0) / max_motor * 100 * weights.motor_rate, 2
        )
        
        # ボート2連率スコア
        max_boat = max(e.boat_rate_2 or 0 for e in all_entries) or 1
        details["boat_rate"] = round(
            (entry.boat_rate_2 or 0) / max_boat * 100 * weights.boat_rate, 2
        )
        
        # 平均STスコア（低いほど良いので逆転）
        st_values = [e.avg_start_timing for e in all_entries if e.avg_start_timing]
        if st_values:
            min_st = min(st_values)
            max_st = max(st_values)
            range_st = max_st - min_st if max_st != min_st else 1
            # STは低いほど良いので逆転
            st_score = (max_st - (entry.avg_start_timing or max_st)) / range_st * 100
            details["avg_st"] = round(st_score * weights.avg_st, 2)
        else:
            details["avg_st"] = 0
        
        # コース別勝率（枠番に基づく）
        course_rate = self._get_course_rate_for_boat(entry)
        details["course_rate"] = round(course_rate * weights.course_rate, 2)
        
        # 今節成績スコア
        current_score = self._calculate_current_series_score(entry.current_series_results)
        details["current_series"] = round(current_score * weights.current_series, 2)
        
        return details
    
    def _get_course_rate_for_boat(self, entry) -> float:
        """艇番に基づくコース勝率を取得"""
        # インコースほど有利（1コースが最も有利）
        # 基本的なコース別勝率（統計的な傾向）
        base_rates = {
            1: 55.0,  # 1コース勝率は約55%
            2: 14.0,
            3: 12.0,
            4: 11.0,
            5: 6.0,
            6: 2.0
        }
        return base_rates.get(entry.boat_no, 10.0)
    
    def _calculate_current_series_score(self, results: str) -> float:
        """今節成績からスコアを計算"""
        if not results:
            return 50.0  # デフォルト値
        
        # 着順をスコアに変換（1着=100, 2着=80, ...）
        score_map = {"1": 100, "2": 80, "3": 60, "4": 40, "5": 20, "6": 10}
        
        total = 0
        count = 0
        for char in results:
            if char in score_map:
                total += score_map[char]
                count += 1
        
        return total / count if count > 0 else 50.0
