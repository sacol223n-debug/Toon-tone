import React, { useState, useEffect } from "react";
import { CHARACTERS } from "./data/characters";
import { Character, GameRound, ScoreEntry } from "./types";
import { ToonRenderer } from "./components/ToonRenderer";
import { ColorPicker } from "./components/ColorPicker";
import { Leaderboard } from "./components/Leaderboard";
import { 
  Trophy, 
  RotateCcw, 
  HelpCircle, 
  Play, 
  ChevronRight, 
  Info, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Check, 
  Bookmark, 
  Tv, 
  Dices,
  Eye,
  EyeOff,
  ArrowUpRight,
  Smartphone,
  Award,
  Flame,
  Gamepad2,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Web Audio API Sound Synthesizer
const playTone = (type: "click" | "submit" | "win" | "fail", muted: boolean) => {
  if (muted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "submit") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(640, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "win") {
      const now = ctx.currentTime;
      osc.type = "sine";
      // Arpeggio C Major C4 -> E4 -> G4 -> C5
      osc.frequency.setValueAtTime(261.63, now);
      osc.frequency.setValueAtTime(329.63, now + 0.08);
      osc.frequency.setValueAtTime(392.00, now + 0.16);
      osc.frequency.setValueAtTime(523.25, now + 0.24);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      osc.start();
      osc.stop(now + 0.5);
    } else if (type === "fail") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(190, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.38);
      osc.start();
      osc.stop(ctx.currentTime + 0.38);
    }
  } catch (e) {
    console.warn("Audio Context blocked or not supported by browser constraints", e);
  }
};

const calculateScore = (hex1: string, hex2: string): number => {
  const parseHex = (h: string) => {
    let s = h.replace("#", "");
    if (s.length === 3) {
      s = s.split("").map(c => c + c).join("");
    }
    return {
      r: parseInt(s.slice(0, 2), 16) || 0,
      g: parseInt(s.slice(2, 4), 16) || 0,
      b: parseInt(s.slice(4, 6), 16) || 0,
    };
  };

  const c1 = parseHex(hex1);
  const c2 = parseHex(hex2);

  // Euclidean distance in 3D color Space
  const distance = Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );

  const maxDistance = 441.673; // sqrt(255^2 * 3)
  const linearPrecision = 1 - (distance / maxDistance);
  
  // Logarithmic reward curves for higher scores
  const score = Math.pow(linearPrecision, 1.4) * 10;
  return Math.max(0, Math.round(score * 100) / 100);
};

