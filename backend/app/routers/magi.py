"""MAGI System - 複数AI協議予想システム"""
import asyncio
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Literal
from collections import Counter
import httpx

from app.database import get_db
from app.models import db_models

router = APIRouter()


# ========== Models ==========

class AIServiceConfig(BaseModel):
    """各AIサービスの設定"""
    enabled: bool = False
    api_key: Optional[str] = None
    model: Optional[str] = None


class MAGIConfig(BaseModel):
    """MAGI全体設定"""
    claude: AIServiceConfig = AIServiceConfig()
    openai: AIServiceConfig = AIServiceConfig()
    gemini: AIServiceConfig = AIServiceConfig()
    grok: AIServiceConfig = AIServiceConfig()


class MAGIRequest(BaseModel):
    """MAGIリクエスト"""
    race_id: int
    config: MAGIConfig


class AIResult(BaseModel):
    """各AIの結果"""
    name: str  # MELCHIOR, BALTHASAR, CASPER, etc.
    provider: str  # claude, openai, gemini, grok
    model: str
    status: Literal["success", "error", "disabled"]
    prediction: Optional[str] = None  # 予想買い目（例: "1-3-4"）
    analysis: Optional[str] = None  # 分析テキスト
    confidence: Optional[str] = None  # 自信度
    error: Optional[str] = None
    tokens_used: Optional[int] = None


class MAGIResponse(BaseModel):
    """MAGI統合結果"""
    race_id: int
    results: List[AIResult]
    consensus: Optional[str] = None  # 多数決による最終予想
    consensus_rate: float = 0.0  # 一致率
    vote_detail: Dict[str, int] = {}  # 各買い目の票数
    active_count: int = 0  # 有効なAI数


# ========== MAGI Names ==========

MAGI_NAMES = {
    "claude": "MELCHIOR",
    "openai": "BALTHASAR", 
    "gemini": "CASPER",
    "grok": "RAMIEL",  # 追加枠（使徒名）
}


# ========== Prompt Template ==========

MAGI_PROMPT = """あなたはボートレース予想の専門家です。以下のレースを分析し、予想を行ってください。

【レース情報】
会場: {venue_name}
日付: {race_date}
レース: {race_no}R {race_name}

【出走表】
{entries_text}

【出力形式】
必ず以下の形式で回答してください：

■予想買い目（3連単）
[買い目を1つだけ記載。例: 1-3-4]

■自信度
[高/中/低 のいずれか]

■分析
[200文字以内で簡潔に根拠を説明]
"""


def format_entries_text(entries) -> str:
    """出走表をテキスト形式に変換"""
    lines = []
    for entry in entries:
        line = f"""{entry.boat_no}号艇: {entry.racer_name} ({entry.racer_rank or '-'})
  全国勝率: {entry.win_rate_all:.2f} / 当地勝率: {entry.win_rate_local:.2f}
  モーター2連率: {entry.motor_rate_2:.1f}% / ボート2連率: {entry.boat_rate_2:.1f}%
  平均ST: {entry.avg_start_timing:.2f} / 今節: {entry.current_series_results or '-'}"""
        lines.append(line)
    return "\n\n".join(lines)


def parse_prediction(text: str) -> Optional[str]:
    """AIの回答から買い目を抽出"""
    # パターン: 1-2-3 形式
    patterns = [
        r'■予想買い目[^\n]*\n\s*(\d-\d-\d)',
        r'買い目[：:]\s*(\d-\d-\d)',
        r'(\d-\d-\d)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    return None


def parse_confidence(text: str) -> Optional[str]:
    """AIの回答から自信度を抽出"""
    if "高" in text and "自信" in text:
        return "高"
    if "中" in text and "自信" in text:
        return "中"
    if "低" in text and "自信" in text:
        return "低"
    
    # ■自信度セクションから抽出
    match = re.search(r'■自信度[^\n]*\n\s*(高|中|低)', text)
    if match:
        return match.group(1)
    return None


# ========== AI API Calls ==========

async def call_claude(api_key: str, model: str, prompt: str) -> dict:
    """Claude API呼び出し"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": model or "claude-sonnet-4-20250514",
                "max_tokens": 1000,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=60.0
        )
        
        if response.status_code != 200:
            raise Exception(f"API error: {response.status_code}")
        
        data = response.json()
        return {
            "text": data["content"][0]["text"],
            "tokens": data.get("usage", {}).get("output_tokens", 0),
            "model": model or "claude-sonnet-4-20250514"
        }


async def call_openai(api_key: str, model: str, prompt: str) -> dict:
    """OpenAI API呼び出し"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model or "gpt-4o",
                "messages": [
                    {"role": "system", "content": "あなたはボートレース予想の専門家です。"},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1000,
                "temperature": 0.7
            },
            timeout=60.0
        )
        
        if response.status_code != 200:
            raise Exception(f"API error: {response.status_code}")
        
        data = response.json()
        return {
            "text": data["choices"][0]["message"]["content"],
            "tokens": data.get("usage", {}).get("total_tokens", 0),
            "model": model or "gpt-4o"
        }


async def call_gemini(api_key: str, model: str, prompt: str) -> dict:
    """Google Gemini API呼び出し"""
    model_name = model or "gemini-2.0-flash"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent",
            headers={"Content-Type": "application/json"},
            params={"key": api_key},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "maxOutputTokens": 1000,
                    "temperature": 0.7
                }
            },
            timeout=60.0
        )
        
        if response.status_code != 200:
            raise Exception(f"API error: {response.status_code} - {response.text}")
        
        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        tokens = data.get("usageMetadata", {}).get("totalTokenCount", 0)
        
        return {
            "text": text,
            "tokens": tokens,
            "model": model_name
        }


