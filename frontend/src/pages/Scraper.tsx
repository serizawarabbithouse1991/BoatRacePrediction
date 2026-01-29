import { useState } from 'react';
import { format, subYears, subDays } from 'date-fns';
import { Download, CheckCircle, AlertCircle, Loader2, Database, History, Play, Square } from 'lucide-react';
import { scraperApi } from '../api/client';
import { VENUES } from '../types';

interface ScrapeResult {
  success: boolean;
  message: string;
  data?: unknown;
}

interface BatchProgress {
  venue: string;
  venueName: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  current: number;
  total: number;
  message?: string;
}

export default function Scraper() {
  const [venueCode, setVenueCode] = useState('');
  const [raceDate, setRaceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [raceNo, setRaceNo] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScrapeResult[]>([]);
  
  // 一括取得用の状態
  const [batchMode, setBatchMode] = useState<'single' | 'batch'>('single');
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [batchStartDate, setBatchStartDate] = useState(format(subYears(new Date(), 1), 'yyyy-MM-dd'));
  const [batchEndDate, setBatchEndDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [batchProgress, setBatchProgress] = useState<BatchProgress[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [shouldStop, setShouldStop] = useState(false);

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

  // 会場の選択/解除
  const toggleVenue = (code: string) => {
    setSelectedVenues(prev => 
      prev.includes(code) 
        ? prev.filter(v => v !== code)
        : [...prev, code]
    );
  };

  // 全会場選択/解除
  const toggleAllVenues = () => {
    if (selectedVenues.length === VENUES.length) {
      setSelectedVenues([]);
    } else {
      setSelectedVenues(VENUES.map(v => v.code));
    }
  };

  // 一括取得の実行
  const handleBatchScrape = async () => {
    if (selectedVenues.length === 0) {
      addResult({ success: false, message: '会場を選択してください' });
      return;
    }

    setIsBatchRunning(true);
    setShouldStop(false);

    // 進捗状況の初期化
    const initialProgress: BatchProgress[] = selectedVenues.map(code => ({
      venue: code,
      venueName: VENUES.find(v => v.code === code)?.name || code,
      status: 'pending',
      current: 0,
      total: 0,
    }));
    setBatchProgress(initialProgress);

    // 各会場を順番に処理
    for (let i = 0; i < selectedVenues.length; i++) {
      if (shouldStop) {
        addResult({ success: false, message: '一括取得を中断しました' });
        break;
      }

      const venueCode = selectedVenues[i];
      const venueName = VENUES.find(v => v.code === venueCode)?.name || venueCode;

      // 進捗を更新（実行中）
      setBatchProgress(prev => prev.map((p, idx) => 
        idx === i ? { ...p, status: 'running', message: '取得中...' } : p
      ));

      try {
        // 過去データ一括取得APIを呼び出し
        await scraperApi.scrapeHistorical(venueCode, batchStartDate, batchEndDate);
        
        // 完了
        setBatchProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'completed', message: '完了' } : p
        ));
        
        addResult({
          success: true,
          message: `${venueName} のデータ取得を開始しました（${batchStartDate} 〜 ${batchEndDate}）`,
        });
      } catch (error) {
        // エラー
        setBatchProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'error', message: `エラー: ${error}` } : p
        ));
        
        addResult({
          success: false,
          message: `${venueName} のデータ取得に失敗しました: ${error}`,
        });
      }

      // サーバー負荷軽減のため少し待機
      if (i < selectedVenues.length - 1 && !shouldStop) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsBatchRunning(false);
    addResult({
      success: true,
      message: '一括取得リクエストが完了しました。バックグラウンドで処理中です。',
    });
  };

  // 一括取得の停止
  const handleStopBatch = () => {
    setShouldStop(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">データ取得</h1>
          <p className="text-gray-400">ボートレース公式サイトから出走表・結果を取得します</p>
        </div>
        
        {/* モード切り替え */}
        <div className="flex bg-dark-200 rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => setBatchMode('single')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              batchMode === 'single' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            単発取得
          </button>
          <button
            onClick={() => setBatchMode('batch')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              batchMode === 'batch' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>一括取得</span>
            </div>
          </button>
        </div>
      </div>

      {/* 単発取得モード */}
      {batchMode === 'single' && (
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
      )}

      {/* 一括取得モード */}
      {batchMode === 'batch' && (
        <div className="space-y-6">
          {/* 期間設定 */}
          <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4">取得期間</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">開始日</label>
                <input
                  type="date"
                  value={batchStartDate}
                  onChange={(e) => setBatchStartDate(e.target.value)}
                  className="px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <span className="text-gray-500 mt-6">〜</span>
              <div>
                <label className="block text-sm text-gray-400 mb-2">終了日</label>
                <input
                  type="date"
                  value={batchEndDate}
                  onChange={(e) => setBatchEndDate(e.target.value)}
                  className="px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setBatchStartDate(format(subYears(new Date(), 1), 'yyyy-MM-dd'));
                    setBatchEndDate(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  過去1年
                </button>
                <button
                  onClick={() => {
                    setBatchStartDate(format(subDays(new Date(), 90), 'yyyy-MM-dd'));
                    setBatchEndDate(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  過去3ヶ月
                </button>
                <button
                  onClick={() => {
                    setBatchStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
                    setBatchEndDate(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  過去1ヶ月
                </button>
              </div>
            </div>
          </div>

          {/* 会場選択 */}
          <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">会場選択</h3>
              <button
                onClick={toggleAllVenues}
                className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {selectedVenues.length === VENUES.length ? '全解除' : '全選択'}
              </button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {VENUES.map((venue) => {
                const isSelected = selectedVenues.includes(venue.code);
                const progress = batchProgress.find(p => p.venue === venue.code);
                
                return (
                  <button
                    key={venue.code}
                    onClick={() => toggleVenue(venue.code)}
                    disabled={isBatchRunning}
                    className={`
                      relative px-3 py-2 rounded-lg font-medium text-sm transition-all
                      ${isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-dark-100 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }
                      ${isBatchRunning ? 'cursor-not-allowed' : ''}
                    `}
                  >
                    {venue.name}
                    {progress && (
                      <span className={`
                        absolute -top-1 -right-1 w-3 h-3 rounded-full
                        ${progress.status === 'running' ? 'bg-yellow-500 animate-pulse' : ''}
                        ${progress.status === 'completed' ? 'bg-green-500' : ''}
                        ${progress.status === 'error' ? 'bg-red-500' : ''}
                      `} />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {selectedVenues.length} / {VENUES.length} 会場選択中
            </p>
          </div>

          {/* 実行ボタン */}
          <div className="flex gap-4">
            {!isBatchRunning ? (
              <button
                onClick={handleBatchScrape}
                disabled={selectedVenues.length === 0}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5" />
                <span>一括取得を開始</span>
              </button>
            ) : (
              <button
                onClick={handleStopBatch}
                className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
              >
                <Square className="w-5 h-5" />
                <span>停止</span>
              </button>
            )}
          </div>

          {/* 進捗表示 */}
          {batchProgress.length > 0 && (
            <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4">取得状況</h3>
              <div className="space-y-2">
                {batchProgress.map((progress) => (
                  <div
                    key={progress.venue}
                    className={`
                      flex items-center justify-between p-3 rounded-lg
                      ${progress.status === 'running' ? 'bg-yellow-500/10 border border-yellow-500/30' : ''}
                      ${progress.status === 'completed' ? 'bg-green-500/10 border border-green-500/30' : ''}
                      ${progress.status === 'error' ? 'bg-red-500/10 border border-red-500/30' : ''}
                      ${progress.status === 'pending' ? 'bg-dark-100' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {progress.status === 'running' && (
                        <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                      )}
                      {progress.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                      {progress.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      {progress.status === 'pending' && (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
                      )}
                      <span className={`font-medium ${
                        progress.status === 'running' ? 'text-yellow-400' :
                        progress.status === 'completed' ? 'text-green-400' :
                        progress.status === 'error' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {progress.venueName}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {progress.message || '待機中'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 注意事項 */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-yellow-400 font-medium">注意事項</p>
            <ul className="text-yellow-400/80 mt-1 space-y-1">
              <li>• データ取得はボートレース公式サイトに負荷をかけないよう、間隔を空けて実行してください</li>
              <li>• 一括取得はバックグラウンドで実行されます。完了まで数時間かかることがあります</li>
              <li>• 1会場・1年分で約4,300レース（12レース×365日）のデータを取得できます</li>
              <li>• 機械学習モデルの学習には1000レース以上のデータを推奨します</li>
              <li>• サーバーログで進捗を確認できます</li>
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
