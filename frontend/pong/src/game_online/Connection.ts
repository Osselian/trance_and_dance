const socket = new WebSocket('ws://localhost:3000/ws');

socket.onopen = () => {
    console.log('WebSocket connection established');
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'move', direction: 'up' }));
    }
};

socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    switch (message.type) {
        case 'gameState':
            console.log('Game state update:', message.data);
            break;
        case 'error':
            console.error('Error from server:', message.data);
            break;
        default:
            console.warn('Unknown message type:', message);
    }
};

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