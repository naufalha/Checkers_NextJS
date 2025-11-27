// app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gameApi } from "@/lib/api";
import { PlayCircle, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [player1, setPlayer1] = useState("Player Black");
  const [player2, setPlayer2] = useState("Player Red");

  const handleStartGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await gameApi.startGame(player1, player2);
      // Asumsi response: { gameId: "...", message: "..." }
      if (data.gameId) {
        router.push(`/game/${data.gameId}`);
      }
    } catch (error) {
      console.error("Failed to start game", error);
      alert("Gagal memulai game. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md">
        <h1 className="text-4xl font-bold text-white text-center mb-2">Checkers</h1>
        <p className="text-slate-400 text-center mb-8">Modern Checkers Interface</p>

        <form onSubmit={handleStartGame} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Black Player Name</label>
            <input 
              type="text" 
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Enter name..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Red Player Name</label>
            <input 
              type="text" 
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-red-500 outline-none transition"
              placeholder="Enter name..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <PlayCircle />}
            Start New Game
          </button>
        </form>
      </div>
    </main>
  );
}