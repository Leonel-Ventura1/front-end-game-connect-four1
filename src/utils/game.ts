import { GameState, GameMove } from '../types/index.js';

const COLS = 7;
const ROWS = 6;
const WIN_LENGTH = 4;

export class GameEngine {
  private player1Id: string;
  private player2Id: string;
  private board: (string | null)[][];
  private currentPlayer: 'player1' | 'player2';
  private moves: GameMove[];
  private status: 'playing' | 'completed' | 'draw';
  private winner?: string;
  private winType?: 'horizontal' | 'vertical' | 'diagonal';
  private winPositions?: [number, number][];

  constructor(
    player1Id: string,
    player2Id: string,
    initialBoard?: (string | null)[][],
    initialMoves?: GameMove[]
  ) {
    this.player1Id = player1Id;
    this.player2Id = player2Id;
    this.board = initialBoard ?? this.initializeBoard();
    this.moves = Array.isArray(initialMoves) ? initialMoves : [];
    this.currentPlayer = 'player1';
    this.status = 'playing';

    // Se há movimentos prévios, calcular o jogador atual
    if (this.moves.length > 0) {
      this.currentPlayer =
        this.moves.length % 2 === 0 ? 'player1' : 'player2';
    }
  }

  private initializeBoard(): (string | null)[][] {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  private isValidPlayer(userId: string): boolean {
    return userId === this.player1Id || userId === this.player2Id;
  }

  
  private isPlayerTurn(userId: string): boolean {
    if (this.currentPlayer === 'player1') {
      return userId === this.player1Id;
    } else {
      return userId === this.player2Id;
    }
  }

  makeMove(column: number, playerId: string): { success: boolean; error?: string } {
   
    if (!this.isValidPlayer(playerId)) {
      return { success: false, error: 'You are not a player in this game' };
    }

 
    if (!this.isPlayerTurn(playerId)) {
      return { success: false, error: 'Not your turn' };
    }


    if (this.status !== 'playing') {
      return { success: false, error: 'Game finished' };
    }


    if (column < 0 || column >= COLS) {
      return { success: false, error: 'Invalid column' };
    }

 
    if (this.board[0][column] !== null) {
      return { success: false, error: 'Column is full' };
    }

 
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r][column] === null) {
        row = r;
        break;
      }
    }

    if (row === -1) {
      return { success: false, error: 'Column is full' };
    }

  
    const playerMarker = this.currentPlayer === 'player1' ? 'P1' : 'P2';
    this.board[row][column] = playerMarker;


    this.moves.push({
      column,
      row,
      playerId,
      timestamp: Date.now(),
    });


    if (this.checkWin(row, column, playerMarker)) {
      this.status = 'completed';
      this.winner = playerId;
      return { success: true };
    }

  
    if (this.isBoardFull()) {
      this.status = 'draw';
      return { success: true };
    }

    this.currentPlayer =
      this.currentPlayer === 'player1' ? 'player2' : 'player1';

    return { success: true };
  }

  private checkWin(row: number, col: number, player: string): boolean {
    return (
      this.checkDirection(row, col, player, 0, 1) ||
      this.checkDirection(row, col, player, 1, 0) ||
      this.checkDirection(row, col, player, 1, 1) ||
      this.checkDirection(row, col, player, 1, -1)
    );
  }

  private checkDirection(
    row: number,
    col: number,
    player: string,
    rowDir: number,
    colDir: number
  ): boolean {
    let count = 1;
    const positions: [number, number][] = [[row, col]];

    for (let i = 1; i < WIN_LENGTH; i++) {
      const r = row + rowDir * i;
      const c = col + colDir * i;
      if (this.out(r, c) || this.board[r][c] !== player) break;
      positions.push([r, c]);
      count++;
    }

    for (let i = 1; i < WIN_LENGTH; i++) {
      const r = row - rowDir * i;
      const c = col - colDir * i;
      if (this.out(r, c) || this.board[r][c] !== player) break;
      positions.push([r, c]);
      count++;
    }

    if (count >= WIN_LENGTH) {
      this.winPositions = positions;
      this.winType =
        rowDir === 0
          ? 'horizontal'
          : colDir === 0
          ? 'vertical'
          : 'diagonal';
      return true;
    }

    return false;
  }

  private out(r: number, c: number) {
    return r < 0 || r >= ROWS || c < 0 || c >= COLS;
  }

  private isBoardFull(): boolean {
    return this.board[0].every((c) => c !== null);
  }

  reset(): void {
    this.board = this.initializeBoard();
    this.currentPlayer = 'player1';
    this.moves = [];
    this.status = 'playing';
    this.winner = undefined;
    this.winType = undefined;
    this.winPositions = undefined;
  }

  getState(): GameState {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      moves: this.moves,
      status: this.status,
      winner: this.winner,
      winType: this.winType,
      winPositions: this.winPositions,
    };
  }
}