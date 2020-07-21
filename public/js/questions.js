
var question;    
var lastTimeStamp = 0;     
getQuestion();
async function getQuestion(){
    var response = await fetch('/getQuestion');
    const data = await response.json();
    console.log("Question:")
    console.log(data);
    question = data;
    document.getElementById('question').textContent = data;
}
var ip;

function sendData(){
    const answer = document.getElementById("answer").value;
    const data =  {question, answer, ip};
    const timestamp = Date.now();
    if(timestamp - lastTimeStamp < 10000) {
        alert("Bitte warte ein paar Sekunden um eine neue Antwort zu verschicken");
        return;  
    }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify(data)
    };
    fetch('/sendData', options);

    getQuestion();
    document.getElementById("answer").value = "";
}
