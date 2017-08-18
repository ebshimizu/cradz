var socket = io('http://localhost');

// stubbing events the socket can respond to.
socket.on('connect', function () {
  console.log("Connected to server.");
});

socket.on('setHost', function () {
  console.log("You have been selected as Host.");
});

socket.on('gameError', function (message) {
  console.log("Error: " + message);
});

// stubbing events the socket can initiate
function setName(name) {
  socket.emit('setName', name);
}