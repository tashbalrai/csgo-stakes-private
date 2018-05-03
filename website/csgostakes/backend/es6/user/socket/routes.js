import Chat from './controllers/chat';

export default {
  routes(socket, ns) {
    socket.on('chat/messages/send', data => {
      let chat = new Chat(socket, ns);
      chat.sendMessage(data)
    });

    socket.on('chat/messages/recent', () => {
      let chat = new Chat(socket, ns);
      chat.getRecentMessages();
    });

    socket.on('auth', (data) => {
      let chat = new Chat(socket, ns);
      chat.auth(data);
    });

    socket.on('chat/commands/ban', data => {
      let chat = new Chat(socket, ns);
      chat.banUser(data.user_id);
    });
  }
};