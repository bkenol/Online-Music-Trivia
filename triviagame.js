var io;
var gameSocket;

var api = require('./questions');

exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostCountdownFinished', hostStartGame);
    gameSocket.on('hostNextRound', hostNextRound);
    gameSocket.on('createArray', createArray);

    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerAnswer', playerAnswer);
    gameSocket.on('playerRestart', playerRestart);
}

function hostCreateNewGame() {
    var thisGameId = ( Math.random() * 100000 ) | 0;
    

    this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});

    this.join(thisGameId.toString());
};

function getQuestions(api){

    var alreadyUsed = [];
    var questionArray = [];
    while (questionArray.length < 20) {
     var questionIndex = (Math.random() * 50) |0;
     if (!alreadyUsed.includes(questionIndex)){
        alreadyUsed.push(questionIndex);
        questionArray.push(
        {
            "answer"  :  api.results[questionIndex].correct_answer,
            "decoys" : api.results[questionIndex].incorrect_answers,
            "question": api.results[questionIndex].question
        }
        )
     } 
     console.log('this is indexes used :', alreadyUsed)
    }
    return questionArray;
}

function hostPrepareGame(gameId) {
    var sock = this;
    var data = {
        mySocketId : sock.id,
        gameId : gameId
    };
    io.sockets.in(data.gameId).emit('beginNewGame', data);
}

function hostStartGame(gameId) {
    console.log('Game Started.');
    sendWord(0,gameId);
};

function hostNextRound(data) {
    if(data.round < wordPool.length ){
        sendWord(data.round, data.gameId);
    } else {
        io.sockets.in(data.gameId).emit('gameOver',data);
    }
}

function playerJoinGame(data) {
    var sock = this;

    var room = gameSocket.manager.rooms["/" + data.gameId];

    if( room != undefined ){
        data.mySocketId = sock.id;

        sock.join(data.gameId);
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    } else {
        this.emit('error',{message: "This room does not exist."} );
    }
}

function playerAnswer(data) {
    console.log("Player answered");
    io.sockets.in(data.gameId).emit('hostCheckAnswer', data);
}

function playerRestart(data) {
    data.playerId = this.id;
    io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
}

function sendWord(wordPoolIndex, gameId) {
    var data = getWordData(wordPoolIndex);
    io.sockets.in(gameId).emit('newWordData', data);
}

function getWordData(i){
    var question = wordPool[i].question;
    var answer = wordPool[i].answer;
    //var words = shuffle(wordPool[i].words);
    var decoys = shuffle(wordPool[i].decoys).slice(0,3);
    var rnd = Math.floor(Math.random() * 4);
    //decoys.splice(rnd, 0, words[1]);
    decoys.splice(rnd, 0, answer);

    var wordData = {
        round: i,
        question: question,
        // word : words[0],   
        answer : answer, 
        list : decoys
    };
    console.log(wordData);

    return wordData;
}

function shuffle(array) {
    var currentIndex = array.length;
    var temporaryValue;
    var randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function createArray(data){
    //console.log(data);
}

var wordPool = getQuestions(api);
console.log("this is: "+ wordPool);
// var wordPool = [

//     {
//         "answer"  :  "Mr. Rogers",
//         "decoys" : ["Batman","Chuck Norris","Godzilla"],
//         "question": "In the song The Ultimate Showdown of Ultimate Destiny, who is the only one to survive the battle?",
//         "words": ["Batman","Chuck Norris","Godzilla", "Mr.Rogers"]
//     },{
//         "answer"  :  "The Wall",
//         "decoys" : ["Abbey Road","Magical Mystery Tour","Revolver"],
//         "question": "Which of these is NOT an album released by The Beatles?"
//     },{
//         "answer"  :  "Eleanor Rigby",
//         "decoys" : ["Loretta Martin","Molly Jones","Lady Madonna"],
//         "question": "According to a Beatles song, who kept her face in a jar by the door?"
//     },{
//         "answer"  :  "Portuguese",
//         "decoys" :["Japanese","French","Spanish"],
//         "question": "Which of these languages was NOT included in the 2016 song Dont Mind by Kent Jones?"
//     },{
//         "answer"  :  "Canada",
//         "decoys" : ["United States","United Kingdom","Germany"],
//         "question": "EDM record label Monstercat is based in which country?"
//     }
//     // {
//     //     "words"  : [ "sale","seal","ales","leas" ],
//     //     "decoys" : [ "lead","lamp","seed","eels","lean","cels","lyse","sloe","tels","self" ]
//     // },

//     // {
//     //     "words"  : [ "item","time","mite","emit" ],
//     //     "decoys" : [ "neat","team","omit","tame","mate","idem","mile","lime","tire","exit" ]
//     // },

//     // {
//     //     "words"  : [ "spat","past","pats","taps" ],
//     //     "decoys" : [ "pots","laps","step","lets","pint","atop","tapa","rapt","swap","yaps" ]
//     // },

//     // {
//     //     "words"  : [ "nest","sent","nets","tens" ],
//     //     "decoys" : [ "tend","went","lent","teen","neat","ante","tone","newt","vent","elan" ]
//     // },

//     // {
//     //     "words"  : [ "pale","leap","plea","peal" ],
//     //     "decoys" : [ "sale","pail","play","lips","slip","pile","pleb","pled","help","lope" ]
//     // },

//     // {
//     //     "words"  : [ "races","cares","scare","acres" ],
//     //     "decoys" : [ "crass","scary","seeds","score","screw","cager","clear","recap","trace","cadre" ]
//     // },

//     // {
//     //     "words"  : [ "bowel","elbow","below","beowl" ],
//     //     "decoys" : [ "bowed","bower","robed","probe","roble","bowls","blows","brawl","bylaw","ebola" ]
//     // },

//     // {
//     //     "words"  : [ "dates","stead","sated","adset" ],
//     //     "decoys" : [ "seats","diety","seeds","today","sited","dotes","tides","duets","deist","diets" ]
//     // },

//     // {
//     //     "words"  : [ "spear","parse","reaps","pares" ],
//     //     "decoys" : [ "ramps","tarps","strep","spore","repos","peris","strap","perms","ropes","super" ]
//     // },

//     // {
//     //     "words"  : [ "stone","tones","steno","onset" ],
//     //     "decoys" : [ "snout","tongs","stent","tense","terns","santo","stony","toons","snort","stint" ]
//     // }
// ]
