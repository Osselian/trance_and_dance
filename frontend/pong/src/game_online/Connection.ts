import { GamesStateDto } from './GamesStateDto';
import { Game } from './Game';
import { GameState } from '../utils/types';

const game = new Game();

export const socket = new WebSocket('ws://localhost:3000/ws');

socket.onopen = () => {
    console.log('WebSocket connection established');
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'move', direction: 'up' }));
    }
};

socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    switch (message.type) {
        case 'readyStatus':
            console.log('Game state update:', message.data);
            break;
        case 'error':
            console.error('Error from server:', message.data);
            break;
        case 'gameState': {
            const gameState: GamesStateDto = message.data;
            console.log('Game state received:', gameState);

            // Обновите состояние игры на фронтенде
            updateGameFromState(gameState);
            break;
        }
        default:
            console.warn('Unknown message type:', message);
    }
};

function updateGameFromState(state: GamesStateDto): void {
    game.setBallPosition(state.ballPos);
    game.setPlayerPaddlePosition(state.player1PaddlePos);
    game.setComputerPaddlePosition(state.player2PaddlePos);
    game.updateScore(state.score.player, state.score.opponent);


	switch (state.gameState) {
        case 'modeSelection':
			game.setGameState(GameState.MODE_SELECTION);
            break;
		case 'start':
			game.setGameState(GameState.START);
            break;
        case 'playing':
			game.setGameState(GameState.PLAYING);
            break;
        case 'paused':
			game.setGameState(GameState.PAUSED);
            break;
        case 'gameOver':
			game.setGameState(GameState.GAME_OVER);
            break;
        default:
            console.warn('Unknown game state:', state);
    }
    // Обновите состояние игры
    // game.setGameState(state.gameState);
    if (state.hasWinner) {
        game.endGame(state.winnerId);
    }
}

socket.onclose = () => {
    console.log('WebSocket connection closed');
};

socket.onerror = (error) => {
    console.error('WebSocket error:', error);
};

window.addEventListener('beforeunload', () => {
    if (socket.readyState === WebSocket.OPEN) {
        socket.close();
    }
});

// Функция для отправки сообщений через WebSocket
export function sendMessage(type: string, data: any) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type, data }));
    } else {
        console.warn('WebSocket is not open. Message not sent:', { type, data });
    }
}

// Функция для закрытия соединения
export function closeConnection() {
    if (socket.readyState === WebSocket.OPEN) {
        socket.close();
    }
}