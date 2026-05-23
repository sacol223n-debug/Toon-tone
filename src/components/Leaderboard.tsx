import React, { useState, useEffect } from "react";
import { ScoreEntry } from "../types";
import { Trophy, Clock, Medal, Trash2, ArrowUpRight } from "lucide-react";

interface LeaderboardProps {
  currentScoreEntry?: ScoreEntry | null;
  onRefresh?: () => void;
}

const DEFAULT_LEGENDS: ScoreEntry[] = [
  {
    id: "legend-1",
    name: "Carlinhos98",
    score: 9.94,
    characterId: "homer",
    characterName: "Homero Simpson",
    userColor: "#FEDA1D",
    targetColor: "#FED41D",
    date: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
  },
  {
    id: "legend-2",
    name: "Ana_Disney",
    score: 9.88,
    characterId: "goofy",
    characterName: "Goofy (Tribilín)",
    userColor: "#41A048",
    targetColor: "#3FA34D",
    date: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
  },
  {
    id: "legend-3",
    name: "Pro_Dexter",
    score: 9.79,
    characterId: "dexter",
    characterName: "Dexter",
    userColor: "#9337EB",
    targetColor: "#9333EA",
    date: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
  },
  {
    id: "legend-4",
    name: "MarcyOoo",
    score: 9.65,
    characterId: "finn",
    characterName: "Finn el Humano",
    userColor: "#17833B",
    targetColor: "#15803D",
    date: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
  },
  {
    id: "legend-5",
    name: "BobPiña",
    score: 9.48,
    characterId: "spongebob",
    characterName: "Bob Esponja",
    userColor: "#DE2925",
    targetColor: "#DC2626",
    date: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
  }
];

export const Leaderboard: React.FC<LeaderboardProps> = () => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"top" | "recent">("top");

  // Load and combine scores
  useEffect(() => {
    const rawLocal = localStorage.getItem("toontone_leaderboard");
    let localScores: ScoreEntry[] = [];
    if (rawLocal) {
      try {
        localScores = JSON.parse(rawLocal);
      } catch (e) {
        console.error("Failed to parse local scores", e);
      }
    }

    // Combine default and user local scores
    const allScores = [...localScores, ...DEFAULT_LEGENDS];
    
    // Sort logic
    if (activeTab === "top") {
      allScores.sort((a, b) => b.score - a.score);
    } else {
      allScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    setScores(allScores);
  }, [activeTab]);

  const clearScores = () => {
    if (window.confirm("¿Seguro que deseas reiniciar tu historial local de puntuaciones?")) {
      localStorage.removeItem("toontone_leaderboard");
      // Only keep legends
      const sortedLegends = [...DEFAULT_LEGENDS];
      if (activeTab === "top") {
        sortedLegends.sort((a, b) => b.score - a.score);
      } else {
        sortedLegends.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      setScores(sortedLegends);
    }
  };

  const getDifficultyBadgeColor = (score: number) => {
    if (score >= 9.5) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (score >= 8.5) return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  };

  return (
    <div id="leaderboard-component" className="w-full bg-[#0e1424]/90 rounded-[32px] border border-white/5 p-6 backdrop-blur-md shadow-2xl flex flex-col gap-4">
      <div className="flex justify-between items-center pb-2 border-b border-white/10">
        <h3 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
          <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
          🏆 Leyendas del Tono
        </h3>
        
        <button
          type="button"
          onClick={clearScores}
          title="Borrar mi historial local"
          className="p-1.5 text-slate-500 hover:text-rose-450 hover:bg-slate-800/40 rounded-full transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 text-[11px]">
        <button
          type="button"
          onClick={() => setActiveTab("top")}
          className={`flex-1 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "top"
              ? "bg-indigo-600 text-white shadow-md font-black"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Mejores
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("recent")}
          className={`flex-1 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "recent"
              ? "bg-indigo-600 text-white shadow-md font-black"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Recientes
        </button>
      </div>

      {/* Table List */}
      <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1 select-none custom-scrollbar">
        {scores.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-550 font-mono">
            Sin marcas registradas.
          </div>
        ) : (
          scores.map((entry, index) => {
            const isLegend = entry.id.startsWith("legend-");
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 hover:translate-x-1 ${
                  isLegend 
                    ? "bg-slate-950/40 border-white/5" 
                    : "bg-indigo-950/20 border-indigo-900/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Position Badge */}
                  <div className="flex items-center justify-center w-6 h-6 rounded-full font-extrabold text-xs">
                    {index === 0 ? (
                      <span className="text-yellow-400 text-base animate-bounce" title="1° Lugar">🥇</span>
                    ) : index === 1 ? (
                      <span className="text-slate-300 text-base" title="2° Lugar">🥈</span>
                    ) : index === 2 ? (
                      <span className="text-amber-600 text-base" title="3° Lugar">🥉</span>
                    ) : (
                      <span className="text-slate-500 font-mono">#{index + 1}</span>
                    )}
                  </div>

                  {/* Player Name and Date */}
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-205 flex items-center gap-1.5">
                      {entry.name}
                      {isLegend && (
                        <span className="bg-amber-400/10 text-amber-400 border border-amber-450/20 text-[8px] px-1 rounded uppercase font-black tracking-widest">
                          NPC
                        </span>
                      )}
                    </span>
                    <span className="text-[9px] text-slate-450 font-mono flex items-center gap-1 truncate max-w-[160px] sm:max-w-xs mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(entry.date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short"
                      })} - {entry.characterName}{entry.part ? ` (${entry.part})` : ""}
                    </span>
                  </div>
                </div>

                {/* Score Column */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Visual Color Dots comparison */}
                  <div className="flex -space-x-1.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-slate-950 shadow-sm"
                      style={{ backgroundColor: entry.userColor }}
                      title={`Tono jugado: ${entry.userColor}`}
                    />
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-slate-950 shadow-sm"
                      style={{ backgroundColor: entry.targetColor }}
                      title={`Tono objetivo: ${entry.targetColor}`}
                    />
                  </div>
                  
                  {/* Score badge */}
                  <div className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-black border ${getDifficultyBadgeColor(entry.score)}`}>
                    {entry.score.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-[10px] text-slate-500 text-center font-mono">
        Escanea la lista y supera tus marcas locales.
      </div>
    </div>
  );
};
