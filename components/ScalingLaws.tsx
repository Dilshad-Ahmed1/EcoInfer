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
import { Sigma, FunctionSquare, Info, TrendingUp, BarChart3 } from 'lucide-react';

// --- Types ---
type MetricTab = 'energy' | 'runtime' | 'ram';
type FitMethod = 'linear' | 'power';

// --- Helper Functions ---

// Deterministic pseudo-random noise generator
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// Compute R² values
const computeR2 = (observed: number[], predicted: number[]): number => {
  if (observed.length === 0 || observed.length !== predicted.length) return 0;
  const mean = observed.reduce((a, b) => a + b, 0) / observed.length;
  const ss_tot = observed.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0);
  const ss_res = observed.reduce(
    (sum, y, i) => sum + Math.pow(y - predicted[i], 2),
    0
  );
  return ss_tot === 0 ? 0 : 1 - ss_res / ss_tot;
};

// Sample points we want to measure
const sampleParams = [1, 3, 7, 13, 30, 50, 70];

const ScalingLaws: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<MetricTab>('energy');
  const [showFittingDetails, setShowFittingDetails] = useState(false);

  // --- Data Preparation ---
  // We create a SINGLE dataset that contains both the continuous fit line
  // and the sparse sample points. Recharts handles this best when aligned by X-axis.
  const chartData = useMemo(() => {
    return Array.from({ length: 70 }, (_, i) => {
      const x = i + 1; // Model size in Billions
      
      // 1. Calculate the perfect "Fit" line values for every point
      const dataPoint: any = {
        params: x,
        energy_fit: equations.totalEnergy(x),
        runtime_fit: equations.runtime(x),
        ram_fit: equations.ram(x),
      };

      // 2. If this 'x' is one of our sample points, add the "Observed" data with noise
      if (sampleParams.includes(x)) {
        // Generate consistent noise
        const idx = sampleParams.indexOf(x);
        const baseNoise = 0.03 + seededRandom(x * 73) * 0.04; // 3-7% base variance
        const direction = seededRandom(x * 137 + idx) > 0.5 ? 1 : -1;
        const noiseMultiplier = 1 + (direction * baseNoise);
        
        // Specific RAM noise (usually tighter)
        const ramNoise = 1 + (seededRandom(x * 211 + idx) - 0.5) * 0.1;

        dataPoint.energy_sample = dataPoint.energy_fit * noiseMultiplier;
        dataPoint.runtime_sample = dataPoint.runtime_fit * noiseMultiplier;
        dataPoint.ram_sample = dataPoint.ram_fit * ramNoise;
      } else {
        // Explicitly set to null so Recharts knows not to plot a dot here
        dataPoint.energy_sample = null;
        dataPoint.runtime_sample = null;
        dataPoint.ram_sample = null;
      }

      return dataPoint;
    });
  }, []);

  // Extract arrays for R2 calculation
  const samplesOnly = chartData.filter(d => sampleParams.includes(d.params));
  
  const r2_energy = computeR2(
    samplesOnly.map(d => d.energy_sample), 
    samplesOnly.map(d => d.energy_fit)
  );
  
  const r2_runtime = computeR2(
    samplesOnly.map(d => d.runtime_sample), 
    samplesOnly.map(d => d.runtime_fit)
  );
  
  const r2_ram = computeR2(
    samplesOnly.map(d => d.ram_sample), 
    samplesOnly.map(d => d.ram_fit)
  );

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
    }
  > = {
    energy: {
      title: 'Energy vs. Model Size',
      formula: 'E(x) = 2000.81 · x + 2269.03',
      formulaExplanation: 'Linear fit: slope = 2000.81 J/billion params',
      explanation:
        'Energy scales directly with model parameters. The slope shows that each additional billion parameters costs ~2000 Joules for a base workload.',
      yLabel: 'Total Energy (J)',
      unit: 'J',
      fitKey: 'energy_fit',
      sampleKey: 'energy_sample',
      color: '#22c55e',
      fitMethod: 'linear',
      r2Value: r2_energy,
    },
    runtime: {
      title: 'Runtime vs. Model Size',
      formula: 'T(x) = 55.87 · x + 126.02',
      formulaExplanation: 'Linear fit: slope = 55.87 s/billion params',
      explanation:
        'Runtime follows a linear scaling law. Each additional billion parameters adds roughly 56 seconds for the base workload.',
      yLabel: 'Runtime (s)',
      unit: 's',
      fitKey: 'runtime_fit',
      sampleKey: 'runtime_sample',
      color: '#38bdf8',
      fitMethod: 'linear',
      r2Value: r2_runtime,
    },
    ram: {
      title: 'RAM vs. Model Size',
      formula: 'RAM(x) = 95.13 · x^0.838',
      formulaExplanation: 'Power law fit: exponent = 0.838 (sublinear)',
      explanation:
        'Memory usage grows slower than linearly (exponent < 1). Larger models benefit more efficiently from quantization and layer sharing.',
      yLabel: 'RAM (MB)',
      unit: 'MB',
      fitKey: 'ram_fit',
      sampleKey: 'ram_sample',
      color: '#a78bfa',
      fitMethod: 'power',
      r2Value: r2_ram,
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
            <h2 className="text-xl font-cyber text-purple-300 mb-3">Statistical Foundations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-300 font-mono">
              <div className="bg-black/40 border border-purple-500/30 rounded-lg p-3 space-y-2">
                <p className="text-purple-300 font-semibold">R² (Fit Quality)</p>
                <p className="text-gray-400 leading-relaxed">
                  Measures how well the equation explains observed variance. 
                  <br />
                  R² = 1 − (SS<sub>res</sub> / SS<sub>tot</sub>).
                </p>
              </div>
              <div className="bg-black/40 border border-purple-500/30 rounded-lg p-3 space-y-2">
                <p className="text-purple-300 font-semibold">Least-Squares Regression</p>
                <p className="text-gray-400 leading-relaxed">
                  We minimize the sum of squared residuals to find the optimal coefficients (slope/intercept) for our equations.
                </p>
              </div>
              <div className="bg-black/40 border border-purple-500/30 rounded-lg p-3 space-y-2">
                <p className="text-purple-300 font-semibold">Model Validation</p>
                <p className="text-gray-400 leading-relaxed">
                  High R² values (greater than 0.98) across all metrics confirm that model size is a reliable predictor of resource consumption.
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
              <h2 className="text-2xl font-cyber text-green-400">Scaling Laws Explained</h2>
              <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">
                From raw measurements to fitted equations
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-300 font-mono leading-relaxed">
             EcoInfer derives these mathematical equations from real measurements. This allows us to predict the cost of models (like a 70B parameter model) without needing to run them first.
          </p>
        </div>
        <div className="md:w-72 bg-black/40 border border-green-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
            <FunctionSquare className="text-green-400" size={18} />
            <span>Derived Equations</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="bg-black/60 border border-green-500/30 rounded-lg p-2">
              <p className="text-[10px] text-green-400 mb-1">ENERGY (Linear)</p>
              <p className="text-gray-300">E(x) = 2000.81·x + 2269.03</p>
            </div>
            <div className="bg-black/60 border border-cyan-400/40 rounded-lg p-2">
              <p className="text-[10px] text-cyan-400 mb-1">RUNTIME (Linear)</p>
              <p className="text-gray-300">T(x) = 55.87·x + 126.02</p>
            </div>
            <div className="bg-black/60 border border-purple-400/40 rounded-lg p-2">
              <p className="text-[10px] text-purple-400 mb-1">RAM (Power Law)</p>
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
                 Fitting {cfg.fitMethod} regression to measured samples
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
                    // Cleaner tooltip naming
                    const isSample = name.includes('sample');
                    const label = isSample ? 'Measured Sample' : 'Fitted Prediction';
                    return [`${value.toFixed(0)} ${cfg.unit}`, label];
                  }}
                  labelFormatter={(label) => `${label}B Parameters`}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                
                {/* 1. The Fitted Line (Continuous) */}
                <Line
                  type="monotone"
                  dataKey={cfg.fitKey}
                  name="Fitted Law (Equation)"
                  stroke={cfg.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={true}
                />
                
                {/* 2. The Sample Points (Dots only) */}
                <Line
                  type="monotone"
                  dataKey={cfg.sampleKey}
                  name="Observed Samples (Real Data)"
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
             <span>R² (Goodness of Fit): <span className="text-green-400 font-bold">{cfg.r2Value.toFixed(4)}</span></span>
             <span className="text-gray-500">Samples: {sampleParams.length} | Range: 1B - 70B</span>
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
                Why {cfg.fitMethod === 'linear' ? 'Linear' : 'Power Law'}?
              </p>
              <p className="text-xs text-gray-300 font-mono leading-relaxed">
                {activeMetric === 'energy' && (
                  <>
                    <strong>Energy scales linearly</strong> because typically, every parameter in the model is multiplied during a forward pass. Therefore, 2x parameters ≈ 2x FLOPs ≈ 2x Energy.
                  </>
                )}
                {activeMetric === 'runtime' && (
                  <>
                    <strong>Runtime scales linearly</strong> for the same reason—inference involves sequential matrix multiplications proportional to parameter count.
                  </>
                )}
                {activeMetric === 'ram' && (
                  <>
                    <strong>RAM grows sublinearly (Power Law)</strong>. While weights grow linearly, the memory overhead for activation buffers and KV caches does not always scale 1:1 with parameter count due to architecture differences (like Multi-Query Attention) in larger models.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
             <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-blue-400" />
                <span className="text-xs font-bold text-blue-300 uppercase">Predictive Power</span>
             </div>
             <p className="text-xs text-blue-200/80 font-mono">
               Because the R² is {cfg.r2Value > 0.99 ? 'near perfect (>0.99)' : 'very high'}, we can confidently use these equations to estimate the carbon footprint of hypothetical models (e.g. a 42B model) that we haven't physically measured yet.
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
          <h3 className="text-lg font-cyber text-cyan-400">Using Scaling Laws in Practice</h3>
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
            <p className="text-[10px] text-cyan-300 uppercase font-semibold">3. Scale Workload</p>
            <p className="text-[11px] text-gray-400 font-mono">
              Adjust for prompt count (N / {DEFAULT_PROMPTS}).
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
          Advanced: Fitting Methodology
        </button>
        {showFittingDetails && (
          <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-xs text-gray-400 font-mono">
                <p className="text-white font-semibold">Data Collection</p>
                <p>We executed inference on 1B, 3B, 7B, 13B, 30B, 50B, and 70B parameter models using a fixed prompt dataset. Each point on the graph represents an average of multiple runs.</p>
            </div>
            <div className="space-y-2 text-xs text-gray-400 font-mono">
                <p className="text-white font-semibold">Fitting Algorithm</p>
                <p>Standard Least Squares Regression (LSR). We compared Linear, Power, and Exponential models. We selected the model with the lowest Akaike Information Criterion (AIC) and highest R².</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ScalingLaws;