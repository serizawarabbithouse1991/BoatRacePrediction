import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Calculator, User, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { predictionsApi, racesApi } from '../api/client';
import type { Prediction, Race } from '../types';

export default function Predictions() {
  const [predictions, setPredictions] = useState<(Prediction & { race?: Race })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'manual' | 'statistical' | 'ml'>('all');

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setIsLoading(true);
    try {
      // ここでは全てのレースから予想を取得する必要がある
      // 実際のAPIでは/predictions/allのようなエンドポイントが必要
      const races = await racesApi.getAll();
      const allPredictions: (Prediction & { race?: Race })[] = [];
      
      for (const race of races.slice(0, 20)) { // 最新20レースのみ
        try {
          const preds = await predictionsApi.getByRace(race.id);
          preds.forEach(p => allPredictions.push({ ...p, race }));
        } catch {
          // 予想がないレースはスキップ
        }
      }
      
      setPredictions(allPredictions);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPredictions = predictions.filter(p => 
    filter === 'all' || p.prediction_type === filter
  );

  const typeIcon = (type: string) => {
    switch (type) {
      case 'statistical': return <Calculator className="w-4 h-4" />;
      case 'ml': return <Brain className="w-4 h-4" />;
      case 'manual': return <User className="w-4 h-4" />;
      default: return null;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'statistical': return '統計';
      case 'ml': return 'AI';
      case 'manual': return '手動';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-white">予想履歴</h1>
        <p className="text-gray-400">過去の予想と結果を確認します</p>
      </div>

      {/* フィルター */}
      <div className="flex gap-2">
        {(['all', 'manual', 'statistical', 'ml'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${filter === type 
                ? 'bg-blue-600 text-white' 
                : 'bg-dark-200 text-gray-400 hover:bg-dark-100'
              }
            `}
          >
            {type === 'all' ? '全て' : typeLabel(type)}
          </button>
        ))}
      </div>

      {/* 予想一覧 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">読み込み中...</div>
        </div>
      ) : filteredPredictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Brain className="w-12 h-12 mb-4" />
          <p>予想がありません</p>
          <p className="text-sm mt-2">レース詳細ページで予想を行ってください</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPredictions.map((prediction) => (
            <div
              key={prediction.id}
              className="bg-dark-200 rounded-xl border border-gray-800 p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* 予想タイプ */}
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${prediction.prediction_type === 'statistical' ? 'bg-blue-500/20 text-blue-400' : ''}
                    ${prediction.prediction_type === 'ml' ? 'bg-purple-500/20 text-purple-400' : ''}
                    ${prediction.prediction_type === 'manual' ? 'bg-gray-500/20 text-gray-400' : ''}
                  `}>
                    {typeIcon(prediction.prediction_type)}
                  </div>

                  <div>
                    {/* レース情報 */}
                    {prediction.race && (
                      <Link
                        to={`/races/${prediction.race.id}`}
                        className="flex items-center gap-2 text-white font-medium hover:text-blue-400 transition-colors"
                      >
                        <span>{prediction.race.venue_name} {prediction.race.race_no}R</span>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span>{typeLabel(prediction.prediction_type)}予想</span>
                      {prediction.predicted_rank && (
                        <span className="font-mono font-bold text-lg text-white">
                          {prediction.predicted_rank}
                        </span>
                      )}
                      {prediction.bet_type && (
                        <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">
                          {prediction.bet_type}
                        </span>
                      )}
                    </div>

                    {/* メモ */}
                    {prediction.memo && (
                      <p className="mt-2 text-sm text-gray-500">{prediction.memo}</p>
                    )}
                  </div>
                </div>

                {/* 結果 */}
                <div className="text-right">
                  {prediction.is_hit !== undefined && (
                    <div className={`flex items-center gap-2 ${prediction.is_hit ? 'text-green-400' : 'text-red-400'}`}>
                      {prediction.is_hit ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-bold">的中</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          <span className="font-bold">不的中</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  {prediction.bet_amount && (
                    <div className="text-sm text-gray-400 mt-1">
                      賭け金: ¥{prediction.bet_amount.toLocaleString()}
                    </div>
                  )}
                  
                  {prediction.return_amount && (
                    <div className="text-sm text-green-400 mt-1">
                      払戻: ¥{prediction.return_amount.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
