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
import { AudioManager } from "./utils/AudioManager";

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

  // Daily guess challenge states
  const [dailyPlayedScore, setDailyPlayedScore] = useState<number | null>(null);
  const [isDailyGame, setIsDailyGame] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Helper date and card selectors
  const getDailyDateKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };

  const getDailyCharacter = (): Character => {
    const key = getDailyDateKey();
    const sum = key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = sum % CHARACTERS.length;
    return CHARACTERS[index];
  };

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

  // Game Modes details (Maraton 5 rounds, Speedrun timer, Zen workshop)
  const [gameMode, setGameMode] = useState<"marathon" | "speedrun" | "zen">("marathon");
  const [timeLeft, setTimeLeft] = useState(65);
  const [speedrunCompletions, setSpeedrunCompletions] = useState(0);
  const [floatingBonus, setFloatingBonus] = useState<string | null>(null);
  const [zenRevealFormula, setZenRevealFormula] = useState(false);

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

  // Sync initial mute status and preload sound buffers early
  useEffect(() => {
    const audio = AudioManager.getInstance();
    audio.setMute(muted);
    audio.preload();
    return () => {
      audio.stopAmbient();
    };
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
      const todayKey = getDailyDateKey();
      const savedDaily = localStorage.getItem("toontone_daily_" + todayKey);
      if (savedDaily) {
        setDailyPlayedScore(parseFloat(savedDaily));
      } else {
        setDailyPlayedScore(null);
      }

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
    const audio = AudioManager.getInstance();
    audio.playSfx(type);
    audio.startAmbient(); // Smoothly starts looping ambient track on first user click
  };

  // Speedrun Countdown clock tracker
  useEffect(() => {
    if (gameState !== "playing" || gameMode !== "speedrun") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerSound("fail");
          setGameState("summary");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, gameMode]);

  // Launch a game match
  const startNewGame = () => {
    triggerSound("click");
    setGameMode("marathon");
    
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
    setIsDailyGame(false);
    setScoreSaved(false);
    setMobileTab("game"); // Reset navigation focused screen to active game
    setGameState("playing");
  };

  const startDailyGame = () => {
    triggerSound("click");
    setGameMode("marathon");
    const todayChar = getDailyCharacter();
    const round: GameRound = {
      character: todayChar,
      selectedColor: "#FFFFFF",
      score: null
    };

    setRounds([round]);
    setCurrentRoundIdx(0);
    setCurrentColor("#F9A8D4"); // unique starting pastel pink for daily theme
    setHintRevealed(false);
    setIsDailyGame(true);
    setScoreSaved(false);
    setMobileTab("game");
    setGameState("playing");
  };

  const startSpeedrunGame = () => {
    triggerSound("click");
    setGameMode("speedrun");
    setTimeLeft(65);
    setSpeedrunCompletions(0);

    // Shuffle all characters
    let pool = [...CHARACTERS].sort(() => Math.random() - 0.5);
    const initialRounds: GameRound[] = pool.map(character => ({
      character,
      selectedColor: "#FFFFFF",
      score: null
    }));

    setRounds(initialRounds);
    setCurrentRoundIdx(0);
    setCurrentColor("#FBCFE8");
    setHintRevealed(false);
    setIsDailyGame(false);
    setScoreSaved(false);
    setMobileTab("game");
    setGameState("playing");
  };

  const startZenGame = (characterId: string) => {
    triggerSound("click");
    setGameMode("zen");
    setZenRevealFormula(false);

    const character = CHARACTERS.find(c => c.id === characterId) || CHARACTERS[0];
    const round: GameRound = {
      character,
      selectedColor: "#FFFFFF",
      score: null
    };

    setRounds([round]);
    setCurrentRoundIdx(0);
    setCurrentColor("#FFEAA7");
    setHintRevealed(false);
    setIsDailyGame(false);
    setScoreSaved(false);
    setMobileTab("game");
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

    // Persist daily score
    if (isDailyGame) {
      const todayKey = getDailyDateKey();
      localStorage.setItem("toontone_daily_" + todayKey, score.toFixed(2));
      setDailyPlayedScore(score);
    }

    // Interactive countdown mechanics for Speedrun Game Mode
    if (gameMode === "speedrun") {
      if (score >= 8.2) {
        setSpeedrunCompletions(prev => prev + 1);
        setTimeLeft(prev => Math.min(99, prev + 12));
        setFloatingBonus("+12s 🚀");
        setTimeout(() => setFloatingBonus(null), 1800);
      } else if (score < 6.5) {
        setTimeLeft(prev => Math.max(0, prev - 6));
        setFloatingBonus("-6s ⚠️");
        setTimeout(() => setFloatingBonus(null), 1800);
      } else {
        setFloatingBonus("OK!");
        setTimeout(() => setFloatingBonus(null), 1200);
      }
    }

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
      if (score < 7.0 && gameMode !== "speedrun") {
        setCurrentStreak(Math.max(0, currentStreak - 1));
      }
    }

    setGameState("round_result");
  };

  const nextRound = () => {
    triggerSound("click");
    let nextIdx = currentRoundIdx + 1;
    
    // In Speedrun, if we hit the limit, double up the rounds list endlesly
    if (gameMode === "speedrun" && nextIdx >= rounds.length) {
      let pool = [...CHARACTERS].sort(() => Math.random() - 0.5);
      const extraRounds = pool.map(character => ({
        character,
        selectedColor: "#FFFFFF",
        score: null
      }));
      setRounds(prev => [...prev, ...extraRounds]);
    }

    if (nextIdx < rounds.length || gameMode === "speedrun") {
      setCurrentRoundIdx(nextIdx);
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
    
    const completed = rounds.filter(r => r.score !== null);
    const finalAverage = completed.length > 0 
      ? completed.reduce((sum, r) => sum + (r.score || 0), 0) / completed.length 
      : 0;

    let modeSuffix = gameMode === "speedrun"
      ? `Relámpago⏱️ (${speedrunCompletions} aciertos)`
      : gameMode === "zen"
        ? "Taller Zen Sandbox 🌸"
        : `${rounds.length} Personajes`;

    const newLeaderboardEntry: ScoreEntry = {
      id: "score-" + Date.now(),
      name: playerName.trim(),
      score: Math.round(finalAverage * 100) / 100,
      characterId: rounds[0]?.character.id || "multi",
      characterName: modeSuffix,
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
    if (score >= 9.2) return { text: "Excelente", color: "text-indigo-400 bg-indigo-500/10 border-indigo-505/20" };
    if (score >= 8.0) return { text: "Muy Bueno", color: "text-sky-400 bg-sky-500/10 border-sky-555/20" };
    if (score >= 6.5) return { text: "Bueno", color: "text-amber-400 bg-amber-500/10 border-amber-555/20" };
    return { text: "Revisar", color: "text-rose-400 bg-rose-500/10 border-rose-555/20" };
  };

  const activeRound: GameRound | undefined = rounds[currentRoundIdx];
  const completedRounds = rounds.filter(r => r.score !== null);
  const averageAllTime = completedRounds.length > 0
    ? completedRounds.reduce((sum, r) => sum + (r.score || 0), 0) / completedRounds.length
    : 0;

  return (
    <div id="application-container" className="min-h-screen bg-[#FFFBEA] bg-[radial-gradient(#fed7aa_1.5px,transparent_1.5px)] [background-size:24px_24px] text-zinc-900 flex flex-col items-center justify-center font-sans selection:bg-amber-200 p-0 md:p-4 select-none relative overflow-hidden">
      
      {/* Decorative environment background bubbles */}
      <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-[#FFEAA7]/40 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-[#FF7675]/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Outer ambient decorative frame header (only displays on desktop sizes) */}
      <div className="hidden md:flex flex-col items-center gap-1.5 mb-5 pointer-events-none select-none text-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#00B894] border border-zinc-950 rounded-full animate-ping shrink-0" />
          <span className="text-xs uppercase tracking-widest text-zinc-700 font-extrabold font-mono">Simulador Toon Tone</span>
        </div>
        <p className="text-[11px] text-zinc-500 font-bold">Ajusta el color de los personajes animados con el simulador táctil.</p>
      </div>

      {/* PHONE WRAPPER SIMULATOR: Native flow on small screens, physical phone chassis mock on desktop */}
      <div className="relative w-full max-w-[420px] h-[100dvh] sm:h-[840px] bg-[#EEF2F6] rounded-none sm:rounded-[42px] border-none sm:border-[10px] sm:border-zinc-950 shadow-[12px_12px_0_0_#18181b] flex flex-col overflow-hidden shrink-0 self-center transition-all duration-300">
        
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
        <div className="h-10 w-full flex items-center justify-between px-6 bg-[#FFEAA7] text-[12px] font-black text-zinc-900 font-mono select-none shrink-0 border-b-[3px] border-zinc-950 relative z-40">
          {/* Real-time Time */}
          <span className="font-sans font-[900] text-xs tracking-tight text-zinc-950">{formattedTime}</span>
          
          {/* Hardware Connection strength */}
          <div className="flex items-center gap-1.5 font-sans">
            <div className="flex items-end gap-0.5 h-2.5">
              <span className="w-0.75 h-1 bg-zinc-900 rounded-2xs" />
              <span className="w-0.75 h-1.5 bg-zinc-900 rounded-2xs" />
              <span className="w-0.75 h-2 bg-zinc-900 rounded-2xs" />
              <span className="w-0.75 h-2.5 bg-zinc-900 rounded-2xs" />
            </div>
            
            <span className="text-[8px] font-black tracking-widest text-zinc-950 bg-white border-2 border-zinc-950 px-1.5 py-0.25 rounded-md shadow-[1px_1px_0_0_#000]">5G</span>
            
            {/* Visual Battery charge */}
            <div className="flex items-center gap-0.5 border-2 border-zinc-950 rounded px-0.75 py-0.25 h-3.5 bg-white">
              <div className="w-2.5 h-1.5 bg-[#00B894] rounded-3xs" />
              <div className="w-0.25 h-0.5 bg-zinc-900" />
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
        <header className="h-16 w-full flex items-center justify-between px-5 bg-[#FF7675]/10 border-b-[3px] border-zinc-950 shrink-0 z-30 relative select-none">
          {/* Logo brand / Back button replacement */}
          <div 
            onClick={() => { triggerSound("click"); setGameState("welcome"); }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-[#FF2E93] border-2 border-zinc-950 rounded-xl flex items-center justify-center transform group-hover:rotate-6 transition-all duration-300 shadow-[2px_2px_0_0_#000]">
              <div className="w-3.5 h-3.5 border-2 border-white rounded-full bg-amber-350"></div>
            </div>
            <h1 className="text-xl font-[900] tracking-tighter italic uppercase text-zinc-950 drop-shadow-[1px_1px_0_#FFF]">
              TOON<span className="text-[#FF2E93]">TONE</span>
            </h1>
          </div>

          {/* User Score and Sound Toolbar */}
          <div className="flex items-center gap-2.5">
            {/* Score state stats */}
            <div className="bg-[#FFEAA7] px-3 py-1 rounded-full border-2 border-zinc-950 shadow-[2px_2px_0_0_#000] flex items-center gap-1">
              <span className="text-[10px] font-black uppercase text-zinc-700">AVG:</span>
              <span className="text-[11px] font-mono font-black text-zinc-950">{historicalAverage.toFixed(2)}</span>
            </div>

            {/* Micro sound toggler */}
            <button
              type="button"
              onClick={() => {
                const nextMuted = !muted;
                setMuted(nextMuted);
                AudioManager.getInstance().setMute(nextMuted);
                if (muted) {
                  // Toggling sound ON
                  AudioManager.getInstance().playSfx("click");
                  AudioManager.getInstance().startAmbient();
                } else {
                  // Toggling sound OFF
                  AudioManager.getInstance().stopAmbient();
                }
              }}
              className="p-1.5 bg-white border-2 border-zinc-950 rounded-full text-zinc-900 active:scale-90 shadow-[2px_2px_0_0_#000] cursor-pointer"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-[#00B894]" />}
            </button>
          </div>
        </header>

        {/* INTERNAL APPLICATION VIEWPANEL viewport (Scrollable nested layer) */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col relative px-4.5 py-5 custom-scrollbar bg-[#FFFDF5]">

          {/* VIEW 1: WELCOME MOBILE CONTROLLER SCREEN */}
          {gameState === "welcome" && (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col justify-start gap-4 pb-4"
            >
              {/* COMPACT SWITCHABLE TAP PILL VIEW - Top level navigation inside Phone */}
              <div className="flex bg-[#EBF3FA] p-1.5 rounded-[20px] border-[3px] border-zinc-950 shadow-[3px_3px_0_0_#000] mb-3 select-none">
                <button
                  type="button"
                  onClick={() => { triggerSound("click"); setMobileTab("game"); }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mobileTab === "game"
                      ? "bg-[#FF7675] text-white border-2 border-zinc-950 shadow-[2px_2px_0_0_#000]"
                      : "text-zinc-650 hover:text-zinc-900 font-bold"
                  }`}
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  JUGAR
                </button>
                <button
                  type="button"
                  onClick={() => { triggerSound("click"); setMobileTab("leaderboard"); }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mobileTab === "leaderboard"
                      ? "bg-[#6C5CE7] text-white border-2 border-zinc-950 shadow-[2px_2px_0_0_#000]"
                      : "text-zinc-650 hover:text-zinc-900 font-bold"
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-300" />
                  RÉCORDS
                </button>
              </div>

              {mobileTab === "game" ? (
                /* Interactive game config panel layout */
                <div className="flex flex-col gap-4">
                  {/* Neon promo label */}
                  <div className="bg-[#EBF3FA] p-5 rounded-[24px] border-[3px] border-zinc-950 shadow-[4px_4px_0_0_#18181b] flex flex-col gap-1.5 relative overflow-hidden">
                    <span className="text-[10px] uppercase font-mono font-black text-[#6C5CE7] tracking-wider">
                      ✨ ¡DESAFÍO EXCLUSIVO!
                    </span>
                    <h3 className="text-xl font-[900] text-zinc-955 leading-tight">
                      Reconstruye el color de tu infancia.
                    </h3>
                    <p className="text-zinc-700 text-xs leading-normal font-bold">
                      Los toons han perdido su color original. Modula con precisión la paleta para conseguir afinidad perfecta.
                    </p>
                  </div>

                  {/* Desafío Diario Premium Card Panel */}
                  <div className="bg-[#FFF0F6] p-5 rounded-[28px] border-[3px] border-zinc-950 flex flex-col gap-3 relative overflow-hidden shadow-[4px_4px_0_0_#18181b] select-none text-zinc-950">
                    {/* Decorative ambient background badge inside card */}
                    <div className="absolute top-2.5 right-2.5 bg-[#FF2E93]/10 border-2 border-zinc-950 text-[#FF2E93] rounded-full px-2 py-0.5 text-[8px] font-black uppercase font-mono tracking-wider flex items-center gap-1 shadow-[1.5px_1.5px_0_0_#000]">
                      <Sparkles className="w-2.5 h-2.5 text-[#FF2E93]" />
                      EXCLUSIVO DÍA
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono font-black text-[#FF2E93] tracking-widest uppercase">
                        DESAFÍO DIARIO (DAILY GUESS)
                      </span>
                      <h4 className="text-base font-[900] text-zinc-950 flex items-center gap-1.5 leading-none">
                        <Award className="w-4 h-4 text-amber-500 fill-current shrink-0" />
                        Adivinanza Cromática
                      </h4>
                    </div>

                    <div className="bg-white p-3 rounded-2xl flex items-center gap-3.5 border-2 border-zinc-950 shadow-[2px_2px_0_0_#000]">
                      {/* Grayscale / masked preview avatar of the daily toon */}
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border-2 border-zinc-950 flex items-center justify-center relative p-0.5 shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-pink-500/5 rounded-full filter blur" />
                        <ToonRenderer characterId={getDailyCharacter().id} userColor="" showOriginal={true} isMasked={true} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="block text-xs font-[900] text-zinc-950 truncate leading-none">
                          {getDailyCharacter().name}
                        </span>
                        <span className="block text-[9px] text-zinc-650 font-extrabold mt-1 truncate uppercase tracking-tight">
                          {getDailyCharacter().series} • Zona: {getDailyCharacter().part}
                        </span>
                      </div>
                    </div>

                    {dailyPlayedScore !== null ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between bg-[#E8F8F5] border-2 border-zinc-950 rounded-xl px-3 py-2 shadow-[2px_2px_0_0_#000]">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-mono text-zinc-600 font-bold uppercase leading-none">PUNTUACIÓN DE HOY</span>
                            <span className="text-xs font-black text-zinc-950 font-mono mt-0.5">
                              {dailyPlayedScore.toFixed(2)} / 10.00
                            </span>
                          </div>
                          <span className="text-[8px] font-black uppercase text-white bg-[#00B894] px-2.5 py-0.5 rounded border-2 border-[#00d2aa] shadow-[1px_1px_0_0_#000]">
                            Completado
                          </span>
                        </div>

                        {/* Copy to clipboard feedback */}
                        <button
                          type="button"
                          onClick={() => {
                            const todayKey = getDailyDateKey();
                            const todayChar = getDailyCharacter();
                            const emojiMap = (score: number) => {
                              if (score >= 9.7) return "🎯👑💎";
                              if (score >= 9.2) return "🎨🔥✨";
                              if (score >= 8.0) return "👀⭐👍";
                              if (score >= 6.5) return "⚡🍀";
                              return "🌪️💔";
                            };
                            const text = `ToonTone Desafío Diario 🎨\nFecha: ${todayKey}\nPersonaje: ${todayChar.name}\nZona: ${todayChar.part}\nPrecisión: ${dailyPlayedScore.toFixed(2)}/10.00 ${emojiMap(dailyPlayedScore)}\n\n¡Modula el color de tus toons! 📲`;
                            navigator.clipboard.writeText(text);
                            setCopiedShareLink(true);
                            setTimeout(() => setCopiedShareLink(false), 2000);
                          }}
                          className="w-full py-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4dbf] border-2 border-zinc-950 text-white font-extrabold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 active:translate-y-0.5 active:shadow-none shadow-[2px_2px_0_0_#000]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-zinc-200" />
                          {copiedShareLink ? "¡COPIADO!" : "COMPARTIR RESULTADO"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startDailyGame}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF7675] to-[#FF2E93] border-2 border-zinc-950 hover:from-pink-400 hover:to-indigo-550 text-white font-[900] text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3 h-3 fill-current text-white" />
                        ¡INTENTAR DESAFÍO DE HOY!
                      </button>
                    )}
                  </div>

                  {/* Series miniature hype previews */}
                  <div className="flex gap-2.5 items-center bg-[#FFFBEA] p-3 rounded-2xl border-2 border-zinc-950 justify-around shadow-[2px_2px_0_0_#000]">
                    <div className="flex flex-col items-center">
                      <span className="text-lg">🤖</span>
                      <span className="text-[9px] font-mono text-zinc-650 font-black">Dexter</span>
                    </div>
                    <span className="text-zinc-400 font-extrabold text-xs">•</span>
                    <div className="flex flex-col items-center">
                      <span className="text-lg">🧚‍♀️</span>
                      <span className="text-[9px] font-mono text-zinc-650 font-black">Padrinos</span>
                    </div>
                    <span className="text-zinc-400 font-extrabold text-xs">•</span>
                    <div className="flex flex-col items-center">
                      <span className="text-lg">🍭</span>
                      <span className="text-[9px] font-mono text-zinc-650 font-black">Burbuja</span>
                    </div>
                    <span className="text-zinc-400 font-extrabold text-xs">•</span>
                    <div className="flex flex-col items-center">
                      <span className="text-lg">💀</span>
                      <span className="text-[9px] font-mono text-zinc-650 font-black">Grim</span>
                    </div>
                  </div>

                  {/* Game Mode Selector tab and description */}
                  <div className="bg-white p-4 rounded-[24px] border-[3px] border-zinc-950 flex flex-col gap-3 shadow-[4px_4px_0_0_#18181b]">
                    <span className="text-[10px] uppercase text-zinc-500 font-mono font-black tracking-widest text-center">
                      SELECCIONA EL MODO DE JUEGO:
                    </span>
                    
                    <div className="flex bg-[#EBF3FA] p-1 rounded-xl border-2 border-zinc-950 text-[9px] uppercase tracking-widest select-none">
                      {(["marathon", "speedrun", "zen"] as const).map((mode) => {
                        const modeNames = {
                          marathon: "🏆 Maratón",
                          speedrun: "⚡ Relámpago",
                          zen: "🌸 Taller Zen",
                        };
                        const isSelected = gameMode === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => { triggerSound("click"); setGameMode(mode); }}
                            className={`flex-1 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#FF7675] text-white border-2 border-zinc-950 shadow-[1.5px_1.5px_0_0_#000]"
                                : "text-zinc-500 hover:text-zinc-950"
                            }`}
                          >
                            {modeNames[mode]}
                          </button>
                        );
                      })}
                    </div>

                    {gameMode === "marathon" && (
                      <div className="flex flex-col gap-2 mt-0.5">
                        <p className="text-[10.5px] text-zinc-700 leading-normal font-bold">
                          Completa una ronda de 5 personajes con filtros de dificultad. Tu precisión acumulada se publicará en el Leaderboard.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                          {(["todas", "fácil", "medio", "difícil"] as const).map((difficulty) => {
                            const styleMap = {
                              todas: "bg-[#74b9ff]",
                              fácil: "bg-[#55efc4]",
                              medio: "bg-[#ffeaa7]",
                              difícil: "bg-[#ff7675]",
                            };
                            const isSelected = selectedDifficulty === difficulty;
                            return (
                              <button
                                key={difficulty}
                                type="button"
                                onClick={() => { triggerSound("click"); setSelectedDifficulty(difficulty); }}
                                className={`py-1.5 rounded-lg border-2 border-zinc-950 uppercase tracking-wider font-extrabold text-[9px] transition-all cursor-pointer ${
                                  isSelected
                                    ? `${styleMap[difficulty]} text-zinc-950 shadow-[1.5px_1.5px_0_0_#000] font-black`
                                    : "bg-zinc-50 border-zinc-950/20 text-zinc-500 hover:text-zinc-950"
                                }`}
                              >
                                {difficulty}
                              </button>
                            );
                          })}
                        </div>
                        
                        <div className="flex items-center gap-2 justify-center text-[10px] text-zinc-650 font-bold mt-1">
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-current animate-pulse" />
                          <span>Racha de victorias: <strong className="text-zinc-950 font-black">{currentStreak}</strong></span>
                        </div>

                        <button
                          type="button"
                          onClick={startNewGame}
                          className="w-full py-4.5 rounded-[20px] bg-[#00B894] hover:bg-[#00d2aa] border-2 border-zinc-950 text-white font-[900] text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                        >
                          <Play className="w-3.5 h-3.5 fill-current text-white" />
                          ¡INICIAR MARATÓN COMPLETO!
                        </button>
                      </div>
                    )}

                    {gameMode === "speedrun" && (
                      <div className="flex flex-col gap-2 mt-0.5">
                        <p className="text-[10.5px] text-zinc-700 leading-normal font-bold bg-[#FFF5F5] p-2.5 rounded-xl border-2 border-[#FF7675]/30">
                          ⏱️ <strong>Adrenalina Pura</strong>: ¡Tienes 65 segundos!
                          <br />• Acierto preciso (≥8.2): <strong>+12 segundos</strong> ⚡
                          <br />• Desvío burdo (&lt;6.5): <strong>-6 segundos</strong> ⚠️
                          Adivina de forma continua tantos toons como puedas antes de que el reloj marque cero.
                        </p>
                        <button
                          type="button"
                          onClick={startSpeedrunGame}
                          className="w-full py-4.5 rounded-[20px] bg-[#FF7675] hover:bg-[#ff5d5a] border-2 border-zinc-950 text-white font-[900] text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                        >
                          <Flame className="w-3.5 h-3.5 fill-current text-white animate-spin" style={{ animationDuration: '3s' }} />
                          ¡INICIAR CONTRARELOJ!
                        </button>
                      </div>
                    )}

                    {gameMode === "zen" && (
                      <div className="flex flex-col gap-2 mt-0.5">
                        <p className="text-[10.5px] text-zinc-750 leading-normal font-bold">
                          Presiona cualquier ilustración a continuación para calibrar sus colores en vivo. Sin límites de tiempo ni puntuaciones; entrena tu memoria y afina tu ojo visual.
                        </p>
                        
                        <div className="grid grid-cols-3 gap-2 mt-1.5 max-h-48 overflow-y-auto pr-1 select-none custom-scrollbar">
                          {CHARACTERS.map((char) => (
                            <button
                              key={char.id}
                              type="button"
                              onClick={() => startZenGame(char.id)}
                              className="bg-white hover:bg-[#FFEAA7]/10 border-2 border-zinc-950 p-2 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-[2.5px_2.5px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                            >
                              <div className="w-8 h-8 flex items-center justify-center mb-1 bg-[#EEF2F6] rounded-lg border border-zinc-250 p-0.5 shrink-0">
                                <ToonRenderer characterId={char.id} userColor="" showOriginal={true} isMasked={false} />
                              </div>
                              <span className="text-[8px] font-black leading-none text-zinc-950 truncate w-full">
                                {char.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Leaderboard renders smoothly inside mobile screen view */
                <Leaderboard />
              )}

              {/* Sponsored Content Block */}
              <div id="sponsored-ad-card" className="mt-4 p-4 bg-[#FFF5F5] hover:bg-[#FFEAEB] border-2 border-zinc-950 rounded-2xl shadow-[3px_3px_0_0_#000] flex flex-col gap-2 transition-all cursor-pointer select-text shrink-0">
                <div className="flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 bg-[#FF7675] border border-zinc-950 rounded-full animate-ping" />
                  <span className="text-[9px] font-black uppercase text-zinc-500 font-mono tracking-widest">Enlace Patrocinado:</span>
                </div>
                <a 
                  id="sponsored-offer-link"
                  href="https://www.effectivecpmnetwork.com/cq2vq861uq?key=1b9adba0f8a61874cfcf3163e3898e01"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-black text-[#FF2E93] hover:text-[#e01d7a] hover:underline flex items-center justify-center gap-1 text-center leading-snug"
                >
                  🎁 ¡Consigue Skins de Toons y Premios Exclusivos Aquí! 🚀
                </a>
                <div className="text-[8.5px] text-center font-bold text-zinc-500">
                  Visita nuestro socio verificado para desbloquear paletas especiales de color.
                </div>
              </div>
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
              <div className="flex justify-between items-center bg-white p-3 rounded-2xl border-[3px] border-zinc-950 shadow-[2px_2px_0_0_#000]">
                <div className="flex flex-col">
                  {gameMode === "speedrun" ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono leading-none bg-[#FF7675] text-white px-2 py-0.75 rounded border-2 border-zinc-950 shadow-[1px_1px_0_0_#000] font-black animate-pulse">
                        ⏱️ {timeLeft}s
                      </span>
                      <span className="text-[10px] font-mono leading-none bg-[#FFEAA7] text-zinc-950 px-2 py-0.75 rounded border-2 border-zinc-950 shadow-[1px_1px_0_0_#000] font-black">
                        🎯 {speedrunCompletions}
                      </span>
                    </div>
                  ) : gameMode === "zen" ? (
                    <span className="text-[10px] font-mono uppercase text-[#00B894] font-black flex items-center gap-1">
                      🔬 SINFONÍA ZEN
                    </span>
                  ) : isDailyGame ? (
                    <span className="text-[10px] font-mono uppercase text-[#FF2E93] font-black flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#FF2E93] animate-spin" style={{ animationDuration: '3s' }} />
                      Desafío Diario
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono uppercase text-[#6C5CE7] font-[900]">
                      Ronda {currentRoundIdx + 1} de {rounds.length}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-650 font-extrabold tracking-tight mt-1">
                    {gameMode === "zen" ? "Laboratorio de Tono" : activeRound.character.series}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {gameMode !== "zen" && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerSound("click");
                        setRealtimePreview(!realtimePreview);
                      }}
                      className="text-[9px] uppercase font-black py-1 px-3.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-zinc-950 transition-all border-2 border-zinc-950 shadow-[1.5px_1.5px_0_0_#000] active:translate-y-0.5 active:shadow-none"
                    >
                      {realtimePreview ? "Fácil" : "Pro"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("¿Seguro que quieres retirarte de la pantalla de calibración?")) {
                        triggerSound("click");
                        setGameState("welcome");
                      }
                    }}
                    className="p-1 bg-[#FF7675]/10 hover:bg-[#FF7675]/20 border-2 border-[#FF7675] rounded-lg text-[#FF7675] text-[9px] uppercase font-black tracking-wider px-2"
                  >
                    Salir
                  </button>
                </div>
              </div>

              {/* Progress bar visual */}
              {gameMode !== "zen" && gameMode !== "speedrun" && (
                <div className="w-full bg-zinc-200 rounded-full h-2 border-2 border-zinc-950 overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-[#00B894] transition-all duration-300"
                    style={{ width: `${((currentRoundIdx) / rounds.length) * 100}%` }}
                  />
                </div>
              )}

              {/* Character drawing space */}
              <div className="bg-[#FFEAA7]/30 p-4 rounded-3xl border-[3px] border-zinc-950 flex flex-col items-center relative overflow-hidden shrink-0 shadow-[4px_4px_0_0_#000]">
                
                {/* Floating Retro-Arcade Popups inside canvas */}
                <AnimatePresence>
                  {floatingBonus && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0, y: 15 }}
                      animate={{ scale: 1.25, opacity: 1, y: -10 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 px-4 py-2 rounded-2xl border-[3.5px] border-zinc-950 shadow-[3px_3px_0_0_#000] text-sm font-black uppercase tracking-widest ${
                        floatingBonus.includes("+") || floatingBonus.includes("OK")
                          ? "bg-[#55efc4] text-zinc-950"
                          : "bg-[#ff7675] text-white"
                      }`}
                    >
                      {floatingBonus}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Simulated grayscale character block */}
                <div className="w-full max-w-[170px] aspect-square flex items-center justify-center relative p-1">
                  <div className="absolute inset-0 bg-pink-500/5 rounded-full filter blur-xl -z-10" />
                  <ToonRenderer 
                    characterId={activeRound.character.id} 
                    userColor={currentColor} 
                    showOriginal={false} 
                    isMasked={gameMode === "zen" ? false : realtimePreview} 
                  />
                </div>

                {/* Subtitle Zone key and prompt */}
                <div className="text-center w-full mt-2.5">
                  <span className="text-[10px] uppercase font-mono font-black py-1 px-2.5 bg-white text-zinc-950 border-2 border-zinc-950 rounded-lg shadow-[1.5px_1.5px_0_0_#000]">
                    Zona: {activeRound.character.part}
                  </span>
                  <h3 className="text-lg font-[900] text-zinc-950 mt-2 leading-none">
                    {activeRound.character.name}
                  </h3>
                  <p className="text-[11px] text-zinc-700 font-bold mt-1.5 lines-clamp-2 max-w-xs mx-auto leading-relaxed">
                    {activeRound.character.description}
                  </p>
                </div>
              </div>

              {/* Snug Color Selector */}
              <div className="flex flex-col items-center gap-3 shrink-0 col-picker-container">
                <ColorPicker color={currentColor} onChange={handleColorChange} />

                {/* Hints and Submits triggers */}
                <div className="w-full flex flex-col gap-2.5">
                  {gameMode === "zen" ? (
                    <div className="w-full flex flex-col gap-3.5 bg-[#FFFDF5] p-4 rounded-2xl border-2 border-zinc-950 shadow-[3px_3px_0_0_#000] text-zinc-950 select-none text-center">
                      {/* Live score meter */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono">Afinidad en vivo:</span>
                        <div className="flex items-center gap-1 bg-white border-2 border-zinc-950 px-2.5 py-1 rounded-xl shadow-[1.5px_1.5px_0_0_#000]">
                          <span className="font-mono text-xs font-black text-[#00B894]">
                            {calculateScore(currentColor, activeRound.character.targetColor).toFixed(2)} / 10.00 pts
                          </span>
                        </div>
                      </div>

                      {/* Diagnostic level indicator based on accuracy */}
                      <p className="text-[10.5px] text-center font-black uppercase text-zinc-950">
                        {(() => {
                          const s = calculateScore(currentColor, activeRound.character.targetColor);
                          if (s >= 9.7) return <span className="text-[#00B894] block animate-bounce">💎 ¡Premio Mayor! (Afinidad Plena)</span>;
                          if (s >= 9.2) return <span className="text-[#00B894] block">✨ Espectacular Calibración</span>;
                          if (s >= 8.0) return <span className="text-[#6C5CE7] block">👍 Bastante Cerca</span>;
                          if (s >= 6.5) return <span className="text-amber-550 block">⚡ Desvío Sutil</span>;
                          return <span className="text-rose-500 block">🌫️ Tono Desenfocado</span>;
                        })()}
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            triggerSound("click");
                            setCurrentColor(activeRound.character.targetColor);
                          }}
                          className="py-2 px-2.5 bg-[#00B894] hover:bg-[#00d2aa] text-white text-[10px] uppercase font-black tracking-wider rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center justify-center gap-1"
                          title="Auto-establece el color original del toon para estudiar su fórmula auténtica"
                        >
                          🧪 Autocompletar
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            triggerSound("click");
                            setZenRevealFormula(!zenRevealFormula);
                          }}
                          className="py-2 px-2.5 bg-[#FFEAA7] hover:bg-amber-300 text-zinc-950 text-[10px] uppercase font-black tracking-wider rounded-xl border-2 border-[#18181b] shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center justify-center gap-1"
                        >
                          🔬 {zenRevealFormula ? "Ocultar" : "Revelar Hex"}
                        </button>
                      </div>

                      <AnimatePresence>
                        {zenRevealFormula && (
                          <motion.div
                            initial={{ opacity: 0, scaleY: 0.9 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            className="bg-zinc-950 text-[#55efc4] p-2.5 rounded-lg border-2 border-zinc-900 font-mono text-[9px] flex flex-col gap-1 text-left shadow-inner select-text"
                          >
                            <span className="font-extrabold uppercase text-white tracking-widest text-[8.5px] opacity-75">Sintonizador Cromático:</span>
                            <span className="flex justify-between"><span>ACTUAL:</span> <strong className="text-white">{currentColor}</strong></span>
                            <span className="flex justify-between"><span>OBJETIVO:</span> <strong className="text-[#FFEAA7]">{activeRound.character.targetColor}</strong></span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        type="button"
                        onClick={() => {
                          triggerSound("click");
                          setGameState("welcome");
                        }}
                        className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border-2 border-rose-500 hover:border-rose-600 text-rose-600 hover:text-rose-700 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none"
                      >
                        Abandonar Taller Zen
                      </button>
                    </div>
                  ) : (
                    <>
                      <AnimatePresence mode="wait">
                        {hintRevealed ? (
                          <motion.div
                            initial={{ opacity: 0, y: 3 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#EBF3FA] border-2 border-zinc-950 rounded-xl p-2.5 text-[11px] text-[#6C5CE7] font-bold flex items-start gap-1.5 max-w-sm mx-auto shadow-[2px_2px_0_0_#000]"
                          >
                            <Info className="w-3.5 h-3.5 text-zinc-950 shrink-0 mt-0.5" />
                            <span className="leading-snug">{activeRound.character.hint}</span>
                          </motion.div>
                        ) : (
                          <button
                            type="button"
                            onClick={revealHint}
                            className="text-[10px] text-[#6C5CE7] hover:text-[#5b4dbf] font-black font-mono tracking-wider mx-auto hover:underline flex items-center gap-1 cursor-pointer justify-center py-0.5"
                          >
                            <HelpCircle className="w-3 h-3 text-[#6C5CE7]" />
                            ¿MOSTRAR PISTA DE COLOR?
                          </button>
                        )}
                      </AnimatePresence>

                      <button
                        type="button"
                        onClick={submitGuess}
                        className="w-full py-4 px-6 rounded-[24px] bg-[#6C5CE7] hover:bg-[#5b4dbf] border-2 border-zinc-950 text-white font-[900] text-sm uppercase tracking-widest shadow-[4px_4px_0_0_#18181b] active:translate-y-0.5 active:shadow-none transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4.5 h-4.5 text-white stroke-[3px]" />
                        VERIFICAR TONO
                      </button>
                    </>
                  )}
                </div>
              </div>

            </motion.div>
          )}
          {gameState === "round_result" && activeRound && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col justify-start gap-4 pb-2 text-zinc-950"
            >
              <div className="text-center">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-[#EBF3FA] text-zinc-700 px-3 py-1.5 rounded-full border-2 border-zinc-950 shadow-[1.5px_1.5px_0_0_#000] font-bold">
                  VEREDICTO DE PRECISIÓN
                </span>
                
                <h3 className="text-xl font-[900] text-zinc-950 leading-tight mt-3">
                  {currentRoundScore >= 9.7 ? (
                    <span className="text-[#00B894] uppercase italic drop-shadow-[1px_1px_0_#FFF]">⭐ ¡Precisión Absoluta!</span>
                  ) : currentRoundScore >= 9.2 ? (
                    <span className="text-[#00B894] uppercase drop-shadow-[1px_1px_0_#FFF]">✨ ¡Increíble!</span>
                  ) : currentRoundScore >= 8.0 ? (
                    <span className="text-[#6C5CE7]">👍 ¡Buen Ojo!</span>
                  ) : currentRoundScore >= 6.5 ? (
                    <span className="text-amber-500">⚡ Aceptable</span>
                  ) : (
                    <span className="text-rose-500 font-extrabold">❌ Muy Distante</span>
                  )}
                </h3>
              </div>

              {/* Unified gauge dial */}
              <div className="relative w-32 h-32 rounded-full bg-white flex flex-col items-center justify-center border-[3px] border-zinc-950 shadow-[4px_4px_0_0_#18181b] mx-auto">
                <span className="text-[9px] uppercase font-mono text-zinc-500 font-extrabold">AFINIDAD</span>
                <span className="text-3xl font-[900] font-mono tracking-tighter text-[#00B894] my-0.25">
                  {currentRoundScore.toFixed(2)}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 font-bold">de 10.00 pts</span>
              </div>

              {/* Circular Color Chips Match */}
              <div className="flex items-center gap-4 bg-[#FFFBEA] p-3.5 rounded-2xl border-2 border-zinc-950 max-w-sm mx-auto w-full justify-around shadow-[3px_3px_0_0_#000]">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] uppercase text-zinc-500 font-black font-mono">Tuyo</span>
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-zinc-950 shadow-[1px_1px_0_0_#000]"
                    style={{ backgroundColor: activeRound.selectedColor }}
                  />
                  <span className="text-[10px] font-mono font-bold text-zinc-905">
                    {activeRound.selectedColor}
                  </span>
                </div>

                <div className="flex flex-col items-center text-zinc-500 font-mono text-[10px] font-bold">
                  <span>vs</span>
                  <span className="text-[8px] uppercase text-zinc-800 font-black">{(currentRoundScore * 10).toFixed(0)}%</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] uppercase text-zinc-500 font-black font-mono">Objetivo</span>
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-zinc-950 shadow-[1px_1px_0_0_#000]"
                    style={{ backgroundColor: activeRound.character.targetColor }}
                  />
                  <span className="text-[10px] font-mono font-bold text-[#FF2E93]">
                    {activeRound.character.targetColor}
                  </span>
                </div>
              </div>

              {/* Side-by-side Avatar validation preview renders snuggly */}
              <div className="flex flex-col gap-2 items-center bg-[#FFFFD5] p-3 rounded-2xl border-2 border-zinc-950 max-w-xs mx-auto shadow-[2px_2px_0_0_#000]">
                <span className="text-[8px] uppercase text-zinc-500 font-black tracking-widest">Resultado Visual (Tuyo vs Real)</span>
                <div className="flex gap-4 items-center justify-center">
                  <div className="w-18 h-18 p-1 bg-[#EEF2F6] rounded-xl border-2 border-zinc-950 flex items-center justify-center">
                    <ToonRenderer characterId={activeRound.character.id} userColor={activeRound.selectedColor} showOriginal={false} isMasked={true} />
                  </div>
                  <div className="w-18 h-18 p-1 bg-white rounded-xl border-2 border-zinc-950 flex items-center justify-center">
                    <ToonRenderer characterId={activeRound.character.id} userColor="" showOriginal={true} isMasked={false} />
                  </div>
                </div>
              </div>

              {/* Action forward footer */}
              <button
                type="button"
                onClick={nextRound}
                className="w-full py-4 rounded-[20px] bg-[#6C5CE7] hover:bg-[#5b4dbf] border-2 border-zinc-950 text-white font-[900] text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1 cursor-pointer mt-auto"
              >
                <span>{currentRoundIdx + 1 < rounds.length ? "Siguiente Dibujo" : (isDailyGame ? "Ver Reporte Diario" : "Ver Reporte Maestro")}</span>
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
              <div className="bg-[#FFFDF5] p-5 rounded-[28px] border-[3px] border-zinc-950 flex flex-col gap-3 relative overflow-hidden text-center sm:text-left shadow-[4px_4px_0_0_#000]">
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#FF2E93] font-black">
                  {gameMode === "speedrun"
                    ? "REPORTE CARRERA RELÁMPAGO ⏱️"
                    : isDailyGame
                      ? "REPORTE DESAFÍO DIARIO"
                      : "REPORTE FINAL COMPLETO"}
                </span>
                
                <h3 className="text-xl font-[900] text-zinc-950 leading-none">
                  {gameMode === "speedrun"
                    ? `¡Lograste ${speedrunCompletions} Aciertos!`
                    : isDailyGame
                      ? "Resultado del Día"
                      : "Precisión Cromática"}
                </h3>

                {/* Score panel info */}
                <div className="flex flex-col items-center justify-center py-2 gap-1.5 text-center">
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white w-28 border-2 border-zinc-950 shadow-[2px_2px_0_0_#000]">
                    <span className="text-[9px] uppercase font-mono text-zinc-500 font-extrabold">AVG SCORE</span>
                    <span className="text-2xl font-black text-[#00B894] font-mono my-0.25">
                      {averageAllTime.toFixed(2)}
                    </span>
                    <span className="text-[8px] text-zinc-500 font-mono">de 10.00 pts</span>
                  </div>

                  <p className="text-zinc-700 text-[11px] leading-normal max-w-xs font-bold my-1">
                    {gameMode === "speedrun" ? (
                      <>¡El tiempo expiró! Lograste restaurar el color de <strong>{speedrunCompletions}</strong> personajes con un índice promedio del <strong>{(averageAllTime * 10).toFixed(1)}%</strong>.</>
                    ) : isDailyGame ? (
                      <>¡Has completado el desafío diario para <strong>{rounds[0]?.character.name}</strong>! Tu precisión final es de <strong>{(averageAllTime * 10).toFixed(1)}%</strong>.</>
                    ) : (
                      <>¡Has completado las {rounds.length} rondas de forma exitosa! Tu índice de afinidad es del <strong>{(averageAllTime * 10).toFixed(1)}%</strong>.</>
                    )}
                  </p>
                  
                  <div className="inline-flex bg-[#FFEAA7] text-zinc-950 text-[10px] px-3 py-1 rounded-full border-2 border-zinc-950 font-black uppercase shadow-[1.5px_1.5px_0_0_#000]">
                    🏅 Rango: {averageAllTime >= 9.5 ? "Ojo de Dios" : averageAllTime >= 8.6 ? "Restaurador" : "Aficionado"}
                  </div>
                </div>

                {isDailyGame && (
                  <div className="flex flex-col gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const todayKey = getDailyDateKey();
                        const todayChar = getDailyCharacter();
                        const emojiMap = (score: number) => {
                          if (score >= 9.7) return "🎯👑💎";
                          if (score >= 9.2) return "🎨🔥✨";
                          if (score >= 8.0) return "👀⭐👍";
                          if (score >= 6.5) return "⚡🍀";
                          return "🌪️💔";
                        };
                        const text = `ToonTone Desafío Diario 🎨\nFecha: ${todayKey}\nPersonaje: ${todayChar.name}\nZona: ${todayChar.part}\nPrecisión: ${averageAllTime.toFixed(2)}/10.00 ${emojiMap(averageAllTime)}\n\n¡Modula el color de tus toons! 📲`;
                        navigator.clipboard.writeText(text);
                        setCopiedShareLink(true);
                        setTimeout(() => setCopiedShareLink(false), 2000);
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4dbf] border-2 border-zinc-950 text-white font-extrabold text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#000] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:translate-y-0.5 active:shadow-none"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-zinc-100" />
                      {copiedShareLink ? "¡COPIADO!" : "COMPARTIR RESULTADO"}
                    </button>
                  </div>
                )}

                {/* Local score registration */}
                {!scoreSaved ? (
                  <form onSubmit={saveOverallScore} className="bg-amber-50/50 p-4 rounded-2xl border-2 border-zinc-950 flex flex-col gap-2 mt-1 shadow-inner">
                    <span className="text-[10px] font-black text-zinc-800 flex items-center gap-1.5 self-center uppercase tracking-wider">
                      <Bookmark className="w-3.5 h-3.5 text-[#FF2E93]" />
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
                        className="bg-white border-2 border-zinc-950 px-3 py-2 rounded-lg text-xs outline-none text-zinc-950 placeholder-zinc-500 font-bold"
                      />
                      <button
                        type="submit"
                        className="py-2.5 px-4 bg-[#FF2E93] hover:bg-[#e01d7a] text-white text-[10px] font-black uppercase tracking-widest rounded-lg border-2 border-zinc-950 shadow-[2px_2px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                      >
                        Enviar
                        <ArrowUpRight className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-[#E8F8F5] border-2 border-zinc-950 p-2.5 rounded-xl text-[10px] text-[#00B894] font-black flex items-center gap-1.5 justify-center shadow-[1.5px_1.5px_0_0_#000]">
                    <Check className="w-3.5 h-3.5 shrink-0 text-[#00B894]" />
                    <span>¡Puntuación guardada localmente!</span>
                  </div>
                )}
              </div>

              {/* Mini Scrollable details per toon */}
              <div className="flex flex-col gap-2 bg-[#EEF2F6] p-3 rounded-2xl border-2 border-zinc-950 shadow-[3px_3px_0_0_#000]">
                <span className="text-[10px] uppercase text-zinc-700 font-black tracking-widest px-1">
                  Resumen de Rondas:
                </span>
                
                {/* Scroll container strictly height constrained for phone viewport */}
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 select-none custom-scrollbar">
                  {rounds.map((round, index) => {
                    const rating = getAccuracyBadgeText(round.score || 0);
                    return (
                      <div 
                        key={round.character.id}
                        className="bg-white p-2.5 rounded-xl border-2 border-zinc-950 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Mini render avatar */}
                          <div className="w-8 h-8 rounded-lg bg-[#FFEAA7]/10 border-2 border-zinc-950 p-0.5 flex items-center justify-center shrink-0">
                            <ToonRenderer characterId={round.character.id} userColor="" showOriginal={true} isMasked={false} />
                          </div>

                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-950 leading-none">
                              {round.character.name}
                            </span>
                            <span className="text-[8px] text-zinc-500 font-extrabold truncate mt-1">
                              {round.character.part}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-950 shadow" style={{ backgroundColor: round.selectedColor }} />
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-950 shadow" style={{ backgroundColor: round.character.targetColor }} />
                          </div>
                          <span className="text-xs font-mono font-black text-[#6C5CE7]">
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
                className="py-4 rounded-[20px] bg-[#6C5CE7] hover:bg-[#5b4dbf] border-2 border-zinc-950 text-white font-[900] text-xs uppercase tracking-widest text-center shadow-[4px_4px_0_0_#18181b] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-auto"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white" />
                REINICIAR O CAMBIAR FILTRO
              </button>
            </motion.div>
          )}

        </div>

        {/* SWIPE HOME INDICATOR LINE (Simulated iOS/Modern bottom handle indicator) */}
        <div className="h-6 w-full bg-[#FFEAA7] flex items-center justify-center shrink-0 border-t-[3px] border-zinc-950 relative z-30 select-none">
          <div 
            onClick={() => { triggerSound("click"); setGameState("welcome"); }}
            className="w-28 h-1.5 bg-zinc-950 rounded-full cursor-pointer hover:bg-zinc-800 active:scale-95 transition-all"
            title="Volver al Inicio" 
          />
        </div>

      </div>

    </div>
  );
}
