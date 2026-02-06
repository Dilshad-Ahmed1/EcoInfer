import React, { useState } from 'react';
import { Send, Cpu, Clock, FileText, Loader, UserCog } from 'lucide-react';
import { AnalysisResult } from '../../types';

const PromptAnalyzer: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('http://localhost:8000/analyze-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          system_prompt: systemPrompt,
          model: 'llama3' 
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      // Fallback for UI demo if fetch fails
      setResult({
        runtime_seconds: 1.2,
        cpu_peak: 85,
        gpu_peak: 45,
        reasoning: "Backend connection failed. Displaying fallback data.",
        generated_text: "Error connecting to backend."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
      <h2 className="text-xl font-cyber text-green-400 mb-4 flex items-center gap-2">
        <Cpu /> Prompt Lab
      </h2>

      <div className="flex-1 flex flex-col gap-4">
        
        {/* System Persona Input */}
        <div className="bg-black/40 border border-green-500/20 rounded-lg p-3">
          <label className="text-xs text-green-500 font-bold mb-1 flex items-center gap-2 uppercase">
            <UserCog size={12} /> System Persona (Optional)
          </label>
          <input
            type="text"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="e.g. 'Act as a Senior Python Engineer' or 'Explain like I'm 5'"
            className="w-full bg-transparent text-gray-300 text-sm font-mono focus:outline-none placeholder-gray-700"
          />
        </div>

        {/* Input Area */}
        <div className="relative flex-1">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a prompt to profile (e.g., 'Explain Quantum Computing')..."
            className="w-full h-full bg-black/50 border border-green-500/30 rounded-lg p-4 text-green-100 font-mono focus:outline-none focus:border-green-500 transition-all resize-none"
          />
          <button 
            onClick={handleAnalyze}
            disabled={isLoading || !prompt}
            className="absolute bottom-4 right-4 bg-green-500 text-black px-4 py-2 rounded font-bold font-mono flex items-center gap-2 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader className="animate-spin" size={16}/> : <Send size={16}/>}
            ANALYZE
          </button>
        </div>

        {/* Results Card */}
        {result && (
          <div className="flex-none bg-green-500/5 border border-green-500/20 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-2 text-green-400 mb-3 border-b border-green-500/20 pb-2">
               <FileText size={18} /> 
               <span className="font-cyber uppercase tracking-wider text-sm">Analysis Report</span>
             </div>
             
             <div className="grid grid-cols-3 gap-2 mb-4">
               <div className="bg-black/60 p-2 rounded text-center">
                 <div className="text-[10px] text-gray-500">RUNTIME</div>
                 <div className="text-green-300 font-mono">{result.runtime_seconds.toFixed(2)}s</div>
               </div>
               <div className="bg-black/60 p-2 rounded text-center">
                 <div className="text-[10px] text-gray-500">CPU PEAK</div>
                 <div className="text-green-300 font-mono">{result.cpu_peak.toFixed(0)}%</div>
               </div>
               <div className="bg-black/60 p-2 rounded text-center">
                 <div className="text-[10px] text-gray-500">GPU PEAK</div>
                 <div className="text-green-300 font-mono">{result.gpu_peak.toFixed(0)}%</div>
               </div>
             </div>

             <div className="space-y-3">
               <div>
                 <span className="text-xs text-green-500 uppercase font-bold">Reasoning Engine:</span>
                 <p className="text-sm text-gray-300 italic mt-1 border-l-2 border-green-500/50 pl-2">
                   "{result.reasoning}"
                 </p>
               </div>
               
               <div>
                 <span className="text-xs text-gray-500 uppercase">Output Preview:</span>
                 <p className="text-xs text-gray-400 font-mono mt-1 line-clamp-2">
                   {result.generated_text}
                 </p>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptAnalyzer;