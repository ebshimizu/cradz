var socket = io('http://localhost');
var isJudge = false;
var isHost = false;

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

  $('#deckList').dropdown({
    onChange: function (value, text, $selectedItem) {
      if (isHost)
        socket.emit('updateDecks', value);
    }
  });

  $('#settings .input').change(function () {
    if (isHost) {
      var name = $(this).attr("settingName");

      if (name === 'pointsToWin') {
        socket.emit('setPointsToWin', parseInt($('.input[settingName="' + name + '"] input').val()));
      }
    }
  });

  $('#startGame').click(function () {
    if (isHost)
      socket.emit('startGame');
  });

  $('#hostLabel').hide();
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
  console.log("Black card is: " + card.text + " pick " + card.pick);
  var newCard = createBlackCard(card.text, card.pick);
  $('#blackCard').html(newCard);

  // also clear the play area
  $('#playArea .iso').isotope('remove', $('.cardGroup')).isotope('layout');
  $('#scoreboard .item').removeClass("winner");
}

function addWhiteCardToHand(card) {
  console.log('Card added to hand: ' + card.text + " (" + card.id + ")");

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

function addPlayer(id, name) {
  // check if the player already exists
  if ($('.item[playerID="' + id + '"]').length === 0) {
    var elem = '<div class="item" playerID="' + id + '">';
    elem += '<div class="content">';
    elem += '<div class="header"></div>';
    elem += '<div class="description">0 points</div>';
    elem += '</div></div>';

    $('#scoreboard .list').append(elem);
  }

  // let jquery sanitize
  $('.item[playerID="' + id + '"] .header').text(name); 
}

function deletePlayer(id) {
  $('.item[playerID="' + id + '"]').remove();
}

function setTurnOrder(turnOrder) {
  for (var i in turnOrder) {
    var id = turnOrder[i];

    var elem = $('.item[playerID="' + id + '"]').detach();
    $('#scoreboard .list').append(elem);
  }
}

function initUI() {
  // remove black card
  $('#blackCard').html('');

  // hide settings
  $('#settings').transition('drop out');
}

function checkName() {
  var name = $('#nameInput input').val();

  // check non-empty, whitespace is empty
  if (name === '' || !(/\s*\S+/.test(name))) {
    $('#nameInput').transition('pulse');
    return false;
  }

  setName(name);
  return true;
}

function updateScores(scores) {
  for (var key in scores) {
    $('.item[playerID="' + key + '"] .description').text(scores[key] + " points");
  }
}

function updateCzar(id) {
  $('#scoreboard .item').removeClass('judge');
  $('.item[playerID="' + id + '"]').addClass('judge');
}

function settingsUpdate(data) {
  if (data.setting === "selectedDecks") {
    if (!isHost)
      $('#deckList').dropdown('set exactly', data.value);
  }
  else {
    $('.input[settingName="' + data.setting + '"] input').val(data.value);
  }
}

function updateAvailableDecks(decks) {
  $('#deckList').html('');
  $('#deckList').remove('a');
  for (var name in decks.available) {
    $('#deckList').append('<option>' + name + '</option>');
  }

  // update the selection
  socket.emit('getDecks');
}

function setHost() {
  isHost = true;
  $('#settings .ui').removeClass("disabled");
  $('#hostLabel').show();
  console.log("You have been selected as Host.");
}

function highlightWinner(groupID, playerID) {
  // change the card class
  $('.cardGroup[groupID="' + groupID + '"]').addClass("winner");
  $('.item[playerID="' + playerID + '"]').addClass("winner");
}

// stubbing events the socket can respond to.
socket.on('connect', function () {
  console.log("Connected to server.");

  // immediately lock them behind the modal
  $('#nameModal').modal({
    closable: false,
    onApprove: checkName
  }).modal('show')
});

socket.on('setHost', setHost);

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

socket.on('drawHand', addWhiteCardToHand);
socket.on('gameStart', initUI);

socket.on('setCardCzar', function () {
  isJudge = true;
  $('#hand').scrollTop(0);
  $('#judgeDimmer').dimmer('show');
  console.log("you are the card czar for this turn");
});

socket.on('deposeCardCzar', function () {
  isJudge = false;
  $('#judgeDimmer').dimmer('hide');
  console.log("you are no longer the card czar");
});

socket.on('setBlackCard', updateBlackCard);

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

socket.on('newPlayerJoined', function (id, displayName) {
  // scoreboard update with new player
  addPlayer(id, displayName);
});

socket.on('playerDC', function (id) {
  // for now this deletes the player
  deletePlayer(id);
});

socket.on('updateScores', updateScores);
socket.on('whoIsCardCzar', updateCzar);
socket.on('setTurnOrder', setTurnOrder);
socket.on('settingsUpdate', settingsUpdate);
socket.on('availableDecks', updateAvailableDecks);
socket.on('winningCard', highlightWinner);

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