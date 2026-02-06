import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { equations } from '../constants';
import { TrendingUp, Activity, Box } from 'lucide-react';

const data = Array.from({ length: 70 }, (_, i) => {
  const x = i + 1; // 1B to 70B
  return {
    params: x,
    energy: equations.totalEnergy(x),
    ram: equations.ram(x),
    gpu: Math.max(0, equations.gpuUsage(x)), // Clamp negative for display
  };
});

const Graphs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'energy' | 'ram' | 'gpu'>('energy');

  const renderChart = () => {
    switch (activeTab) {
      case 'energy':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff41" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="params" stroke="#666" label={{ value: 'Size (B)', position: 'insideBottomRight', offset: -5 }} />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #00ff41', color: '#fff' }}
                itemStyle={{ color: '#00ff41' }}
                formatter={(value: number) => [`${value.toFixed(0)} J`, 'Energy']}
                labelFormatter={(label) => `${label}B Params`}
              />
              <Area type="monotone" dataKey="energy" stroke="#00ff41" fillOpacity={1} fill="url(#colorEnergy)" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'ram':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="params" stroke="#666" label={{ value: 'Size (B)', position: 'insideBottomRight', offset: -5 }} />
              <YAxis stroke="#666" />
              <Tooltip 
                 contentStyle={{ backgroundColor: '#000', border: '1px solid #a855f7', color: '#fff' }}
                 itemStyle={{ color: '#a855f7' }}
                 formatter={(value: number) => [`${value.toFixed(0)} MB`, 'RAM']}
                 labelFormatter={(label) => `${label}B Params`}
              />
              <Line type="monotone" dataKey="ram" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'gpu':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="params" stroke="#666" label={{ value: 'Size (B)', position: 'insideBottomRight', offset: -5 }} />
              <YAxis stroke="#666" />
              <Tooltip 
                 contentStyle={{ backgroundColor: '#000', border: '1px solid #f43f5e', color: '#fff' }}
                 itemStyle={{ color: '#f43f5e' }}
                 formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilization']}
                 labelFormatter={(label) => `${label}B Params`}
              />
              <Line type="monotone" dataKey="gpu" stroke="#f43f5e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl h-[400px] flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-cyber text-green-400">Scaling Law Explorer</h2>
        <div className="flex gap-2 bg-black/50 p-1 rounded-lg border border-gray-800">
          <button 
            onClick={() => setActiveTab('energy')}
            className={`p-2 rounded ${activeTab === 'energy' ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}
            title="Energy Scaling"
          >
            <TrendingUp size={16} />
          </button>
          <button 
            onClick={() => setActiveTab('ram')}
            className={`p-2 rounded ${activeTab === 'ram' ? 'bg-purple-500 text-black' : 'text-gray-400 hover:text-white'}`}
            title="RAM Scaling"
          >
            <Box size={16} />
          </button>
          <button 
            onClick={() => setActiveTab('gpu')}
            className={`p-2 rounded ${activeTab === 'gpu' ? 'bg-rose-500 text-black' : 'text-gray-400 hover:text-white'}`}
            title="GPU Paradox"
          >
            <Activity size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full font-mono text-xs">
        {renderChart()}
      </div>
      
      <div className="mt-2 text-xs text-center font-mono text-gray-500">
        {activeTab === 'energy' && "Linear Growth: Energy costs rise steadily with model size."}
        {activeTab === 'ram' && "Power Law: Memory efficiency varies slightly with size."}
        {activeTab === 'gpu' && "The Paradox: Larger models suffer lower GPU utilization."}
      </div>
    </div>
  );
};

export default Graphs;