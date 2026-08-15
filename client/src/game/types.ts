import type { Scene } from "@babylonjs/core/scene";

export type MatchStatus = "lobby" | "active" | "victory" | "defeat";

export type GameSnapshot = {
  status: MatchStatus;
  health: number;
  armor: number;
  ammo: number;
  reserveAmmo: number;
  eliminations: number;
  enemiesRemaining: number;
  zoneSeconds: number;
  zoneRadius: number;
  message: string;
  crateCollected: boolean;
};

export type GameHandle = {
  scene: Scene;
  startMatch: () => void;
  restart: () => void;
  setMoveInput: (x: number, y: number) => void;
  setAimInput: (value: number) => void;
  fire: () => void;
  jump: () => void;
  dispose: () => void;
};
