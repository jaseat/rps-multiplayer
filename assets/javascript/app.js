var config = {
    apiKey: "AIzaSyCHmN_Icf6o4ggQldcqrtQU3NStRRJXYIA",
    authDomain: "rps-game-52542.firebaseapp.com",
    databaseURL: "https://rps-game-52542.firebaseio.com",
    projectId: "rps-game-52542",
    storageBucket: "",
    messagingSenderId: "54679651880"
  };

firebase.initializeApp(config);

var database = firebase.database();
var playerRef = database.ref("players");
var chatRef = database.ref("chat");

var thisPlayer = 0;
var player = {
    losses: 0,
    wins: 0,
    ties: 0,
    name: ''
}
var players = [null, false, false];
var turn = 0;
var lastTurn = 0;

var opposing = function(){
    return thisPlayer === 1 ? 2 : 1;
}

var playerExists = playerNum =>{
    return playerRef.child(playerNum).once("value").then(snapshot => snapshot.exists())
}

var logPlayer = event => {
    event.preventDefault();
    var name = $("#name").val();
    playerExists('1').then(res => {
        if(res === true){
            playerExists('2').then(res => {
                if(res === true){
                    alert('Room is full');
                }
                else{
                    //log player 2
                    players[2] = true;
                    thisPlayer = 2;
                    playerRef.update({
                        '2' : {
                            'name': name,
                            'wins': 0,
                            'losses': 0
                        }
                    });
                    player.name = name;
                    $("#display").html("Hi " + name + "! You are player 2");
                    var disconnectRef = chatRef.push();
                    disconnectRef.onDisconnect().set({
                        name: player.name,
                        text: 'has disconnected',
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    })
                    playerRef.child('2').onDisconnect().set({});
                    playerRef.child('turn').onDisconnect().set(0);
                    playerRef.update({
                        'turn': 1
                    })
                }
            })
        }
        else{
            //log player 1
            players[1] = true;
            thisPlayer = 1;
            playerRef.update({
                '1' : {
                    'name': name,
                    'wins': 0,
                    'losses': 0
                }
            });
            player.name = name;
            $("#display").html("Hi " + name + "! You are player 1");
            var disconnectRef = chatRef.push();
                disconnectRef.onDisconnect().set({
                    name: player.name,
                    text: 'has disconnected',
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                })
            playerRef.child('1').onDisconnect().set({});
            playerRef.child('turn').onDisconnect().set(0);
            playerExists('2').then(res => {
                if(res === true){
                    playerRef.update({
                        'turn': 1
                    })
                }
            })
            
        }
    });

}

var displayPlayer = (num, data) => {
    $("#player-"+num+"-name").text(data[num].name)
    $("#player-"+num+"-count").text("Wins: " + data[num].wins + " Losses: " + data[num].losses)
    if(players[num] === true && turn === num){
        $('#player-'+opposing()+'-selection').empty();
        var selection = $("<div>");
        var rock = $("<div>");
        var paper = $("<div>");
        var scissors = $("<div>");
        rock.addClass("pick");
        paper.addClass("pick");
        scissors.addClass("pick");
        rock.html("Rock");
        paper.html("Paper");
        scissors.html("Scissors");
        rock.attr("choice", "Rock");
        paper.attr("choice", "Paper");
        scissors.attr("choice", "Scissors");
        selection.append(rock);
        selection.append(paper);
        selection.append(scissors);
        $("#player-"+num+"-selection").html(selection);
    }
};

var clearPlayer = (num) => {
    $("#player-"+num+"-name").html("Waiting for Player " + num);
    $("#player-"+num+"-selection").empty();
    $("#player-"+num+"-count").empty();
}

var calculateResults = data => {
    var oppositePlayerChoice = data[opposing()].choice;
    var thisPlayerChoice = data[thisPlayer].choice;
    $("#player-"+opposing()+"-selection").html("<h1>"+oppositePlayerChoice+"</h1>");
    if(thisPlayerChoice === "Rock"){
        if(oppositePlayerChoice === "Rock"){
            tie(data);
        }
        else if(oppositePlayerChoice === "Paper"){
            lose(data);
        }
        else if(oppositePlayerChoice === "Scissors"){
            win(data);
        }
    }
    else if(thisPlayerChoice === "Paper"){
        if(oppositePlayerChoice === "Rock"){
            win(data);
        }
        else if(oppositePlayerChoice === "Paper"){
            tie(data);
        }
        else if(oppositePlayerChoice === "Scissors"){
            lose(data);
        }
    }
    else if(thisPlayerChoice === "Scissors"){
        if(oppositePlayerChoice === "Rock"){
            lose(data);
        }
        else if(oppositePlayerChoice === "Paper"){
            win(data);
        }
        else if(oppositePlayerChoice === "Scissors"){
            tie(data);
        }
    }
    setTimeout(sendData, 3000);
}

var sendData = function(){
    $("#player-1-selection").empty();
    $("#player-2-selection").empty();
    playerRef.child(thisPlayer).update(player);
}

var displayWinner = winner => {
    $("#message").html("<h1>"+winner + " wins!");
}

var win = data =>{
    player.wins += 1;
    displayWinner(player.name);
}
var lose = data =>{
    player.losses += 1;
    displayWinner(data[opposing()].name);
}
var tie = data =>{
    player.ties += 1;
    $("#message").html("<h1>Tie game!");
}

var updateDisplay = snapshot => {
    if(lastTurn === 2 && turn === 1){
        calculateResults(snapshot.val());
        return 0;
    }
    $("#message").empty();
    if(snapshot.hasChild("1")){
        displayPlayer(1, snapshot.val());
    }
    else{
        clearPlayer(1);
        $('#player-2-selection').empty();
        lastTurn = 0;
    }
    if(snapshot.hasChild("2")){
        displayPlayer(2, snapshot.val());
    }
    else{
       clearPlayer(2);
       $('#player-1-selection').empty();
       lastTurn = 0;
    }
}

playerRef.on("value", snapshot => {
    lastTurn = turn;
    turn = snapshot.val().turn;

    updateDisplay(snapshot);
})

var select = function(){
    var choice = $(this).attr("choice");
    $("#player-"+thisPlayer+"-selection").html("<h1>"+choice+"</h1>");
    var update = {
        turn: turn === 1 ? 2 : 1
    };
    player.choice = choice;
    update[thisPlayer] = player;
    
    playerRef.update(update);
}

var submitChat = event => {
    event.preventDefault();
    var message = {
        name: player.name,
        text: $("#text").val(),
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }
    if(thisPlayer !== 0)
        chatRef.push(message);
    else{
        alert("You are not a player");
    }
    $("#text").val('');
}

var displayChat = data => {
    var message = $("<p>");
    var name = $("<span>");
    name.html(data.name+": ");
    name.addClass("name");
    message.append(name);
    message.append(data.text);
    $("#chat-display").append(message);
}

chatRef.orderByChild('timestamp').on("child_added", snapshot => {
    displayChat(snapshot.val());
})

$(document).ready(function() {
    $("#name-form").on("submit", logPlayer);
    $("#chat-form").on("submit", submitChat);
    $(document).on("click", ".pick", select);
});