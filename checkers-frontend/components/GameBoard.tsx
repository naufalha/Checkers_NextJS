// components/GameBoard.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GameState, Position, MoveHint, PieceColor } from "@/types/game";
import { gameApi } from "@/lib/api";
import { parseHints, isSamePos } from "@/lib/utils";
import BoardSquare from "./BoardSquare";
import { Loader2, AlertTriangle, Trophy, Pause, Play, RotateCcw, LogOut, User } from "lucide-react";

interface GameBoardProps {
  gameId: string;
}

export default function GameBoard({ gameId }: GameBoardProps) {
  const router = useRouter();
  
  // -- STATE --
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
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

  // -- LOGIC: HITUNG SKOR & CAPTURED PIECES --
  const gameStats = useMemo(() => {
    if (!gameState) return { blackScore: 0, redScore: 0 };

    let blackCount = 0;
    let redCount = 0;

    // Hitung bidak yang masih ada di papan
    gameState.board.forEach(row => {
      row.forEach(cell => {
        if (cell.piece) {
          if (cell.piece.color === PieceColor.Black) blackCount++;
          else if (cell.piece.color === PieceColor.Red) redCount++;
        }
      });
    });

    // Skor Black = Jumlah Red yang dimakan (Total awal 12 - sisa Red)
    // Skor Red = Jumlah Black yang dimakan (Total awal 12 - sisa Black)
    return {
      blackScore: 12 - redCount,
      redScore: 12 - blackCount
    };
  }, [gameState]);

  // -- HANDLERS --
  const handleSquareClick = async (x: number, y: number) => {
    if (!gameState || gameState.status !== "Play" || isPaused) return;
    
    const cell = gameState.board[y][x]; 
    const clickedPos = { x, y };
    
    const isPieceColorMatch = cell.piece?.color === (gameState.currentColor === "Black" ? PieceColor.Black : PieceColor.Red);

    if (cell.piece && isPieceColorMatch) {
      setSelectedPos(clickedPos);
      const movesForThisPiece = availableHints.filter(h => isSamePos(h.from, clickedPos));
      setValidDestinations(movesForThisPiece.map(h => h.to));
      return;
    }

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

  if (!gameState) return <div className="p-10 text-center text-stone-500">Loading Arena...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full p-4 gap-8">
      
      {/* HEADER / HUD */}
      <div className="fixed top-4 z-40 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg border border-stone-200 flex items-center gap-6">
        <div className="text-lg font-bold text-slate-800">Checkers Arena</div>
        
        {/* Turn Indicator */}
        <div className="flex items-center gap-2 px-4 py-1 bg-stone-100 rounded-full border border-stone-200">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Turn</span>
          <span className={`text-sm font-bold ${gameState.currentColor === 'Black' ? 'text-slate-900' : 'text-red-600'}`}>
            {gameState.currentPlayer}
          </span>
        </div>

        {gameState.isDoubleJumpActive && (
          <div className="flex items-center gap-2 text-amber-600 font-bold animate-pulse text-sm">
            <AlertTriangle size={16} /> Double Jump!
          </div>
        )}

        <button
          onClick={() => setIsPaused(true)}
          disabled={gameState.status !== "Play"}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition"
        >
          <Pause size={20} />
        </button>
      </div>

      {/* === MAIN LAYOUT: PLAYER 1 - BOARD - PLAYER 2 === */}
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12 mt-16 w-full max-w-6xl justify-center">
        
        {/* LEFT PANEL (BLACK PLAYER) */}
        <PlayerScorePanel 
          playerName={gameState.blackName || "Player Black"}
          score={gameStats.blackScore}
          capturedColor={PieceColor.Red} // Black captures Red pieces
          isActive={gameState.currentColor === "Black"}
          align="right"
        />

        {/* BOARD GRID */}
        <div className="relative select-none shrink-0">
          {loading && (
            <div className="absolute inset-0 z-20 bg-white/50 flex items-center justify-center rounded">
              <Loader2 className="w-10 h-10 animate-spin text-stone-600" />
            </div>
          )}

          <div className="grid grid-cols-8 grid-rows-[repeat(8,1fr)] gap-0 border-8 border-[#5c3a21] rounded shadow-2xl w-[320px] h-[320px] md:w-[500px] md:h-[500px]">
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

        {/* RIGHT PANEL (RED PLAYER) */}
        <PlayerScorePanel 
          playerName={gameState.redName || "Player Red"}
          score={gameStats.redScore}
          capturedColor={PieceColor.Black} // Red captures Black pieces
          isActive={gameState.currentColor === "Red"}
          align="left"
        />

      </div>

      {/* === PAUSE & GAME OVER MODALS (Tetap sama) === */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-80 text-center border-4 border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-center gap-2">
              <Pause className="text-slate-400"/> Game Paused
            </h2>
            <div className="space-y-3">
              <button onClick={() => setIsPaused(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2"><Play size={18}/> Resume</button>
              <button onClick={() => router.push('/')} className="w-full py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 flex items-center justify-center gap-2"><RotateCcw size={18}/> Restart</button>
              <button onClick={() => router.push('/')} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 flex items-center justify-center gap-2"><LogOut size={18}/> Exit</button>
            </div>
          </div>
        </div>
      )}

      {gameState.status !== "Play" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center border-4 border-yellow-400">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-extrabold text-slate-800 mb-1">GAME OVER</h2>
            <p className="text-lg text-slate-600 mb-6">Winner: <span className="font-bold text-green-600">{gameState.currentColor === "Red" ? "Black" : "Red"}</span></p>
            <button onClick={() => router.push('/')} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition">Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

// === SUB-COMPONENT: PLAYER SCORE PANEL ===
function PlayerScorePanel({ 
  playerName, 
  score, 
  capturedColor, 
  isActive, 
  align 
}: { 
  playerName: string, 
  score: number, 
  capturedColor: PieceColor, 
  isActive: boolean,
  align: "left" | "right" 
}) {
  const isBlackCaptured = capturedColor === PieceColor.Black;
  
  return (
    <div className={`flex flex-col gap-4 w-full md:w-48 transition-all duration-300 ${isActive ? 'opacity-100 scale-105' : 'opacity-60 scale-95'} ${align === 'right' ? 'md:items-end' : 'md:items-start'}`}>
      
      {/* Player Card */}
      <div className={`flex flex-col p-4 rounded-2xl border-2 shadow-sm w-full ${isActive ? 'bg-white border-blue-400 ring-2 ring-blue-100' : 'bg-stone-50 border-stone-200'}`}>
        <div className="flex items-center gap-2 mb-1 text-stone-400 text-xs font-bold uppercase">
          <User size={14} /> Player
        </div>
        <div className="text-lg font-bold text-slate-800 truncate" title={playerName}>
          {playerName}
        </div>
        <div className="mt-2 text-xs font-medium text-stone-500">
          Score: <span className="text-lg font-bold text-emerald-600 ml-1">{score}</span>
        </div>
      </div>

      {/* Graveyard (Visualisasi Bidak yang dimakan) */}
      <div className={`flex flex-wrap content-start gap-1 p-3 bg-stone-200/50 rounded-xl min-h-[80px] w-full border border-stone-300/50 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {Array.from({ length: score }).map((_, i) => (
          <div 
            key={i} 
            className={`w-6 h-6 rounded-full shadow-sm border-2 ${
              isBlackCaptured 
                ? "bg-slate-900 border-slate-600" // Red eats Black
                : "bg-red-600 border-red-800"     // Black eats Red
            }`} 
          />
        ))}
        {score === 0 && (
          <span className="text-xs text-stone-400 w-full text-center py-4">No captures yet</span>
        )}
      </div>
    </div>
  );
}