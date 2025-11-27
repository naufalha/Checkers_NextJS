// app/game/[id]/page.tsx
import GameBoard from "@/components/GameBoard";

interface PageProps {
  params: { id: string };
}

export default function GamePage({ params }: PageProps) {
  return (
    <main className="min-h-screen bg-stone-100 flex flex-col items-center justify-center py-10">
      <h1 className="text-3xl font-extrabold text-[#5c3a21] mb-2 tracking-wide uppercase">
        Checkers Arena
      </h1>
      <p className="text-stone-500 mb-8">Next.js + .NET Core</p>
      
      <GameBoard gameId={params.id} />
    </main>
  );
}