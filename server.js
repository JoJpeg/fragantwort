const express = require('express');
const assert = require('assert');


const url = "mongodb+srv://main_user:PHEFOcEymMuHHBWU@fragantwort.kgc4b.mongodb.net/frageantwort?retryWrites=true&w=majority";
const MongoClient = require('mongodb').MongoClient;
const mongo = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true});

//const mongo = require('mongodb');


const { request, response } = require('express');
const app = express();
app.set('port', process.env.PORT || 8080);
var server = app.listen(process.env.PORT || 8080, () => console.log("Server stated"));
app.use(express.static('public'));
app.use(express.json({limit: '1mb'} ));

var socket = require('socket.io');
var io = socket(server);
io.sockets.on('connection', newConnection);


var questions;
loadQuestions();
console.log(questions);
//setTimeout(loadQuestions, 10000000);


app.post('/sendData', (request, response) => {
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
    response.json(q);
});


function verify(data){
    var resultArray = []; 
    mongo.connect(function(err, db) {
        assert.equal(null, err);
        const collection = mongo.db("fragantwort").collection("antworten");
        collection.insertOne(data, function(err, res) {
            console.log("Neue Antwort: ");
            console.log(data);
        });
        notifyAnswerSite(data); 
    }, function(){
        db.close();
    });
}

function loadQuestions(){
    questions = require('./public/questions.json');
}

function newConnection(socket) {
    console.log("New answer reader connected: " + socket.id);
}

function notifyAnswerSite(data){
    io.emit('answer', data.answer);
}