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

exports.Player = Player;