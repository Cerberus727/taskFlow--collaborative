import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: false,
      });
    }

    if (!this.socket.connected) {
      this.socket.connect();
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  joinUserRoom(userId) {
    if (this.socket) {
      if (this.socket.connected) {
        this.socket.emit('join-user-room', userId);
      } else {
        this.socket.once('connect', () => {
          this.socket.emit('join-user-room', userId);
        });
      }
    }
  }

  joinBoard(boardId) {
    if (this.socket) {
      if (this.socket.connected) {
        this.socket.emit('join-board', boardId);
      } else {
        this.socket.once('connect', () => {
          this.socket.emit('join-board', boardId);
        });
      }
    }
  }

  leaveBoard(boardId) {
    if (this.socket) {
      this.socket.emit('leave-board', boardId);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();
