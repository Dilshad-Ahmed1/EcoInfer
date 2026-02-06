import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Terminal, Cpu } from 'lucide-react';
import { SimulationLog, CalculatedMetrics } from '../types';

interface BenchmarkerProps {
  metrics: CalculatedMetrics;
  modelSize: number;
}

const DUMMY_PROMPTS = [
  "Summarize: The history of renewable energy...",
  "Calculate: 3498 + 5743 * 12",
  "Translate to Spanish: 'The algorithm is efficient'",
  "Explain quantum entanglement like I'm five",
  "Write a python script to sort a list",
  "Analyze sentiment: 'I love this green dashboard'",
  "Generate a haiku about optimization",
  "Debug this React component...",
  "Optimize SQL query for latency",
  "Classify this image of a cat"
];

const Benchmarker: React.FC<BenchmarkerProps> = ({ metrics, modelSize }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  
  // Simulation duration: Calculated Runtime / 10 (scaled for demo)
  // Ensure a minimum duration so it doesn't flash instantly for small models
  const simulationDuration = Math.max(2000, (metrics.runtime * 1000) / 10); 
  
  // Auto-scroll to bottom whenever logs update
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    let interval: number;
    let timeout: number;
    let logInterval: number;

    if (isRunning) {
      const startTime = Date.now();
      setLogs([{ id: 0, timestamp: new Date().toLocaleTimeString(), message: `Initializing ${modelSize}B Model...`, type: 'info' }]);
      setProgress(0);

      // Progress loop
      interval = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(100, (elapsed / simulationDuration) * 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          setIsRunning(false);
          setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message: "Simulation Complete. Metrics verified.", type: 'success' }]);
        }
      }, 50);

      // Logs loop
      logInterval = window.setInterval(() => {
        const randomPrompt = DUMMY_PROMPTS[Math.floor(Math.random() * DUMMY_PROMPTS.length)];
        setLogs(prev => {
          const newLog: SimulationLog = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            message: `Processing: "${randomPrompt}"`,
            type: 'info'
          };
          return [...prev.slice(-15), newLog]; // Keep last 15 logs so scrolling is visible
        });
      }, Math.max(300, simulationDuration / 8)); // Faster logs for more activity

    } else {
        // Reset if stopped manually? No, keep state.
    }

    return () => {
      clearInterval(interval);
      clearInterval(logInterval);
      clearTimeout(timeout);
    };
  }, [isRunning, simulationDuration, modelSize]);

  const handleStart = () => {
    if (isRunning) {
      setIsRunning(false);
      setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message: "Simulation Aborted.", type: 'warning' }]);
    } else {
      setIsRunning(true);
    }
  };

  const getLogColor = (type: string) => {
    switch(type) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl mt-6 relative overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        
        {/* Controls & Progress */}
        <div className="flex-1 flex flex-col justify-center space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-cyber text-green-400 flex items-center gap-2">
              <Terminal size={20} /> Virtual Benchmarker
            </h2>
            <button
              onClick={handleStart}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold font-mono transition-all ${
                isRunning 
                ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30' 
                : 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_15px_rgba(0,255,65,0.4)]'
              }`}
            >
              {isRunning ? <><Square size={16} fill="currentColor"/> STOP</> : <><Play size={16} fill="currentColor"/> SIMULATE</>}
            </button>
          </div>

          <div className="space-y-2">
             <div className="flex justify-between text-xs font-mono text-gray-400">
               <span>PROGRESS</span>
               <span>{progress.toFixed(1)}%</span>
             </div>
             <div className="h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
               <div 
                 className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-100 ease-out relative"
                 style={{ width: `${progress}%` }}
               >
                 {isRunning && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
               </div>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-black/40 border border-gray-800 p-3 rounded-lg">
               <div className="text-xs text-gray-500 mb-1 font-mono">CPU POWER</div>
               <div className="text-lg text-green-400 font-mono">
                 {isRunning ? (Math.random() * 5 + 15).toFixed(1) : '0.0'} W
               </div>
             </div>
             <div className="bg-black/40 border border-gray-800 p-3 rounded-lg">
               <div className="text-xs text-gray-500 mb-1 font-mono">GPU POWER</div>
               <div className="text-lg text-green-400 font-mono">
                 {isRunning ? metrics.power.toFixed(1) : '0.0'} W
               </div>
             </div>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="flex-1 bg-black border border-gray-800 rounded-lg p-4 font-mono text-xs flex flex-col h-[200px] shadow-inner relative">
           <div className="flex items-center gap-1 mb-2 pb-2 border-b border-gray-800 shrink-0">
             <div className="w-2 h-2 rounded-full bg-red-500"></div>
             <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             <span className="ml-2 text-gray-600">ecoinfer_cli.exe</span>
           </div>
           
           <div 
             ref={logsContainerRef}
             className="flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-green-900 scrollbar-track-transparent"
             style={{ scrollBehavior: 'smooth' }}
           >
             {logs.length === 0 && <span className="text-gray-600 italic">Ready to benchmark...</span>}
             {logs.map((log) => (
               <div key={log.id} className="flex gap-2">
                 <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                 <span className={getLogColor(log.type)}>{log.message}</span>
               </div>
             ))}
             {isRunning && <span className="text-green-500 animate-pulse">_</span>}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Benchmarker;