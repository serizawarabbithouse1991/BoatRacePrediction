# ボートレース予想 AI Predictor

統計分析と機械学習を活用したボートレース予想支援システムです。

## 機能

### 🎯 3つの予想アプローチ

1. **統計分析** - 勝率・モーター成績・コース別データを重み付けしてスコア化
2. **機械学習** - LightGBMによる高速・高精度な着順予測
3. **手動入力** - 自分の判断で予想を記録・管理

### 📊 主な機能

- **レース情報管理**: 出走表の表示・選手成績の確認
- **予想機能**: 統計/AI/手動の3種類の予想方式
- **結果管理**: 的中率・収支の追跡
- **データ取得**: ボートレース公式サイトからの自動データ収集

## 技術スタック

### フロントエンド
- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- Recharts (グラフ)
- TanStack Query

### バックエンド
- Python (FastAPI)
- SQLAlchemy + SQLite
- LightGBM (機械学習)
- BeautifulSoup (スクレイピング)

## セットアップ

### 必要条件

- Node.js 18+
- Python 3.10+

### バックエンド

```bash
cd backend

# 仮想環境を作成
python -m venv venv

# 仮想環境を有効化
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 依存関係をインストール
pip install -r requirements.txt

# サーバーを起動
uvicorn app.main:app --reload
```

### フロントエンド

```bash
cd frontend

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

## 使い方

### 1. データ取得

1. 「データ取得」ページを開く
2. 会場と日付を選択
3. 「出走表を取得」または「全レース取得」をクリック

### 2. 予想を行う

1. 「レース一覧」からレースを選択
2. 出走表を確認
3. 予想パネルで以下のいずれかを実行:
   - **統計予想**: 重みを調整して「統計予想を実行」
   - **AI予想**: 「AI予想を実行」
   - **手動予想**: 自分の予想を入力して保存

### 3. 結果を確認

1. 「統計」ページで的中率・収支を確認
2. 「予想」ページで過去の予想履歴を確認

## API エンドポイント

### レース
- `GET /api/races/` - レース一覧
- `GET /api/races/{id}` - レース詳細
- `POST /api/races/` - レース作成

### 予想
- `GET /api/predictions/race/{race_id}` - レースの予想一覧
- `POST /api/predictions/statistical/{race_id}` - 統計予想
- `POST /api/predictions/ml/{race_id}` - 機械学習予想

### スクレイピング
- `POST /api/scraper/race` - 出走表を取得
- `POST /api/scraper/venue` - 会場の全レースを取得
- `POST /api/scraper/result` - 結果を取得

## 機械学習モデル

### 特徴量

- 選手成績（勝率、2連率、3連率）
- モーター/ボート成績
- コース別成績
- 平均ST
- 級別（A1/A2/B1/B2）
- 今節成績
- 枠番

### モデル学習

```bash
cd backend
python -m ml.train
```

1000レース以上のデータを収集してから学習することを推奨します。

## ライセンス

MIT License

## 注意事項

- スクレイピングはボートレース公式サイトに負荷をかけないよう、適切な間隔を空けて実行してください
- 予想結果は参考情報であり、投票の結果を保証するものではありません
- 公営競技は20歳以上の方のみ参加可能です
