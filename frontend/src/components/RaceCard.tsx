import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Calendar } from 'lucide-react';
import type { Race } from '../types';
import BoatNumber from './BoatNumber';

interface RaceCardProps {
  race: Race;
}

const gradeColors: Record<string, string> = {
  'SG': 'bg-yellow-500 text-black',
  'G1': 'bg-red-500 text-white',
  'G2': 'bg-blue-500 text-white',
  'G3': 'bg-green-500 text-white',
  '一般': 'bg-gray-600 text-white',
};

export default function RaceCard({ race }: RaceCardProps) {
  return (
    <Link
      to={`/races/${race.id}`}
      className="block bg-dark-200 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-all duration-300 overflow-hidden group"
    >
      <div className="p-5">
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${gradeColors[race.race_grade || '一般']}`}>
                {race.race_grade || '一般'}
              </span>
              <span className="text-xl font-bold text-white">{race.race_no}R</span>
            </div>
            <h3 className="text-gray-300 font-medium">
              {race.race_name || `第${race.race_no}レース`}
            </h3>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
        </div>

        {/* 会場・日時 */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{race.venue_name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{race.race_date}</span>
          </div>
        </div>

        {/* コンディション */}
        {(race.weather || race.wind_speed) && (
          <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-4 text-xs text-gray-500">
            {race.weather && <span>天候: {race.weather}</span>}
            {race.wind_speed && <span>風速: {race.wind_speed}m</span>}
            {race.wave_height && <span>波高: {race.wave_height}cm</span>}
          </div>
        )}
      </div>

      {/* 出走艇プレビュー */}
      <div className="px-5 py-3 bg-dark-100 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <BoatNumber key={num} number={num} size="sm" />
          ))}
        </div>
        <span className="text-xs text-gray-500">{race.distance}m</span>
      </div>
    </Link>
  );
}
