export interface Character {
  id: string;
  name: string;
  part: string;
  series: string;
  targetColor: string; // hex string, e.g., "#458285"
  difficulty: "fácil" | "medio" | "difícil";
  hint: string;
  description: string;
}

export interface ScoreEntry {
  id: string;
  name: string;
  score: number; // e.g., 9.85
  characterId: string;
  characterName: string;
  userColor: string;
  targetColor: string;
  date: string;
}

export interface GameRound {
  character: Character;
  selectedColor: string;
  score: number | null;
}

export interface GameState {
  isPlaying: boolean;
  rounds: GameRound[];
  currentRoundIdx: number;
  totalScore: number;
  gameCompleted: boolean;
}