export default function App() {
  // Navigation tabs for mobile screen interface
  const [mobileTab, setMobileTab] = useState<"game" | "leaderboard">("game");

  // Game screen state
  const [gameState, setGameState] = useState<"welcome" | "playing" | "round_result" | "summary">("welcome");
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"todas" | "fácil" | "medio" | "difícil">("todas");
  
  // Audio state
  const [muted, setMuted] = useState(false);
  
  // Real-time Preview Mode (Easy mode vs memory mode)
  const [realtimePreview, setRealtimePreview] = useState(true);

  // Active round input state
  const [currentColor, setCurrentColor] = useState("#FFFFFF");
  const [hintRevealed, setHintRevealed] = useState(false);

  // Result overlay variables
  const [currentRoundScore, setCurrentRoundScore] = useState(0);
  
  // Save score state
  const [playerName, setPlayerName] = useState("");
  const [scoreSaved, setScoreSaved] = useState(false);

  // Stats persisting across sessions
  const [historicalAverage, setHistoricalAverage] = useState(9.45);
  const [currentStreak, setCurrentStreak] = useState(4);
  const [userLevel, setUserLevel] = useState(8);

  // Confetti particles generator
  const [confettiParticles, setConfettiParticles] = useState<{ id: number; r: number; g: number; b: number; x: number; y: number; s: number }[]>([]);

  // Clock state for the phone status bar
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format digital clock like a premium mobile layout e.g. "14:45"
  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  // Load stats from localStorage on mount
  useEffect(() => {
    try {
      const rawLocal = localStorage.getItem("toontone_leaderboard");
      if (rawLocal) {
        const parsed: ScoreEntry[] = JSON.parse(rawLocal);
        if (parsed.length > 0) {
          const sum = parsed.reduce((acc, curr) => acc + curr.score, 0);
          const avg = sum / parsed.length;
          setHistoricalAverage(Math.round(avg * 100) / 100);
          
          // Calculate a simulated streak count based on high scores (>= 8.5)
          let streak = 0;
          for (const entry of parsed) {
            if (entry.score >= 8.5) streak++;
            else break;
          }
          setCurrentStreak(streak > 0 ? streak + 2 : 3);
          setUserLevel(Math.min(25, parsed.length + 5));
        }
      }
    } catch (e) {
      console.warn("Could not read stats on mount", e);
    }
  }, [gameState]);

  // Trigger local sound action
  const triggerSound = (type: "click" | "submit" | "win" | "fail") => {
    playTone(type, muted);
  };

  // Launch a game match
  const startNewGame = () => {
    triggerSound("click");
    
    // Sort and filter characters
    let pool = [...CHARACTERS];
    if (selectedDifficulty !== "todas") {
      pool = pool.filter(c => c.difficulty === selectedDifficulty);
    }
    
    // Shuffle
    pool.sort(() => Math.random() - 0.5);
    
    // Take up to 5 rounds
    const selectedPool = pool.slice(0, 5);
    const initialRounds: GameRound[] = selectedPool.map(character => ({
      character,
      selectedColor: "#FFFFFF",
      score: null
    }));

    setRounds(initialRounds);
    setCurrentRoundIdx(0);
    setCurrentColor("#A7F3D0"); // Start with a nice pastel green rather than harsh white
    setHintRevealed(false);
    setScoreSaved(false);
    setMobileTab("game"); // Reset navigation focused screen to active game
    setGameState("playing");
  };

  const handleColorChange = (hex: string) => {
    setCurrentColor(hex);
  };

  const revealHint = () => {
    triggerSound("click");
    setHintRevealed(true);
  };

  const submitGuess = () => {
    const round = rounds[currentRoundIdx];
    const score = calculateScore(currentColor, round.character.targetColor);
    
    setCurrentRoundScore(score);

    // Update round stats
    const updatedRounds = [...rounds];
    updatedRounds[currentRoundIdx] = {
      ...round,
      selectedColor: currentColor,
      score
    };
    setRounds(updatedRounds);

    // Dynamic sounds and custom confetti for high precision
    if (score >= 9.2) {
      triggerSound("win");
      setCurrentStreak(prev => prev + 1);
      // Fire beautiful particles inside the viewport area
      const newParticles = Array.from({ length: 30 }).map((_, i) => ({
        id: Math.random() + i,
        r: Math.round(Math.random() * 255),
        g: Math.round(Math.random() * 255),
        b: Math.round(Math.random() * 255),
        x: Math.random() * 80 + 10, // percentage left bounds
        y: Math.random() * 30 + 50, // lower bounds
        s: Math.random() * 10 + 4   // size
      }));
      setConfettiParticles(newParticles);
      setTimeout(() => setConfettiParticles([]), 3000);
    } else {
      triggerSound("fail");
      if (score < 7.0) {
        setCurrentStreak(Math.max(0, currentStreak - 1));
      }
    }

    setGameState("round_result");
  };

  const nextRound = () => {
    triggerSound("click");
    if (currentRoundIdx + 1 < rounds.length) {
      setCurrentRoundIdx(currentRoundIdx + 1);
      setCurrentColor("#818CF8"); // different start color for diversity
      setHintRevealed(false);
      setGameState("playing");
    } else {
      setGameState("summary");
    }
  };

  const saveOverallScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    triggerSound("submit");
    
    const finalAverage = rounds.reduce((sum, r) => sum + (r.score || 0), 0) / rounds.length;

    const newLeaderboardEntry: ScoreEntry = {
      id: "score-" + Date.now(),
      name: playerName.trim(),
      score: Math.round(finalAverage * 100) / 100,
      characterId: rounds[0]?.character.id || "multi",
      characterName: `${rounds.length} Personajes`,
      userColor: rounds[0]?.selectedColor || "#FFF",
      targetColor: rounds[0]?.character.targetColor || "#FFF",
      date: new Date().toISOString()
    };

    const existingRaw = localStorage.getItem("toontone_leaderboard");
    let scores: ScoreEntry[] = [];
    if (existingRaw) {
      try {
        scores = JSON.parse(existingRaw);
      } catch (e) {
        console.error(e);
      }
    }

    scores.unshift(newLeaderboardEntry);
    localStorage.setItem("toontone_leaderboard", JSON.stringify(scores));
    setScoreSaved(true);
    
    // update state with freshly saved score immediately
    const sum = scores.reduce((acc, curr) => acc + curr.score, 0);
    setHistoricalAverage(Math.round((sum / scores.length) * 100) / 100);
  };

  const getAccuracyBadgeText = (score: number) => {
    if (score >= 9.7) return { text: "Excelente (Memory King)", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (score >= 9.2) return { text: "Excelente", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" };
    if (score >= 8.0) return { text: "Muy Bueno", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" };
    if (score >= 6.5) return { text: "Bueno", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    return { text: "Revisar", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
  };

  const activeRound: GameRound | undefined = rounds[currentRoundIdx];
  const averageAllTime = rounds.length > 0
    ? rounds.reduce((sum, r) => sum + (r.score || 0), 0) / rounds.length
    : 0;

  return (
    <div id="application-container" className="min-h-screen bg-[#080b13] text-white flex flex-col items-center justify-center font-sans selection:bg-indigo-500 p-0 md:p-4 select-none relative overflow-hidden">
      
      {/* Decorative environment background radial glow strictly on viewport */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2"></div>

      {/* Outer ambient decorative frame header (only displays on desktop sizes) */}
      <div className="hidden md:flex flex-col items-center gap-1.5 mb-5 pointer-events-none select-none text-center">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
          <span className="text-xs uppercase tracking-widest text-slate-400 font-black font-mono">Modo Móvil Activo</span>
        </div>
        <p className="text-[11px] text-slate-500">Usa el simulador táctil para jugar. Se adapta perfectamente al tacto real.</p>
      </div>

      {/* PHONE WRAPPER SIMULATOR: Native flow on small screens, physical phone chassis mock on desktop */}
      <div className="relative w-full max-w-[420px] h-[100dvh] sm:h-[840px] bg-[#0c101d] rounded-none sm:rounded-[56px] border-none sm:border-[11px] sm:border-slate-800 shadow-[0_22px_70px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden ring-4 ring-slate-900/35 shrink-0 self-center transition-all duration-300">
        
        {/* PHYSICAL HARDWARE NOTCH (Speaker slot & Camera lens mock) */}
        <div className="hidden sm:flex absolute top-0 inset-x-0 h-7 justify-center items-center z-50 pointer-events-none">
          <div className="w-36 h-5.5 bg-slate-950 rounded-b-[20px] flex items-center justify-center gap-2.5 px-3">
            {/* Hard speaker screen */}
            <div className="w-11 h-1 bg-zinc-800 rounded-full" />
            {/* Front Camera camera glass */}
            <div className="w-2.5 h-2.5 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center shadow-inner">
              <div className="w-1 h-1 bg-cyan-900 rounded-full opacity-70" />
            </div>
          </div>
        </div>

        {/* SIMULATED PHONE STATUS BAR */}
        <div className="h-10 w-full flex items-center justify-between px-6 bg-[#040813]/85 text-[12px] font-black text-slate-200 font-mono select-none shrink-0 border-b border-white/5 relative z-40">
          {/* Real-time Time */}
          <span className="font-sans font-extrabold text-xs tracking-tight text-slate-350">{formattedTime}</span>
          
          {/* Hardware Connection strength */}
          <div className="flex items-center gap-1.5 font-sans">
            <div className="flex items-end gap-0.5 h-2.5">
              <span className="w-0.75 h-1 bg-slate-300 rounded-2xs" />
              <span className="w-0.75 h-1.5 bg-slate-300 rounded-2xs" />
              <span className="w-0.75 h-2 bg-emerald-400 rounded-2xs" />
              <span className="w-0.75 h-2.5 bg-emerald-400 rounded-2xs" />
            </div>
            
            <span className="text-[8px] font-black tracking-widest text-[#10b981] bg-emerald-555/10 border border-emerald-500/20 px-1 py-0.25 rounded">5G</span>
            
            {/* Visual Battery charge */}
            <div className="flex items-center gap-0.5 border border-slate-500/60 rounded px-0.75 py-0.25 h-3">
              <div className="w-2.5 h-1.5 bg-emerald-400 rounded-3xs" />
              <div className="w-0.25 h-0.5 bg-slate-500" />
            </div>
          </div>
        </div>

        {/* MOBILE INSTANT ALERT CONFETTI */}
        <AnimatePresence>
          {confettiParticles.length > 0 && (
            <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
              {confettiParticles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 1, y: "800px", x: `${p.x}%`, rotate: 0 }}
                  animate={{ 
                    opacity: [1, 0.9, 0], 
                    y: "120px", 
                    x: `${p.x + (Math.random() * 30 - 15)}%`,
                    rotate: Math.random() * 360
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.2, ease: "easeOut" }}
                  className="absolute rounded-sm shadow-md"
                  style={{
                    width: `${p.s}px`,
                    height: `${p.s}px`,
                    backgroundColor: `rgb(${p.r}, ${p.g}, ${p.b})`,
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* IN-APP STATUS HEADER BAR Component */}
        <header className="h-15 w-full flex items-center justify-between px-5 bg-slate-900/60 border-b border-white/5 shrink-0 z-30 relative select-none">
          {/* Logo brand / Back button replacement */}
          <div 
            onClick={() => { triggerSound("click"); setGameState("welcome"); }}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <div className="w-7 h-7 bg-indigo-650 rounded-lg flex items-center justify-center transform group-hover:rotate-6 transition-all duration-300 shadow-md">
              <div className="w-4 h-4 border-2 border-white rounded-full"></div>
            </div>
            <h1 className="text-xl font-extrabold tracking-tighter italic uppercase text-slate-100">
              TOON<span className="text-indigo-400">TONE</span>
            </h1>
          </div>

          {/* User Score and Sound Toolbar */}
          <div className="flex items-center gap-2.5">
            {/* Score state stats */}
            <div className="bg-slate-950/60 px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1">
              <span className="text-[10px] font-black uppercase text-slate-400">AVG:</span>
              <span className="text-[11px] font-mono font-black text-emerald-400">{historicalAverage.toFixed(2)}</span>
            </div>

            {/* Micro sound toggler */}
            <button
              type="button"
              onClick={() => {
                setMuted(!muted);
                if (muted) playTone("click", false);
              }}
              className="p-1.5 bg-slate-800 border border-white/5 rounded-full text-slate-400 active:scale-90 cursor-pointer"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-450" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        </header>

        {/* INTERNAL APPLICATION VIEWPANEL viewport (Scrollable nested layer) */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col relative px-4.5 py-5 custom-scrollbar">

          {/* VIEW 1: WELCOME MOBILE CONTROLLER SCREEN */}
          {gameState === "welcome" && (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col justify-start gap-4 pb-4"
            >
              {/* COMPACT SWITCHABLE TAP PILL VIEW - Top level navigation inside Phone */}
              <div className="flex bg-slate-950 p-1 rounded-2xl border border-white/5 mb-2 select-none">
                <button
                  type="button"
                  onClick={() => { triggerSound("click"); setMobileTab("game"); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mobileTab === "game"
                      ? "bg-indigo-600 text-white shadow font-black"
                      : "text-slate-400 hover:text-slate-205"
                  }`}
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  JUGAR
                </button>
                <button
                  type="button"
                  onClick={() => { triggerSound("click"); setMobileTab("leaderboard"); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mobileTab === "leaderboard"
                      ? "bg-indigo-600 text-white shadow font-black"
                      : "text-slate-400 hover:text-slate-205"
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  RÉCORDS
                </button>
              </div>

              {mobileTab === "game" ? (
                /* Interactive game config panel layout */
                <div className="flex flex-col gap-4">
                  {/* Neon promo label */}
                  <div className="bg-gradient-to-r from-indigo-900/40 to-sky-950/30 p-5 rounded-3xl border border-indigo-500/15 flex flex-col gap-2 relative overflow-hidden">
                    <span className="text-[10px] uppercase font-mono font-black text-indigo-400 tracking-wider">
                      ✨ ¡DESAFÍO EXCLUSIVO!
                    </span>
                    <h3 className="text-xl font-extrabold text-white leading-tight">
                      Reconstruye el color de tu infancia.
                    </h3>
                    <p className="text-slate-300 text-xs leading-normal">
                      Los toons han perdido su color original. Modula con precisión la paleta para conseguir afinidad perfecta.
                    </p>
                  </div>

                  {/* Series miniature hype previews */}
                  <div className="flex gap-2.5 items-center bg-slate-900/30 p-3 rounded-2xl border border-white/5 justify-around">
                    <div className="flex flex-col items-center">
                      <span className="text-lg">🤖</span>
                      <span className="text-[9px] font-mono text-slate-400">Dexter</span>
                    </div>
                    <span className="text-slate-700 font-extrabold text-xs">•</span>
                    <div className="flex flex-col items-center">
                      <span className="text-lg">🧚‍♀️</span>
                      <span className="text-[9px] font-mono text-slate-400">Padrinos</span>
                    </div>
                    <span className="text-slate-700 font-extrabold text-xs">•</span>
                    <div className="flex flex-col items-center">
                      <span className="text-lg">🍭</span>
                      <span className="text-[9px] font-mono text-slate-400">Burbuja</span>
                    </div>
                    <span className="text-slate-700 font-extrabold text-xs">•</span>
                    <div className="flex flex-col items-center">
                      <span className="text-lg">💀</span>
                      <span className="text-[9px] font-mono text-slate-400">Grim</span>
                    </div>
                  </div>

                  {/* Difficulty choices */}
                  <div className="bg-slate-950/60 p-4.5 rounded-[24px] border border-white/5 flex flex-col gap-3">
                    <span className="text-[10px] uppercase text-slate-400 font-extrabold tracking-widest font-mono text-center">
                      FILTRAR CONTENIDO DE LA PARTIDA:
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {(["todas", "fácil", "medio", "difícil"] as const).map((difficulty) => (
                        <button
                          key={difficulty}
                          type="button"
                          onClick={() => { triggerSound("click"); setSelectedDifficulty(difficulty); }}
                          className={`py-2 rounded-xl border uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                            selectedDifficulty === difficulty
                              ? "bg-indigo-600 text-white border-indigo-400 shadow-md font-black"
                              : "bg-slate-900/50 border-white/5 text-slate-400 hover:text-slate-205"
                          }`}
                        >
                          {difficulty}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 justify-center text-[10px] text-slate-400 font-mono mt-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Racha actual de victorias: <strong>{currentStreak}</strong></span>
                    </div>
                  </div>

                  {/* Tap design play button */}
                  <button
                    type="button"
                    onClick={startNewGame}
                    className="w-full py-4.5 rounded-[24px] bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base uppercase tracking-widest shadow-[0_6px_0_rgb(49,46,129)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Play className="w-4 h-4 fill-current text-white animate-pulse" />
                    ¡INICIAR PARTIDA!
                  </button>
                </div>
              ) : (
                /* Leaderboard renders smoothly inside mobile screen view */
                <Leaderboard />
              )}
            </motion.div>
          )}

          {/* VIEW 2: ACTIVE GAMEPLAY CONTROLS */}
          {gameState === "playing" && activeRound && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col justify-between gap-4 pb-2"
            >
              {/* Play state HUD */}
              <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase text-indigo-300 font-extrabold">
                    Ronda {currentRoundIdx + 1} de {rounds.length}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold tracking-tight">
                    {activeRound.character.series}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerSound("click");
                      setRealtimePreview(!realtimePreview);
                    }}
                    className="text-[9px] uppercase font-bold py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                  >
                    {realtimePreview ? "Fácil" : "Pro"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("¿Seguro que quieres retirarte?")) {
                        triggerSound("click");
                        setGameState("welcome");
                      }
                    }}
                    className="p-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded text-rose-450 text-[9px] uppercase font-black tracking-wider px-2"
                  >
                    Salir
                  </button>
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${((currentRoundIdx) / rounds.length) * 100}%` }}
                />
              </div>

              {/* Character drawing space */}
              <div className="bg-slate-950/40 p-4 rounded-3xl border border-white/5 flex flex-col items-center relative overflow-hidden shrink-0">
                
                {/* Simulated grayscale character block */}
                <div className="w-full max-w-[170px] aspect-square flex items-center justify-center relative p-1">
                  <div className="absolute inset-0 bg-indigo-500/5 rounded-full filter blur-xl -z-10" />
                  <ToonRenderer 
                    characterId={activeRound.character.id} 
                    userColor={currentColor} 
                    showOriginal={false} 
                    isMasked={realtimePreview} 
                  />
                </div>

                {/* Subtitle Zone key and prompt */}
                <div className="text-center w-full mt-2.5">
                  <span className="text-[10px] uppercase font-mono font-black py-0.5 px-2 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded">
                    Zona: {activeRound.character.part}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1.5 leading-none">
                    {activeRound.character.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 lines-clamp-2 max-w-xs mx-auto leading-relaxed">
                    {activeRound.character.description}
                  </p>
                </div>
              </div>

              {/* Snug Color Selector */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <ColorPicker color={currentColor} onChange={handleColorChange} />

                {/* Hints and Submits triggers */}
                <div className="w-full flex flex-col gap-2.5">
                  <AnimatePresence mode="wait">
                    {hintRevealed ? (
                      <motion.div
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-sky-550/10 border border-sky-400/20 rounded-xl p-2.5 text-[11px] text-sky-300 flex items-start gap-1.5 max-w-sm mx-auto shadow-inner"
                      >
                        <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{activeRound.character.hint}</span>
                      </motion.div>
                    ) : (
                      <button
                        type="button"
                        onClick={revealHint}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-black font-mono tracking-wider mx-auto hover:underline flex items-center gap-1 cursor-pointer justify-center py-0.5"
                      >
                        <HelpCircle className="w-3 h-3 text-indigo-450" />
                        ¿MOSTRAR PISTA DE COLOR?
                      </button>
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={submitGuess}
                    className="w-full py-4 px-6 rounded-[24px] bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-sm uppercase tracking-widest shadow-[0_5px_0_rgb(30,27,75)] active:translate-y-0.5 active:shadow-none transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4.5 h-4.5 text-white stroke-[3px]" />
                    VERIFICAR TONO
                  </button>
                </div>
              </div>

            </motion.div>
          )}

          {/* VIEW 3: ACTIVE ROUND RESULTS MODAL */}
          {gameState === "round_result" && activeRound && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col justify-start gap-4 pb-2"
            >
              <div className="text-center">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-slate-950/60 text-slate-400 px-3 py-1 rounded-full border border-white/5">
                  VEREDICTO DE PRECISIÓN
                </span>
                
                <h3 className="text-xl font-black text-white leading-tight mt-2.5">
                  {currentRoundScore >= 9.7 ? (
                    <span className="text-emerald-400 uppercase italic">⭐ ¡Precisión Absoluta!</span>
                  ) : currentRoundScore >= 9.2 ? (
                    <span className="text-emerald-400 uppercase">✨ ¡Increíble!</span>
                  ) : currentRoundScore >= 8.0 ? (
                    <span className="text-indigo-400">👍 ¡Buen Ojo!</span>
                  ) : currentRoundScore >= 6.5 ? (
                    <span className="text-amber-400">⚡ Aceptable</span>
                  ) : (
                    <span className="text-rose-400">❌ Muy Distante</span>
                  )}
                </h3>
              </div>

              {/* Unified gauge dial */}
              <div className="relative w-32 h-32 rounded-full bg-slate-950/80 flex flex-col items-center justify-center border-4 border-slate-800 shadow-inner mx-auto">
                <span className="text-[9px] uppercase font-mono text-slate-450 font-bold">AFINIDAD</span>
                <span className="text-3xl font-black font-mono tracking-tighter text-emerald-400 my-0.25">
                  {currentRoundScore.toFixed(2)}
                </span>
                <span className="text-[9px] font-mono text-slate-500">de 10.00 pts</span>
              </div>

              {/* Circular Color Chips Match */}
              <div className="flex items-center gap-4 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 max-w-sm mx-auto w-full justify-around shadow-inner">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] uppercase text-slate-450 font-bold font-mono">Tuyo</span>
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-slate-950 shadow ring-2 ring-white/10"
                    style={{ backgroundColor: activeRound.selectedColor }}
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-300">
                    {activeRound.selectedColor}
                  </span>
                </div>

                <div className="flex flex-col items-center text-slate-600 font-mono text-[10px]">
                  <span>vs</span>
                  <span className="text-[8px] uppercase">{(currentRoundScore * 10).toFixed(0)}%</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] uppercase text-slate-450 font-bold font-mono">Objetivo</span>
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-slate-950 shadow ring-2 ring-indigo-500/20"
                    style={{ backgroundColor: activeRound.character.targetColor }}
                  />
                  <span className="text-[10px] font-mono font-bold text-indigo-400">
                    {activeRound.character.targetColor}
                  </span>
                </div>
              </div>

              {/* Side-by-side Avatar validation preview renders snuggly */}
              <div className="flex flex-col gap-2 items-center bg-slate-950/40 p-3 rounded-2xl border border-white/5 max-w-xs mx-auto">
                <span className="text-[8px] uppercase text-slate-500 font-black tracking-widest">Resultado Visual (Tuyo vs Real)</span>
                <div className="flex gap-4 items-center justify-center">
                  <div className="w-18 h-18 p-1 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-center">
                    <ToonRenderer characterId={activeRound.character.id} userColor={activeRound.selectedColor} showOriginal={false} isMasked={true} />
                  </div>
                  <div className="w-18 h-18 p-1 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-center scale-105 ring-2 ring-indigo-505/10">
                    <ToonRenderer characterId={activeRound.character.id} userColor="" showOriginal={true} isMasked={false} />
                  </div>
                </div>
              </div>

              {/* Action forward footer */}
              <button
                type="button"
                onClick={nextRound}
                className="w-full py-4 rounded-[20px] bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs uppercase tracking-widest shadow-[0_5px_0_rgb(30,27,75)] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1 cursor-pointer mt-auto"
              >
                <span>{currentRoundIdx + 1 < rounds.length ? "Siguiente Dibujo" : "Ver Reporte Maestro"}</span>
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </motion.div>
          )}

          {/* VIEW 4: FINAL RETROSPECTIVE GAME SUMMARY */}
          {gameState === "summary" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col justify-start gap-4 pb-2"
            >
              <div className="bg-slate-950/60 p-5 rounded-[28px] border border-white/5 flex flex-col gap-3 relative overflow-hidden text-center sm:text-left">
                <span className="text-[9px] font-mono tracking-widest uppercase text-indigo-400 font-extrabold">
                  REPORTE FINAL COMPLETO
                </span>
                
                <h3 className="text-xl font-black text-white leading-none">Precisión Cromática</h3>

                {/* Score panel info */}
                <div className="flex flex-col items-center justify-center py-2 gap-1.5">
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 w-28 border border-white/5">
                    <span className="text-[9px] uppercase font-mono text-slate-450 font-bold">AVG SCORE</span>
                    <span className="text-2xl font-black text-indigo-400 font-mono my-0.25">
                      {averageAllTime.toFixed(2)}
                    </span>
                    <span className="text-[8px] text-slate-550 font-mono">de 10.00 pts</span>
                  </div>

                  <p className="text-slate-350 text-[11px] leading-normal max-w-xs">
                    ¡Has completado las {rounds.length} ilustraciones! Tu índice de afinidad final es del <strong>{(averageAllTime * 10).toFixed(1)}%</strong>.
                  </p>
                  
                  <div className="inline-flex bg-emerald-500/10 text-emerald-400 text-[10px] px-2.5 py-1 rounded border border-emerald-500/20 font-extrabold uppercase mt-0.5">
                    🏅 Rango: {averageAllTime >= 9.5 ? "Ojo de Dios" : averageAllTime >= 8.6 ? "Restaurador" : "Aficionado"}
                  </div>
                </div>

                {/* Local score registration */}
                {!scoreSaved ? (
                  <form onSubmit={saveOverallScore} className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-300 flex items-center gap-1.5 self-center uppercase tracking-wider">
                      <Bookmark className="w-3 h-3 text-indigo-400" />
                      Registrar en el Leaderboard
                    </span>
                    <div className="flex flex-col gap-2">
                      <input
                        id="save-player-name-input"
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Ingresa tu alias..."
                        maxLength={12}
                        required
                        className="bg-slate-900 border border-white/10 px-3 py-2 rounded-lg text-xs outline-none text-slate-200 placeholder-slate-550 font-bold"
                      />
                      <button
                        type="submit"
                        className="py-2 px-4 bg-indigo-650 hover:bg-indigo-650 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                      >
                        Enviar
                        <ArrowUpRight className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-emerald-500/15 border border-emerald-500/20 p-2.5 rounded-xl text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 justify-center">
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>¡Puntuación guardada localmente!</span>
                  </div>
                )}
              </div>

              {/* Mini Scrollable details per toon */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase text-slate-450 font-black tracking-widest px-1">
                  Resumen de Rondas:
                </span>
                
                {/* Scroll container strictly height constrained for phone viewport */}
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 select-none custom-scrollbar shadow-inner">
                  {rounds.map((round, index) => {
                    const rating = getAccuracyBadgeText(round.score || 0);
                    return (
                      <div 
                        key={round.character.id}
                        className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Mini render avatar */}
                          <div className="w-8 h-8 rounded bg-slate-950 border border-white/5 p-0.5 flex items-center justify-center shrink-0">
                            <ToonRenderer characterId={round.character.id} userColor="" showOriginal={true} isMasked={false} />
                          </div>

                          <div className="flex flex-col">
                            <span className="text-[10px] font-extrabold text-[#94a3b8] leading-none">
                              {round.character.name}
                            </span>
                            <span className="text-[8px] text-slate-450 truncate mt-0.5">
                              {round.character.part}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            <div className="w-3 h-3 rounded-full border border-slate-950" style={{ backgroundColor: round.selectedColor }} />
                            <div className="w-3 h-3 rounded-full border border-slate-950" style={{ backgroundColor: round.character.targetColor }} />
                          </div>
                          <span className="text-xs font-mono font-black text-indigo-400">
                            {(round.score || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Retry loop */}
              <button
                type="button"
                onClick={() => { triggerSound("click"); setGameState("welcome"); }}
                className="py-3.5 rounded-[20px] bg-indigo-650 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest text-center shadow-[0_5px_0_rgb(30,27,75)] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-auto"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white" />
                REINICIAR O CAMBIAR FILTRO
              </button>
            </motion.div>
          )}

        </div>

        {/* SWIPE HOME INDICATOR LINE (Simulated iOS/Modern bottom handle indicator) */}
        <div className="h-6 w-full bg-slate-950/80 flex items-center justify-center shrink-0 border-t border-white/5 relative z-30 select-none">
          <div 
            onClick={() => { triggerSound("click"); setGameState("welcome"); }}
            className="w-28 h-1 bg-white/35 rounded-full cursor-pointer hover:bg-white/50 active:scale-95 transition-all"
            title="Volver al Inicio" 
          />
        </div>

      </div>

    </div>
  );
}
