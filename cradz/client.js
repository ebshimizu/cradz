var socket = io('http://localhost');
var isJudge = false;

$(document).ready(function () {
  // initialization code
  $('#hand .iso').isotope({
    itemSelector: '.card',
    layourMode: 'fitRows'
  });

  $('#playArea .iso').isotope({
    itemSelector: '.cardGroup',
    layoutMode: 'fitRows'
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

  // also clear the play area
  $('#playArea .iso').isotope('remove', $('.cardGroup')).isotope('layout');
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

function addPlaceholder() {
  var placeholder = $('<div class="cardGroup placeholder"><div class="ui placeholder card"</div></div>');

  $('#playArea .iso').append(placeholder).isotope('appended', placeholder);
  $('#playArea .iso').isotope('layout');
}

function revealPlaceholders(played) {
  // first, delete all of them
  $('#playArea .iso').isotope('remove', $('.cardGroup')).isotope('layout');

  // iterate through the object
  for (var key in played) {
    var cards = played[key];

    // the judge cards are included as a null array, just don't display
    if (cards.length === 0)
      continue;

    var elem = $(createCardGroup(cards, key));

    $('#playArea .iso').append(elem).isotope('appended', elem).isotope('layout');

    // event binding, only if judge
    if (isJudge) {
      $(elem).click(function () {
        var groupID = parseInt($(this).attr("groupID"));
        pickFavorite(groupID);
      });
    }
  }
}

function createCardGroup(cards, key) {
  // array of cards, create the container for the white cards
  var cardElem = "";

  for (var i = 0; i < cards.length; i++) {
    cardElem += createWhiteCard(cards[i].text, cards[i].id);
  }

  // here, if there's more than one card, the container gets assigned the "multi" class,
  // otherwise it's just a blank container
  if (cards.length === 1) {
    cardElem = '<div class="single cardGroup" groupID="' + key + '">' + cardElem + '</div>';
  }
  else if (cards.length === 2) {
    cardElem = '<div class="two multi cardGroup" groupID="' + key + '">' + cardElem + '</div>';
  }
  else {
    cardElem = '<div class="three multi cardGroup" groupID="' + key + '">' + cardElem + '</div>';
  }

  return cardElem;
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
  initUI();
});

socket.on('setCardCzar', function () {
  isJudge = true;
  console.log("you are the card czar for this turn");
});

socket.on('deposeCardCzar', function () {
  isJudge = false;
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
  addPlaceholder();
});

socket.on('cardsRevealed', function (cards) {
  console.log(cards);
  revealPlaceholders(cards);
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