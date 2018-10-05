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

var canvasBound = {
	min_x : 0,
	max_x : 800,
	min_y : 0,
	max_y : 800
};

var players = {};
var projectiles = [];
io.on('connection', function(socket) {

	socket.on('new player', function() {
		players[socket.id] = {
			x: 300,
			y: 300,
			color: getRandomColor()
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

		if (player.x <= canvasBound.min_x - 10){
			player.x = canvasBound.max_x
		}
		if (player.x >= canvasBound.max_x + 10){
			player.x = canvasBound.min_x
		}
		if (player.y <= canvasBound.min_y - 10){
			player.y = canvasBound.max_y;
		}
		if (player.y >= canvasBound.max_y + 10){
			player.y = canvasBound.min_y;
		}
	});

	socket.on('projectile', function(data) {
		console.log(data);
		projectiles.push({
			x: data.x,
			y: data.y,
			pX: players[socket.id].x,
			pY: players[socket.id].y,
			angleY: Math.atan((data.y - players[socket.id].y ) / (data.x - players[socket.id].x))
			
		});

		let currentP = projectiles[projectiles.length-1];
		if (currentP.pX < currentP.x) {
			currentP.dir = 'right';
		} else {
			currentP.dir = 'left';
		}
		console.log(projectiles[projectiles.length-1].angleY);

		console.log(projectiles[projectiles.length-1].pX);
		console.log(projectiles[projectiles.length-1].pY);

	});

	socket.on('rm-all-proj', function() {
		projectiles = [];
	});

	socket.on('disconnect', function(data) {
		console.log('Got disconnect!');
		console.log(players);
		delete players[socket.id];
		console.log(players);
	});


}); // end io connection


setInterval(function() {
	io.sockets.emit('state', players);

	for (var p in projectiles) {
		if (projectiles[p].dir == 'right') {
			projectiles[p].x += 1;
			projectiles[p].y += 1 * projectiles[p].angleY;
		} else {
			projectiles[p].x -= 1;
			projectiles[p].y -= 1 * projectiles[p].angleY;
		}
	}
	io.sockets.emit('projectiles', projectiles);
}, 1000 / 60);


function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}
