class Player {
  constructor(socket) {
    this.socket = socket;
  }

  set namne(name) {
    this.name = name;
  }

  get name() {
    return this.name;
  }

  // player needs:
  // -hand
  // --play card
  // --draw card(card)
  // -points
  // -isJudge (determine if can play hand)
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