import { useState, useEffect } from 'react';
import { Save, RotateCcw, Brain, Calculator, Database, Bot, Eye, EyeOff } from 'lucide-react';
import type { PredictionWeights } from '../types';
import { aiApi, type AIModel } from '../api/client';

const defaultWeights: PredictionWeights = {
  win_rate_all: 0.20,
  win_rate_local: 0.15,
  motor_rate: 0.15,
  boat_rate: 0.10,
  avg_st: 0.15,
  course_rate: 0.15,
  current_series: 0.10,
};

const weightLabels: Record<keyof PredictionWeights, string> = {
  win_rate_all: '全国勝率',
  win_rate_local: '当地勝率',
  motor_rate: 'モーター2連率',
  boat_rate: 'ボート2連率',
  avg_st: '平均ST',
  course_rate: 'コース勝率',
  current_series: '今節成績',
};

export default function Settings() {
  const [weights, setWeights] = useState<PredictionWeights>(defaultWeights);
  const [isSaving, setIsSaving] = useState(false);
  
  // AI設定
  const [aiProvider, setAiProvider] = useState<'claude' | 'openai'>('claude');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [claudeModel, setClaudeModel] = useState('');
  const [openaiModel, setOpenaiModel] = useState('');
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [models, setModels] = useState<{ claude: AIModel[]; openai: AIModel[] } | null>(null);

  // 設定を読み込み
  useEffect(() => {
    const savedConfig = localStorage.getItem('aiConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setAiProvider(config.provider || 'claude');
      if (config.provider === 'claude') {
        setClaudeApiKey(config.apiKey || '');
        setClaudeModel(config.model || '');
      } else {
        setOpenaiApiKey(config.apiKey || '');
        setOpenaiModel(config.model || '');
      }
    }
    
    // 個別保存されたキーも読み込み
    const claudeKey = localStorage.getItem('claudeApiKey');
    const openaiKey = localStorage.getItem('openaiApiKey');
    if (claudeKey) setClaudeApiKey(claudeKey);
    if (openaiKey) setOpenaiApiKey(openaiKey);
    
    // モデル一覧を取得
    aiApi.getModels().then(setModels).catch(console.error);
  }, []);

  const handleWeightChange = (key: keyof PredictionWeights, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setWeights(defaultWeights);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // 設定を保存（LocalStorageまたはAPI）
    localStorage.setItem('predictionWeights', JSON.stringify(weights));
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
  };

  const handleSaveAiConfig = () => {
    // 両方のAPIキーを個別に保存
    if (claudeApiKey) localStorage.setItem('claudeApiKey', claudeApiKey);
    if (openaiApiKey) localStorage.setItem('openaiApiKey', openaiApiKey);
    
    // 現在選択中のプロバイダーの設定をaiConfigとして保存
    const config = {
      provider: aiProvider,
      apiKey: aiProvider === 'claude' ? claudeApiKey : openaiApiKey,
      model: aiProvider === 'claude' ? claudeModel : openaiModel,
    };
    localStorage.setItem('aiConfig', JSON.stringify(config));
    
    alert('AI設定を保存しました');
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-white">設定</h1>
        <p className="text-gray-400">予想エンジンのパラメータを調整します</p>
      </div>

      {/* 統計予想の重み設定 */}
      <div className="bg-dark-200 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <Calculator className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="font-bold text-white">統計予想の重み設定</h2>
            <p className="text-sm text-gray-400">各項目の重要度を調整して予想精度を向上させます</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {Object.entries(weights).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300">
                  {weightLabels[key as keyof PredictionWeights]}
                </label>
                <span className="text-blue-400 font-mono font-bold">
                  {(value * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={value}
                onChange={(e) => handleWeightChange(key as keyof PredictionWeights, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-blue-500
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:hover:bg-blue-400
                "
              />
            </div>
          ))}

          {/* 合計表示 */}
          <div className={`p-4 rounded-lg ${Math.abs(totalWeight - 1) < 0.01 ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
            <div className="flex items-center justify-between">
              <span className={Math.abs(totalWeight - 1) < 0.01 ? 'text-green-400' : 'text-yellow-400'}>
                合計重み
              </span>
              <span className={`font-bold ${Math.abs(totalWeight - 1) < 0.01 ? 'text-green-400' : 'text-yellow-400'}`}>
                {(totalWeight * 100).toFixed(0)}%
              </span>
            </div>
            {Math.abs(totalWeight - 1) >= 0.01 && (
              <p className="text-xs text-yellow-400/80 mt-1">
                合計が100%になるように調整することを推奨します
              </p>
            )}
          </div>

          {/* ボタン */}
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>リセット</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? '保存中...' : '保存'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 機械学習モデル */}
      <div className="bg-dark-200 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="font-bold text-white">機械学習モデル</h2>
            <p className="text-sm text-gray-400">学習済みモデルの情報と再学習</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-dark-100 rounded-lg">
              <p className="text-sm text-gray-400">モデル</p>
              <p className="text-white font-medium">LightGBM</p>
            </div>
            <div className="p-4 bg-dark-100 rounded-lg">
              <p className="text-sm text-gray-400">学習データ数</p>
              <p className="text-white font-medium">- レース</p>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
            <Brain className="w-4 h-4" />
            <span>モデルを再学習</span>
          </button>
          
          <p className="text-xs text-gray-500">
            ※ 再学習には1000レース以上のデータと数分の時間が必要です
          </p>
        </div>
      </div>

      {/* AI連携設定 */}
      <div className="bg-dark-200 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <Bot className="w-6 h-6 text-violet-400" />
          <div>
            <h2 className="font-bold text-white">AI連携設定</h2>
            <p className="text-sm text-gray-400">Claude / ChatGPT APIの設定</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* デフォルトプロバイダー */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">デフォルトプロバイダー</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAiProvider('claude')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  aiProvider === 'claude'
                    ? 'bg-orange-500 text-white'
                    : 'bg-dark-100 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Claude (Anthropic)
              </button>
              <button
                onClick={() => setAiProvider('openai')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  aiProvider === 'openai'
                    ? 'bg-green-500 text-white'
                    : 'bg-dark-100 text-gray-400 hover:bg-gray-700'
                }`}
              >
                ChatGPT (OpenAI)
              </button>
            </div>
          </div>

          {/* Claude API設定 */}
          <div className="p-4 bg-dark-100 rounded-lg space-y-4">
            <h3 className="font-medium text-orange-400">Claude (Anthropic)</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-2">APIキー</label>
              <div className="flex gap-2">
                <input
                  type={showClaudeKey ? 'text' : 'password'}
                  value={claudeApiKey}
                  onChange={(e) => setClaudeApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="flex-1 px-4 py-2 bg-dark-200 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                />
                <button
                  onClick={() => setShowClaudeKey(!showClaudeKey)}
                  className="px-3 py-2 bg-dark-200 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  {showClaudeKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">モデル</label>
              <select
                value={claudeModel}
                onChange={(e) => setClaudeModel(e.target.value)}
                className="w-full px-4 py-2 bg-dark-200 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">デフォルト (Claude Sonnet 4)</option>
                {models?.claude.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* OpenAI API設定 */}
          <div className="p-4 bg-dark-100 rounded-lg space-y-4">
            <h3 className="font-medium text-green-400">ChatGPT (OpenAI)</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-2">APIキー</label>
              <div className="flex gap-2">
                <input
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 px-4 py-2 bg-dark-200 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                />
                <button
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="px-3 py-2 bg-dark-200 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  {showOpenaiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">モデル</label>
              <select
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                className="w-full px-4 py-2 bg-dark-200 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
              >
                <option value="">デフォルト (GPT-4o)</option>
                {models?.openai.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            ※ APIキーはブラウザのローカルストレージにのみ保存されます。サーバーには送信されません。
          </div>

          <button
            onClick={handleSaveAiConfig}
            className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-colors"
          >
            AI設定を保存
          </button>
        </div>
      </div>

      {/* データベース */}
      <div className="bg-dark-200 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <Database className="w-6 h-6 text-cyan-400" />
          <div>
            <h2 className="font-bold text-white">データベース</h2>
            <p className="text-sm text-gray-400">蓄積データの管理</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-dark-100 rounded-lg">
              <p className="text-sm text-gray-400">レース数</p>
              <p className="text-white font-medium text-2xl">-</p>
            </div>
            <div className="p-4 bg-dark-100 rounded-lg">
              <p className="text-sm text-gray-400">選手数</p>
              <p className="text-white font-medium text-2xl">-</p>
            </div>
            <div className="p-4 bg-dark-100 rounded-lg">
              <p className="text-sm text-gray-400">予想数</p>
              <p className="text-white font-medium text-2xl">-</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
