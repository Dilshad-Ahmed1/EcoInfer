export interface ModelData {
  name: string;
  params: number; // Billions
  efficiency: number; // J/Param
  tag?: string;
}

export interface CalculatedMetrics {
  energy: number; // Joules
  runtime: number; // Seconds
  ram: number; // MB
  gpuUsage: number; // %
  power: number; // Watts
  cost: number; // USD
}

export interface SimulationLog {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

// --- NEW TYPES FOR LAB ---

export interface SystemMetrics {
  timestamp: number;
  cpu_percent: number;
  gpu_percent: number;
  power_watts: number;
  is_simulated: boolean;
}

export interface AnalysisResult {
  runtime_seconds: number;
  cpu_peak: number;
  gpu_peak: number;
  reasoning: string;
  generated_text: string;
}

// --- NEW TYPES FOR RECOMMENDER ---

export interface RecommendationRequest {
  profession: string;
  apiKey?: string;
}

export interface RecommendedModel {
  name: string;
  params: number;
  reason: string;
}

export interface RecommendationResponse {
  efficiency: RecommendedModel;
  balanced: RecommendedModel;
  accuracy: RecommendedModel;
  is_simulated: boolean;
}