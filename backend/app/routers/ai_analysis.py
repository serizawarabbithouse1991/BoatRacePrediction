"""AI連携によるレース分析"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Literal
import httpx

from app.database import get_db
from app.models import db_models

router = APIRouter()


class AIConfig(BaseModel):
    provider: Literal["claude", "openai"]
    api_key: str
    model: Optional[str] = None


class AIAnalysisRequest(BaseModel):
    race_id: int
    config: AIConfig
    prompt_type: Literal["prediction", "analysis", "custom"] = "prediction"
    custom_prompt: Optional[str] = None


class AIAnalysisResponse(BaseModel):
    provider: str
    model: str
    analysis: str
    tokens_used: Optional[int] = None


# プロンプトテンプレート
PROMPTS = {
    "prediction": """あなたはボートレースの予想専門家です。以下の出走表データを分析し、予想を行ってください。

【レース情報】
会場: {venue_name}
日付: {race_date}
レース: {race_no}R
{race_name}

【出走表】
{entries_text}

【分析依頼】
1. 各艇の強み・弱みを分析してください
2. 展開予想（スタート、1マーク）を述べてください
3. 推奨買い目を3つ提示してください（3連単）
4. 穴狙いの買い目があれば1つ提示してください
5. 予想の根拠を簡潔に説明してください

※ 的中を保証するものではありません。参考情報としてご活用ください。
""",

    "analysis": """あなたはボートレースのデータアナリストです。以下の出走表を詳細に分析してください。

【レース情報】
会場: {venue_name}
日付: {race_date}
レース: {race_no}R

【出走表】
{entries_text}

【分析項目】
1. 選手力分析（級別、勝率、実績）
2. 機力分析（モーター2連率、ボート2連率）
3. コース分析（枠番別有利不利、進入予想）
4. スタート分析（平均ST、フライング傾向）
5. 総合評価（各艇のランク付け）

客観的なデータに基づいて分析してください。
"""
}


def format_entries_text(entries) -> str:
    """出走表をテキスト形式に変換"""
    lines = []
    for entry in entries:
        line = f"""
{entry.boat_no}号艇: {entry.racer_name} ({entry.racer_rank or '-'})
  登録番号: {entry.racer_registration_no}
  全国勝率: {entry.win_rate_all:.2f} / 2連率: {entry.place_rate_2_all:.1f}%
  当地勝率: {entry.win_rate_local:.2f} / 2連率: {entry.place_rate_2_local:.1f}%
  モーター: {entry.motor_no or '-'} (2連率: {entry.motor_rate_2:.1f}%)
  ボート: {entry.boat_no_actual or '-'} (2連率: {entry.boat_rate_2:.1f}%)
  平均ST: {entry.avg_start_timing:.2f}
  今節成績: {entry.current_series_results or '-'}
"""
        lines.append(line)
    return "\n".join(lines)


async def call_claude_api(api_key: str, model: str, prompt: str) -> dict:
    """Claude APIを呼び出し"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 2000,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            },
            timeout=60.0
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Claude API error: {response.text}"
            )
        
        data = response.json()
        return {
            "analysis": data["content"][0]["text"],
            "tokens_used": data.get("usage", {}).get("output_tokens", 0)
        }


async def call_openai_api(api_key: str, model: str, prompt: str) -> dict:
    """OpenAI APIを呼び出し"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": "あなたはボートレースの予想・分析の専門家です。"},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 2000,
                "temperature": 0.7
            },
            timeout=60.0
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"OpenAI API error: {response.text}"
            )
        
        data = response.json()
        return {
            "analysis": data["choices"][0]["message"]["content"],
            "tokens_used": data.get("usage", {}).get("total_tokens", 0)
        }


@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_race(request: AIAnalysisRequest, db: Session = Depends(get_db)):
    """AIによるレース分析"""
    
    # レース情報を取得
    race = db.query(db_models.Race).filter(
        db_models.Race.id == request.race_id
    ).first()
    
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
    
    # 出走表を取得
    entries = db.query(db_models.RaceEntry).filter(
        db_models.RaceEntry.race_id == request.race_id
    ).order_by(db_models.RaceEntry.boat_no).all()
    
    if not entries:
        raise HTTPException(status_code=404, detail="No entries found for this race")
    
    # プロンプトを生成
    if request.prompt_type == "custom" and request.custom_prompt:
        prompt = request.custom_prompt
    else:
        template = PROMPTS.get(request.prompt_type, PROMPTS["prediction"])
        prompt = template.format(
            venue_name=race.venue_name,
            race_date=race.race_date,
            race_no=race.race_no,
            race_name=race.race_name or f"第{race.race_no}レース",
            entries_text=format_entries_text(entries)
        )
    
    # モデルを決定
    if request.config.provider == "claude":
        model = request.config.model or "claude-sonnet-4-20250514"
        result = await call_claude_api(request.config.api_key, model, prompt)
    else:  # openai
        model = request.config.model or "gpt-4o"
        result = await call_openai_api(request.config.api_key, model, prompt)
    
    return AIAnalysisResponse(
        provider=request.config.provider,
        model=model,
        analysis=result["analysis"],
        tokens_used=result.get("tokens_used")
    )


@router.get("/models")
async def get_available_models():
    """利用可能なモデル一覧を取得"""
    return {
        "claude": [
            {"id": "claude-sonnet-4-20250514", "name": "Claude Sonnet 4 (推奨)"},
            {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet"},
            {"id": "claude-3-5-haiku-20241022", "name": "Claude 3.5 Haiku (高速)"},
        ],
        "openai": [
            {"id": "gpt-4o", "name": "GPT-4o (推奨)"},
            {"id": "gpt-4o-mini", "name": "GPT-4o mini (高速)"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo"},
        ]
    }
