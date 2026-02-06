import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, TriangleAlert, Zap } from 'lucide-react';
import { SystemMetrics } from '../../types';

const SystemMonitor: React.FC = () => {
  const [data, setData] = useState<SystemMetrics[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [latest, setLatest] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/metrics');
        if (!res.ok) throw new Error('Failed');
        const metric = await res.json();
        
        setIsConnected(true);
        setLatest(metric);
        
        setData(prev => {
          const newData = [...prev, metric];
          // Keep last 60 points (approx 30 seconds at 500ms rate)
          return newData.slice(-60);
        });
      } catch (e) {
        setIsConnected(false);
      }
    };

    const interval = setInterval(fetchData, 500);
    return () => clearInterval(interval);
  }, []);

  if (!isConnected) {
    return (
      <div className="glass-panel p-6 rounded-2xl h-[300px] flex flex-col items-center justify-center text-center border-red-500/30">
        <TriangleAlert size={48} className="text-red-500 mb-4 animate-pulse" />
        <h3 className="text-xl font-cyber text-red-400">BACKEND OFFLINE</h3>
        <p className="text-gray-500 mt-2 font-mono text-sm">
          Start the Python server: <br/>
          <span className="bg-gray-900 px-2 py-1 rounded text-gray-300">uvicorn backend:app --reload</span>
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-cyber text-green-400 flex items-center gap-2">
          <Activity className="animate-pulse" /> Live System Monitor
        </h2>
        <div className="flex gap-4">
           {latest?.is_simulated && (
             <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/50 font-mono">
               SIMULATION MODE
             </span>
           )}
           <div className="flex items-center gap-2 text-xs font-mono text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              LIVE
           </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-black/40 p-3 rounded border border-gray-800">
           <div className="text-gray-500 text-xs font-mono">CPU LOAD</div>
           <div className="text-2xl font-cyber text-white">{latest?.cpu_percent.toFixed(1)}%</div>
        </div>
        <div className="bg-black/40 p-3 rounded border border-gray-800">
           <div className="text-gray-500 text-xs font-mono">GPU LOAD</div>
           <div className="text-2xl font-cyber text-white">{latest?.gpu_percent.toFixed(1)}%</div>
        </div>
        <div className="bg-black/40 p-3 rounded border border-gray-800">
           <div className="text-gray-500 text-xs font-mono">POWER DRAW</div>
           <div className="text-2xl font-cyber text-white flex items-center gap-1">
             <Zap size={16} className="text-yellow-400" fill="currentColor" />
             {latest?.power_watts.toFixed(0)}W
           </div>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="timestamp" hide />
            <YAxis domain={[0, 100]} stroke="#666" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', border: '1px solid #00ff41' }}
              labelFormatter={() => ''}
            />
            <Line 
              type="monotone" 
              dataKey="cpu_percent" 
              stroke="#00ff41" 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false} 
              name="CPU %"
            />
            <Line 
              type="monotone" 
              dataKey="gpu_percent" 
              stroke="#a855f7" 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false} 
              name="GPU %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SystemMonitor;