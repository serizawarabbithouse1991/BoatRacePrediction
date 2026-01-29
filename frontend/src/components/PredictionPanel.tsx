import { useState } from 'react';
import { Brain, Calculator, User, ChevronDown } from 'lucide-react';
import type { StatisticalPrediction, MLPrediction, PredictionWeights } from '../types';
import BoatNumber from './BoatNumber';

interface PredictionPanelProps {
  statisticalPrediction?: StatisticalPrediction | null;
  mlPrediction?: MLPrediction | null;
  onStatisticalPredict: (weights?: PredictionWeights) => void;
  onMLPredict: () => void;
  isLoading?: boolean;
}

const defaultWeights: PredictionWeights = {
  win_rate_all: 0.20,
  win_rate_local: 0.15,
  motor_rate: 0.15,
  boat_rate: 0.10,
  avg_st: 0.15,
  course_rate: 0.15,
  current_series: 0.10,
};

export default function PredictionPanel({
  statisticalPrediction,
  mlPrediction,
  onStatisticalPredict,
  onMLPredict,
  isLoading,
}: PredictionPanelProps) {
  const [activeTab, setActiveTab] = useState<'statistical' | 'ml' | 'manual'>('statistical');
  const [weights, setWeights] = useState<PredictionWeights>(defaultWeights);
  const [showWeights, setShowWeights] = useState(false);

  const handleWeightChange = (key: keyof PredictionWeights, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'statistical', label: '統計分析', icon: Calculator },
    { id: 'ml', label: '機械学習', icon: Brain },
    { id: 'manual', label: '手動予想', icon: User },
  ] as const;

  return (
    <div className="bg-dark-200 rounded-xl border border-gray-800">
      {/* タブ */}
      <div className="flex border-b border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-4 transition-colors
                ${isActive 
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* コンテンツ */}
      <div className="p-6">
        {/* 統計分析タブ */}
        {activeTab === 'statistical' && (
          <div className="space-y-6">
            {/* 重み設定 */}
            <div>
              <button
                onClick={() => setShowWeights(!showWeights)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showWeights ? 'rotate-180' : ''}`} />
                <span className="text-sm">重み設定</span>
              </button>
              
              {showWeights && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {Object.entries(weights).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-400 mb-1">
                        {getWeightLabel(key as keyof PredictionWeights)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.05"
                        value={value}
                        onChange={(e) => handleWeightChange(key as keyof PredictionWeights, parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{(value * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 予想実行ボタン */}
            <button
              onClick={() => onStatisticalPredict(weights)}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-lg hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-50"
            >
              {isLoading ? '分析中...' : '統計予想を実行'}
            </button>

            {/* 結果表示 */}
            {statisticalPrediction && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">推奨買い目</p>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                    {statisticalPrediction.recommended_rank}
                  </p>
                </div>

                <div className="space-y-2">
                  {statisticalPrediction.scores.map((boat) => (
                    <div
                      key={boat.boat_no}
                      className="flex items-center gap-3 p-3 bg-dark-100 rounded-lg"
                    >
                      <BoatNumber number={boat.boat_no} />
                      <div className="flex-1">
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                            style={{ width: `${Math.min(boat.score, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-mono text-gray-300 w-16 text-right">
                        {boat.score.toFixed(1)}pt
                      </span>
                      <span className="text-xs text-gray-500 w-8">
                        {boat.rank}位
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 機械学習タブ */}
        {activeTab === 'ml' && (
          <div className="space-y-6">
            <button
              onClick={onMLPredict}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-400 transition-all disabled:opacity-50"
            >
              {isLoading ? '予測中...' : 'AI予想を実行'}
            </button>

            {mlPrediction && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">AI予想</p>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    {mlPrediction.predicted_rank}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    信頼度: {(mlPrediction.model_confidence * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="space-y-2">
                  {mlPrediction.probabilities.map((boat) => (
                    <div
                      key={boat.boat_no}
                      className="flex items-center gap-3 p-3 bg-dark-100 rounded-lg"
                    >
                      <BoatNumber number={boat.boat_no} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-8">1着</span>
                          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400"
                              style={{ width: `${boat.prob_1st * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-10 text-right">
                            {(boat.prob_1st * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-8">2着</span>
                          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gray-400"
                              style={{ width: `${boat.prob_2nd * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-10 text-right">
                            {(boat.prob_2nd * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 手動予想タブ */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              自分の判断で予想を入力してください。
            </p>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">予想順位</label>
              <input
                type="text"
                placeholder="例: 1-3-4"
                className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">買い目</label>
              <select className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none">
                <option value="trifecta">3連単</option>
                <option value="trio">3連複</option>
                <option value="exacta">2連単</option>
                <option value="quinella">2連複</option>
                <option value="win">単勝</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">賭け金</label>
              <input
                type="number"
                placeholder="100"
                className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">メモ</label>
              <textarea
                rows={3}
                placeholder="予想理由など"
                className="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <button className="w-full py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors">
              予想を保存
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getWeightLabel(key: keyof PredictionWeights): string {
  const labels: Record<keyof PredictionWeights, string> = {
    win_rate_all: '全国勝率',
    win_rate_local: '当地勝率',
    motor_rate: 'モーター2連率',
    boat_rate: 'ボート2連率',
    avg_st: '平均ST',
    course_rate: 'コース勝率',
    current_series: '今節成績',
  };
  return labels[key];
}
