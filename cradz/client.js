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

socket.on('cardCountFail', function (rw, rb, hw, hb) {
  console.log("Game failed to start! Not enough cards.");
  console.log("White cards: " + hw + " / " + rw);
  console.log("Black cards: " + hb + " / " + rb);
});

socket.on('clearHand', function () {
  // delete hand stuff
  console.log('Hand cleared');
});

socket.on('drawHand', function (card) {
  console.log('Card added to hand: ' + card.text + " (" + card.id + ")");
});

socket.on('gameStart', function () {
  console.log('init game UI here');
});

socket.on('setCardCzar', function () {
  console.log("you are the card czar for this turn");
});

socket.on('deposeCardCzar', function () {
  console.log("you are no longer the card czar");
});

socket.on('setBlackCard', function (card) {
  console.log("Black card is: " + card.text + " pick " + card.pick);
});

socket.on('anonFinished', function (total) {
  console.log("another player has finished playing their cards");
});

socket.on('cardsRevealed', function (cards) {
  console.log(cards);
});

socket.on('gameOver', function (winner) {
  console.log(winner + " won the game!");
});

// stubbing events the socket can initiate
function setName(name) {
  socket.emit('setName', name);
}

function startGame() {
  socket.emit('startGame');
}

function playCard(id) {
  socket.emit('playWhiteCard', id);
}

function pickFavorite(id) {
  socket.emit('cardCzarSelect', id);
}