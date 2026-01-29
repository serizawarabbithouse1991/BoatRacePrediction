import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Cloud, Wind, Waves } from 'lucide-react';
import { racesApi, predictionsApi } from '../api/client';
import type { RaceDetail as RaceDetailType, StatisticalPrediction, MLPrediction, PredictionWeights } from '../types';
import StatsChart from '../components/StatsChart';
import PredictionPanel from '../components/PredictionPanel';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

export default function RaceDetail() {
  const { id } = useParams<{ id: string }>();
  const [race, setRace] = useState<RaceDetailType | null>(null);
  const [statisticalPrediction, setStatisticalPrediction] = useState<StatisticalPrediction | null>(null);
  const [mlPrediction, setMLPrediction] = useState<MLPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRaceDetail(parseInt(id));
    }
  }, [id]);

  const fetchRaceDetail = async (raceId: number) => {
    setIsLoading(true);
    try {
      const data = await racesApi.getById(raceId);
      setRace(data);
    } catch (error) {
      console.error('Failed to fetch race detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatisticalPredict = async (weights?: PredictionWeights) => {
    if (!race) return;
    setIsPredicting(true);
    try {
      const prediction = await predictionsApi.getStatistical(race.id, weights);
      setStatisticalPrediction(prediction);
    } catch (error) {
      console.error('Statistical prediction failed:', error);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleMLPredict = async () => {
    if (!race) return;
    setIsPredicting(true);
    try {
      const prediction = await predictionsApi.getML(race.id);
      setMLPrediction(prediction);
    } catch (error) {
      console.error('ML prediction failed:', error);
    } finally {
      setIsPredicting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-400">レースが見つかりませんでした</p>
        <Link to="/races" className="mt-4 text-blue-400 hover:underline">
          一覧に戻る
        </Link>
      </div>
    );
  }

  const gradeColors: Record<string, string> = {
    'SG': 'bg-yellow-500 text-black',
    'G1': 'bg-red-500 text-white',
    'G2': 'bg-blue-500 text-white',
    'G3': 'bg-green-500 text-white',
    '一般': 'bg-gray-600 text-white',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 戻るリンク */}
      <Link
        to="/races"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>レース一覧に戻る</span>
      </Link>

      {/* レース情報ヘッダー */}
      <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded text-sm font-bold ${gradeColors[race.race_grade || '一般']}`}>
                {race.race_grade || '一般'}
              </span>
              <h1 className="text-2xl font-bold text-white">
                {race.race_no}R {race.race_name || `第${race.race_no}レース`}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-400">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{race.venue_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{race.race_date}</span>
              </div>
              <span className="text-gray-600">|</span>
              <span>{race.distance}m</span>
            </div>
          </div>

          {/* コンディション */}
          <div className="flex items-center gap-6 text-sm">
            {race.weather && (
              <div className="flex items-center gap-2 text-gray-400">
                <Cloud className="w-4 h-4" />
                <span>{race.weather}</span>
              </div>
            )}
            {race.wind_speed && (
              <div className="flex items-center gap-2 text-gray-400">
                <Wind className="w-4 h-4" />
                <span>{race.wind_direction} {race.wind_speed}m</span>
              </div>
            )}
            {race.wave_height && (
              <div className="flex items-center gap-2 text-gray-400">
                <Waves className="w-4 h-4" />
                <span>{race.wave_height}cm</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 出走表・チャート */}
        <div className="lg:col-span-2">
          <StatsChart 
            entries={race.entries} 
            scores={statisticalPrediction?.scores}
          />
        </div>

        {/* 予想パネル */}
        <div className="lg:col-span-1 space-y-6">
          <PredictionPanel
            statisticalPrediction={statisticalPrediction}
            mlPrediction={mlPrediction}
            onStatisticalPredict={handleStatisticalPredict}
            onMLPredict={handleMLPredict}
            isLoading={isPredicting}
          />
          
          {/* AI分析パネル */}
          <AIAnalysisPanel raceId={race.id} />
        </div>
      </div>
    </div>
  );
}
