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
    if (score >= 9.5) return "bg-[#55EFC4] text-zinc-950 border-2 border-zinc-950 shadow-[1px_1px_0_0_#000] font-black";
    if (score >= 8.5) return "bg-[#74B9FF] text-zinc-950 border-2 border-zinc-950 shadow-[1px_1px_0_0_#000] font-black";
    return "bg-[#FFEAA7] text-zinc-950 border-2 border-zinc-950 shadow-[1px_1px_0_0_#000] font-black";
  };

  return (
    <div id="leaderboard-component" className="w-full bg-[#FFFDF5] rounded-[32px] border-[3px] border-zinc-950 p-6 shadow-[5px_5px_0_0_#18181b] flex flex-col gap-4 text-zinc-900">
      <div className="flex justify-between items-center pb-2 border-b-2 border-zinc-200">
        <h3 className="text-sm font-[900] text-zinc-950 flex items-center gap-1.5 uppercase tracking-wide">
          <Trophy className="w-4 h-4 text-amber-500 fill-current animate-pulse" />
          🏆 Leyendas del Tono
        </h3>
        
        <button
          type="button"
          onClick={clearScores}
          title="Borrar mi historial local"
          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border-2 border-zinc-200 hover:border-zinc-950 rounded-lg transition-all cursor-pointer shadow-[1px_1px_0_0_#000] bg-white active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-100 p-1 rounded-xl border-2 border-zinc-950 text-[11px] shadow-[2px_2px_0_0_#000]">
        <button
          type="button"
          onClick={() => setActiveTab("top")}
          className={`flex-1 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "top"
              ? "bg-[#FF7675] text-white border-2 border-zinc-950 shadow-[1.5px_1.5px_0_0_#000]"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Mejores
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("recent")}
          className={`flex-1 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "recent"
              ? "bg-[#6C5CE7] text-white border-2 border-zinc-950 shadow-[1.5px_1.5px_0_0_#000]"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Recientes
        </button>
      </div>

      {/* Table List */}
      <div className="flex flex-col gap-3.5 max-h-[340px] overflow-y-auto pr-1 select-none custom-scrollbar">
        {scores.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500 font-mono font-bold">
            Sin marcas registradas.
          </div>
        ) : (
          scores.map((entry, index) => {
            const isLegend = entry.id.startsWith("legend-");
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-2xl border-2 border-zinc-950 shadow-[3px_3px_0_0_#000] transition-all duration-300 hover:translate-x-1 ${
                  isLegend 
                    ? "bg-amber-50/50 hover:bg-amber-50" 
                    : "bg-[#FF7675]/5 text-zinc-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Position Badge */}
                  <div className="flex items-center justify-center w-6 h-6 rounded-full font-black text-xs">
                    {index === 0 ? (
                      <span className="text-yellow-400 text-base animate-bounce" title="1° Lugar">🥇</span>
                    ) : index === 1 ? (
                      <span className="text-[#A4B0BE] text-base" title="2° Lugar">🥈</span>
                    ) : index === 2 ? (
                      <span className="text-amber-600 text-base" title="3° Lugar">🥉</span>
                    ) : (
                      <span className="text-zinc-500 font-mono font-black">#{index + 1}</span>
                    )}
                  </div>

                  {/* Player Name and Date */}
                  <div className="flex flex-col">
                    <span className="text-xs font-[900] text-zinc-950 flex items-center gap-1.5">
                      {entry.name}
                      {isLegend && (
                        <span className="bg-amber-200 text-zinc-950 border-2 border-zinc-950 text-[7px] px-1.5 py-0.25 rounded uppercase font-black tracking-widest shadow-[1px_1px_0_0_#000]">
                          BOT
                        </span>
                      )}
                    </span>
                    <span className="text-[9px] text-zinc-650 font-mono flex items-center gap-1 truncate max-w-[140px] sm:max-w-xs mt-1 font-bold">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(entry.date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short"
                      })} - {entry.characterName}
                    </span>
                  </div>
                </div>

                {/* Score Column */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Visual Color Dots comparison */}
                  <div className="flex -space-x-1.5">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-zinc-950 shadow-sm"
                      style={{ backgroundColor: entry.userColor }}
                      title={`Tono jugado: ${entry.userColor}`}
                    />
                    <div
                      className="w-4 h-4 rounded-full border-2 border-zinc-950 shadow-sm"
                      style={{ backgroundColor: entry.targetColor }}
                      title={`Tono objetivo: ${entry.targetColor}`}
                    />
                  </div>
                  
                  {/* Score badge */}
                  <div className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-black border-2 border-zinc-950 ${getDifficultyBadgeColor(entry.score)}`}>
                    {entry.score.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-[10px] text-zinc-500 text-center font-mono font-bold">
        Escanea la lista de récords y supera tus marcas locales.
      </div>
    </div>
  );
};
