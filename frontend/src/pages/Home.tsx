import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ship, TrendingUp, Brain, Target, ArrowRight } from 'lucide-react';
import { resultsApi } from '../api/client';
import type { Statistics } from '../types';

export default function Home() {
  const [stats, setStats] = useState<Statistics | null>(null);

  useEffect(() => {
    resultsApi.getStatistics()
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ヒーローセクション */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-dark-200 to-purple-900 p-8 md:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <Ship className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                BOAT RACE AI Predictor
              </h1>
              <p className="text-blue-300">統計分析 × 機械学習で勝利を予測</p>
            </div>
          </div>

          <p className="text-gray-300 max-w-2xl mb-6">
            過去のレースデータを統計分析し、機械学習モデルで着順を予測。
            3つのアプローチ（統計・AI・手動）を組み合わせて、より精度の高い予想を実現します。
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/races"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
            >
              <span>レースを見る</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/scraper"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors backdrop-blur"
            >
              <span>データを取得</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Target className="w-6 h-6" />}
          label="予想数"
          value={stats?.total_predictions?.toString() || '0'}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="的中率"
          value={stats?.hit_rate ? `${(stats.hit_rate * 100).toFixed(1)}%` : '0%'}
          color="green"
        />
        <StatCard
          icon={<Brain className="w-6 h-6" />}
          label="収支"
          value={stats?.profit ? `¥${stats.profit.toLocaleString()}` : '¥0'}
          color={stats?.profit && stats.profit > 0 ? 'green' : 'red'}
        />
        <StatCard
          icon={<Ship className="w-6 h-6" />}
          label="回収率"
          value={stats?.roi ? `${stats.roi.toFixed(1)}%` : '0%'}
          color="purple"
        />
      </div>

      {/* 機能紹介 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          title="統計分析"
          description="勝率・モーター成績・コース別データを重み付けしてスコア化。カスタマイズ可能な重み設定で自分好みの分析が可能。"
          icon={<TrendingUp className="w-8 h-8" />}
          color="blue"
        />
        <FeatureCard
          title="機械学習予測"
          description="LightGBMによる高速・高精度な予測モデル。過去データから学習し、各艇の着順確率を算出。"
          icon={<Brain className="w-8 h-8" />}
          color="purple"
        />
        <FeatureCard
          title="データ自動取得"
          description="ボートレース公式サイトから出走表・結果を自動取得。過去データを蓄積して予測精度を向上。"
          icon={<Ship className="w-8 h-8" />}
          color="cyan"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'red' | 'purple';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <span className="text-gray-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'cyan';
}

function FeatureCard({ title, description, icon, color }: FeatureCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
  };

  return (
    <div className="bg-dark-200 rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
