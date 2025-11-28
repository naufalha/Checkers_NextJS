// components/BoardSquare.tsx
import React from 'react';
import { Cell, PieceColor, PieceType } from '@/types/game';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';

interface BoardSquareProps {
  cell: Cell;
  isValidMove: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const BoardSquare: React.FC<BoardSquareProps> = ({ cell, isValidMove, isSelected, onClick }) => {
  const { x, y } = cell.position;
  
  // Papan catur: (x+y) ganjil adalah kotak gelap (tempat main)
  const isDarkSquare = (x + y) % 2 !== 0;

  return (
    <div 
      className={cn(
        "relative w-full h-full flex items-center justify-center",
        isDarkSquare ? "bg-[#734d32]" : "bg-[#e5cbb4]", // Coklat Tua & Muda
        isValidMove && "ring-inset ring-4 ring-green-400/70 cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Render Bidak jika ada */}
      {cell.piece && (
        <div className={cn(
          "w-[75%] h-[75%] rounded-full shadow-md flex items-center justify-center transition-transform duration-200",
          // LOGIC WARNA: 0 = Black (Slate), 1 = Red
          cell.piece.color === PieceColor.Black 
            ? "bg-slate-900 border-4 border-slate-700" 
            : "bg-red-600 border-4 border-red-800",
          
          isSelected && "ring-4 ring-yellow-400",
          // Jika King, kasih efek glow atau border emas tambahan
          cell.piece.typePiece === PieceType.King && "border-yellow-500"
        )}>
          {cell.piece.typePiece === PieceType.King && (
            <Crown className="w-3/5 h-3/5 text-yellow-400 drop-shadow-md" />
          )}
        </div>
      )}

      {/* Hint Dot untuk kotak kosong valid */}
      {!cell.piece && isValidMove && (
        <div className="w-4 h-4 bg-green-500 rounded-full opacity-50" />
      )}
    </div>
  );
};

export default BoardSquare;