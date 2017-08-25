class Player {
  constructor(socket) {
    this.socket = socket;
    this.hand = new Map();
    this.isJudge = false;
    this.cardsPlayed = [];
    this.pick = 0;
    this.points = 0;
    this.name = '';
  }

  reset() {
    this.clearHand();
    this.unsetJudge();
    this.points = 0;
  }

  clearHand() {
    this.hand = new Map();
    this.socket.emit('clearHand');
  }

  addToHand(card) {
    this.hand.set(card.id, card);
    this.socket.emit('drawHand', card);

    console.log("Player " + this.socket.id + " drew card " + card.text + " (" + card.id + "). Now has " + this.hand.size + " cards.");
  }

  setJudge() {
    this.isJudge = true;
    this.socket.emit('setCardCzar');
  }

  unsetJudge() {
    this.isJudge = false;
    this.socket.emit('deposeCardCzar');
  }

  turnSetup(pick) {
    this.cardsPlayed = [];
    this.pick = pick;
  }

  playCard(cardID) {
    // check that player has that card
    if (this.hand.has(cardID)) {
      if (this.isJudge) {
        this.socket.emit('gameError', "The Card Czar cannot play white cards.");
        return false;
      }
      // if pick count has been met, player is prevented from playing more cards.
      if (this.cardsPlayed.length >= this.pick) {
        this.socket.emit('gameError', "You have already played your cards this turn");
        return false;
      }

      // play the card
      this.cardsPlayed.push(this.hand.get(cardID));
      console.log('Player ' + this.socket.id + ' played card ' + cardID);

      this.socket.emit('playedCard', this.hand.get(cardID));
      this.hand.delete(cardID);
      return true;
    }
    else {
      this.socket.emit('gameError', "You don't have that card.");
      return false;
    }
  }

  addPoint() {
    this.points++;
  }
}

class Card {
  constructor(id, text, pick) {
    this.id = id;
    this.text = text;
    this.pick = pick;
  }
}

class Deck {
  constructor() {
    // card list lists all cards that belong to this deck.
    this.cardList = new Map();

    // cards are all the cards CURRENTLY in the deck (can be modified)
    this.cards = [];
  }

  set name(name) {
    this.name = name;
  }

  get name() {
    return this.name;
  }

  get remaining() {
    return this.cards.length;
  }

  get cardCount() {
    return this.cardList.size;
  }
  
  // Decks are only allowed to have one of each unique ID card
  // if you add cards to the deck, make sure you call reshuffle()
  // before drawing.
  addCard(card) {
    if (this.cardList.has(card.id)) {
      console.log("ERROR: Deck already has card ID " + card.id);
      return;
    }

    this.cardList.set(card.id, card);
  }

  // reinitializes the deck from the cardList
  // callers responsibility to ensure cards are returned to the deck by
  // players, the deck doesn't care.
  reshuffle() {
    // add everything to a new array
    var tempCards = [];
    this.cardList.forEach(function (value, key, map) {
      tempCards.push(value);
    });

    shuffleArray(tempCards);
    this.cards = tempCards;
  }

  // randomizes the current cards, does not add back anything
  // from the card list.
  shuffle() {
    shuffleArray(this.cards);
  }

  draw() {
    // returns a card from the deck. if the deck isn't ready or is out of cards,
    // returns null.
    return this.cards.pop();
  }
}

function shuffleArray(a) {
  for (let i = a.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
}

exports.Player = Player;
exports.Card = Card;
exports.Deck = Deck;
exports.shuffleArray = shuffleArray;