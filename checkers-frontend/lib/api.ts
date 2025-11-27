// lib/api.ts
import axios from 'axios';
import { GameState } from '@/types/game';

// Ganti port sesuai backend Anda (5xxx)
const API_BASE_URL = 'http://localhost:5260/api/checkers';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const gameApi = {
  startGame: async (player1: string = 'Black', player2: string = 'Red') => {
    const response = await api.post(`/start?player1=${player1}&player2=${player2}`);
    return response.data; // Mengembalikan { gameId, message }
  },

  getBoard: async (gameId: string): Promise<GameState> => {
    const response = await api.get(`/${gameId}/board`);
    return response.data;
  },

  getHints: async (gameId: string): Promise<string[]> => {
    const response = await api.get(`/${gameId}/hints`);
    return response.data; // ["2,2 -> 3,3", ...]
  },

  makeMove: async (gameId: string, fromX: number, fromY: number, toX: number, toY: number) => {
    const payload = { fromX, fromY, toX, toY };
    const response = await api.post(`/${gameId}/move`, payload);
    return response.data;
  }
};