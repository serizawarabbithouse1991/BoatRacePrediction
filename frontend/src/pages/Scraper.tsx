import { useState } from 'react';
import { format } from 'date-fns';
import { Download, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react';
import { scraperApi } from '../api/client';
import { VENUES } from '../types';

interface ScrapeResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export default function Scraper() {
  const [venueCode, setVenueCode] = useState('');
  const [raceDate, setRaceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [raceNo, setRaceNo] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScrapeResult[]>([]);

  const addResult = (result: ScrapeResult) => {
    setResults((prev) => [result, ...prev].slice(0, 10));
  };

  const handleScrapeRace = async () => {
    if (!venueCode) {
      addResult({ success: false, message: '会場を選択してください' });
      return;
    }

    setIsLoading(true);
    try {
      const data = await scraperApi.scrapeRace(venueCode, raceDate, raceNo);
      addResult({
        success: true,
        message: `${VENUES.find(v => v.code === venueCode)?.name} ${raceNo}R のデータを取得しました`,
        data,
      });
    } catch (error) {
      addResult({
        success: false,
        message: `データ取得に失敗しました: ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrapeVenue = async () => {
    if (!venueCode) {
      addResult({ success: false, message: '会場を選択してください' });
      return;
    }

    setIsLoading(true);
    try {
      const data = await scraperApi.scrapeVenue(venueCode, raceDate);
      addResult({
        success: true,
        message: `${VENUES.find(v => v.code === venueCode)?.name} の全レースデータを取得しました`,
        data,
      });
    } catch (error) {
      addResult({
        success: false,
        message: `データ取得に失敗しました: ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrapeResult = async () => {
    if (!venueCode) {
      addResult({ success: false, message: '会場を選択してください' });
      return;
    }

    setIsLoading(true);
    try {
      const data = await scraperApi.scrapeResult(venueCode, raceDate, raceNo);
      addResult({
        success: true,
        message: `${VENUES.find(v => v.code === venueCode)?.name} ${raceNo}R の結果を取得しました`,
        data,
      });
    } catch (error) {
      addResult({
        success: false,
        message: `結果取得に失敗しました: ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-white">データ取得</h1>
        <p className="text-gray-400">ボートレース公式サイトから出走表・結果を取得します</p>
      </div>

      {/* 設定フォーム */}
      <div className="bg-dark-200 rounded-xl border border-gray-800 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 会場選択 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">会場</label>
            <select
              value={venueCode}
              onChange={(e) => setVenueCode(e.target.value)}
              className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">会場を選択</option>
              {VENUES.map((venue) => (
                <option key={venue.code} value={venue.code}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          {/* 日付選択 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">日付</label>
            <input
              type="date"
              value={raceDate}
              onChange={(e) => setRaceDate(e.target.value)}
              className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* レース番号 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">レース番号</label>
            <select
              value={raceNo}
              onChange={(e) => setRaceNo(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}R
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleScrapeRace}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>出走表を取得</span>
          </button>

          <button
            onClick={handleScrapeVenue}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Database className="w-5 h-5" />
            )}
            <span>全レース取得</span>
          </button>

          <button
            onClick={handleScrapeResult}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <span>結果を取得</span>
          </button>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-yellow-400 font-medium">注意事項</p>
            <ul className="text-yellow-400/80 mt-1 space-y-1">
              <li>• データ取得はボートレース公式サイトに負荷をかけないよう、間隔を空けて実行してください</li>
              <li>• 過去データの一括取得は時間がかかります</li>
              <li>• 機械学習モデルの学習には1000レース以上のデータを推奨します</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 取得結果ログ */}
      <div className="bg-dark-200 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-bold text-white">取得ログ</h3>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              取得結果がここに表示されます
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 flex items-start gap-3 ${
                    result.success ? 'bg-green-500/5' : 'bg-red-500/5'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  )}
                  <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
