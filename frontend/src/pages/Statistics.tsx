import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, DollarSign, Percent, Calendar } from 'lucide-react';
import { resultsApi } from '../api/client';
import type { Statistics as StatsType } from '../types';

export default function Statistics() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [startDate, endDate]);

  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      const data = await resultsApi.getStatistics({
        start_date: startDate,
        end_date: endDate,
      });
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // サンプルデータ（実際のAPIから取得する）
  const pieData = [
    { name: '的中', value: stats?.hits || 0, color: '#22C55E' },
    { name: '不的中', value: (stats?.total_predictions || 0) - (stats?.hits || 0), color: '#EF4444' },
  ];

  const trendData = [
    { date: '1/1', profit: 1000 },
    { date: '1/5', profit: -500 },
    { date: '1/10', profit: 2000 },
    { date: '1/15', profit: 1500 },
    { date: '1/20', profit: 3000 },
    { date: '1/25', profit: 2500 },
    { date: '1/30', profit: 4000 },
  ];

  const methodData = [
    { name: '統計', hitRate: 35, count: 50 },
    { name: 'AI', hitRate: 42, count: 30 },
    { name: '手動', hitRate: 28, count: 20 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">統計・分析</h1>
          <p className="text-gray-400">予想の成績と収支を確認します</p>
        </div>

        {/* 期間選択 */}
        <div className="flex items-center gap-4 p-3 bg-dark-200 rounded-lg border border-gray-800">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 bg-dark-100 border border-gray-700 rounded text-white text-sm"
          />
          <span className="text-gray-500">〜</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 bg-dark-100 border border-gray-700 rounded text-white text-sm"
          />
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Target className="w-6 h-6" />}
          label="総予想数"
          value={stats?.total_predictions?.toString() || '0'}
          subtext="回"
          color="blue"
        />
        <StatCard
          icon={<Percent className="w-6 h-6" />}
          label="的中率"
          value={stats?.hit_rate ? `${(stats.hit_rate * 100).toFixed(1)}` : '0'}
          subtext="%"
          color={stats?.hit_rate && stats.hit_rate > 0.3 ? 'green' : 'yellow'}
        />
        <StatCard
          icon={stats?.profit && stats.profit >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          label="収支"
          value={stats?.profit ? `¥${Math.abs(stats.profit).toLocaleString()}` : '¥0'}
          subtext={stats?.profit && stats.profit >= 0 ? 'プラス' : 'マイナス'}
          color={stats?.profit && stats.profit >= 0 ? 'green' : 'red'}
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          label="回収率"
          value={stats?.roi ? `${stats.roi.toFixed(1)}` : '0'}
          subtext="%"
          color={stats?.roi && stats.roi >= 100 ? 'green' : 'red'}
        />
      </div>

      {/* チャート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 的中率円グラフ */}
        <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
          <h3 className="font-bold text-white mb-4">的中/不的中</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-400">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 収支推移 */}
        <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
          <h3 className="font-bold text-white mb-4">収支推移</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                formatter={(value) => [`¥${(value as number).toLocaleString()}`, '収支']}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 予想方法別成績 */}
      <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
        <h3 className="font-bold text-white mb-4">予想方法別成績</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={methodData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="hitRate" name="的中率 (%)" fill="#3B82F6" />
            <Bar dataKey="count" name="予想数" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: 'blue' | 'green' | 'red' | 'yellow';
}

function StatCard({ icon, label, value, subtext, color }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <span className="text-gray-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-white">{value}</p>
        <span className="text-gray-400">{subtext}</span>
      </div>
    </div>
  );
}
