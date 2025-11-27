// components/GameBoard.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { GameState, Position, MoveHint, PieceColor } from "@/types/game";
import { gameApi } from "@/lib/api";
import { parseHints, isSamePos } from "@/lib/utils";
import BoardSquare from "./BoardSquare";
import { Loader2, AlertTriangle, Trophy } from "lucide-react";

interface GameBoardProps {
  gameId: string;
}

export default function GameBoard({ gameId }: GameBoardProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  
  // State Interaksi
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [availableHints, setAvailableHints] = useState<MoveHint[]>([]);
  const [validDestinations, setValidDestinations] = useState<Position[]>([]);

  const fetchBoard = useCallback(async () => {
    try {
      const data = await gameApi.getBoard(gameId);
      setGameState(data);
    } catch (err) {
      console.error("Failed to load board", err);
    }
  }, [gameId]);

  // Initial Load
  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  // Load Hints saat giliran aktif
  useEffect(() => {
    const loadHints = async () => {
      if (gameState?.status === "Play") {
        try {
          const rawHints = await gameApi.getHints(gameId);
          const parsed = parseHints(rawHints);
          setAvailableHints(parsed);
        } catch (err) {
          console.error(err);
        }
      }
    };
    loadHints();
  }, [gameState, gameId]); // Re-run saat gameState berubah

  // Handle Click
  const handleSquareClick = async (x: number, y: number) => {
    if (!gameState || gameState.status !== "Play") return;
    

    // --- FIX UTAMA: Akses Array Board menggunakan [Y][X] bukan [X][Y] ---
    const cell = gameState.board[y][x]; 
    const clickedPos = { x, y };
    
    // Logic A: Select Bidak Sendiri
    // Cek apakah user klik bidak yang warnanya sesuai giliran
    const isPieceColorMatch = cell.piece?.color === (gameState.currentColor === "Black" ? PieceColor.Black : PieceColor.Red);

    if (cell.piece && isPieceColorMatch) {
      // Jika sedang Double Jump, validasi bidak yang boleh dipilih
      // (Opsional: bisa ditambah logic strict di sini)
      
      setSelectedPos(clickedPos);
      
      // Filter destinasi hanya untuk bidak ini
      const movesForThisPiece = availableHints.filter(h => isSamePos(h.from, clickedPos));
      setValidDestinations(movesForThisPiece.map(h => h.to));
      return;
    }

    // Logic B: Move ke Kotak Kosong
    const isDestinationValid = validDestinations.some(dest => isSamePos(dest, clickedPos));
    
    if (selectedPos && !cell.piece && isDestinationValid) {
      await executeMove(selectedPos, clickedPos);
    }
  };

  const executeMove = async (from: Position, to: Position) => {
    setLoading(true);
    try {
      await gameApi.makeMove(gameId, from.x, from.y, to.x, to.y);
      // Reset seleksi lokal
      setSelectedPos(null);
      setValidDestinations([]);
      // Refresh data dari server
      await fetchBoard();
    } catch (err) {
      alert("Gerakan gagal! Cek aturan main.");
    } finally {
      setLoading(false);
    }
  };
console.log(gameState);
  if (!gameState) return <div className="p-10 text-center text-stone-500">Loading Arena...</div>;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto p-4">
      
      {/* HUD */}
      <div className="flex justify-between items-center w-full bg-white/80 backdrop-blur p-4 rounded-xl shadow-sm border border-stone-200">
        <div className="flex items-center gap-3">
          <span className="text-stone-500 font-medium">Turn:</span>
          <span className={`px-3 py-1 rounded-full font-bold text-white ${gameState.currentColor === 'Black' ? 'bg-slate-900' : 'bg-red-600'}`}>
            
            {gameState.currentPlayer}
          </span>
        </div>
        {gameState.isDoubleJumpActive && (
          <div className="flex items-center gap-2 text-amber-600 font-bold animate-pulse">
            <AlertTriangle size={18} />
            Double Jump Required!
          </div>
        )}
      </div>

      {/* BOARD GRID */}
      <div className="relative select-none">
        {loading && (
          <div className="absolute inset-0 z-20 bg-white/50 flex items-center justify-center rounded">
            <Loader2 className="w-10 h-10 animate-spin text-stone-600" />
          </div>
        )}

        {/* Render Board: Ingat map row = Y, map col = X */}
        <div className="grid grid-cols-8 gap-0 border-8 border-[#5c3a21] rounded shadow-2xl w-[350px] md:w-[500px] h-[350px] md:h-[500px]">
          {gameState.board.map((row, y) => (
            row.map((cell, x) => {
              const isDest = validDestinations.some(d => isSamePos(d, { x, y }));
              const isSelected = selectedPos ? isSamePos(selectedPos, { x, y }) : false;

              return (
                <BoardSquare
                  key={`${x}-${y}`}
                  cell={cell}
                  isValidMove={isDest}
                  isSelected={isSelected}
                  onClick={() => handleSquareClick(x, y)}
                />
              );
            })
          ))}
        </div>
      </div>

      {/* WIN MODAL */}
     
s
      {gameState.status !== "Play" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center border-4 border-yellow-400">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-extrabold text-slate-800 mb-1">GAME OVER</h2>
            <p className="text-lg text-slate-600 mb-6">
              Winner: <span className="font-bold text-green-600">{gameState.currentColor === "Red" ? "Black" : "Red"}</span>
              
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}