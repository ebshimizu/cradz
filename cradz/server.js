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
var cradCzar;

// sets of the cards. id -> card object. players hands consist of an array of these ids.
var whiteCardList;
var blackCardList;

// current set of available cards
var whiteCardDeck = [];
var blackCardDeck = [];

// reconnect events:
// should have client cache the socket id and send that to the server. the server should
// somehow then remap the old id to the new id

io.on('connection', function (socket) {
  console.log("Connection from socket ID " + socket.id);
  players[socket.id] = new Cradz.Player(socket);

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
    players[socket.id].name = name;
    console.log("Set player " + socket.id + " name to " + name);
  });

  socket.on('setPointsToWin', function (points) {
    if (host !== socket.id) {
      
    }
  });
});

function setHost(id) {
  host = id;
  players[id].socket.emit('setHost');
}