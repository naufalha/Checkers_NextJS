// components/BoardSquare.tsx
import React from 'react';
import { Cell, PieceColor, PieceType } from '@/types/game';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';

interface BoardSquareProps {
  cell: Cell;
  isValidMove: boolean; // Apakah kotak ini adalah tujuan valid?
  isSelected: boolean;  // Apakah kotak ini sedang diklik user?
  onClick: () => void;
}

const BoardSquare: React.FC<BoardSquareProps> = ({ cell, isValidMove, isSelected, onClick }) => {
  const { x, y } = cell.position;
  
  // Logika Warna Papan (Selang-seling)
  // Genap + Genap = Genap (Putih/Cream)
  // Ganjil + Genap = Ganjil (Hitam/Coklat - Playable)
  const isDarkSquare = (x + y) % 2 !== 0;

  // Styling Base
  const squareClass = cn(
    "w-full h-full aspect-square flex items-center justify-center relative cursor-pointer transition-all duration-200",
    isDarkSquare ? "bg-[#8B4513]" : "bg-[#F5DEB3]", // Brown & Wheat colors
    isValidMove && "ring-4 ring-inset ring-green-400 bg-green-800/40" // Highlight Hint
  );

  // Render Bidak
  const renderPiece = () => {
    if (!cell.piece) return null;

    const isBlack = cell.piece.color === PieceColor.Black;
    const isKing = cell.piece.typePiece === PieceType.King;

    return (
      <div
        className={cn(
          "w-[80%] h-[80%] rounded-full shadow-lg flex items-center justify-center transition-transform",
          isBlack 
            ? "bg-slate-900 border-2 border-slate-600" 
            : "bg-red-600 border-2 border-red-800",
          isSelected && "scale-110 ring-4 ring-yellow-400", // Highlight Selection
          "hover:scale-105"
        )}
      >
        {/* Indikator King */}
        {isKing && <Crown className={cn("w-3/5 h-3/5", isBlack ? "text-yellow-500" : "text-yellow-300")} />}
        
        {/* Texture detail (inner circle) */}
        {!isKing && <div className="w-[60%] h-[60%] rounded-full border border-white/20" />}
      </div>
    );
  };

  return (
    <div className={squareClass} onClick={onClick}>
      {/* Koordinat Debug (Opsional, matikan untuk production) */}
      <span className="absolute top-0 left-1 text-[8px] opacity-30 pointer-events-none text-white font-mono">
        {x},{y}
      </span>
      
      {/* Visual Bidak atau Dot Hint untuk kotak kosong */}
      {cell.piece ? renderPiece() : (isValidMove && <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse" />)}
    </div>
  );
};

export default BoardSquare;