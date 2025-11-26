"use client";

import { useState, useEffect } from "react";

// --- KONFIGURASI API ---
const API_BASE_URL = "http://localhost:5260/api/checkers"; // Sesuaikan port C# kamu

export default function CheckersGame() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [board, setBoard] = useState<any[][]>([]); // Array 8x8
  const [currentPlayer, setCurrentPlayer] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  
  // State interaksi user
  const [selectedPos, setSelectedPos] = useState<{ x: number; y: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ x: number; y: number }[]>([]);
  const [feedback, setFeedback] = useState<string>("");

  // 1. Start Game
  const startGame = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/start`, { method: "POST" });
      const data = await res.json();
      setGameId(data.gameId);
      setFeedback("Game Started! Black moves first.");
      fetchBoardState(data.gameId);
    } catch (err) {
      setFeedback("Error starting game. Is backend running?");
    }
  };

  // 2. Get Board State
  const fetchBoardState = async (id: string) => {
    if (!id) return;
    const res = await fetch(`${API_BASE_URL}/${id}/board`);
    const data = await res.json();
    
    // Asumsi data.board adalah array of objects, kita perlu mapping ke grid
    // Jika API mengembalikan array 2D langsung, gunakan data.board
    setBoard(data.board); 
    setCurrentPlayer(data.currentPlayer);
    setStatus(data.status);
    
    // Reset selection setiap ganti giliran/update board
    setSelectedPos(null);
    setValidMoves([]);
  };

  // 3. Get Hints (Ketika user klik bidak miliknya)
  const handlePieceClick = async (x: number, y: number, color: string) => {
    if (status !== "Play") return;
    if (color !== currentPlayer) {
        setFeedback(`It is ${currentPlayer}'s turn!`);
        return;
    }

    setSelectedPos({ x, y });
    setFeedback("Fetching moves...");

    // Panggil API Hints
    const res = await fetch(`${API_BASE_URL}/${gameId}/hints`);
    const hints: string[] = await res.json(); 
    // Format hints dari API: "2,2 -> 3,3" atau "5,5 -> 3,3 (Capture)"

    // Parsing string hints untuk mencari tujuan yang valid dari posisi (x,y)
    const possibleDestinations: { x: number; y: number }[] = [];
    
    hints.forEach(hint => {
        // Regex sederhana untuk parse "x1,y1 -> x2,y2"
        const parts = hint.match(/(\d+),(\d+)\s->\s(\d+),(\d+)/);
        if (parts) {
            const fromX = parseInt(parts[1]);
            const fromY = parseInt(parts[2]);
            const toX = parseInt(parts[3]);
            const toY = parseInt(parts[4]);

            // Jika hint ini berasal dari bidak yang kita klik
            if (fromX === x && fromY === y) {
                possibleDestinations.push({ x: toX, y: toY });
            }
        }
    });

    setValidMoves(possibleDestinations);
    if (possibleDestinations.length === 0) {
        setFeedback("No valid moves for this piece.");
    } else {
        setFeedback("Select a highlighted square to move.");
    }
  };

  // 4. Make Move (Ketika user klik kotak tujuan yang valid)
  const handleSquareClick = async (x: number, y: number) => {
    // Jika belum select bidak, abaikan (atau handle logic select di sini jika ada bidak)
    if (!selectedPos || !gameId) return;

    // Cek apakah kotak ini adalah destinasi valid
    const isValidMove = validMoves.some(m => m.x === x && m.y === y);

    if (isValidMove) {
      try {
        const payload = {
          fromX: selectedPos.x,
          fromY: selectedPos.y,
          toX: x,
          toY: y
        };

        const res = await fetch(`${API_BASE_URL}/${gameId}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.text(); // Ambil pesan error (misal: Mandatory Jump)
            setFeedback(`❌ Error: ${errData}`);
            return;
        }

        const data = await res.json();
        setFeedback(data.message); // "Move processed"
        
        // Refresh board
        fetchBoardState(gameId);
      } catch (err) {
        setFeedback("Failed to execute move.");
      }
    } else {
       // Jika klik sembarang tempat, deselect
       setSelectedPos(null);
       setValidMoves([]);
    }
  };

  // Render Helper: Menentukan warna kotak
  const getSquareColor = (x: number, y: number) => {
    const isDark = (x + y) % 2 !== 0; // Pola catur
    if (!isDark) return "bg-amber-100"; // Kotak terang
    
    // Cek apakah kotak ini adalah target valid (Highlight)
    if (validMoves.some(m => m.x === x && m.y === y)) return "bg-green-500 cursor-pointer";
    
    return "bg-stone-700"; // Kotak gelap
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-stone-900 text-white">
      <h1 className="text-4xl font-bold mb-6">♟️ Next.js Checkers</h1>

      {/* Control Panel */}
      <div className="mb-4 flex flex-col items-center gap-2">
        {!gameId ? (
          <button 
            onClick={startGame}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-bold"
          >
            Start New Game
          </button>
        ) : (
          <div className="text-center">
            <p className="text-xl">Turn: <span className={currentPlayer === "Red" ? "text-red-500" : "text-gray-300 font-bold"}>{currentPlayer}</span></p>
            <p className="text-sm text-yellow-400 mt-1">{feedback}</p>
          </div>
        )}
      </div>

      {/* Board Rendering */}
      {board.length > 0 && (
        <div className="border-8 border-stone-600 rounded-lg">
          {/* Loop Baris (Y) */}
          {board.map((row, y) => (
            <div key={y} className="flex">
              {/* Loop Kolom (X) */}
              {row.map((cell: any, x: number) => {
                // Asumsi cell object dari API atau jika API return simple values
                // Struktur cell dari API mungkin perlu disesuaikan di sini
                // Contoh: cell mungkin null atau object { color: "Red", type: "Man" }
                // Mari asumsikan board[y][x] aksesnya. Perhatikan coordinate system API
                // API: fromX, fromY. Biasanya X=Kolom, Y=Baris.
                
                // Jika board dari API adalah array objek datar, kita harus menyesuaikan
                // Di sini saya asumsi board adalah array 2D [y][x]
                const piece = cell; 
                
                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => piece ? handlePieceClick(x, y, piece.Color) : handleSquareClick(x, y)}
                    className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center ${getSquareColor(x, y)}`}
                  >
                    {piece && (
                      <div 
                        className={`
                          w-[80%] h-[80%] rounded-full shadow-lg border-2 
                          ${piece.Color === "Red" ? "bg-red-600 border-red-800" : "bg-gray-900 border-black"}
                          ${selectedPos?.x === x && selectedPos?.y === y ? "ring-4 ring-yellow-400" : ""}
                          flex items-center justify-center
                        `}
                      >
                        {/* Tanda King */}
                        {piece.Type === "King" && <span className="text-yellow-400 font-bold text-xl">♔</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}