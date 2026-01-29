// ========== Racer Types ==========

export interface Racer {
  id: number;
  registration_no: string;
  name: string;
  name_kana?: string;
  branch?: string;
  birthplace?: string;
  birth_date?: string;
  rank?: string;
  win_rate_all: number;
  place_rate_2_all: number;
  place_rate_3_all: number;
  course_1_rate: number;
  course_2_rate: number;
  course_3_rate: number;
  course_4_rate: number;
  course_5_rate: number;
  course_6_rate: number;
  avg_start_timing: number;
  created_at: string;
  updated_at: string;
}

// ========== Race Entry Types ==========

export interface RaceEntry {
  id: number;
  race_id: number;
  racer_id?: number;
  boat_no: number;
  racer_registration_no: string;
  racer_name: string;
  racer_rank?: string;
  win_rate_all: number;
  place_rate_2_all: number;
  win_rate_local: number;
  place_rate_2_local: number;
  motor_no?: string;
  motor_rate_2: number;
  boat_no_actual?: string;
  boat_rate_2: number;
  current_series_results?: string;
  avg_start_timing: number;
  weight?: number;
  created_at: string;
}

// ========== Race Types ==========

export interface Race {
  id: number;
  venue_code: string;
  venue_name: string;
  race_date: string;
  race_no: number;
  race_name?: string;
  race_grade?: string;
  race_type?: string;
  distance: number;
  weather?: string;
  wind_direction?: string;
  wind_speed?: number;
  wave_height?: number;
  water_temp?: number;
  created_at: string;
  updated_at: string;
}

export interface RaceDetail extends Race {
  entries: RaceEntry[];
}

// ========== Race Result Types ==========

export interface RaceResult {
  id: number;
  race_id: number;
  place_1: number;
  place_2: number;
  place_3: number;
  place_4?: number;
  place_5?: number;
  place_6?: number;
  winning_technique?: string;
  trifecta?: string;
  trifecta_payout?: number;
  trio?: string;
  trio_payout?: number;
  exacta?: string;
  exacta_payout?: number;
  quinella?: string;
  quinella_payout?: number;
  win?: number;
  win_payout?: number;
  st_1?: number;
  st_2?: number;
  st_3?: number;
  st_4?: number;
  st_5?: number;
  st_6?: number;
  race_time?: string;
  created_at: string;
}

// ========== Prediction Types ==========

export interface PredictionWeights {
  win_rate_all: number;
  win_rate_local: number;
  motor_rate: number;
  boat_rate: number;
  avg_st: number;
  course_rate: number;
  current_series: number;
}

export interface Prediction {
  id: number;
  race_id: number;
  prediction_type: 'manual' | 'statistical' | 'ml';
  predicted_rank?: string;
  bet_type?: string;
  bet_numbers?: string;
  score_boat_1?: number;
  score_boat_2?: number;
  score_boat_3?: number;
  score_boat_4?: number;
  score_boat_5?: number;
  score_boat_6?: number;
  bet_amount?: number;
  return_amount?: number;
  is_hit: boolean;
  memo?: string;
  created_at: string;
  updated_at: string;
}

export interface BoatScore {
  boat_no: number;
  score: number;
  rank: number;
  details: Record<string, number>;
}

export interface StatisticalPrediction {
  race_id: number;
  scores: BoatScore[];
  recommended_rank: string;
  weights_used: PredictionWeights;
}

export interface BoatProbability {
  boat_no: number;
  prob_1st: number;
  prob_2nd: number;
  prob_3rd: number;
  expected_rank: number;
}

export interface MLPrediction {
  race_id: number;
  probabilities: BoatProbability[];
  predicted_rank: string;
  model_confidence: number;
}

// ========== Statistics Types ==========

export interface Statistics {
  total_predictions: number;
  hits: number;
  hit_rate: number;
  total_bet: number;
  total_return: number;
  profit: number;
  roi: number;
}

// ========== Venue Types ==========

export interface Venue {
  code: string;
  name: string;
}

export const VENUES: Venue[] = [
  { code: '01', name: '桐生' },
  { code: '02', name: '戸田' },
  { code: '03', name: '江戸川' },
  { code: '04', name: '平和島' },
  { code: '05', name: '多摩川' },
  { code: '06', name: '浜名湖' },
  { code: '07', name: '蒲郡' },
  { code: '08', name: '常滑' },
  { code: '09', name: '津' },
  { code: '10', name: '三国' },
  { code: '11', name: 'びわこ' },
  { code: '12', name: '住之江' },
  { code: '13', name: '尼崎' },
  { code: '14', name: '鳴門' },
  { code: '15', name: '丸亀' },
  { code: '16', name: '児島' },
  { code: '17', name: '宮島' },
  { code: '18', name: '徳山' },
  { code: '19', name: '下関' },
  { code: '20', name: '若松' },
  { code: '21', name: '芦屋' },
  { code: '22', name: '福岡' },
  { code: '23', name: '唐津' },
  { code: '24', name: '大村' },
];
