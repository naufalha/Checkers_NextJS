import GameBoard from "@/components/GameBoard";

// Perbaikan 1: Definisikan params sebagai Promise
interface PageProps {
  params: Promise<{ id: string }>;
}

// Perbaikan 2: Jadikan component async
export default async function GamePage({ params }: PageProps) {
  // Perbaikan 3: Await params sebelum mengambil ID
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <main className="min-h-screen bg-stone-100 flex flex-col items-center justify-center py-10">
      <h1 className="text-3xl font-extrabold text-[#5c3a21] mb-2 tracking-wide uppercase">
        Checkers Arena
      </h1>
      <p className="text-stone-500 mb-8">Next.js + .NET Core</p>
      
      {/* Gunakan ID yang sudah di-await */}
      <GameBoard gameId={id} />
    </main>
  );
}