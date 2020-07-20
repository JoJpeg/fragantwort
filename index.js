const express = require('express');
const Datastore = require('nedb');

const { request, response } = require('express');
const app = express();
var server = app.listen(3000, () => console.log("listening to 3000"));
app.use(express.static('public'));
app.use(express.json({limit: '1mb'} ));

var socket = require('socket.io');
var io = socket(server);
io.sockets.on('connection', newConnection);


var questions;
loadQuestions();
console.log(questions);
setTimeout(loadQuestions, 10000000);

//C:\Users\Jo3\Dropbox (Privat)\Projekte\Laden\Fragen Site\questions.txt
//console.log(decDir);

const database = new Datastore('database.db');
database.loadDatabase();

app.post('/sendData', (request, response) => {
    //TODO: log ips for spam
    console.log('I got a request:');
    console.log(request.body);
    data = request.body;
    const timestamp = Date.now();
    data.timestamp = timestamp;
    verify(data);
    response.json({
        status: 'success'
    });
});

app.get('/getQuestion', (request, response) => {
    var r = Math.round(Math.random() * (questions.data.length -1));
    var q = questions['data'][parseInt(r)];
    console.log("Question " + r + "/" + questions.data.length + " :" + q);
    response.json(q);
});


function verify(data){
    database.find({ip: data.ip}, function(err, docs){
        //if(docs.length == 0) return;
        var timePassed;
        var existingQuestions;
        docs.sort(function(a, b){
            return a.timestamp - b.timestamp;
        })
        existingQuestions = docs;
        timePassed = data.timestamp - docs[docs.length-1].timestamp;
        console.log(data.ip + " (" + timePassed + "):" + data.answer);
        if(timePassed < 10000 ) {
            console.log("Spam");
            return false;
        }else{
            saveData(data);
        }
    });
}

function saveData(data){
    database.insert(data);
    notifyAnswerSite(data);
}

function loadQuestions(){
    console.log("loading Questions");
    questions = require('./public/questions.json');
}

function newConnection(socket) {
    console.log("connection established: " + socket.id);
}

function notifyAnswerSite(data){
    console.log("sending answer");
    io.emit('answer', data.answer);
}