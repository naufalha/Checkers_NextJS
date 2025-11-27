// components/GameBoard.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { GameState, Position, MoveHint, PieceColor } from "@/types/game";
import { gameApi } from "@/lib/api";
import { parseHints, isSamePos } from "@/lib/utils";
import BoardSquare from "./BoardSquare";
import { Loader2, RefreshCw, AlertTriangle, Trophy } from "lucide-react";

interface GameBoardProps {
  gameId: string;
}

export default function GameBoard({ gameId }: GameBoardProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State Interaksi
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [availableHints, setAvailableHints] = useState<MoveHint[]>([]);
  const [validDestinations, setValidDestinations] = useState<Position[]>([]);

  // 1. Fetch Board State
  const fetchBoard = useCallback(async () => {
    try {
      const data = await gameApi.getBoard(gameId);
      setGameState(data);
      // Reset seleksi setiap kali board refresh
      setSelectedPos(null);
      setValidDestinations([]);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat papan permainan.");
    }
  }, [gameId]);

  // Initial Load
  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  // 2. Load Hints (Pre-load atau Lazy load)
  const loadHints = async () => {
    if (!gameState) return;
    try {
      const rawHints = await gameApi.getHints(gameId);
      const parsed = parseHints(rawHints);
      setAvailableHints(parsed);
    } catch (err) {
      console.error("Failed fetching hints", err);
    }
  };

  // Muat hint setiap kali giliran berubah atau board update
  useEffect(() => {
    if (gameState?.status === "Play") {
      loadHints();
    }
  }, [gameState]);

  // 3. Handle Click Logic
  const handleSquareClick = async (x: number, y: number) => {
    if (!gameState || gameState.status !== "Play") return;

    const clickedPos = { x, y };
    const cell = gameState.board[x][y]; // Ingat: Array 2D board[row][col] -> board[x][y] jika backend kirim X sebagai Row
    
    // --- Logic A: User klik bidak sendiri (Select Phase) ---
    // Cek apakah ada bidak dan warnanya sesuai giliran
    const isMyTurn = gameState.currentColor === (cell.piece?.color === PieceColor.Black ? "Black" : "Red");
    
    if (cell.piece && isMyTurn) {
      // Jika Double Jump Active, pastikan user hanya memilih bidak yang sedang aktif
      // (Ini asumsi backend memvalidasi, tapi UI bisa membantu memfilter jika backend kirim info bidak mana yg harus gerak)
      
      setSelectedPos(clickedPos);
      
      // Filter hints: Ambil hanya gerakan yang berasal dari bidak ini
      const movesForThisPiece = availableHints.filter(h => isSamePos(h.from, clickedPos));
      setValidDestinations(movesForThisPiece.map(h => h.to));
      return;
    }

    // --- Logic B: User klik kotak kosong (Move Phase) ---
    const isDestinationValid = validDestinations.some(dest => isSamePos(dest, clickedPos));
    
    if (selectedPos && !cell.piece && isDestinationValid) {
      await executeMove(selectedPos, clickedPos);
    }
  };

  const executeMove = async (from: Position, to: Position) => {
    setLoading(true);
    try {
      await gameApi.makeMove(gameId, from.x, from.y, to.x, to.y);
      await fetchBoard(); // Refresh board state
    } catch (err) {
      alert("Gerakan tidak valid atau server error!");
    } finally {
      setLoading(false);
    }
  };

  if (!gameState) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto p-4">
      
      {/* HUD / Status Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center w-full bg-slate-800 p-4 rounded-xl text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg font-bold ${gameState.currentColor === 'Black' ? 'bg-slate-900 border border-slate-600' : 'bg-red-600'}`}>
            Giliran: {gameState.currentColor}
          </div>
          {gameState.isDoubleJumpActive && (
            <div className="flex items-center gap-2 text-yellow-400 font-bold animate-pulse">
              <AlertTriangle size={20} />
              MUST JUMP AGAIN!
            </div>
          )}
        </div>
        
        <div className="text-sm opacity-75">Status: {gameState.status}</div>
      </div>

      {/* Game Board Grid */}
      <div className="relative">
        {/* Overlay Loading saat Move */}
        {loading && (
          <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}

        <div className="grid grid-cols-8 gap-0 border-4 border-[#5c3a21] shadow-2xl rounded-sm overflow-hidden w-[350px] md:w-[600px] h-[350px] md:h-[600px]">
          {/* Rendering Grid 8x8 */}
          {gameState.board.map((row, rIndex) => (
            row.map((cell, cIndex) => {
              // Cek apakah kotak ini adalah destinasi valid dari bidak yang dipilih
              const isDest = validDestinations.some(d => isSamePos(d, cell.position));
              // Cek apakah kotak ini yang sedang dipilih
              const isSelected = selectedPos ? isSamePos(selectedPos, cell.position) : false;

              return (
                <BoardSquare
                  key={`${rIndex}-${cIndex}`}
                  cell={cell}
                  isValidMove={isDest}
                  isSelected={isSelected}
                  onClick={() => handleSquareClick(cell.position.x, cell.position.y)}
                />
              );
            })
          ))}
        </div>
      </div>

      {/* Game Over Modal */}
      {gameState.status === "Win" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md animate-bounce-in">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Permainan Selesai!</h2>
            <p className="text-xl text-slate-600 mb-6">
              Pemenang: <span className="font-bold text-green-600">{gameState.currentPlayer} ({gameState.currentColor})</span>
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
            >
              Main Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}