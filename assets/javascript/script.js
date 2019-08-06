$(document).ready(geolocate());

//function for converting a string to an mp3 byte array
function textToSpeech(string) {
    //creating the request body of the query
    data = {
        input: {
            text: string
        },
        voice: {
            languageCode: "en-US",
            ssmlGender: "MALE"
        },
        audioConfig: {
            audioEncoding: "MP3"
        }
    };

    var audio;

    $.ajax({
        url: "https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=AIzaSyDFxmA0dJPQQvj_K20QPqdHBdPfqfNKQQs",
        dataType: "json",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        processData: false,
        success: function (response) {
            //convert the base-64 encoded string into a byte array
            audio = Uint8Array.from(atob(response.audioContent), c =>
                c.charCodeAt(0)
            );
        },
        complete: function () {
            init();
            playByteArray(audio);
        }
    });
}

var context; // Audio context
var buf; // Audio buffer

//initialize audio context for each new audio file
function init() {
    if (!window.AudioContext) {
        if (!window.webkitAudioContext) {
            alert(
                "Your browser does not support any AudioContext and cannot play back this audio."
            );
            return;
        }
        window.AudioContext = window.webkitAudioContext;
    }
    context = new AudioContext();
}

//function for playing an array of bytes
function playByteArray(byteArray) {
    var arrayBuffer = new ArrayBuffer(byteArray.length);
    var bufferView = new Uint8Array(arrayBuffer);
    for (i = 0; i < byteArray.length; i++) {
        bufferView[i] = byteArray[i];
    }

    let x = context
        .decodeAudioData(arrayBuffer, function (buffer) {
            buf = buffer;
            play();
        })
        .catch(err => console.error(err));
}

// Play the loaded file
function play() {
    // Create a source node from the buffer
    var source = context.createBufferSource();
    source.buffer = buf;
    // Connect to the final output node (the speakers)
    source.connect(context.destination);
    // Play immediately
    let x = source.start(0);
}

//Autofill suburb field using Google Places
var autocomplete;
var infoWindow;

//Gives autofill options on "Suburb" field
function initAutocomplete() {
    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById("autocomplete"), {
            types: ["(cities)"]
        }
    );
}
var geolocation;

// Gets current geo location
function geolocate() {
    //Check if it can find the current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            //Saves the current location in variable as longitutde and latitude
            geolocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            // return geolocation;
            console.log("geolocate");
        });
    }

}

/* Creating on-click function to run ajax GET on the google places API, using the  users current suburb
which we get from either the input val(), or the users current location  */

var locLAT, locLNG;
var apiKey = "AIzaSyAWEtBeR_Jx7m6NFIKjF3y0tgIOxZ2HDek";

$("#es-button").on("click", function (e) {
    e.preventDefault();
    var location = $("#autocomplete").val();

    var queryURL =
        "https://maps.googleapis.com/maps/api/geocode/json?&address=" +
        location +
        "&key=" +
        apiKey;


    $.ajax({
        url: queryURL,
        method: "GET",
        success: function (response) {
            locLAT = response.results[0].geometry.location.lat;
            locLNG = response.results[0].geometry.location.lng;
            refineResults(locLAT, locLNG);
        }
    });
});


function refineResults(locLAT, locLNG) {
    console.log("latitude " + locLAT);
    console.log("longitude " + locLNG);

    var searchURL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + locLAT + "," + locLNG + "&radius=5000&type=restaurant&key=" + apiKey;

    jQuery.ajaxPrefilter(function (options) {
        if (options.crossDomain && jQuery.support.cors) {
            options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
        }
    });

    $.ajax({
        url: searchURL,
        method: "GET",
        cache: false,
    }).then(function (resp) {
        console.log(resp)
        var newURL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?" + "key=" + apiKey + '&pagetoken=' + encodeURIComponent(resp.next_page_token);
        console.log(resp.results.length);
        console.log(resp.results);
        var placeArray = resp.results.map(function (item) {
            return {
                rating: item.rating,
                name: item.name,
                address: item.vicinity
            }
        });

        placeArray.sort(function (val1, val2) {
            return val1.rating - val2.rating;
        })

        console.log(placeArray);
    });

}

$("#current-location").on("click", function (e) {
    event.preventDefault();
    geolocate();
    var currentLocation = geolocation;
    console.log("current location", currentLocation);
    locLAT = currentLocation.lat;
    locLNG = currentLocation.lng;
    refineResults(locLAT, locLNG);
})