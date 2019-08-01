//function for converting a string to an mp3 byte array
function textToSpeech(string) {
    //creating the request body of the query
    data = {
        "input": {
            text: string
        },
        "voice": {
            "languageCode": "en-US",
            "ssmlGender": "MALE"
        },
        "audioConfig": {
            "audioEncoding": "MP3" 
        }
    }

    $.ajax({
        url: "https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=AIzaSyDFxmA0dJPQQvj_K20QPqdHBdPfqfNKQQs",
        dataType: "json",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        processData: false,
        success: function (response) {
            console.log(atob(response.audioContent));
            return test = Uint8Array.from(atob(response.audioContent), c => c.charCodeAt(0));
        }
    });
}

// var test;
var context; // Audio context
var buf; // Audio buffer

function init() {
    if (!window.AudioContext) {
        if (!window.webkitAudioContext) {
            alert("Your browser does not support any AudioContext and cannot play back this audio.");
            return;
        }
        window.AudioContext = window.webkitAudioContext;
    }
    console.log('create audio context')
    context = new AudioContext();
}

function playByteArray(byteArray) {

    var arrayBuffer = new ArrayBuffer(byteArray.length);
    var bufferView = new Uint8Array(arrayBuffer);
    for (i = 0; i < byteArray.length; i++) {
        bufferView[i] = byteArray[i];
    }

    console.log('before decode');

    let x = context.decodeAudioData(arrayBuffer, function (buffer) {
        buf = buffer;
        console.log('after decode');
        play();
    }).catch(err => console.error(err));
}

// Play the loaded file
function play() {
    console.log('play');
    // Create a source node from the buffer
    var source = context.createBufferSource();
    source.buffer = buf;
    // Connect to the final output node (the speakers)
    source.connect(context.destination);
    // Play immediately
    let x = source.start(0);
}

var test = textToSpeech("I hope you get food poisoning");

$("#click").on("click", function () {
    
    init();
    playByteArray(test);
})
