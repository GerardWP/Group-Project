function textToSpeech(string) {

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
        success: function(response){
            console.log(response);
        }
    });
}


textToSpeech("Hello World");