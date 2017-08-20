var socket = io('http://localhost');

$(document).ready(function () {
  // initialization code
  $('#hand .iso').isotope({
    itemSelector: '.card',
    layourMode: 'fitRows'
  });
});

// ui functions
function createBlackCard(text, pick) {
  var html = '<div class="ui fluid card">';
  html += '<div class="content">';
  html += '<div class="header">' + text + '</div>';
  html += '<div class="meta">Pick ' + pick + '</div>';
  html += '</div></div>';

  return html;
}

function createWhiteCard(text, id) {
  var html = '<div class="ui card" cardID="' + id + '">';
  html += '<div class="content">';
  html += '<div class="header">' + text + '</div>';
  html += '</div></div>';

  return html;
}

function updateBlackCard(card) {
  var newCard = createBlackCard(card.text, card.pick);
  $('#blackCard').html(newCard);
}

function addWhiteCardToHand(card) {
  var card = $(createWhiteCard(card.text, card.id));

  $('#hand .iso').append(card).isotope('appended', card);
  $('#hand .iso').isotope('layout');

  // event binding
  $(card).click(function () {
    var id = parseInt($(this).attr('cardID'));
    playCard(id);
  });
}

function initUI() {
  // remove black card
  $('#blackCard').html('');
}

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
  $('#hand .iso').html('');

  console.log('Hand cleared');
});

socket.on('drawHand', function (card) {
  console.log('Card added to hand: ' + card.text + " (" + card.id + ")");
  addWhiteCardToHand(card);
});

socket.on('gameStart', function () {
  //initUI();
});

socket.on('setCardCzar', function () {
  console.log("you are the card czar for this turn");
});

socket.on('deposeCardCzar', function () {
  console.log("you are no longer the card czar");
});

socket.on('setBlackCard', function (card) {
  console.log("Black card is: " + card.text + " pick " + card.pick);
  updateBlackCard(card);
});

socket.on('playedCard', function (card) {
  // remove the specified card
  var c = $('.card[cardID="' + card.id + '"]');
  $('#hand .iso').isotope('remove', c).isotope('layout');
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