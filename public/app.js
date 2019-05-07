
jQuery(function($){    
    'use strict';

    var IO = {

        init: function() {
            IO.socket = io.connect();
            IO.bindEvents();
        },

        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('newWordData', IO.onNewWordData);
            IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );
        },

        onConnected : function() {
            App.mySocketId = IO.socket.socket.sessionid;

        },

        onNewGameCreated : function(data) {
            App.Host.gameInit(data);
        },

        playerJoinedRoom : function(data) {
            App[App.myRole].updateWaitingScreen(data);
        },

        beginNewGame : function(data) {
            App[App.myRole].gameCountdown(data);
        },

        onNewWordData : function(data) {
            App.currentRound = data.round;

            App[App.myRole].newWord(data);
        },

        hostCheckAnswer : function(data) {
            if(App.myRole === 'Host') {
                App.Host.checkAnswer(data);
            }
        },

        gameOver : function(data) {
            App[App.myRole].endGame(data);
        },

        error : function(data) {
            alert(data.message);
        }

    };

    var App = {
        gameId: 0,

        myRole: '',   // 'Player' or 'Host'
        mySocketId: '',
        currentRound: 0,

        init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();
            FastClick.attach(document.body);
        },

        cacheElements: function () {
            App.$doc = $(document);

            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$hostGame = $('#host-game-template').html();
        },

        bindEvents: function () {
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart',App.Player.onPlayerStartClick);
            App.$doc.on('click', '.btnAnswer',App.Player.onPlayerAnswerClick);
            App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
        },

        showInitScreen: function() {
            App.$gameArea.html(App.$templateIntroScreen);
            App.doTextFit('.title');
        },

        Host : {
            players : [],
            isNewGame : false,
            numPlayersInRoom: 0,
            currentCorrectAnswer: '',

            onCreateClick: function () {
                // console.log('Clicked "Create A Game"');
                IO.socket.emit('hostCreateNewGame');
            },

            gameInit: function (data) {
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.Host.numPlayersInRoom = 0;

                App.Host.displayNewGameScreen();
            },

            displayNewGameScreen : function() {
                // Fill the game screen with the appropriate HTML
                App.$gameArea.html(App.$templateNewGame);

                // Display the URL on screen
                $('#gameURL').text(window.location.href);
                App.doTextFit('#gameURL');

                // Show the gameId / room id on screen
                $('#spanNewGameCode').text(App.gameId);
            },

            updateWaitingScreen: function(data) {
                if ( App.Host.isNewGame ) {
                    App.Host.displayNewGameScreen();
                }

                $('#playersWaiting')
                    .append('<p/>')
                    .text('Player ' + data.playerName + ' joined the game.');

                App.Host.players.push(data);

                App.Host.numPlayersInRoom += 1;

                if (App.Host.numPlayersInRoom === 2) {

                    IO.socket.emit('hostRoomFull',App.gameId);
                }
            },

            gameCountdown : function() {

                App.$gameArea.html(App.$hostGame);
                App.doTextFit('#hostWord');

                var $secondsLeft = $('#hostWord');
                App.countDown( $secondsLeft, 5, function(){
                    IO.socket.emit('hostCountdownFinished', App.gameId);
                });

                $('#player1Score')
                    .find('.playerName')
                    .html(App.Host.players[0].playerName);

                $('#player2Score')
                    .find('.playerName')
                    .html(App.Host.players[1].playerName);

                $('#player1Score').find('.score').attr('id',App.Host.players[0].mySocketId);
                $('#player2Score').find('.score').attr('id',App.Host.players[1].mySocketId);
            },

            newWord : function(data) {
                // $('#hostWord').text(data.word);
                // App.doTextFit('#hostWord');

                $('#hostWord').text(data.question);
                // App.doTextFit('#hostWord');

                App.Host.currentCorrectAnswer = data.answer;
                App.Host.currentRound = data.round;
            },

            checkAnswer : function(data) {
                if (data.round === App.currentRound){
                    var $pScore = $('#' + data.playerId);

                    if( App.Host.currentCorrectAnswer === data.answer ) {
                        $pScore.text( +$pScore.text() + 5 );
                        App.currentRound += 1;

                        var data = {
                            gameId : App.gameId,
                            round : App.currentRound
                        }

                        IO.socket.emit('hostNextRound',data);

                    } else {
                        $pScore.text( +$pScore.text() - 3 );
                    }
                }
            },

            endGame : function(data) {
                var $p1 = $('#player1Score');
                var p1Score = +$p1.find('.score').text();
                var p1Name = $p1.find('.playerName').text();

                var $p2 = $('#player2Score');
                var p2Score = +$p2.find('.score').text();
                var p2Name = $p2.find('.playerName').text();

                var winner = (p1Score < p2Score) ? p2Name : p1Name;
                var tie = (p1Score === p2Score);

                if(tie){
                    $('#hostWord').text("It's a Tie!");
                } else {
                    $('#hostWord').text( winner + ' Wins!!' );
                }
                App.doTextFit('#hostWord');

                App.Host.numPlayersInRoom = 0;
                App.Host.isNewGame = true;
            },

            restartGame : function() {
                App.$gameArea.html(App.$templateNewGame);
                $('#spanNewGameCode').text(App.gameId);
            }
        },

        Player : {
            hostSocketId: '',
            myName: '',

            onJoinClick: function () {
                // console.log('Clicked "Join A Game"');

                // Display the Join Game HTML on the player's screen.
                App.$gameArea.html(App.$templateJoinGame);
            },

            onPlayerStartClick: function() {
                var data = {
                    gameId : +($('#inputGameId').val()),
                    playerName : $('#inputPlayerName').val() || 'anon'
                };

                IO.socket.emit('playerJoinGame', data);

                App.myRole = 'Player';
                App.Player.myName = data.playerName;
            },

            onPlayerAnswerClick: function() {
                console.log('Clicked Answer Button');
                var $btn = $(this);      // the tapped button
                var answer = $btn.val(); // The tapped word

                var data = {
                    gameId: App.gameId,
                    playerId: App.mySocketId,
                    answer: answer,
                    round: App.currentRound
                }

                console.log(answer);
                IO.socket.emit('playerAnswer', data);
            },

            onPlayerRestart : function() {
                var data = {
                    gameId : App.gameId,
                    playerName : App.Player.myName
                }
                IO.socket.emit('playerRestart',data);
                App.currentRound = 0;
                $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
            },

            updateWaitingScreen : function(data) {
                if(IO.socket.socket.sessionid === data.mySocketId){
                    App.myRole = 'Player';
                    App.gameId = data.gameId;

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
                }
            },

            gameCountdown : function(hostData) {
                App.Player.hostSocketId = hostData.mySocketId;
                $('#gameArea')
                    .html('<div class="gameOver">Get Ready!</div>');
            },

            newWord : function(data) {
                var $list = $('<ul/>').attr('id','ulAnswers');

                $.each(data.list, function(){
                    $list                                //  <ul> </ul>
                        .append( $('<li/>')              //  <ul> <li> </li> </ul>
                            .append( $('<button/>')      //  <ul> <li> <button> </button> </li> </ul>
                                .addClass('btnAnswer')   //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .addClass('btn')         //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .val(this)               //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>
                                .html(this)              //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                            )
                        )
                });
                $('#gameArea').html($list);
            },

            endGame : function() {
                $('#gameArea')
                    .html('<div class="gameOver">Game Over!</div>')
                    .append(
                        // Create a button to start a new game.
                        $('<button>Start Again</button>')
                            .attr('id','btnPlayerRestart')
                            .addClass('btn')
                            .addClass('btnGameOver')
                    );
            }
        },

        countDown : function( $el, startTime, callback) {

            $el.text(startTime);
            App.doTextFit('#hostWord');

            var timer = setInterval(countItDown,1000);

            function countItDown(){
                startTime -= 1
                $el.text(startTime);
                App.doTextFit('#hostWord');

                if( startTime <= 0 ){
                    clearInterval(timer);
                    callback();
                    return;
                }
            }

        },

        doTextFit : function(el) {
            textFit(
                $(el)[0],
                {
                    alignHoriz:true,
                    alignVert:false,
                    widthOnly:true,
                    reProcess:true,
                    maxFontSize:200
                }
            );
        }

    };

    IO.init();
    App.init();

}($));
