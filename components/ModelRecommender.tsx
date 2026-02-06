import React, { useState } from 'react';
import { Bot, Zap, ShieldCheck, Scale, Brain, Key, Loader } from 'lucide-react';
import { RecommendationResponse, RecommendedModel } from '../types';
import { getEnergySaved, calculateMetrics, DEFAULT_PROMPTS } from '../constants';

const ModelRecommender: React.FC = () => {
  const [profession, setProfession] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);

  const handleConsult = async () => {
    if (!profession.trim()) return;
    setLoading(true);
    setRecommendation(null);

    try {
      const res = await fetch('http://localhost:8000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profession, apiKey })
      });
      const data = await res.json();
      setRecommendation(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const RenderCard = ({ type, data, icon: Icon, color }: { type: string, data: RecommendedModel, icon: any, color: 'green' | 'blue' | 'purple' }) => {
    // Calculate Energy Metrics for this recommendation
    const metrics = calculateMetrics(data.params, DEFAULT_PROMPTS);
    const savedJoules = getEnergySaved(metrics.energy, DEFAULT_PROMPTS);
    const percentSaved = Math.max(0, (savedJoules / calculateMetrics(70, DEFAULT_PROMPTS).energy) * 100);

    // Explicit Tailwind classes map to ensure the CDN generates them
    const styles = {
      green: {
        border: 'border-green-500/30',
        hoverBorder: 'hover:border-green-500',
        bg: 'bg-green-500/5',
        hoverBg: 'group-hover:bg-green-500/10',
        text: 'text-green-400',
        bar: 'bg-green-500'
      },
      blue: {
        border: 'border-blue-500/30',
        hoverBorder: 'hover:border-blue-500',
        bg: 'bg-blue-500/5',
        hoverBg: 'group-hover:bg-blue-500/10',
        text: 'text-blue-400',
        bar: 'bg-blue-500'
      },
      purple: {
        border: 'border-purple-500/30',
        hoverBorder: 'hover:border-purple-500',
        bg: 'bg-purple-500/5',
        hoverBg: 'group-hover:bg-purple-500/10',
        text: 'text-purple-400',
        bar: 'bg-purple-500'
      }
    };

    const s = styles[color];

    return (
      <div className={`glass-panel p-4 rounded-xl border ${s.border} flex flex-col h-full ${s.hoverBorder} transition-colors group relative overflow-hidden`}>
        {/* Background Gradient */}
        <div className={`absolute inset-0 ${s.bg} ${s.hoverBg} transition-colors`}></div>

        <div className="relative z-10 flex flex-col h-full">
          <div className={`flex items-center gap-2 ${s.text} mb-2 font-cyber uppercase tracking-wider text-sm`}>
            <Icon size={18} /> {type}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-1">{data.name}</h3>
          <div className="text-xs text-gray-500 font-mono mb-4">{data.params}B Parameters</div>
          
          <p className="text-gray-400 text-sm italic mb-6 flex-grow">"{data.reason}"</p>
          
          <div className="mt-auto border-t border-gray-700 pt-3">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Energy Cost</div>
                <div className="text-lg font-mono text-white">{metrics.energy.toLocaleString(undefined, {maximumFractionDigits:0})} J</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-green-500 uppercase">Saved vs 70B</div>
                <div className="text-lg font-bold text-green-400 font-mono">
                  {percentSaved.toFixed(0)}%
                </div>
              </div>
            </div>
            
            {/* Visual Bar */}
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
               <div 
                 className={`h-full ${s.bar}`} 
                 style={{ width: `${100 - percentSaved}%` }} 
                 title="Energy Usage relative to 70B"
               ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-cyber text-green-400 flex items-center gap-2">
            <Bot className="animate-bounce" /> AI Hardware Consultant
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">
            Powered by Groq Llama3 • Enter your profession for tailored sizing
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Your Profession / Use Case</label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="e.g. Student, Data Scientist, Writer..."
              className="w-full bg-black/50 border border-green-500/30 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-green-500 transition-all"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
               <Key size={10} /> Groq API Key (Optional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-black/30 border border-gray-800 rounded-lg p-2 text-xs text-gray-400 font-mono focus:outline-none focus:border-green-500/50"
            />
            <p className="text-[10px] text-gray-600">If empty, uses simulation mode.</p>
          </div>

          <button
            onClick={handleConsult}
            disabled={loading || !profession}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg font-cyber transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? <Loader className="animate-spin" size={18} /> : <Brain size={18} />}
            FIND MODELS
          </button>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-3">
          {!recommendation && !loading && (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-800 rounded-xl text-gray-600 text-sm font-mono">
              Waiting for use case input...
            </div>
          )}
          
          {loading && (
             <div className="h-full flex items-center justify-center rounded-xl">
               <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
                 <p className="text-green-500 font-mono text-xs animate-pulse">ANALYZING WORKLOAD REQUIREMENTS...</p>
               </div>
             </div>
          )}

          {recommendation && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full animate-in fade-in slide-in-from-right duration-500">
              <RenderCard 
                type="Energy Saving" 
                data={recommendation.efficiency} 
                icon={Zap} 
                color="green" 
              />
              <RenderCard 
                type="Balanced" 
                data={recommendation.balanced} 
                icon={Scale} 
                color="blue" 
              />
              <RenderCard 
                type="Max Accuracy" 
                data={recommendation.accuracy} 
                icon={ShieldCheck} 
                color="purple" 
              />
              {recommendation.is_simulated && (
                 <div className="col-span-full text-center text-[10px] text-yellow-500/50 font-mono mt-2">
                   * Running in Simulation Mode (No valid API Key provided)
                 </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelRecommender;