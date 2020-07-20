const express = require('express');
const assert = require('assert');


const url = "mongodb+srv://main_user:PHEFOcEymMuHHBWU@fragantwort.kgc4b.mongodb.net/frageantwort?retryWrites=true&w=majority";
const MongoClient = require('mongodb').MongoClient;
const mongo = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true});

//const mongo = require('mongodb');


const { request, response } = require('express');
const app = express();
app.set('port', process.env.PORT || 8080);
var server = app.listen(process.env.PORT || 8080, () => console.log("listening to " + process.env.PORT));
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
    var resultArray; 
    mongo.connect(url, function(err, db) {
        assert.equal(null, err);

        const cursor = db.collection('antworten').find();

        cursor.forEach(function(doc,err){
            assert.equal(null, err);
            resultArray.push(doc);
        }, function() {
            db.close();
            resultArray.find({ip: data.ip}, function(err, docs){
                //if(docs.length == 0) return;
                var timePassed;
                var existingQuestions;
                docs.sort(function(a, b){
                    return a.timestamp - b.timestamp;
                });
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

        });
    });

    

}

function saveData(data){
    mongo.connect(url, function(err, db) {
        if (err) throw err;
        //const collection = mongo.db("fragantwort").collection("antworten");
        db.collection.insertOne(data, function(err, res) {
          if (err) {
              throw err;
          }
          else {
            console.log("document inserted");
            console.log(data);
            db.close();
          }
        });
      
        db.close();
      });
    //database.insert(data);
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