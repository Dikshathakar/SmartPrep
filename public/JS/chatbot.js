const socket = io();

// Listen for messages from the bot
socket.on('bot-message', (message) => {
  const li = document.createElement('li');
  li.classList.add('message', 'bot');
  li.innerHTML = message; // ✅ allows clickable links via <a>
  document.getElementById('messages').appendChild(li);
});

// Send user input to the server
document.getElementById('user-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.value.trim() !== '') {
    const userMessage = event.target.value.trim();
    const li = document.createElement('li');
    li.classList.add('message', 'user');
    li.textContent = userMessage;
    document.getElementById('messages').appendChild(li);
    event.target.value = '';

    // Send message to the server
    socket.emit('user-message', userMessage);
  }
});


