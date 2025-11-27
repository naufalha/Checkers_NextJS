import { MoveHint, Position } from "@/types/game";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Parser: Mengubah "2,2 -> 3,3 [Capture]" menjadi object koordinat
export function parseHints(hintStrings: string[]): MoveHint[] {
  return hintStrings.map((str) => {
    // FIX: Regex diperbarui untuk menangani (...) DAN [...]
    // Menghapus apapun di dalam kurung biasa atau kurung siku
    const cleanStr = str.replace(/\s*[\[\(].*?[\]\)]\s*/g, ""); 
    
    const [fromStr, toStr] = cleanStr.split("->").map(s => s.trim());
    
    const [fromX, fromY] = fromStr.split(",").map(Number);
    const [toX, toY] = toStr.split(",").map(Number);

    return {
      from: { x: fromX, y: fromY },
      to: { x: toX, y: toY },
      isCapture: str.toLowerCase().includes("capture"),
      originalString: str
    };
  });
}

export const isSamePos = (p1: Position, p2: Position) => p1.x === p2.x && p1.y === p2.y;