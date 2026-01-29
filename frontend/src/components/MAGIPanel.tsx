import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Check, X, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { magiApi, type MAGIConfig, type MAGIResponse, type MAGIResult } from '../api/client';

interface MAGIPanelProps {
  raceId: number;
}

interface StoredAPIKeys {
  claude?: string;
  openai?: string;
  gemini?: string;
  grok?: string;
}

// MAGI コンポーネントの色設定
const MAGI_COLORS = {
  MELCHIOR: { bg: 'from-orange-500 to-amber-600', border: 'border-orange-500', text: 'text-orange-400' },
  BALTHASAR: { bg: 'from-green-500 to-emerald-600', border: 'border-green-500', text: 'text-green-400' },
  CASPER: { bg: 'from-blue-500 to-cyan-600', border: 'border-blue-500', text: 'text-blue-400' },
  RAMIEL: { bg: 'from-purple-500 to-violet-600', border: 'border-purple-500', text: 'text-purple-400' },
};

const PROVIDER_LABELS = {
  claude: 'Claude',
  openai: 'ChatGPT',
  gemini: 'Gemini',
  grok: 'Grok',
};

export default function MAGIPanel({ raceId }: MAGIPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [response, setResponse] = useState<MAGIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  
  // 有効なAIサービスの状態
  const [enabledServices, setEnabledServices] = useState({
    claude: false,
    openai: false,
    gemini: false,
    grok: false,
  });

  // APIキーを読み込み
  useEffect(() => {
    const keys: StoredAPIKeys = {
      claude: localStorage.getItem('claudeApiKey') || undefined,
      openai: localStorage.getItem('openaiApiKey') || undefined,
      gemini: localStorage.getItem('geminiApiKey') || undefined,
      grok: localStorage.getItem('grokApiKey') || undefined,
    };
    
    // キーがあるサービスを自動有効化
    setEnabledServices({
      claude: !!keys.claude,
      openai: !!keys.openai,
      gemini: !!keys.gemini,
      grok: !!keys.grok,
    });

  }, []);

  const handleAnalyze = async () => {
    const keys: StoredAPIKeys = {
      claude: localStorage.getItem('claudeApiKey') || undefined,
      openai: localStorage.getItem('openaiApiKey') || undefined,
      gemini: localStorage.getItem('geminiApiKey') || undefined,
      grok: localStorage.getItem('grokApiKey') || undefined,
    };

    const enabledCount = Object.values(enabledServices).filter(Boolean).length;
    if (enabledCount < 2) {
      setError('MAGIシステムには2つ以上のAIが必要です。設定ページでAPIキーを登録してください。');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResponse(null);

    try {
      const config: MAGIConfig = {
        claude: {
          enabled: enabledServices.claude,
          api_key: keys.claude,
        },
        openai: {
          enabled: enabledServices.openai,
          api_key: keys.openai,
        },
        gemini: {
          enabled: enabledServices.gemini,
          api_key: keys.gemini,
        },
        grok: {
          enabled: enabledServices.grok,
          api_key: keys.grok,
        },
      };

      const result = await magiApi.analyze(raceId, config);
      setResponse(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'MAGI分析に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleService = (service: keyof typeof enabledServices) => {
    const key = localStorage.getItem(`${service}ApiKey`);
    if (!key) {
      setError(`${PROVIDER_LABELS[service]}のAPIキーが設定されていません。設定ページで登録してください。`);
      return;
    }
    setEnabledServices(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const enabledCount = Object.values(enabledServices).filter(Boolean).length;

  return (
    <div className="bg-dark-200 rounded-xl border-2 border-red-900/50 overflow-hidden">
      {/* ヘッダー - エヴァ風 */}
      <div className="bg-gradient-to-r from-red-900/80 via-red-800/60 to-red-900/80 p-4 border-b-2 border-red-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-black rounded border-2 border-red-500 flex items-center justify-center overflow-hidden">
                <span className="text-red-500 font-mono font-bold text-xs tracking-tighter">MAGI</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-red-100 tracking-wider">MAGI SYSTEM</h3>
              <p className="text-xs text-red-300/70 font-mono">Multiple AI Governance Intelligence</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-red-400 font-mono">ACTIVE: {enabledCount}/4</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* AIサービス選択 */}
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(enabledServices) as Array<keyof typeof enabledServices>).map((service) => {
            const hasKey = !!localStorage.getItem(`${service}ApiKey`);
            const isEnabled = enabledServices[service];
            const magiName = service === 'claude' ? 'MELCHIOR' : 
                           service === 'openai' ? 'BALTHASAR' :
                           service === 'gemini' ? 'CASPER' : 'RAMIEL';
            const colors = MAGI_COLORS[magiName as keyof typeof MAGI_COLORS];
            
            return (
              <button
                key={service}
                onClick={() => toggleService(service)}
                disabled={!hasKey}
                className={`
                  p-3 rounded-lg border-2 transition-all text-left
                  ${isEnabled && hasKey
                    ? `bg-gradient-to-br ${colors.bg} ${colors.border} text-white`
                    : hasKey
                    ? 'bg-dark-100 border-gray-700 text-gray-400 hover:border-gray-600'
                    : 'bg-dark-100 border-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono opacity-70">{magiName}</div>
                    <div className="font-bold text-sm">{PROVIDER_LABELS[service]}</div>
                  </div>
                  {isEnabled && hasKey ? (
                    <Check className="w-5 h-5" />
                  ) : !hasKey ? (
                    <X className="w-5 h-5 opacity-50" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* 実行ボタン */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || enabledCount < 2}
          className={`
            w-full py-4 font-bold rounded-lg transition-all flex items-center justify-center gap-2
            ${enabledCount >= 2
              ? 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:from-red-500 hover:via-red-400 hover:to-orange-400 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-mono tracking-wider">ANALYZING...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span className="font-mono tracking-wider">MAGI 起動</span>
            </>
          )}
        </button>

        {enabledCount < 2 && (
          <p className="text-xs text-yellow-500 text-center">
            ※ 2つ以上のAIを有効にしてください
          </p>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* 結果表示 */}
        {response && (
          <div className="space-y-4">
            {/* 統合結果 */}
            <div className="p-4 bg-black/50 border-2 border-red-600/50 rounded-lg">
              <div className="text-center mb-3">
                <div className="text-xs text-red-400 font-mono mb-1">═══ 最終判定 ═══</div>
                {response.consensus ? (
                  <>
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 font-mono">
                      {response.consensus}
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      一致率: <span className="text-white font-bold">{(response.consensus_rate * 100).toFixed(0)}%</span>
                      {' '}({response.active_count}AI参加)
                    </div>
                  </>
                ) : (
                  <div className="text-yellow-500">合意に至らず</div>
                )}
              </div>

              {/* 票の内訳 */}
              {Object.keys(response.vote_detail).length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-900/50">
                  <div className="text-xs text-gray-500 mb-2">投票結果:</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(response.vote_detail)
                      .sort((a, b) => b[1] - a[1])
                      .map(([bet, count]) => (
                        <div
                          key={bet}
                          className={`px-3 py-1 rounded font-mono text-sm ${
                            bet === response.consensus
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {bet}: {count}票
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* 各AIの結果 */}
            <div className="space-y-2">
              {response.results.map((result) => (
                <MAGIResultCard
                  key={result.name}
                  result={result}
                  consensus={response.consensus}
                  isExpanded={expandedResult === result.name}
                  onToggle={() => setExpandedResult(
                    expandedResult === result.name ? null : result.name
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MAGIResultCardProps {
  result: MAGIResult;
  consensus?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function MAGIResultCard({ result, consensus, isExpanded, onToggle }: MAGIResultCardProps) {
  const colors = MAGI_COLORS[result.name as keyof typeof MAGI_COLORS] || MAGI_COLORS.MELCHIOR;
  const isAgreed = result.prediction === consensus;
  
  if (result.status === 'disabled') {
    return (
      <div className="p-3 bg-dark-100 rounded-lg border border-gray-800 opacity-50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-gray-500">{result.name}</span>
            <span className="text-gray-600 text-sm ml-2">無効</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-2 overflow-hidden ${colors.border} bg-dark-100`}>
      {/* ヘッダー */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-dark-200/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${colors.bg}`} />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono ${colors.text}`}>{result.name}</span>
              <span className="text-gray-500 text-xs">({PROVIDER_LABELS[result.provider as keyof typeof PROVIDER_LABELS]})</span>
            </div>
            {result.status === 'success' ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-bold text-white font-mono">{result.prediction || '予想なし'}</span>
                {result.prediction && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    isAgreed 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {isAgreed ? '賛成' : '反対'}
                  </span>
                )}
                {result.confidence && (
                  <span className="text-xs text-gray-500">
                    自信度: {result.confidence}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-red-400 text-sm">エラー</span>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* 展開時の詳細 */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-800 bg-dark-200/50">
          {result.status === 'success' && result.analysis ? (
            <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
              {result.analysis}
            </div>
          ) : result.error ? (
            <div className="text-sm text-red-400">{result.error}</div>
          ) : (
            <div className="text-sm text-gray-500">分析結果なし</div>
          )}
          {result.tokens_used && (
            <div className="mt-2 text-xs text-gray-600">
              使用トークン: {result.tokens_used}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
