// types/game.ts

export type Position = {
  x: number;
  y: number;
};

// Urutan sesuai backend C# (0=Black, 1=Red)
export enum PieceColor {
  Black = 1,
  Red = 0,
}

export enum PieceType {
  Pawn = 0,
  King = 1,
}

export interface Piece {
  color: PieceColor;
  typePiece: PieceType;
  position: Position;
}

export interface Cell {
  position: Position;
  piece: Piece | null;
}

export interface GameState {
  board: Cell[][];
  currentPlayer: string;
  currentColor: string;
  isDoubleJumpActive: boolean;
  status: "Play" | "Win" | "Draw";
  // === UPDATE: Tambahkan field nama pemain (opsional) ===
  blackName?: string;
  redName?: string;
}

export interface MoveHintDto {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface MoveHint {
  from: Position;
  to: Position;
  isCapture: boolean;
  originalString?: string;
}