async def call_grok(api_key: str, model: str, prompt: str) -> dict:
    """xAI Grok API呼び出し（OpenAI互換API）"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model or "grok-beta",
                "messages": [
                    {"role": "system", "content": "あなたはボートレース予想の専門家です。"},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1000,
                "temperature": 0.7
            },
            timeout=60.0
        )
        
        if response.status_code != 200:
            raise Exception(f"API error: {response.status_code}")
        
        data = response.json()
        return {
            "text": data["choices"][0]["message"]["content"],
            "tokens": data.get("usage", {}).get("total_tokens", 0),
            "model": model or "grok-beta"
        }


# ========== MAGI Core ==========

async def call_ai_service(
    provider: str,
    config: AIServiceConfig,
    prompt: str
) -> AIResult:
    """個別AIサービスを呼び出し"""
    magi_name = MAGI_NAMES.get(provider, provider.upper())
    
    if not config.enabled or not config.api_key:
        return AIResult(
            name=magi_name,
            provider=provider,
            model="",
            status="disabled"
        )
    
    try:
        if provider == "claude":
            result = await call_claude(config.api_key, config.model, prompt)
        elif provider == "openai":
            result = await call_openai(config.api_key, config.model, prompt)
        elif provider == "gemini":
            result = await call_gemini(config.api_key, config.model, prompt)
        elif provider == "grok":
            result = await call_grok(config.api_key, config.model, prompt)
        else:
            raise Exception(f"Unknown provider: {provider}")
        
        # 予想を抽出
        prediction = parse_prediction(result["text"])
        confidence = parse_confidence(result["text"])
        
        return AIResult(
            name=magi_name,
            provider=provider,
            model=result["model"],
            status="success",
            prediction=prediction,
            analysis=result["text"],
            confidence=confidence,
            tokens_used=result["tokens"]
        )
        
    except Exception as e:
        return AIResult(
            name=magi_name,
            provider=provider,
            model=config.model or "",
            status="error",
            error=str(e)
        )


def calculate_consensus(results: List[AIResult]) -> tuple:
    """多数決による合意形成"""
    # 成功した予想のみ抽出
    predictions = [
        r.prediction for r in results 
        if r.status == "success" and r.prediction
    ]
    
    if not predictions:
        return None, 0.0, {}
    
    # 票数をカウント
    vote_count = Counter(predictions)
    
    # 最多票を取得
    most_common = vote_count.most_common(1)
    if most_common:
        consensus = most_common[0][0]
        consensus_rate = most_common[0][1] / len(predictions)
        return consensus, consensus_rate, dict(vote_count)
    
    return None, 0.0, {}


# ========== API Endpoints ==========

@router.post("/analyze", response_model=MAGIResponse)
async def magi_analyze(request: MAGIRequest, db: Session = Depends(get_db)):
    """MAGI System - 複数AI協議分析"""
    
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
        raise HTTPException(status_code=404, detail="No entries found")
    
    # プロンプトを生成
    prompt = MAGI_PROMPT.format(
        venue_name=race.venue_name,
        race_date=race.race_date,
        race_no=race.race_no,
        race_name=race.race_name or f"第{race.race_no}レース",
        entries_text=format_entries_text(entries)
    )
    
    # 各AIを並列呼び出し
    tasks = [
        call_ai_service("claude", request.config.claude, prompt),
        call_ai_service("openai", request.config.openai, prompt),
        call_ai_service("gemini", request.config.gemini, prompt),
        call_ai_service("grok", request.config.grok, prompt),
    ]
    
    results = await asyncio.gather(*tasks)
    
    # 合意形成
    consensus, consensus_rate, vote_detail = calculate_consensus(results)
    
    # 有効なAI数
    active_count = sum(1 for r in results if r.status == "success")
    
    return MAGIResponse(
        race_id=request.race_id,
        results=results,
        consensus=consensus,
        consensus_rate=consensus_rate,
        vote_detail=vote_detail,
        active_count=active_count
    )


@router.get("/models")
async def get_magi_models():
    """各AIサービスの利用可能モデル"""
    return {
        "claude": [
            {"id": "claude-sonnet-4-20250514", "name": "Claude Sonnet 4 (推奨)"},
            {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet"},
            {"id": "claude-3-5-haiku-20241022", "name": "Claude 3.5 Haiku"},
        ],
        "openai": [
            {"id": "gpt-4o", "name": "GPT-4o (推奨)"},
            {"id": "gpt-4o-mini", "name": "GPT-4o mini"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo"},
        ],
        "gemini": [
            {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash (推奨)"},
            {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro"},
            {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash"},
        ],
        "grok": [
            {"id": "grok-beta", "name": "Grok Beta (推奨)"},
            {"id": "grok-2", "name": "Grok 2"},
        ]
    }


@router.get("/info")
async def get_magi_info():
    """MAGIシステム情報"""
    return {
        "name": "MAGI System",
        "version": "1.0.0",
        "description": "Multiple AI Governance Intelligence - 複数AI協議予想システム",
        "components": [
            {"name": "MELCHIOR", "provider": "Claude (Anthropic)", "role": "科学者としての分析"},
            {"name": "BALTHASAR", "provider": "ChatGPT (OpenAI)", "role": "母としての直感"},
            {"name": "CASPER", "provider": "Gemini (Google)", "role": "女としての感性"},
            {"name": "RAMIEL", "provider": "Grok (xAI)", "role": "使徒の視点"},
        ]
    }
