// types/game.ts

export type PieceColor = 'Black' | 'Red' | null;
export type GameStatus = 'Play' | 'Win' | 'Draw';

export interface BoardCell {
  x: number;
  y: number;
  occupant: {
    color: PieceColor;
    type: 'Man' | 'King';
  } | null;
}

export interface GameState {
  board: BoardCell[][]; // Asumsi API mengembalikan array 2D atau 1D yang kita mapping
  currentPlayer: PieceColor;
  status: GameStatus;
  isDoubleJumpActive: boolean;
  message?: string;
}

export interface MoveRequest {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}