var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
const recognition = new SpeechRecognition();
const synthesis = window.speechSynthesis;

recognition.continuous = false; //
recognition.lang = 'fr-FR';
recognition.interimResults = false; //
recognition.maxAlternatives = 1;

recognition.addEventListener("result", (event) => {
    var text = event.results[0][0].transcript;
    input.value = text;
    console.log('Confidence: ' + event.results[0][0].confidence);
});


const input = document.querySelector('#input-user');
const talkBtn = document.querySelector("#talk-btn");

$('#talk-btn').on("click", (event) => {
    recognition.start();
    console.log("recording")
});

/*
Documentation for tonyb's API : https//:justbrowse.io


GET: /api/chatgpt/connect?sessionToken=<token>
 RETURNS: {id: string, status: 'pending'}

GET: /api/chatgpt/status?id=<id>
 RETURNS: {id: string, status: 'pending' | 'failed' | 'ready', reason: string}

POST: /api/chatgpt/chat/:id
 BODY: {message: string, conversationId: string | null, parentId: string | null}
      NOTE: conversationId is optional, if you omit it will start a new conversation
 RETURNS: {id: string, reply: Array<string>, conversationId: string, parentId: string, status: 'pending' | 'failed' | 'ready'}
*/

function connectAPI () {
    $.ajax({
        type: 'GET',
        url: 'https://justbrowse.io/api/chatgpt/connect',
        data: {
            sessionToken: ''
        },
        success: function(data) {
            console.log(data)
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}


function checkStatusChatGPT() {
    $.ajax({
        type: 'GET',
        url: 'https://justbrowse.io/api/chatgpt/status',
        data: {
            sessionId: 'JrP-Rz8LZES00imT-i9Xe'
        },
        success: function(data) {
            console.log(data["status"])
            if (data['status'] === 'failed') {
                $('#icon-status-circle').css("background-color", "red");
                $('#title-status-txt').css("color", "red");
                $('#title-status-txt').text('Offline');
            } else if (data['status'] === 'ready') {
                $('#icon-status-circle').css("background-color", "green");
                $('#title-status-txt').css("color", "green");
                $('#title-status-txt').text('Online');
            } else {
                $('#icon-status-circle').css("background-color", "orange");
                $('#title-status-txt').css("color", "orange");
                $('#title-status-txt').text('Pending');
            }
            
        },
        error: function(xhr, status, error) {
            $('#icon-status-circle').css("background-color", "red");
            $('#title-status-txt').css("color", "red");
            $('#title-status-txt').text('Offline');
            console.log("checkStatus", xhr);
        }
    });
}
checkStatusChatGPT();

function addWritingMessageBot() {
    return `<div class="msg msg-chatgpt">
                <div class="dot-flashing"></div>
            </div>`;
}

function playMessageNotif(type) {
    if (type == "sent") {
        var audio = new Audio('audio/message_sent.mp3')
    } else {
        var audio = new Audio('audio/message_received.mp3')
    }

    audio.play();
}

function addMessageBot(msg) {
    var html = "<div class='msg msg-chatgpt'>"+
               "<p>"+msg+"</p>"+
               "<p class='msg-time'>"+getCurrentTime()+"</p>"+
               "</div>";
    $('#chat-container').append(html);
}

function addMessageUser(msg) {
    var html = "<div class='msg msg-user'>"+
               "<p>"+msg+"</p>"+
               "<p class='msg-time'>"+getCurrentTime()+"</p>"+
               "</div>";
    $('#chat-container').append(html);
}

function addMessageBotError(msg) {
    var html = "<div class='msg-user-error'>"+
                "<ion-icon name='close-circle-outline' size='small'></ion-icon>"+
                "<p>"+ msg +"</p>"+
                "</div>";
    $('#chat-container').append(html);
}

function preg_replace(pattern, replacement, string) {
    // eslint-disable-line camelcase
    //   original by: rony2k6 (https://github.com/rony2k6)
    //   example 1: preg_replace('/xmas/i', 'Christmas', 'It was the night before Xmas.')
    //   returns 1: "It was the night before Christmas."
    //   example 2: preg_replace('/xmas/ig', 'Christmas', 'xMas: It was the night before Xmas.')
    //   returns 2: "Christmas: It was the night before Christmas."
    //   example 3: preg_replace('\/(\\w+) (\\d+), (\\d+)\/i', '$11,$3', 'April 15, 2003')
    //   returns 3: "April1,2003"
    //   example 4: preg_replace('/[^a-zA-Z0-9]+/', '', 'The Development of code . http://www.')
    //   returns 4: "TheDevelopmentofcodehttpwww"
    //   example 5: preg_replace('/[^A-Za-z0-9_\\s]/', '', 'D"usseldorfer H"auptstrasse')
    //   returns 5: "Dusseldorfer Hauptstrasse"
    let _flag = pattern.substr(pattern.lastIndexOf(pattern[0]) + 1)
    _flag = (_flag !== '') ? _flag : 'g'
    const _pattern = pattern.substr(1, pattern.lastIndexOf(pattern[0]) - 1)
    const regex = new RegExp(_pattern, _flag)
    const result = string.replace(regex, replacement)
    return result
}


function formatMsg(msg) {
    // format code
    new_msg = preg_replace("/\\`\\`\\`([^\\`]+)\\`\\`\\`/", '<code>$1</code>', msg) // 3 apostrophe
    new_msg = preg_replace("/\\`([^\\`]+)\\`/", '<code>$1</code>', msg) // 1 apostrophe

    return msg
}

function getCurrentTime () {
    var now = new Date();
    return now.getHours() + ":" + now.getMinutes();
}

var conversationID = ""

$(document).ready(function() {
    $('#form').on('submit', function(event) {

        //checkStatusChatGPT();

        var inputText = $('#input-user').val();

        addMessageUser(inputText);
        playMessageNotif("sent");

        $('#chat-container').last()[0].scrollIntoView();

        if(conversationID === "") {
            $.ajax({
                type: 'POST',
                url: 'https://justbrowse.io/api/chatgpt/chat/JrP-Rz8LZES00imT-i9Xe',
                data: {message: inputText},
                beforeSend: function(request) {
                    $('#chat-container').append(addWritingMessageBot());
                },
                success: function(data) {
                    console.log(data);
                    var msg = data["reply"][0]
                    conversationID = data["conversationId"]
                    parentID = data["parentId"]
                    msg_formated = formatMsg(msg)
                    console.log(msg_formated)
                    // supprimer le message "Writing"
                    $('#chat-container').children().last().remove();
                    // on ajoute le message reçu
                    addMessageBot(msg_formated)
                    playMessageNotif("received");
                    //const utter = new SpeechSynthesisUtterance(data["reply"][0])
                    //synthesis.speak(utter);
                    $('#chat-container').last()[0].scrollIntoView();
                },
                error: function(xhr, status, error) {
                    // supprimer le message "Writing"
                    $('#chat-container').children().last().remove();
                    addMessageBotError(xhr);
                    console.log(xhr);
                }
            });
        } else {
            $.ajax({
                type: 'POST',
                url: 'https://justbrowse.io/api/chatgpt/chat/JrP-Rz8LZES00imT-i9Xe',
                data: {
                    message: inputText,
                    conversationId: conversationID,    
                    parentId: parentID},
                beforeSend: function(request) {
                    $('#chat-container').append(addWritingMessageBot());
                },
                success: function(data) {
                    console.log(data);
                    var msg = data["reply"][0]
                    msg_formated = formatMsg(msg)
                    console.log(msg_formated)
                    // supprimer le message "Writing"
                    $('#chat-container').children().last().remove();
                    // on ajoute le message reçu
                    addMessageBot(msg_formated)
                    playMessageNotif("received");
                    //const utter = new SpeechSynthesisUtterance(data["reply"][0])
                    //synthesis.speak(utter);
                    $('#chat-container').last()[0].scrollIntoView();
                },
                error: function(xhr, status, error) {
                    // supprimer le message "Writing"
                    $('#chat-container').children().last().remove();
                    addMessageBotError(xhr);
                    console.log(xhr);
                }
            });



        }


        event.preventDefault();
    });
});