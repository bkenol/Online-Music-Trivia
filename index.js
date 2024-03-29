var express = require('express');

var path = require('path');

var app = express();

var trivia = require('./triviagame');

 app.use(express.logger('dev'));

app.use(express.static(path.join(__dirname,'public')));

var server = require('http').createServer(app).listen(process.env.PORT || 1000);

var io = require('socket.io').listen(server);

io.set('log level',1);

io.sockets.on('connection', function (socket) {
    console.log('client connected');
    trivia.initGame(io, socket);
});


