// Dependencies.
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

//app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Heroku
app.set('port', (process.env.PORT || 5000))

/*app.listen(app.get('port'), function() {
	console.log(`Bot en fonction sur le port ${app.get('port')}`);
})*/

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(app.get('port'), function() {
  console.log('Starting server on port 5000');
});

var players = {};
io.on('connection', function(socket) {
  socket.on('new player', function() {
    players[socket.id] = {
      x: 300,
      y: 300
    };
  });
  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
    if (data.left) {
      player.x -= 5;
    }
    if (data.up) {
      player.y -= 5;
    }
    if (data.right) {
      player.x += 5;
    }
    if (data.down) {
      player.y += 5;
    }
  });

	socket.on('disconnect', function(data) {
		console.log('Got disconnect!');
		console.log(players);
		delete players[socket.id];
		console.log(players);
	});



});



setInterval(function() {
  io.sockets.emit('state', players);
}, 1000 / 60);
