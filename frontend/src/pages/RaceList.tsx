import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Calendar, MapPin, RefreshCw } from 'lucide-react';
import { racesApi } from '../api/client';
import type { Race } from '../types';
import { VENUES } from '../types';
import RaceCard from '../components/RaceCard';

export default function RaceList() {
  const [races, setRaces] = useState<Race[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const fetchRaces = async () => {
    setIsLoading(true);
    try {
      const params: { venue_code?: string; race_date?: string } = {};
      if (selectedVenue) params.venue_code = selectedVenue;
      if (selectedDate) params.race_date = selectedDate;
      
      const data = await racesApi.getAll(params);
      setRaces(data);
    } catch (error) {
      console.error('Failed to fetch races:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRaces();
  }, [selectedVenue, selectedDate]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">レース一覧</h1>
          <p className="text-gray-400">出走表を確認して予想を行います</p>
        </div>
        <button
          onClick={fetchRaces}
          className="flex items-center gap-2 px-4 py-2 bg-dark-200 hover:bg-dark-100 border border-gray-700 rounded-lg text-gray-300 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>更新</span>
        </button>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-4 p-4 bg-dark-200 rounded-xl border border-gray-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-dark-100 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-400" />
          <select
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
            className="px-3 py-2 bg-dark-100 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">全会場</option>
            {VENUES.map((venue) => (
              <option key={venue.code} value={venue.code}>
                {venue.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* レース一覧 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>読み込み中...</span>
          </div>
        </div>
      ) : races.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Search className="w-12 h-12 mb-4" />
          <p>レースが見つかりませんでした</p>
          <p className="text-sm mt-2">データ取得ページからレース情報を取得してください</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {races.map((race) => (
            <RaceCard key={race.id} race={race} />
          ))}
        </div>
      )}
    </div>
  );
}
