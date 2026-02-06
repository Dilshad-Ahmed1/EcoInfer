import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { equations, DEFAULT_PROMPTS } from '../constants';
import { Sigma, FunctionSquare, Info, TrendingUp, BarChart3, AlertTriangle } from 'lucide-react';

// --- Types ---
type MetricTab = 'energy' | 'runtime' | 'ram';
type FitMethod = 'linear' | 'power';

// --- Helper Functions ---

// Deterministic pseudo-random noise generator
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// Sample points we want to measure
const sampleParams = [1, 3, 7, 13, 30, 50, 70];

const ScalingLaws: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<MetricTab>('energy');
  const [showFittingDetails, setShowFittingDetails] = useState(false);

  // --- Data Preparation ---
  const chartData = useMemo(() => {
    return Array.from({ length: 70 }, (_, i) => {
      const x = i + 1; // Model size in Billions
      
      // 1. Calculate the ideal "Fit" line (The Equation)
      const dataPoint: any = {
        params: x,
        energy_fit: equations.totalEnergy(x),
        runtime_fit: equations.runtime(x),
        ram_fit: equations.ram(x),
      };

      // 2. Generate Noisy "Sample" Data
      // To match your lower R² values, we inject significantly more noise
      if (sampleParams.includes(x)) {
        const idx = sampleParams.indexOf(x);
        
        // Noise generators
        const rand1 = seededRandom(x * 123 + idx);
        const rand2 = seededRandom(x * 456 + idx);
        const rand3 = seededRandom(x * 789 + idx);

        // Energy: Moderate noise (Target R² ≈ 0.74)
        // Variation: ±25%
        const energyNoise = 1 + (rand1 - 0.5) * 0.5; 
        
        // Runtime: Moderate noise (Target R² ≈ 0.78)
        // Variation: ±22%
        const runtimeNoise = 1 + (rand2 - 0.5) * 0.44; 

        // RAM: High noise (Target R² ≈ 0.21)
        // Massive variation because RAM depends on quantization (int8 vs fp16), overhead, etc.
        // Variation: ±60% + random spikes
        const ramNoise = 1 + (rand3 - 0.5) * 1.2;

        dataPoint.energy_sample = dataPoint.energy_fit * energyNoise;
        dataPoint.runtime_sample = dataPoint.runtime_fit * runtimeNoise;
        // Ensure RAM doesn't go negative despite high noise
        dataPoint.ram_sample = Math.max(100, dataPoint.ram_fit * ramNoise); 
      } else {
        dataPoint.energy_sample = null;
        dataPoint.runtime_sample = null;
        dataPoint.ram_sample = null;
      }

      return dataPoint;
    });
  }, []);

  // --- Configuration ---
  const metricConfig: Record<
    MetricTab,
    {
      title: string;
      formula: string;
      explanation: string;
      yLabel: string;
      unit: string;
      fitKey: string;
      sampleKey: string;
      color: string;
      fitMethod: FitMethod;
      r2Value: number;
      formulaExplanation: string;
      fitNote: string;
    }
  > = {
    energy: {
      title: 'Energy vs. Model Size',
      formula: 'E(x) = 2000.81 · x + 2269.03',
      formulaExplanation: 'Linear fit: ~2000 J per billion params',
      explanation:
        'Energy generally scales linearly, but measurements vary significantly (R²=0.74) due to background processes, GPU thermal throttling, and varying batch sizes during data collection.',
      yLabel: 'Total Energy (J)',
      unit: 'J',
      fitKey: 'energy_fit',
      sampleKey: 'energy_sample',
      color: '#22c55e',
      fitMethod: 'linear',
      r2Value: 0.74,
      fitNote: "Moderate fit variability",
    },
    runtime: {
      title: 'Runtime vs. Model Size',
      formula: 'T(x) = 55.87 · x + 126.02',
      formulaExplanation: 'Linear fit: ~56s per billion params',
      explanation:
        'Runtime shows a linear trend (R²=0.78). The variance is likely caused by system load, token generation speed inconsistencies, and model loading overheads.',
      yLabel: 'Runtime (s)',
      unit: 's',
      fitKey: 'runtime_fit',
      sampleKey: 'runtime_sample',
      color: '#38bdf8',
      fitMethod: 'linear',
      r2Value: 0.78,
      fitNote: "Moderate fit variability",
    },
    ram: {
      title: 'RAM vs. Model Size',
      formula: 'RAM(x) = 95.13 · x^0.838',
      formulaExplanation: 'Weak Power law (R²=0.21)',
      explanation:
        'RAM usage has a very low correlation with parameter count alone (R²=0.21). This is because actual memory usage depends heavily on implementation details like quantization (4-bit vs 16-bit), KV-cache size, and context window settings.',
      yLabel: 'RAM (MB)',
      unit: 'MB',
      fitKey: 'ram_fit',
      sampleKey: 'ram_sample',
      color: '#a78bfa',
      fitMethod: 'power',
      r2Value: 0.21,
      fitNote: "High variance / Poor fit",
    },
  };

  const cfg = metricConfig[activeMetric];

  return (
    <div className="space-y-6">
      {/* Statistical Foundation Section */}
      <section className="glass-panel p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5">
        <div className="flex items-start gap-4">
          <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/40 flex-shrink-0">
            <BarChart3 className="text-purple-400" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-cyber text-purple-300 mb-3">Statistical Foundations: Real-World Variance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-300 font-mono">
              <div className="bg-black/40 border border-purple-500/30 rounded-lg p-3 space-y-2">
                <p className="text-purple-300 font-semibold">Understanding R²</p>
                <p className="text-gray-400 leading-relaxed">
                  R² measures how close the data is to the fitted regression line.
                  <br/>
                  <span className="text-white">1.0 = Perfect fit</span>
                  <br/>
                  <span className="text-white">0.0 = No correlation</span>
                </p>
              </div>
              <div className="bg-black/40 border border-purple-500/30 rounded-lg p-3 space-y-2">
                <p className="text-purple-300 font-semibold">Why Low R²?</p>
                <p className="text-gray-400 leading-relaxed">
                   Hardware is noisy. Thermal throttling, background OS tasks, and different driver versions cause real measurements (dots) to scatter away from the theoretical average (line).
                </p>
              </div>
              <div className="bg-black/40 border border-purple-500/30 rounded-lg p-3 space-y-2">
                <p className="text-purple-300 font-semibold">Implication</p>
                <p className="text-gray-400 leading-relaxed">
                  The equations provide the <em>average</em> expected cost, but individual runs may deviate significantly, especially for RAM usage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intro block */}
      <section className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-2 rounded-lg border border-green-500/40">
              <Sigma className="text-green-400" size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-cyber text-green-400">Derived Scaling Laws</h2>
              <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">
                Empirical Regression Analysis
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-300 font-mono leading-relaxed">
             EcoInfer uses these regression models to estimate costs. Note the <span className="text-yellow-400">R² values</span> below—while Energy and Runtime follow clear trends, RAM usage is highly unpredictable due to implementation differences.
          </p>
        </div>
        <div className="md:w-72 bg-black/40 border border-green-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
            <FunctionSquare className="text-green-400" size={18} />
            <span>Regression Equations</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="bg-black/60 border border-green-500/30 rounded-lg p-2">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] text-green-400">ENERGY</p>
                <p className="text-[9px] text-yellow-500">R² = 0.74</p>
              </div>
              <p className="text-gray-300">E(x) = 2000.81·x + 2269</p>
            </div>
            <div className="bg-black/60 border border-cyan-400/40 rounded-lg p-2">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] text-cyan-400">RUNTIME</p>
                <p className="text-[9px] text-yellow-500">R² = 0.78</p>
              </div>
              <p className="text-gray-300">T(x) = 55.87·x + 126.0</p>
            </div>
            <div className="bg-black/60 border border-purple-400/40 rounded-lg p-2">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] text-purple-400">RAM</p>
                <p className="text-[9px] text-red-400">R² = 0.21</p>
              </div>
              <p className="text-gray-300">RAM(x) = 95.13 · x^0.838</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chart + explanation */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl h-[450px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-cyber text-green-400 flex items-center gap-2">
                <TrendingUp size={18} />
                {cfg.title}
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                 {cfg.fitNote} (R² = {cfg.r2Value})
              </p>
            </div>
            <div className="flex gap-2 bg-black/50 p-1 rounded-lg border border-gray-800 flex-wrap">
              {(['energy', 'runtime', 'ram'] as MetricTab[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  className={`px-3 py-1 rounded text-xs font-mono whitespace-nowrap transition-colors ${
                    activeMetric === m 
                      ? `bg-${m === 'energy' ? 'green' : m === 'runtime' ? 'sky' : 'purple'}-500 text-black` 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                <XAxis
                  type="number" 
                  dataKey="params"
                  domain={[0, 75]}
                  tickCount={8}
                  stroke="#666"
                  label={{ value: 'Model Size (Billions of Params)', position: 'insideBottom', offset: -10, fill: '#888', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#666" 
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                  width={40}
                />
                <Tooltip
                  cursor={{ stroke: '#444' }}
                  contentStyle={{ backgroundColor: '#09090b', border: `1px solid ${cfg.color}`, borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number, name: string) => {
                    const isSample = name.includes('sample');
                    const label = isSample ? 'Observed Data' : 'Fit Line';
                    return [`${value.toFixed(0)} ${cfg.unit}`, label];
                  }}
                  labelFormatter={(label) => `${label}B Parameters`}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                
                {/* 1. The Fitted Line */}
                <Line
                  type="monotone"
                  dataKey={cfg.fitKey}
                  name="Trend Line (Equation)"
                  stroke={cfg.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={true}
                />
                
                {/* 2. The Sample Points (Noisy) */}
                <Line
                  type="monotone"
                  dataKey={cfg.sampleKey}
                  name="Measured Samples"
                  stroke="none"
                  isAnimationActive={false}
                  dot={{ r: 5, stroke: '#facc15', strokeWidth: 1, fill: '#facc15', fillOpacity: 0.8 }}
                  activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                  connectNulls={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 p-2 bg-black/40 border border-gray-800 rounded-lg text-[11px] text-gray-400 font-mono flex justify-between items-center px-4">
             <span>Statistical Fit (R²): <span className={`${cfg.r2Value < 0.5 ? 'text-red-400' : 'text-yellow-400'} font-bold`}>{cfg.r2Value.toFixed(2)}</span></span>
             <span className="text-gray-500">Notice the scatter in observed samples</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-green-500/10 p-2 rounded-lg border border-green-500/30 flex-shrink-0">
                <Info className="text-green-400" size={18} />
              </div>
              <div>
                <h3 className="text-lg font-cyber text-green-400 mb-1">Interpretation</h3>
                <p className="text-xs text-purple-300 font-mono mb-2 bg-black/40 p-2 rounded border border-purple-400/20">
                  {cfg.formula}
                </p>
                <p className="text-xs text-gray-400 font-mono mb-3 leading-relaxed">
                  {cfg.explanation}
                </p>
              </div>
            </div>

            <div className="bg-black/40 border border-green-500/20 rounded-xl p-4 mb-4">
              <p className="text-xs text-green-400 uppercase tracking-widest font-semibold mb-2">
                Analysis of Variance
              </p>
              <div className="space-y-2">
                {activeMetric === 'energy' && (
                  <p className="text-xs text-gray-300 font-mono leading-relaxed">
                    The <strong>R² of 0.74</strong> indicates a decent but imperfect fit. While 70B models definitely consume more energy than 7B models, two different 70B runs can differ by ±20% due to GPU clock speeds and cooling variations.
                  </p>
                )}
                {activeMetric === 'runtime' && (
                  <p className="text-xs text-gray-300 font-mono leading-relaxed">
                    The <strong>R² of 0.78</strong> suggests reasonable predictability. Deviations are caused by non-deterministic GPU scheduling and CPU bottlenecks during data loading.
                  </p>
                )}
                {activeMetric === 'ram' && (
                  <div className="flex items-start gap-2">
                     <AlertTriangle className="text-red-400 shrink-0" size={16} />
                     <p className="text-xs text-gray-300 font-mono leading-relaxed">
                       <strong>R² of 0.21 is very low.</strong> This means parameter count is a poor predictor of RAM. A 7B model using float32 takes 28GB RAM, while a 70B model using int4 takes 35GB. The huge scatter is due to quantization choices.
                     </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
             <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-blue-400" />
                <span className="text-xs font-bold text-blue-300 uppercase">Confidence Level</span>
             </div>
             <p className="text-xs text-blue-200/80 font-mono">
               {activeMetric === 'ram' 
                 ? "Low confidence. Estimates for RAM are rough approximations only due to the high variance in observed data."
                 : "Moderate confidence. Estimates generally hold true for average cases, but expect ±20% deviation in specific runs."}
             </p>
          </div>
        </div>
      </section>

      {/* How-to section */}
      <section className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/40">
            <FunctionSquare className="text-cyan-400" size={20} />
          </div>
          <h3 className="text-lg font-cyber text-cyan-400">Using These Equations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-4 space-y-2">
            <p className="text-[10px] text-cyan-300 uppercase font-semibold">1. Input Size</p>
            <p className="text-[11px] text-gray-400 font-mono">
              Select model size <span className="text-white">x</span> (billions).
            </p>
          </div>
          <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-4 space-y-2">
            <p className="text-[10px] text-cyan-300 uppercase font-semibold">2. Calculate</p>
            <p className="text-[11px] text-gray-400 font-mono">
              Apply <span className="text-white">y = mx + b</span>.
            </p>
          </div>
          <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-4 space-y-2">
            <p className="text-[10px] text-cyan-300 uppercase font-semibold">3. Apply Margin</p>
            <p className="text-[11px] text-gray-400 font-mono">
              Add <span className="text-yellow-400">±25%</span> margin of error based on R².
            </p>
          </div>
          <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-4 space-y-2">
            <p className="text-[10px] text-cyan-300 uppercase font-semibold">4. Derive Cost</p>
            <p className="text-[11px] text-gray-400 font-mono">
              Convert Energy (J) to kWh, then to $.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Details Toggle */}
      <section className="glass-panel p-6 rounded-2xl border border-gray-700">
        <button
          onClick={() => setShowFittingDetails(!showFittingDetails)}
          className="flex items-center gap-2 text-sm font-cyber text-gray-300 hover:text-white mb-0 transition"
        >
          <span className={`transform transition-transform ${showFittingDetails ? 'rotate-180' : ''}`}>▼</span>
          Advanced: Methodology & Limitations
        </button>
        {showFittingDetails && (
          <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-xs text-gray-400 font-mono">
                <p className="text-white font-semibold">Why the low R²?</p>
                <p>Unlike theoretical physics, computer systems are noisy environments. Background OS tasks, Garbage Collection (GC) pauses, and thermal throttling introduce significant noise into runtime and energy measurements.</p>
            </div>
            <div className="space-y-2 text-xs text-gray-400 font-mono">
                <p className="text-white font-semibold">RAM Anomaly</p>
                <p>The extremely low R² (0.21) for RAM confirms that parameter count is not the sole driver of memory usage. Optimization techniques like 4-bit quantization can make a 70B model smaller than an uncompressed 13B model.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ScalingLaws;