interface GameState {
  timestamp: number;
  ball: { x: number; y: number };
  playerPaddle: { x: number; y: number };
  computerPaddle: { x: number; y: number };
  score: { player: number; computer: number };
}

interface ServerMessage {
  type: string;
  winner?: string;
  state?: GameState;
}

export const socket = new WebSocket('wss://localhost:3000/ws');

socket.onopen = () => {
  console.log('WebSocket connection established');
};

socket.onmessage = (event) => {
  try {
    const message: ServerMessage = JSON.parse(event.data);
    switch (message.type) {
      case 'update':
        if (message.state) {
          updateGameState(message.state);
        }
        break;
      case 'score':
        if (message.winner) {
          console.log(`Winner: ${message.winner}`);
        }
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  } catch (error) {
    console.error('Failed to process WebSocket message:', error);
  }
};

export function sendMove(direction: 'up' | 'down' | 'stop') {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'move', data: { direction } }));
    console.log(`Move sent: ${direction}`);
  } else {
    console.warn('WebSocket is not open. Cannot send move.');
  }
}

let isMoving = false;

// Обработка нажатия клавиш
document.addEventListener('keydown', (event) => {
  if (!isMoving) {
    if (event.key === 'ArrowUp') {
      sendMove('up'); // Отправляем команду движения вверх
      isMoving = true;
    } else if (event.key === 'ArrowDown') {
      sendMove('down'); // Отправляем команду движения вниз
      isMoving = true;
    }
  }
});

// Обработка отпускания клавиш
document.addEventListener('keyup', (event) => {
  if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
    sendMove('stop'); // Отправляем команду остановки
    isMoving = false;
  }
});

socket.onclose = () => {
  console.log('Disconnected from the game server');
};

// Обновляем состояние игры на основе данных от сервера
function updateGameState(state: GameState): void {
  if (!state) return;

  // Здесь вы можете обновить отображение игры
  console.log('Game state updated:', state);

  // Например, обновите позиции объектов игры
  // ball.setPosition(state.ball.x, state.ball.y);
  // playerPaddle.setPosition(state.playerPaddle.x, state.playerPaddle.y);
  // computerPaddle.setPosition(state.computerPaddle.x, state.computerPaddle.y);

  // Обновите счет
  // updateScore(state.score.player, state.score.computer);
}