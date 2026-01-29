import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { RaceEntry, BoatScore } from '../types';
import BoatNumber from './BoatNumber';

interface StatsChartProps {
  entries: RaceEntry[];
  scores?: BoatScore[];
}

const boatColors = [
  '#FFFFFF',
  '#6B7280',
  '#EF4444',
  '#3B82F6',
  '#EAB308',
  '#22C55E',
];

export default function StatsChart({ entries, scores }: StatsChartProps) {
  // レーダーチャート用のデータ
  const radarData = entries.map((entry) => ({
    name: `${entry.boat_no}号艇`,
    全国勝率: entry.win_rate_all * 10,
    当地勝率: entry.win_rate_local * 10,
    'M2連率': entry.motor_rate_2,
    'B2連率': entry.boat_rate_2,
    ST: Math.max(0, (0.3 - entry.avg_start_timing) * 200),
  }));

  // バーチャート用のデータ
  const barData = entries.map((entry) => ({
    boat_no: entry.boat_no,
    name: `${entry.boat_no}`,
    勝率: entry.win_rate_all,
    モーター: entry.motor_rate_2,
    ボート: entry.boat_rate_2,
  }));

  return (
    <div className="space-y-6">
      {/* 成績比較テーブル */}
      <div className="bg-dark-200 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-bold text-white">出走表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-100 text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">艇</th>
                <th className="px-4 py-3 text-left">選手</th>
                <th className="px-4 py-3 text-center">級別</th>
                <th className="px-4 py-3 text-right">全国勝率</th>
                <th className="px-4 py-3 text-right">当地勝率</th>
                <th className="px-4 py-3 text-right">M2連率</th>
                <th className="px-4 py-3 text-right">B2連率</th>
                <th className="px-4 py-3 text-right">平均ST</th>
                {scores && <th className="px-4 py-3 text-right">スコア</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {entries.map((entry) => {
                const score = scores?.find((s) => s.boat_no === entry.boat_no);
                return (
                  <tr key={entry.boat_no} className="hover:bg-dark-100 transition-colors">
                    <td className="px-4 py-3">
                      <BoatNumber number={entry.boat_no} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {entry.racer_name}
                      <span className="text-xs text-gray-500 ml-2">
                        ({entry.racer_registration_no})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRankColor(entry.racer_rank)}`}>
                        {entry.racer_rank || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300">
                      {entry.win_rate_all?.toFixed(2) || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300">
                      {entry.win_rate_local?.toFixed(2) || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300">
                      {entry.motor_rate_2?.toFixed(1) || '-'}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300">
                      {entry.boat_rate_2?.toFixed(1) || '-'}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300">
                      {entry.avg_start_timing?.toFixed(2) || '-'}
                    </td>
                    {scores && (
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-blue-400">
                          {score?.score.toFixed(1) || '-'}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* チャート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* バーチャート */}
        <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
          <h3 className="font-bold text-white mb-4">成績比較</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
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
              <Bar dataKey="勝率" fill="#3B82F6" />
              <Bar dataKey="モーター" fill="#10B981" />
              <Bar dataKey="ボート" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* レーダーチャート */}
        <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
          <h3 className="font-bold text-white mb-4">総合分析</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <PolarRadiusAxis stroke="#374151" />
              {entries.map((entry, index) => (
                <Radar
                  key={entry.boat_no}
                  name={`${entry.boat_no}号艇`}
                  dataKey={`${entry.boat_no}号艇`}
                  stroke={boatColors[index]}
                  fill={boatColors[index]}
                  fillOpacity={0.1}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function getRankColor(rank?: string): string {
  switch (rank) {
    case 'A1':
      return 'bg-yellow-500 text-black';
    case 'A2':
      return 'bg-orange-500 text-white';
    case 'B1':
      return 'bg-blue-500 text-white';
    case 'B2':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
}
