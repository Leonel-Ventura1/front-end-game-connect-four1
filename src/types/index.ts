export interface JwtPayload {
  userId: string;
  email: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  createdAt: Date;
}

export interface UserWithStats extends User {
  stats: {
    wins: number;
    losses: number;
    draws: number;
    totalGames: number;
  };
}

export interface GameMove {
  column: number;
  row: number;
  playerId: string;
  timestamp: number;
}

export interface GameState {
  board: (string | null)[][];
  currentPlayer: 'player1' | 'player2';
  moves: GameMove[];
  status: 'playing' | 'completed' | 'draw';
  winner?: string;
  winType?: 'horizontal' | 'vertical' | 'diagonal';
  winPositions?: [number, number][];
}

export interface Room {
  id: string;
  name: string;
  status: 'waiting' | 'playing' | 'completed';
  hostId: string;
  player1Id: string;
  player2Id?: string;
  gameId?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  roomId: string;
  createdAt: Date;
  username?: string;
  avatar?: string;
}

export interface AuthRequest {
  email: string;
  username?: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
