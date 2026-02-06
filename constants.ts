import { ModelData } from './types';

// Hardcoded Model Database
export const LEADERBOARD_DATA: ModelData[] = [
  { name: "Qwen 5B", params: 5, efficiency: 1097, tag: "Most Efficient" },
  { name: "Gemma 2B", params: 2, efficiency: 2393 },
  { name: "Phi3 8B", params: 8, efficiency: 2399 },
  { name: "Mistral 7B", params: 7, efficiency: 2759 },
  { name: "Phi 3.8B", params: 3.8, efficiency: 2517 },
  { name: "TinyLlama 1.1B", params: 1.1, efficiency: 4971 },
  { name: "Gemma3 1B", params: 1, efficiency: 5510, tag: "Least Efficient" },
];

export const COST_PER_KWH = 0.12;
export const DEFAULT_PROMPTS = 33;
export const BENCHMARK_70B_PARAMS = 70;

// Equations from Empirical Research
// x = Model Size in Billions
export const equations = {
  totalEnergy: (x: number) => 2000.81 * x + 2269.03, // Joules (base for 33 prompts)
  runtime: (x: number) => 55.87 * x + 126.02, // Seconds (base for 33 prompts)
  ram: (x: number) => 95.13 * Math.pow(x, 0.838), // MB
  gpuUsage: (x: number) => -3.37 * x + 92.88, // %
  totalPower: (x: number) => 0.50 * x + 29.22, // Watts
};

export const calculateMetrics = (params: number, prompts: number) => {
  const workloadFactor = prompts / DEFAULT_PROMPTS;
  
  const baseEnergy = equations.totalEnergy(params);
  const baseRuntime = equations.runtime(params);
  
  // Energy and Runtime scale with workload (number of prompts)
  const energy = baseEnergy * workloadFactor;
  const runtime = baseRuntime * workloadFactor;
  
  // RAM, GPU, and Power are instantaneous/capacity metrics mostly dependent on model size
  const ram = equations.ram(params);
  const gpuUsage = equations.gpuUsage(params);
  const power = equations.totalPower(params);
  
  // Cost calculation: (Joules / 3,600,000) * Cost/kWh
  const kwh = energy / 3600000;
  const cost = kwh * COST_PER_KWH;

  return {
    energy,
    runtime,
    ram,
    gpuUsage,
    power,
    cost
  };
};

// Calculate 70B Benchmark once for comparison
const benchmark70BBase = calculateMetrics(BENCHMARK_70B_PARAMS, DEFAULT_PROMPTS);
export const getEnergySaved = (userEnergy: number, userPrompts: number) => {
  // We compare user's total energy against the energy a 70B model would consume for the SAME number of prompts
  const factor = userPrompts / DEFAULT_PROMPTS;
  const energy70B = benchmark70BBase.energy * factor; 
  // Note: calculateMetrics already scales benchmark70BBase if we passed prompts, 
  // but here benchmark70BBase was calc with DEFAULT.
  // Let's just recalculate 70B for specific user prompts to be safe.
  const specific70B = calculateMetrics(BENCHMARK_70B_PARAMS, userPrompts);
  return specific70B.energy - userEnergy;
};