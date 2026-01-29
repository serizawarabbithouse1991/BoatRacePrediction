"""ボートレース公式サイトスクレイピング"""
import time
import requests
from bs4 import BeautifulSoup
from datetime import date, timedelta
from typing import Optional, List, Dict
from sqlalchemy.orm import Session

from app.models import db_models


class BoatRaceScraper:
    """ボートレース公式サイトからデータを取得"""
    
    BASE_URL = "https://www.boatrace.jp"
    
    # 会場コード一覧
    VENUES = {
        "01": "桐生", "02": "戸田", "03": "江戸川", "04": "平和島", "05": "多摩川",
        "06": "浜名湖", "07": "蒲郡", "08": "常滑", "09": "津", "10": "三国",
        "11": "びわこ", "12": "住之江", "13": "尼崎", "14": "鳴門", "15": "丸亀",
        "16": "児島", "17": "宮島", "18": "徳山", "19": "下関", "20": "若松",
        "21": "芦屋", "22": "福岡", "23": "唐津", "24": "大村"
    }
    
    def __init__(self, delay: float = 1.0):
        self.delay = delay  # リクエスト間隔（秒）
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
    
    async def scrape_race_info(
        self, 
        venue_code: str, 
        race_date: date, 
        race_no: int,
        db: Session
    ) -> Dict:
        """指定レースの出走表を取得"""
        
        date_str = race_date.strftime("%Y%m%d")
        url = f"{self.BASE_URL}/owpc/pc/race/racelist?rno={race_no}&jcd={venue_code}&hd={date_str}"
        
        time.sleep(self.delay)
        response = self.session.get(url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "lxml")
        
        # レース情報を取得
        race_data = self._parse_race_info(soup, venue_code, race_date, race_no)
        
        # レースをDBに保存
        db_race = self._save_race(race_data, db)
        
        # 出走表を解析
        entries_data = self._parse_entries(soup, db_race.id)
        
        # 出走表をDBに保存
        for entry_data in entries_data:
            self._save_entry(entry_data, db)
        
        return {
            "race": race_data,
            "entries": entries_data
        }
    
    async def scrape_venue_races(
        self,
        venue_code: str,
        race_date: date,
        db: Session
    ) -> List[Dict]:
        """指定会場の全レースを取得"""
        results = []
        
        for race_no in range(1, 13):  # 1R〜12R
            try:
                result = await self.scrape_race_info(venue_code, race_date, race_no, db)
                results.append(result)
            except Exception as e:
                print(f"Error scraping race {race_no}: {e}")
                continue
        
        return results
    
    async def scrape_race_result(
        self,
        venue_code: str,
        race_date: date,
        race_no: int,
        db: Session
    ) -> Dict:
        """レース結果を取得"""
        
        date_str = race_date.strftime("%Y%m%d")
        url = f"{self.BASE_URL}/owpc/pc/race/raceresult?rno={race_no}&jcd={venue_code}&hd={date_str}"
        
        time.sleep(self.delay)
        response = self.session.get(url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "lxml")
        
        # 結果を解析
        result_data = self._parse_result(soup, venue_code, race_date, race_no)
        
        # 対応するレースを取得
        db_race = db.query(db_models.Race).filter(
            db_models.Race.venue_code == venue_code,
            db_models.Race.race_date == race_date,
            db_models.Race.race_no == race_no
        ).first()
        
        if db_race:
            result_data["race_id"] = db_race.id
            self._save_result(result_data, db)
        
        return result_data
    
    async def scrape_historical_data(
        self,
        venue_code: str,
        start_date: date,
        end_date: date,
        db: Session
    ):
        """過去データを一括取得"""
        current_date = start_date
        
        while current_date <= end_date:
            try:
                await self.scrape_venue_races(venue_code, current_date, db)
                
                # 結果も取得
                for race_no in range(1, 13):
                    try:
                        await self.scrape_race_result(venue_code, current_date, race_no, db)
                    except Exception:
                        continue
                        
            except Exception as e:
                print(f"Error scraping {current_date}: {e}")
            
            current_date += timedelta(days=1)
    
    def _parse_race_info(
        self, 
        soup: BeautifulSoup, 
        venue_code: str,
        race_date: date,
        race_no: int
    ) -> Dict:
        """レース情報を解析"""
        race_data = {
            "venue_code": venue_code,
            "venue_name": self.VENUES.get(venue_code, "不明"),
            "race_date": race_date,
            "race_no": race_no,
            "race_name": "",
            "race_grade": "一般",
            "distance": 1800,
        }
        
        # レース名を取得
        race_title = soup.select_one(".heading2_title")
        if race_title:
            race_data["race_name"] = race_title.get_text(strip=True)
        
        # グレードを判定
        grade_elem = soup.select_one(".label2")
        if grade_elem:
            grade_text = grade_elem.get_text(strip=True)
            if "SG" in grade_text:
                race_data["race_grade"] = "SG"
            elif "G1" in grade_text or "GⅠ" in grade_text:
                race_data["race_grade"] = "G1"
            elif "G2" in grade_text or "GⅡ" in grade_text:
                race_data["race_grade"] = "G2"
            elif "G3" in grade_text or "GⅢ" in grade_text:
                race_data["race_grade"] = "G3"
        
        # 水面コンディション
        weather_elem = soup.select_one(".weather1_body")
        if weather_elem:
            weather_text = weather_elem.get_text()
            race_data["weather"] = self._extract_weather(weather_text)
        
        return race_data
    
    def _parse_entries(self, soup: BeautifulSoup, race_id: int) -> List[Dict]:
        """出走表を解析"""
        entries = []
        
        # 出走表の行を取得
        rows = soup.select(".is-fs12")
        
        for i, row in enumerate(rows[:6], 1):
            entry = {
                "race_id": race_id,
                "boat_no": i,
                "racer_registration_no": "",
                "racer_name": "",
                "racer_rank": "",
                "win_rate_all": 0.0,
                "place_rate_2_all": 0.0,
                "win_rate_local": 0.0,
                "place_rate_2_local": 0.0,
                "motor_no": "",
                "motor_rate_2": 0.0,
                "boat_no_actual": "",
                "boat_rate_2": 0.0,
                "avg_start_timing": 0.0,
            }
            
            # 選手情報を取得
            try:
                cells = row.select("td")
                if len(cells) >= 3:
                    # 登録番号
                    reg_no = cells[0].get_text(strip=True)
                    entry["racer_registration_no"] = reg_no
                    
                    # 選手名
                    name_elem = row.select_one(".is-fs18")
                    if name_elem:
                        entry["racer_name"] = name_elem.get_text(strip=True)
                    
                    # 級別
                    rank_elem = row.select_one(".is-fs11")
                    if rank_elem:
                        entry["racer_rank"] = rank_elem.get_text(strip=True)
            except Exception:
                pass
            
            entries.append(entry)
        
        return entries
    
    def _parse_result(
        self, 
        soup: BeautifulSoup,
        venue_code: str,
        race_date: date,
        race_no: int
    ) -> Dict:
        """レース結果を解析"""
        result = {
            "place_1": 0,
            "place_2": 0,
            "place_3": 0,
            "place_4": 0,
            "place_5": 0,
            "place_6": 0,
        }
        
        # 着順を取得
        result_rows = soup.select(".is-p10-5")
        for i, row in enumerate(result_rows[:6], 1):
            try:
                boat_no = int(row.select_one(".is-fs14").get_text(strip=True))
                result[f"place_{i}"] = boat_no
            except Exception:
                pass
        
        # 払戻金を取得
        payout_section = soup.select_one(".table1")
        if payout_section:
            try:
                # 3連単
                trifecta_elem = payout_section.select_one('[data-type="3t"]')
                if trifecta_elem:
                    result["trifecta"] = trifecta_elem.select_one(".is-payout1").get_text(strip=True)
                    payout_text = trifecta_elem.select_one(".is-payout2").get_text(strip=True)
                    result["trifecta_payout"] = self._parse_payout(payout_text)
            except Exception:
                pass
        
        return result
    
    def _extract_weather(self, text: str) -> str:
        """天候を抽出"""
        weather_map = {
            "晴": "晴",
            "曇": "曇",
            "雨": "雨",
            "雪": "雪",
        }
        for key, value in weather_map.items():
            if key in text:
                return value
        return "不明"
    
    def _parse_payout(self, text: str) -> int:
        """払戻金をパース"""
        try:
            # カンマと円を除去
            clean = text.replace(",", "").replace("円", "").replace("¥", "")
            return int(clean)
        except ValueError:
            return 0
    
    def _save_race(self, race_data: Dict, db: Session) -> db_models.Race:
        """レースをDBに保存"""
        # 既存チェック
        existing = db.query(db_models.Race).filter(
            db_models.Race.venue_code == race_data["venue_code"],
            db_models.Race.race_date == race_data["race_date"],
            db_models.Race.race_no == race_data["race_no"]
        ).first()
        
        if existing:
            for key, value in race_data.items():
                setattr(existing, key, value)
            db.commit()
            return existing
        
        db_race = db_models.Race(**race_data)
        db.add(db_race)
        db.commit()
        db.refresh(db_race)
        return db_race
    
    def _save_entry(self, entry_data: Dict, db: Session):
        """出走表をDBに保存"""
        # 既存チェック
        existing = db.query(db_models.RaceEntry).filter(
            db_models.RaceEntry.race_id == entry_data["race_id"],
            db_models.RaceEntry.boat_no == entry_data["boat_no"]
        ).first()
        
        if existing:
            for key, value in entry_data.items():
                setattr(existing, key, value)
            db.commit()
            return existing
        
        db_entry = db_models.RaceEntry(**entry_data)
        db.add(db_entry)
        db.commit()
        return db_entry
    
    def _save_result(self, result_data: Dict, db: Session):
        """結果をDBに保存"""
        existing = db.query(db_models.RaceResult).filter(
            db_models.RaceResult.race_id == result_data["race_id"]
        ).first()
        
        if existing:
            for key, value in result_data.items():
                setattr(existing, key, value)
            db.commit()
            return existing
        
        db_result = db_models.RaceResult(**result_data)
        db.add(db_result)
        db.commit()
        return db_result
