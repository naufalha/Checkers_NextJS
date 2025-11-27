// types/game.ts

// Koordinat 0-7 (0,0 adalah pojok kiri atas)
export type Position = {
  x: number;
  y: number;
};

// Enum dari Backend: 0 = Black, 1 = Red
export enum PieceColor {
  Black = 0,
  Red = 1,
}

// Enum dari Backend: 0 = Pawn, 1 = King
export enum PieceType {
  Pawn = 0,
  King = 1,
}

// Representasi Bidak
export interface Piece {
  color: PieceColor;
  typePiece: PieceType;
  position: Position;
}

// Representasi Kotak di Papan
export interface Cell {
  position: Position;
  piece: Piece | null; // Null jika kotak kosong
}

// Response utama dari endpoint GET /board
export interface GameState {
  board: Cell[][]; // Array 2D (8 baris x 8 kolom)
  currentPlayer: string; // Nama pemain
  currentColor: string; // "Black" atau "Red"
  isDoubleJumpActive: boolean; // Jika true, user TERKUNCI untuk melompat lagi
  status: "Play" | "Win" | "Draw";
}

// Helper type untuk parsing hints
export interface MoveHint {
  from: Position;
  to: Position;
  isCapture: boolean;
  originalString: string;
}