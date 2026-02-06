import React from 'react';
import { getEnergySaved, BENCHMARK_70B_PARAMS } from '../constants';
import { CalculatedMetrics } from '../types';
import { Cpu, Zap, Clock, DollarSign, Activity } from 'lucide-react';

interface CalculatorProps {
  modelSize: number;
  setModelSize: (val: number) => void;
  promptCount: number;
  setPromptCount: (val: number) => void;
  metrics: CalculatedMetrics;
}

const Calculator: React.FC<CalculatorProps> = ({
  modelSize,
  setModelSize,
  promptCount,
  setPromptCount,
  metrics
}) => {
  const energySaved = getEnergySaved(metrics.energy, promptCount);

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Activity size={120} className="text-green-500" />
      </div>

      <h2 className="text-2xl font-cyber text-green-400 mb-6 flex items-center gap-2">
        <Cpu className="animate-pulse" /> Green-Compute Calculator
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-gray-400 flex justify-between">
              <span>Model Size (Billions of Parameters)</span>
              <span className="text-green-400 font-mono">{modelSize}B</span>
            </label>
            <input
              type="range"
              min="1"
              max="70"
              step="0.5"
              value={modelSize}
              onChange={(e) => setModelSize(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400 transition-all"
            />
            <div className="flex justify-between text-xs text-gray-600 font-mono">
              <span>1B</span>
              <span>35B</span>
              <span>70B</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Number of Prompts</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={promptCount}
                onChange={(e) => setPromptCount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-black/50 border border-green-500/30 rounded-lg py-2 px-4 text-green-400 font-mono focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
              />
              <span className="absolute right-4 top-2 text-xs text-gray-500 py-1">BATCH SIZE</span>
            </div>
          </div>
        </div>

        {/* Outputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-black/40 border border-green-500/10 p-4 rounded-xl flex flex-col justify-between hover:border-green-500/30 transition-colors">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Zap size={16} /> Total Energy
            </div>
            <div className="text-2xl font-mono text-white">
              {metrics.energy.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-sm text-green-500">J</span>
            </div>
          </div>

          <div className="bg-black/40 border border-green-500/10 p-4 rounded-xl flex flex-col justify-between hover:border-green-500/30 transition-colors">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Clock size={16} /> Runtime
            </div>
            <div className="text-2xl font-mono text-white">
              {(metrics.runtime / 60).toFixed(2)} <span className="text-sm text-green-500">min</span>
            </div>
          </div>

          <div className="bg-black/40 border border-green-500/10 p-4 rounded-xl flex flex-col justify-between hover:border-green-500/30 transition-colors">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <DollarSign size={16} /> Est. Cost
            </div>
            <div className="text-2xl font-mono text-white">
              ${metrics.cost.toFixed(6)}
            </div>
          </div>

           <div className="bg-black/40 border border-green-500/10 p-4 rounded-xl flex flex-col justify-between hover:border-green-500/30 transition-colors">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Activity size={16} /> Power Draw
            </div>
            <div className="text-2xl font-mono text-white">
              {metrics.power.toFixed(1)} <span className="text-sm text-green-500">W</span>
            </div>
          </div>
        </div>
      </div>

      {/* Energy Saved Hero */}
      <div className="mt-8 relative border-t border-green-500/20 pt-6 text-center">
        <p className="text-gray-500 text-sm mb-2 font-mono">VS STANDARD {BENCHMARK_70B_PARAMS}B MODEL</p>
        <div className="text-3xl md:text-5xl font-bold font-cyber text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 animate-pulse neon-text">
          ⚡ You Conserved {energySaved > 0 ? energySaved.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0} Joules!
        </div>
      </div>
    </div>
  );
};

export default Calculator;