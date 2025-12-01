import { MoveHint, MoveHintDto, Position } from "@/types/game";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// === UPDATE: Parser baru untuk mengubah DTO menjadi MoveHint ===
export function parseHints(rawHints: MoveHintDto[]): MoveHint[] {
  return rawHints.map((hint) => {
    // Logika Deteksi Capture: 
    // Di checkers, langkah biasa hanya pindah 1 kotak.
    // Jika selisih X (horizontal) lebih dari 1, berarti bidak melompat (memakan lawan).
    const isCaptureMove = Math.abs(hint.fromX - hint.toX) > 1;

    return {
      from: { x: hint.fromX, y: hint.fromY },
      to: { x: hint.toX, y: hint.toY },
      isCapture: isCaptureMove,
      // Optional: string representasi untuk debugging di console
      originalString: `(${hint.fromX},${hint.fromY}) -> (${hint.toX},${hint.toY})`
    };
  });
}

export const isSamePos = (p1: Position, p2: Position) => p1.x === p2.x && p1.y === p2.y;