"""機械学習モデルの学習スクリプト"""
import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime
import joblib

# パスを追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lightgbm import LGBMClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import db_models
from ml.features import FeatureEngineer


class BoatRaceModelTrainer:
    """ボートレース予測モデルの学習"""
    
    MODEL_DIR = "ml/models"
    
    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        self.model_1st = None
        self.model_2nd = None
        self.model_3rd = None
    
    def load_training_data(self, db: Session) -> pd.DataFrame:
        """学習データを読み込み"""
        # レース結果があるレースのみ取得
        races_with_results = db.query(db_models.Race).join(
            db_models.RaceResult
        ).all()
        
        all_features = []
        all_labels_1st = []
        all_labels_2nd = []
        all_labels_3rd = []
        
        for race in races_with_results:
            entries = db.query(db_models.RaceEntry).filter(
                db_models.RaceEntry.race_id == race.id
            ).order_by(db_models.RaceEntry.boat_no).all()
            
            if len(entries) != 6:
                continue
            
            result = race.result
            if not result:
                continue
            
            # 特徴量を生成
            entry_dicts = [
                {
                    "boat_no": e.boat_no,
                    "win_rate_all": e.win_rate_all,
                    "place_rate_2_all": e.place_rate_2_all,
                    "win_rate_local": e.win_rate_local,
                    "place_rate_2_local": e.place_rate_2_local,
                    "motor_rate_2": e.motor_rate_2,
                    "boat_rate_2": e.boat_rate_2,
                    "avg_start_timing": e.avg_start_timing,
                    "racer_rank": e.racer_rank,
                    "weight": e.weight,
                }
                for e in entries
            ]
            
            features_df = self.feature_engineer.create_features(entry_dicts)
            
            # ラベルを生成
            for i, entry in enumerate(entries):
                all_features.append(features_df.iloc[i].values)
                all_labels_1st.append(1 if entry.boat_no == result.place_1 else 0)
                all_labels_2nd.append(1 if entry.boat_no == result.place_2 else 0)
                all_labels_3rd.append(1 if entry.boat_no == result.place_3 else 0)
        
        return (
            np.array(all_features),
            np.array(all_labels_1st),
            np.array(all_labels_2nd),
            np.array(all_labels_3rd)
        )
    
    def train(self, X, y_1st, y_2nd, y_3rd):
        """モデルを学習"""
        print(f"Training data size: {len(X)}")
        
        # データを分割
        X_train, X_test, y1_train, y1_test = train_test_split(
            X, y_1st, test_size=0.2, random_state=42
        )
        _, _, y2_train, y2_test = train_test_split(
            X, y_2nd, test_size=0.2, random_state=42
        )
        _, _, y3_train, y3_test = train_test_split(
            X, y_3rd, test_size=0.2, random_state=42
        )
        
        # LightGBMモデルを学習
        params = {
            "n_estimators": 100,
            "max_depth": 6,
            "learning_rate": 0.1,
            "num_leaves": 31,
            "random_state": 42,
            "verbose": -1,
        }
        
        print("Training 1st place model...")
        self.model_1st = LGBMClassifier(**params)
        self.model_1st.fit(X_train, y1_train)
        
        print("Training 2nd place model...")
        self.model_2nd = LGBMClassifier(**params)
        self.model_2nd.fit(X_train, y2_train)
        
        print("Training 3rd place model...")
        self.model_3rd = LGBMClassifier(**params)
        self.model_3rd.fit(X_train, y3_train)
        
        # 評価
        print("\n=== Model Evaluation ===")
        
        y1_pred = self.model_1st.predict(X_test)
        print(f"1st Place Accuracy: {accuracy_score(y1_test, y1_pred):.4f}")
        
        y2_pred = self.model_2nd.predict(X_test)
        print(f"2nd Place Accuracy: {accuracy_score(y2_test, y2_pred):.4f}")
        
        y3_pred = self.model_3rd.predict(X_test)
        print(f"3rd Place Accuracy: {accuracy_score(y3_test, y3_pred):.4f}")
        
        # 特徴量の重要度
        print("\n=== Feature Importance (1st Place) ===")
        feature_names = self.feature_engineer.feature_names
        importance = self.model_1st.feature_importances_
        for name, imp in sorted(zip(feature_names, importance), key=lambda x: -x[1]):
            print(f"  {name}: {imp:.4f}")
    
    def save_models(self):
        """モデルを保存"""
        os.makedirs(self.MODEL_DIR, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 個別モデルを保存
        joblib.dump(self.model_1st, f"{self.MODEL_DIR}/model_1st_{timestamp}.joblib")
        joblib.dump(self.model_2nd, f"{self.MODEL_DIR}/model_2nd_{timestamp}.joblib")
        joblib.dump(self.model_3rd, f"{self.MODEL_DIR}/model_3rd_{timestamp}.joblib")
        
        # 統合モデルも保存（予測時に使用）
        combined_model = {
            "model_1st": self.model_1st,
            "model_2nd": self.model_2nd,
            "model_3rd": self.model_3rd,
            "feature_names": self.feature_engineer.feature_names,
            "trained_at": timestamp,
        }
        joblib.dump(combined_model, f"{self.MODEL_DIR}/boatrace_model.joblib")
        
        print(f"\nModels saved to {self.MODEL_DIR}/")


def main():
    """メイン処理"""
    print("=== Boat Race Prediction Model Training ===\n")
    
    db = SessionLocal()
    trainer = BoatRaceModelTrainer()
    
    try:
        # データ読み込み
        print("Loading training data...")
        X, y_1st, y_2nd, y_3rd = trainer.load_training_data(db)
        
        if len(X) < 100:
            print(f"Warning: Training data is small ({len(X)} samples)")
            print("Consider collecting more historical data before training.")
            
            if len(X) == 0:
                print("No training data available. Exiting.")
                return
        
        # 学習
        trainer.train(X, y_1st, y_2nd, y_3rd)
        
        # 保存
        trainer.save_models()
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
