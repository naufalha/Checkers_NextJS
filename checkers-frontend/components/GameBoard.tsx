// components/GameBoard.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GameState, Position, MoveHint, PieceColor } from "@/types/game";
import { gameApi } from "@/lib/api";
import { parseHints, isSamePos } from "@/lib/utils";
import BoardSquare from "./BoardSquare";
import { Loader2, AlertTriangle, Trophy, Pause, Play, RotateCcw, LogOut } from "lucide-react";

interface GameBoardProps {
  gameId: string;
}

export default function GameBoard({ gameId }: GameBoardProps) {
  const router = useRouter();
  
  // -- STATE --
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // Pause State
  
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [availableHints, setAvailableHints] = useState<MoveHint[]>([]);
  const [validDestinations, setValidDestinations] = useState<Position[]>([]);

  // -- FETCH DATA --
  const fetchBoard = useCallback(async () => {
    try {
      const data = await gameApi.getBoard(gameId);
      setGameState(data);
    } catch (err) {
      console.error("Failed to load board", err);
    }
  }, [gameId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  // -- LOAD HINTS --
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
  }, [gameState, gameId]);

  // -- HANDLERS --
  const handleSquareClick = async (x: number, y: number) => {
    // Prevent interaction if game is paused or not in play
    if (!gameState || gameState.status !== "Play" || isPaused) return;
    
    const cell = gameState.board[y][x]; 
    const clickedPos = { x, y };
    
    // Check if clicked piece belongs to current player
    const isPieceColorMatch = cell.piece?.color === (gameState.currentColor === "Black" ? PieceColor.Black : PieceColor.Red);

    // 1. Select Piece
    if (cell.piece && isPieceColorMatch) {
      setSelectedPos(clickedPos);
      const movesForThisPiece = availableHints.filter(h => isSamePos(h.from, clickedPos));
      setValidDestinations(movesForThisPiece.map(h => h.to));
      return;
    }

    // 2. Move Piece
    const isDestinationValid = validDestinations.some(dest => isSamePos(dest, clickedPos));
    
    if (selectedPos && !cell.piece && isDestinationValid) {
      await executeMove(selectedPos, clickedPos);
    }
  };

  const executeMove = async (from: Position, to: Position) => {
    setLoading(true);
    try {
      await gameApi.makeMove(gameId, from.x, from.y, to.x, to.y);
      setSelectedPos(null);
      setValidDestinations([]);
      await fetchBoard();
    } catch (err) {
      alert("Gerakan gagal! Cek aturan main.");
    } finally {
      setLoading(false);
    }
  };

  // -- RENDER LOADING --
  if (!gameState) return <div className="p-10 text-center text-stone-500">Loading Arena...</div>;

  // -- RENDER GAME --
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto p-4">
      
      {/* === HUD (HEADS UP DISPLAY) === */}
      <div className="flex justify-between items-center w-full bg-white/80 backdrop-blur p-4 rounded-xl shadow-sm border border-stone-200">
        
        {/* Player Turn Indicator */}
        <div className="flex items-center gap-3">
          <span className="text-stone-500 font-medium">Turn:</span>
          <span className={`px-3 py-1 rounded-full font-bold text-white ${gameState.currentColor === 'Black' ? 'bg-slate-900' : 'bg-red-600'}`}>
            {gameState.currentPlayer}
          </span>
        </div>

        {/* Status Icons & Pause Button */}
        <div className="flex items-center gap-4">
          {/* Double Jump Warning */}
          {gameState.isDoubleJumpActive && (
            <div className="flex items-center gap-2 text-amber-600 font-bold animate-pulse">
              <AlertTriangle size={18} />
              <span className="hidden sm:inline">Double Jump!</span>
            </div>
          )}

          {/* PAUSE BUTTON */}
          <button
            onClick={() => setIsPaused(true)}
            disabled={gameState.status !== "Play"}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition border border-slate-300 disabled:opacity-50"
            title="Pause Game"
          >
            <Pause size={20} />
          </button>
        </div>
      </div>

      {/* === BOARD GRID === */}
      <div className="relative select-none">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-white/50 flex items-center justify-center rounded">
            <Loader2 className="w-10 h-10 animate-spin text-stone-600" />
          </div>
        )}

        <div className="grid grid-cols-8 grid-rows-[repeat(8,1fr)] gap-0 border-8 border-[#5c3a21] rounded shadow-2xl w-[350px] md:w-[500px] h-[350px] md:h-[500px]">
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

      {/* === PAUSE MENU MODAL === */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center w-80 border-4 border-slate-200">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center justify-center gap-2">
                <Pause size={28} className="text-slate-500"/>
                PAUSED
            </h2>
            
            <div className="flex flex-col gap-3">
                {/* Resume Button */}
                <button 
                  onClick={() => setIsPaused(false)}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition transform hover:scale-[1.02]"
                >
                  <Play size={20} fill="currentColor" /> Resume
                </button>

                {/* New Game Button */}
                <button 
                  onClick={() => router.push('/')}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition transform hover:scale-[1.02]"
                >
                  <RotateCcw size={20} /> New Game
                </button>

                {/* Exit Button */}
                <button 
                  onClick={() => router.push('/')}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition transform hover:scale-[1.02]"
                >
                  <LogOut size={20} /> Exit
                </button>
            </div>
          </div>
        </div>
      )}

      {/* === GAME OVER MODAL === */}
      {gameState.status !== "Play" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center border-4 border-yellow-400">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-extrabold text-slate-800 mb-1">GAME OVER</h2>
            <p className="text-lg text-slate-600 mb-6">
              Winner: <span className="font-bold text-green-600">{gameState.currentColor === "Red" ? "Black" : "Red"}</span>
            </p>
            <button 
              onClick={() => router.push('/')}
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