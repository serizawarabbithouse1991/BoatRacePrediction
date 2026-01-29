import { useState, useEffect } from 'react';
import { Bot, Sparkles, Settings, Loader2, Copy, Check, AlertCircle } from 'lucide-react';
import { aiApi, type AIConfig, type AIAnalysisResponse, type AIModel } from '../api/client';

interface AIAnalysisPanelProps {
  raceId: number;
}

export default function AIAnalysisPanel({ raceId }: AIAnalysisPanelProps) {
  const [provider, setProvider] = useState<'claude' | 'openai'>('claude');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [promptType, setPromptType] = useState<'prediction' | 'analysis' | 'custom'>('prediction');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [models, setModels] = useState<{ claude: AIModel[]; openai: AIModel[] } | null>(null);

  // 保存されたAPIキーを読み込み
  useEffect(() => {
    const savedConfig = localStorage.getItem('aiConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setProvider(config.provider || 'claude');
      setApiKey(config.apiKey || '');
      setModel(config.model || '');
    }

    // 利用可能なモデルを取得
    aiApi.getModels().then(setModels).catch(console.error);
  }, []);

  // 設定を保存
  const saveConfig = () => {
    localStorage.setItem('aiConfig', JSON.stringify({
      provider,
      apiKey,
      model,
    }));
    setShowSettings(false);
  };

  // 分析を実行
  const handleAnalyze = async () => {
    if (!apiKey) {
      setError('APIキーを設定してください');
      setShowSettings(true);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const config: AIConfig = {
        provider,
        api_key: apiKey,
        model: model || undefined,
      };

      const response = await aiApi.analyze({
        race_id: raceId,
        config,
        prompt_type: promptType,
        custom_prompt: promptType === 'custom' ? customPrompt : undefined,
      });

      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || '分析に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 結果をコピー
  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentModels = models?.[provider] || [];

  return (
    <div className="bg-dark-200 rounded-xl border border-gray-800">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">AI分析</h3>
            <p className="text-xs text-gray-400">Claude / ChatGPT連携</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors ${
            showSettings ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* 設定パネル */}
      {showSettings && (
        <div className="p-4 border-b border-gray-800 bg-dark-100 space-y-4">
          {/* プロバイダー選択 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">AIプロバイダー</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setProvider('claude');
                  setModel('');
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  provider === 'claude'
                    ? 'bg-orange-500 text-white'
                    : 'bg-dark-200 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Claude
              </button>
              <button
                onClick={() => {
                  setProvider('openai');
                  setModel('');
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  provider === 'openai'
                    ? 'bg-green-500 text-white'
                    : 'bg-dark-200 text-gray-400 hover:bg-gray-700'
                }`}
              >
                ChatGPT
              </button>
            </div>
          </div>

          {/* APIキー */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {provider === 'claude' ? 'Anthropic' : 'OpenAI'} APIキー
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === 'claude' ? 'sk-ant-...' : 'sk-...'}
              className="w-full px-4 py-2 bg-dark-200 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              APIキーはブラウザにのみ保存され、サーバーには送信されません
            </p>
          </div>

          {/* モデル選択 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">モデル</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2 bg-dark-200 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">デフォルト</option>
              {currentModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* 保存ボタン */}
          <button
            onClick={saveConfig}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
          >
            設定を保存
          </button>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="p-4 space-y-4">
        {/* プロンプトタイプ選択 */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">分析タイプ</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPromptType('prediction')}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                promptType === 'prediction'
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-100 text-gray-400 hover:bg-gray-700'
              }`}
            >
              予想
            </button>
            <button
              onClick={() => setPromptType('analysis')}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                promptType === 'analysis'
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-100 text-gray-400 hover:bg-gray-700'
              }`}
            >
              詳細分析
            </button>
            <button
              onClick={() => setPromptType('custom')}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                promptType === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-100 text-gray-400 hover:bg-gray-700'
              }`}
            >
              カスタム
            </button>
          </div>
        </div>

        {/* カスタムプロンプト */}
        {promptType === 'custom' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">カスタムプロンプト</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="分析してほしい内容を入力..."
              rows={3}
              className="w-full px-4 py-2 bg-dark-100 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
        )}

        {/* 実行ボタン */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !apiKey}
          className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>分析中...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>AIに分析を依頼</span>
            </>
          )}
        </button>

        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* 結果表示 */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className={`px-2 py-0.5 rounded ${
                  result.provider === 'claude' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {result.provider === 'claude' ? 'Claude' : 'ChatGPT'}
                </span>
                <span>{result.model}</span>
                {result.tokens_used && (
                  <span className="text-gray-500">({result.tokens_used} tokens)</span>
                )}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">コピー済み</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>コピー</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="p-4 bg-dark-100 rounded-lg max-h-96 overflow-y-auto">
              <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                {result.analysis}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
