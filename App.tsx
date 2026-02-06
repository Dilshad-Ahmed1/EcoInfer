import React, { useState, useMemo } from 'react';
import Calculator from './components/Calculator';
import Leaderboard from './components/Leaderboard';
import Graphs from './components/Graphs';
import Benchmarker from './components/Benchmarker';
import SystemMonitor from './components/Lab/SystemMonitor';
import PromptAnalyzer from './components/Lab/PromptAnalyzer';
import ModelRecommender from './components/ModelRecommender';
import ScalingLaws from './components/ScalingLaws';
import { calculateMetrics, DEFAULT_PROMPTS } from './constants';
import { Leaf, Info, LayoutDashboard, Activity, Sigma } from 'lucide-react';

type ViewMode = 'PLANNER' | 'LAB' | 'SCALING';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('PLANNER');
  const [modelSize, setModelSize] = useState<number>(7.0); 
  const [promptCount, setPromptCount] = useState<number>(DEFAULT_PROMPTS);

  // Recalculate metrics whenever inputs change
  const metrics = useMemo(() => {
    return calculateMetrics(modelSize, promptCount);
  }, [modelSize, promptCount]);

  return (
    <div className="min-h-screen pb-12 selection:bg-green-500/30 selection:text-green-200">
      
      {/* Background Grid Effect */}
      <div className="fixed inset-0 pointer-events-none z-[-1]" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }}>
      </div>
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a] pointer-events-none z-[-1]"></div>

      {/* Header */}
      <header className="border-b border-green-500/20 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-2 rounded-lg border border-green-500/30">
              <Leaf className="text-green-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-cyber text-white tracking-wider">
                Eco<span className="text-green-500">Infer</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">AI Energy Optimization Engine</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-black/50 p-1 rounded-lg border border-green-500/20">
            <button 
              onClick={() => setView('PLANNER')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md font-mono text-sm transition-all ${
                view === 'PLANNER' 
                ? 'bg-green-500 text-black font-bold shadow-[0_0_10px_rgba(0,255,65,0.3)]' 
                : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutDashboard size={16} /> PLANNER
            </button>
            <button 
              onClick={() => setView('LAB')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md font-mono text-sm transition-all ${
                view === 'LAB' 
                ? 'bg-green-500 text-black font-bold shadow-[0_0_10px_rgba(0,255,65,0.3)]' 
                : 'text-gray-400 hover:text-white'
              }`}
            >
              <Activity size={16} /> LAB (LIVE)
            </button>
            <button 
              onClick={() => setView('SCALING')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md font-mono text-sm transition-all ${
                view === 'SCALING' 
                ? 'bg-green-500 text-black font-bold shadow-[0_0_10px_rgba(0,255,65,0.3)]' 
                : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sigma size={16} /> SCALING LAWS
            </button>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {view === 'PLANNER' ? (
          <div className="animate-in fade-in duration-500 space-y-8">
            {/* Intro Text */}
            <div className="flex items-start gap-4 bg-green-900/10 border border-green-500/20 p-4 rounded-lg max-w-3xl mx-auto">
               <Info className="text-green-500 shrink-0 mt-1" size={20} />
               <p className="text-sm text-gray-300">
                 Large Language Models consume vast amounts of energy. Use this dashboard to analyze the <span className="text-green-400 font-bold">Scaling Laws</span> of compute resources and choose the most efficient model for your workload.
               </p>
            </div>

            {/* AI Consultant */}
            <section>
              <ModelRecommender />
            </section>

            {/* Hero Calculator */}
            <section>
              <Calculator 
                modelSize={modelSize} 
                setModelSize={setModelSize}
                promptCount={promptCount}
                setPromptCount={setPromptCount}
                metrics={metrics}
              />
            </section>

            {/* Analytics Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Leaderboard currentModelSize={modelSize} />
              <Graphs />
            </section>

            {/* Static Benchmarker */}
            <section>
              <Benchmarker metrics={metrics} modelSize={modelSize} />
            </section>
          </div>
        ) : view === 'LAB' ? (
          <div className="animate-in fade-in duration-500 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-Time System Monitor */}
            <div className="lg:col-span-2">
              <SystemMonitor />
            </div>
            
            {/* Prompt Lab */}
            <div className="lg:col-span-1 h-[500px]">
              <PromptAnalyzer />
            </div>

            {/* Context/Instructions for Lab */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center">
              <h3 className="text-xl font-cyber text-green-400 mb-4">How the Lab Works</h3>
              <ul className="space-y-4 text-sm text-gray-400 font-mono">
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold">01.</span>
                  <span>Connects to local Python backend to stream real-time sensor data (NVML/Psutil).</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold">02.</span>
                  <span>Sends prompts to local <span className="text-white">Ollama</span> instance running 'llama3'.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold">03.</span>
                  <span>Measures exact CPU/GPU spikes during token generation.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold">04.</span>
                  <span>If no GPU is found, the system enters <span className="text-yellow-400">Simulation Mode</span> for demonstration.</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <ScalingLaws />
          </div>
        )}

      </main>
      
      <footer className="text-center text-gray-600 text-xs font-mono py-8 border-t border-green-500/10 mt-12">
        <p>ECOINFER ULTIMATE // FULL STACK AI DASHBOARD</p>
        <p className="mt-2 opacity-50">Note: GPU Usage Paradox is a known phenomenon in scaling law research.</p>
      </footer>
    </div>
  );
};

export default App;