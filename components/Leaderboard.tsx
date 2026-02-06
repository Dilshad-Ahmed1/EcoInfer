import React, { useState, useMemo } from 'react';
import { LEADERBOARD_DATA } from '../constants';
import { Trophy, ArrowDown, ArrowUp, Target } from 'lucide-react';

interface LeaderboardProps {
  currentModelSize: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentModelSize }) => {
  const [sortAsc, setSortAsc] = useState(true);

  const sortedData = [...LEADERBOARD_DATA].sort((a, b) => {
    return sortAsc ? a.efficiency - b.efficiency : b.efficiency - a.efficiency;
  });

  // Find the model closest to the user's input size
  const closestModelName = useMemo(() => {
    let closest = LEADERBOARD_DATA[0];
    let minDiff = Math.abs(LEADERBOARD_DATA[0].params - currentModelSize);

    for (const model of LEADERBOARD_DATA) {
      const diff = Math.abs(model.params - currentModelSize);
      if (diff < minDiff) {
        minDiff = diff;
        closest = model;
      }
    }
    return closest.name;
  }, [currentModelSize]);

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-cyber text-green-400 flex items-center gap-2">
          <Trophy size={20} className="text-yellow-400" /> Efficiency Leaderboard
        </h2>
        <button 
          onClick={() => setSortAsc(!sortAsc)}
          className="text-xs text-green-500/70 hover:text-green-400 flex items-center gap-1 uppercase font-mono border border-green-500/20 px-2 py-1 rounded"
        >
          Sort {sortAsc ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
        </button>
      </div>

      <div className="overflow-auto flex-1 pr-2">
        <table className="w-full text-left border-collapse">
          <thead className="text-xs text-gray-500 font-mono uppercase border-b border-green-500/20 sticky top-0 bg-[#0a0a0a] z-10">
            <tr>
              <th className="py-3 pl-2">Rank</th>
              <th className="py-3">Model</th>
              <th className="py-3 text-right pr-2">J/Param</th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm">
            {sortedData.map((model, index) => {
              const isGold = model.name === "Qwen 5B";
              const isRecommended = model.name === closestModelName;
              
              return (
                <tr 
                  key={model.name} 
                  className={`border-b border-gray-800 transition-colors
                    ${isRecommended ? 'bg-green-500/20 border-green-500' : 'hover:bg-green-500/5'}
                    ${isGold && !isRecommended ? 'bg-yellow-400/5' : ''}
                  `}
                >
                  <td className="py-3 pl-2 text-gray-400">
                    <div className="flex items-center gap-2">
                       {index + 1}
                       {isGold && <span className="text-yellow-400">★</span>}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col">
                      <span className={`${isGold ? 'text-yellow-300 font-bold' : 'text-gray-200'} ${isRecommended ? 'text-green-300 font-bold' : ''}`}>
                        {model.name}
                      </span>
                      <div className="flex gap-2">
                        {model.tag && (
                          <span className={`text-[10px] uppercase ${model.tag.includes("Most") ? 'text-green-500' : 'text-red-500'}`}>
                            {model.tag}
                          </span>
                        )}
                        {isRecommended && (
                          <span className="text-[10px] uppercase text-green-400 flex items-center gap-1">
                            <Target size={10} /> Rec. Size
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`py-3 text-right pr-2 ${isGold ? 'text-yellow-300 font-bold' : 'text-green-400'} ${isRecommended ? 'text-green-300 text-base' : ''}`}>
                    {model.efficiency}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;