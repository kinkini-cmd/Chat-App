let socket = io();
let currentRoom = "General";
let username = document.getElementById('username').textContent;
let roomMessages = {};

// Socket Event Listeners
socket.on('connect', () => {
    joinRoom('General');
});

socket.on('message', (data) => {
    addMessage(
        data.username,
        data.msg,
        data.username === username ? 'own' : 'other'
    );
});

socket.on('private_message', (data) => {
    addMessage(data.from, `[Private] ${data.msg}`, 'private');
});

socket.on('status', (data) => {
    addMessage('System', data.msg, 'status');
});

socket.on('active_users', (data) => {
    const userList = document.getElementById('active-users');
    userList.innerHTML = data.users.map(
        (user) =>
            `<div class="user-item" onclick="insertPrivateMessage('${user}')">${user} ${
                user === username ? '(you)' : ''
            }</div>`
    ).join('');
});

// Add a message to chat
function addMessage(sender, message, type) {
    if (!roomMessages[currentRoom]) {
        roomMessages[currentRoom] = [];
    }

    roomMessages[currentRoom].push({ sender, message, type });

    const chat = document.getElementById('chat');
    const messageDiv = document.createElement('div');

    messageDiv.className = `message ${type}`;
    messageDiv.textContent = `${sender}: ${message}`;

    chat.appendChild(messageDiv);
    chat.scrollTop = chat.scrollHeight;
}

// Send a message
function sendMessage() {
    const input = document.getElementById('message');
    const message = input.value.trim();

    if (!message) return;

    if (message.startsWith('/')) {
        if (message.startsWith('@')) {
            const [target, ...msgParts] = message.split(' ');
            const privateMsg = msgParts.join(' ');

            if (privateMsg) {
                socket.emit('message', {
                    msg: privateMsg,
                    type: 'private',
                    target: target.replace('@', '')
                });
            }
        }
    } else {
        socket.emit('message', {
            msg: message,
            room: currentRoom,
        });
    }

    input.value = '';
    input.focus();
}

// Join a room
function joinRoom(room) {
    socket.emit('leave', { room: currentRoom });
    currentRoom = room;
    socket.emit('join', { room });

    const chat = document.getElementById('chat');
    chat.innerHTML = "";

    if (roomMessages[room]) {
        roomMessages[room].forEach((msg) => {
            addMessage(msg.sender, msg.message, msg.type);
        });
    }
}

// Insert private message starter
function insertPrivateMessage(user) {
    document.getElementById('message').value = `@${user} `;
    document.getElementById('message').focus();
}

// Handle enter key
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.room-item').forEach((item) => {
        if (item.textContent.trim() === currentRoom) {
            item.classList.add('active-room');
        }
    });
});



