import axios from 'axios';
import type {
  Race,
  RaceDetail,
  RaceResult,
  Racer,
  Prediction,
  StatisticalPrediction,
  MLPrediction,
  PredictionWeights,
  Statistics,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========== Races API ==========

export const racesApi = {
  getAll: async (params?: { venue_code?: string; race_date?: string }) => {
    const response = await api.get<Race[]>('/races/', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<RaceDetail>(`/races/${id}`);
    return response.data;
  },

  create: async (data: Partial<Race>) => {
    const response = await api.post<Race>('/races/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Race>) => {
    const response = await api.put<Race>(`/races/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/races/${id}`);
  },
};

// ========== Racers API ==========

export const racersApi = {
  getAll: async (params?: { rank?: string }) => {
    const response = await api.get<Racer[]>('/racers/', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Racer>(`/racers/${id}`);
    return response.data;
  },

  getByRegistration: async (registrationNo: string) => {
    const response = await api.get<Racer>(`/racers/registration/${registrationNo}`);
    return response.data;
  },

  create: async (data: Partial<Racer>) => {
    const response = await api.post<Racer>('/racers/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Racer>) => {
    const response = await api.put<Racer>(`/racers/${id}`, data);
    return response.data;
  },
};

// ========== Predictions API ==========

export const predictionsApi = {
  getByRace: async (raceId: number) => {
    const response = await api.get<Prediction[]>(`/predictions/race/${raceId}`);
    return response.data;
  },

  createManual: async (data: Partial<Prediction>) => {
    const response = await api.post<Prediction>('/predictions/manual', data);
    return response.data;
  },

  getStatistical: async (raceId: number, weights?: PredictionWeights) => {
    const response = await api.post<StatisticalPrediction>(
      `/predictions/statistical/${raceId}`,
      weights
    );
    return response.data;
  },

  getML: async (raceId: number) => {
    const response = await api.post<MLPrediction>(`/predictions/ml/${raceId}`);
    return response.data;
  },

  update: async (id: number, data: Partial<Prediction>) => {
    const response = await api.put<Prediction>(`/predictions/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/predictions/${id}`);
  },
};

// ========== Results API ==========

export const resultsApi = {
  getAll: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await api.get<RaceResult[]>('/results/', { params });
    return response.data;
  },

  getByRace: async (raceId: number) => {
    const response = await api.get<RaceResult>(`/results/race/${raceId}`);
    return response.data;
  },

  create: async (data: Partial<RaceResult>) => {
    const response = await api.post<RaceResult>('/results/', data);
    return response.data;
  },

  getStatistics: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await api.get<Statistics>('/results/statistics', { params });
    return response.data;
  },
};

// ========== Scraper API ==========

export const scraperApi = {
  scrapeRace: async (venueCode: string, raceDate: string, raceNo: number) => {
    const response = await api.post('/scraper/race', null, {
      params: { venue_code: venueCode, race_date: raceDate, race_no: raceNo },
    });
    return response.data;
  },

  scrapeVenue: async (venueCode: string, raceDate: string) => {
    const response = await api.post('/scraper/venue', null, {
      params: { venue_code: venueCode, race_date: raceDate },
    });
    return response.data;
  },

  scrapeResult: async (venueCode: string, raceDate: string, raceNo: number) => {
    const response = await api.post('/scraper/result', null, {
      params: { venue_code: venueCode, race_date: raceDate, race_no: raceNo },
    });
    return response.data;
  },

  scrapeHistorical: async (venueCode: string, startDate: string, endDate: string) => {
    const response = await api.post('/scraper/historical', null, {
      params: { venue_code: venueCode, start_date: startDate, end_date: endDate },
    });
    return response.data;
  },
};

// ========== AI Analysis API ==========

export interface AIConfig {
  provider: 'claude' | 'openai';
  api_key: string;
  model?: string;
}

export interface AIAnalysisRequest {
  race_id: number;
  config: AIConfig;
  prompt_type: 'prediction' | 'analysis' | 'custom';
  custom_prompt?: string;
}

export interface AIAnalysisResponse {
  provider: string;
  model: string;
  analysis: string;
  tokens_used?: number;
}

export interface AIModel {
  id: string;
  name: string;
}

export const aiApi = {
  analyze: async (request: AIAnalysisRequest) => {
    const response = await api.post<AIAnalysisResponse>('/ai/analyze', request);
    return response.data;
  },

  getModels: async () => {
    const response = await api.get<{ claude: AIModel[]; openai: AIModel[] }>('/ai/models');
    return response.data;
  },
};

export default api;
