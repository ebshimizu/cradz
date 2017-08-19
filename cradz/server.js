var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var Cradz = require('./Cradz.js')

// server crap
app.listen(80);

function handler(req, res) {
  var file = req.url;

  if (req.url === "/")
    file = "/cradz.html";

  var contentType;

  // common extension detection time
  if (/[\w\d]+.html/.test(file)) {
    contentType = "text/html";
  }
  else if (/[\w\d]+.js/.test(file)) {
    contentType = "application/javascript";
  }
  else if (/[\w\d]+.css/.test(file)) {
    contentType = "text/css";
  }

  fs.readFile(__dirname + file,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('500 Internal Server Error. Request: ' + file);
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

// application nonsense

// game variables
var pointsToWin = 10;

// map: socket.id -> player object
var players = new Map();
var host;

// current card judge
var cardCzar;

// current set of available cards
var whiteCardDeck;
var blackCardDeck;

// turn order
var turnOrder;
var turn;

var currentBlackCard;
var playersDone;

// for judging
var revealHiddenKey;
var revealCards;

// only a few states here
// WHITE_CARDS: players can play white cards
// JUDGE: card czar can act
// SETUP: internal setup phase
var currentPhase;

// reconnect events:
// should have client cache the socket id and send that to the server. the server should
// somehow then remap the old id to the new id

// network layer
io.on('connection', function (socket) {
  console.log("Connection from socket ID " + socket.id);
  players.set(socket.id, new Cradz.Player(socket));
  console.log("Players: " + players.size);

  if (players.size === 1) {
    // first player is the host (just go with it for now)
    setHost(socket.id);
  }

  socket.on('disconnect', function () {
    // want to not really delete the player but instead mark them as offline
    // for now delete to keep clean
    console.log("Disconnect from socket ID " + socket.id);
    players.delete(socket.id);
    // replace with setOffline(socket.id); at some point
  });

  socket.on('setName', function (name) {
    players.get(socket.id).name = name;
    console.log("Set player " + socket.id + " name to " + name);
  });

  socket.on('setPointsToWin', function (points) {
    if (host !== socket.id) {
      socket.emit('gameError', "nice try nerd, you're not the host, so you can't set the points to win.");
    }
    else {
      pointsToWin = points;
      console.log("Points to win: " + pointsToWin);
    }
  });

  socket.on('startGame', function () {
    if (host !== socket.id) {
      socket.emit('gameError', 'Only the Host can start a game.');
      return;
    }

    currentPhase = "SETUP";

    // construct decks
    loadDecks();

    // check that we have enough cards
    var canStart = checkCardCount();
    if (!canStart) {
      // checkCardCount() fires a message to users in event of failure
      return;
    }

    // clear player hands
    clearHands();

    // shuffle decks
    blackCardDeck.reshuffle();
    whiteCardDeck.reshuffle();

    // draw player hands
    dealStartHands();

    // set turn order
    setTurnOrder();

    // start the game (allow UI to set up)
    io.sockets.emit('gameStart');

    // choose the first card czar
    setCardCzar(0);

    // set up turn variables
    startTurn();
  });

  // stubbing player actions
  socket.on('playWhiteCard', function (cardID) {
    if (currentPhase != "WHITE_CARDS") {
      socket.emit('gameError', "You can't play white cards right now");
      return;
    }

    var success = players.get(socket.id).playCard(cardID);

    // check if the player is done playing cards.
    if (success) {
      if (players.get(socket.id).cardsPlayed.length >= players.get(socket.id).pick) {
        playersDone++;
        io.sockets.emit('anonFinished', playersDone);

        if (playersDone >= players.size - 1) {
          judgePhase();
        }
      }
    }
  });

  socket.on('cardCzarSelect', function (groupID) {
    if (currentPhase != "JUDGE") {
      socket.emit('gameError', "You can't judge things right now");
      return;
    }

    // check that the player is the card czar
    if (socket.id != cardCzar) {
      socket.emit('gameError', "You are not the Czar. You can't judge cards.");
      return;
    }

    // select the card/set of cards the judge likes
    var key = revealHiddenKey[groupID];
    if (revealCards[groupID].length == 0) {
      socket.emit('gameError', "The player you selected did not play cards.");
      return;
    }
    else {
      // assign points
      players.get(key).addPoint();
      console.log("Player " + key + " won. Now has " + players.get(key).points + " points");

      // check victory conditions
      if (players.get(key).points >= pointsToWin) {
        io.sockets.emit("gameOver", player.get(key).name);
        // something something reset to config menu
        return;
      }

      // update scores
      var scores = {};
      players.forEach(function (player, id, map) {
        scores[id] = player.points;
      });
      io.sockets.emit('updateScores', scores);

      // players draw cards
      players.forEach(function (player, id, map) {
        if (id === cardCzar)
          return;

        for (var i = 0; i < player.pick; i++) {
          player.addToHand(whiteCardDeck.draw());
        }
      });

      // control transfers to next card czar
      startTurn();
    }

    // players draw cards (except card czar)
    // control transfers to next card czar
  });
});

// game functions

function setHost(id) {
  host = id;
  players.get(id).socket.emit('setHost');
  console.log("Set host to " + id);
}

function loadDecks() {
  // TODO: user select for multiple deck types
  var cardSet = JSON.parse(fs.readFileSync("./data/base_set.json"));
  var cardID = 0;

  // load black cards
  var blackCards = cardSet["blackCards"];
  blackCardDeck = new Cradz.Deck();

  for (var i in blackCards) {
    var c = blackCards[i];
    blackCardDeck.addCard(new Cradz.Card(cardID, c.text, c.pick));

    console.log("Added black card " + c.text + " (" + cardID + ")");

    cardID++;
  }

  // white cards
  var whiteCards = cardSet["whiteCards"];
  whiteCardDeck = new Cradz.Deck();
  for (var i in whiteCards) {
    whiteCardDeck.addCard(new Cradz.Card(cardID, whiteCards[i], 1));

    console.log("Added white card " + whiteCards[i] + " (" + cardID + ")");

    cardID++;
  }

  console.log("Decks loaded. " + blackCardDeck.cardCount + " black cards, " + whiteCardDeck.cardCount + " white cards");
}

function checkCardCount() {
  // 10 card hands
  // TODO: I forgot about the existence of pick 2/3 so the min should account for that
  var maxRounds = pointsToWin * (players.size - 1) + 1;
  var minWhiteCards = maxRounds * players.size + 10 * players.size;
  var minBlackCards = maxRounds;

  console.log("Required white cards: " + minWhiteCards + "\nRequired Black Cards: " + minBlackCards);

  if (whiteCardDeck.cardCount < minWhiteCards || blackCardDeck.cardCount < minBlackCards) {
    notEnoughCards(minWhiteCards, minBlackCards, whiteCardDeck.cardCount, blackCardDeck.cardCount);
    return false;
  }

  return true;
}

function notEnoughCards(reqWhite, reqBlack, haveWhite, haveBlack) {
  io.sockets.emit('cardCountFail', reqWhite, reqBlack, haveWhite, haveBlack);
}

function clearHands() {
  players.forEach(function (player, key, map) {
    player.clearHand();
  });
}

function dealStartHands() {
  for (var i = 0; i < 10; i++) {
    players.forEach(function (player, id, map) {
      var card = whiteCardDeck.draw();
      player.addToHand(card);
    });
  }
}

function setTurnOrder() {
  turnOrder = [];
  players.forEach(function (player, id, map) {
    turnOrder.push(id);
  });

  Cradz.shuffleArray(turnOrder);
  console.log("Turn order set");
  console.log(turnOrder);

  turn = 0;
}

function setCardCzar(turn) {
  // based on turn, will pick a card czar
  players.forEach(function (player, id, map) {
    player.unsetJudge();
  });

  cardCzar = turnOrder[turn % players.size];
  players.get(cardCzar).setJudge();
  turn++;

  console.log("Turn " + turn + " Czar is " + cardCzar);
}

function startTurn() {
  // a black card is dealt
  currentBlackCard = blackCardDeck.draw();
  playersDone = 0;
  io.sockets.emit('setBlackCard', currentBlackCard);

  // players have a quota of cards to play based on the black card's pick value
  players.forEach(function (player, id, map) {
    player.turnSetup(currentBlackCard.pick);
  });

  currentPhase = "WHITE_CARDS";
}

function judgePhase() {
  // this is when the picks are revealed and the card czar does the judging
  // randomize the order of the groups
  currentPhase = "JUDGE";

  var order = turnOrder;
  revealHiddenKey = {};
  revealCards = {};

  Cradz.shuffleArray(order);

  // create the hidden key
  for (var i = 0; i < order.length; i++) {
    revealHiddenKey[i] = order[i];
  }

  console.log(revealHiddenKey);
  
  // create the reveal map
  for (var i = 0; i < order.length; i++) {
    var cardsPlayed = players.get(order[i]).cardsPlayed;
    revealCards[i] = cardsPlayed;
  }

  console.log(revealCards);

  // send to all players, allow judge to make a selection
  io.sockets.emit('cardsRevealed', revealCards);
}