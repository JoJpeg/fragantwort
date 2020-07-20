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
    //TODO: log ips for spam
    //console.log('I got a request:');
    //console.log(request.body);
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
    var resultArray = []; 
    mongo.connect(function(err, db) {
        assert.equal(null, err);

        const cursor = db.db('fragantwort').collection('antworten').find();
        var spam = false;
        cursor.forEach(function(doc,err){
            assert.equal(null, err);
            resultArray.push(doc);
        }, function() {
            
            var entries = [];
            for (var i = 0; i < resultArray.length; i++){
                if (resultArray[i].ip == data.ip){
                    entries.push(resultArray[i]);
                }
              }

            entries.sort(function(a, b){
                return a.timestamp - b.timestamp;
            });
            
            entries.forEach(function(entry){
                timePassed = data.timestamp - entry.timestamp;
                //console.log(entry.ip + " (" + timePassed + "):" + entry.answer);
                if(timePassed < 10000 ) {
                    console.log("Spam:");
                    console.log(data)
                    spam = true;
                }
            });

            if(!spam){
                const collection = mongo.db("fragantwort").collection("antworten");
                collection.insertOne(data, function(err, res) {
                    console.log("Neue Antwort: ");
                    console.log(data);
                });
    
                notifyAnswerSite(data); 
            }

        });
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