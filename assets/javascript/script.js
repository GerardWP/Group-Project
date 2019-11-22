//initialise firebase
var firebaseConfig = {
    apiKey: "AIzaSyCytBUmS2IQgcSaC3ysubDYTT8Rk5tKPTw",
    authDomain: "group-project1-47650.firebaseapp.com",
    databaseURL: "https://group-project1-47650.firebaseio.com",
    projectId: "group-project1-47650",
    storageBucket: "",
    messagingSenderId: "62502366503",
    appId: "1:62502366503:web:17e43ba3ca7089e0"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var database = firebase.database();
var prefix = [];
var slogan = [];
var insult = [];
var text = [];

//function for loading firebase data into local variables
function getData() {
    database.ref("/text-to-speech").once("value", function (snap) {
        var data = snap.val();
        prefix = data.prefix;
        slogan = data.slogan;
        insult = data.insult;
    });
}

//generates an array to be used in the form "Prefix + Restaurant name + Rating + Slogan", insult can be used if the user chooses the restaurant
function randomWords() {
    var rand1 = Math.floor(Math.random() * prefix.length);
    var rand2 = Math.floor(Math.random() * slogan.length);
    var rand3 = Math.floor(Math.random() * insult.length);

    var pre = prefix[rand1];
    var slo = slogan[rand2];
    var ins = insult[rand3];

    return [pre, slo, ins];
}

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
            audio = Uint8Array.from(atob(response.audioContent), c => c.charCodeAt(0));
        },
        complete: function () {
            init();
            playByteArray(audio);
        }
    });
}

var context; // Audio context
var buf; // Audio buffer
var source;

//initialize audio context for each new audio file
function init() {
    if (!window.AudioContext) {
        if (!window.webkitAudioContext) {
            alert("Your browser does not support any AudioContext and cannot play back this audio.");
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
    source = context.createBufferSource();
    source.buffer = buf;
    // Connect to the final output node (the speakers)
    source.connect(context.destination);
    // Play immediately
    let x = source.start(0);
}

function stop() {
    if (source) {
        source.disconnect();
        source.stop(0);
        source = null;
    }
}

//Autofill suburb field using Google Places
var autocomplete;
var infoWindow;
var geolocation;

//Gives autofill options on "Suburb" field
function initAutocomplete() {
    autocomplete = new google.maps.places.Autocomplete(document.getElementById("autocomplete"), {
        types: ["(cities)"]
    });
}

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
        });
    }
}

/* Creating on-click function to run ajax GET on the google places API, using the  users current suburb
which we get from either the input val(), or the users current location  */

var locLAT, locLNG;
var apiKey = "AIzaSyBymZZ_4KpRi_3VkDn653yZiq-lW3Dq-w8";
var placeArray;

$("#es-button").on("click", function (e) {
    e.preventDefault();
    var location = $("#autocomplete").val();

    var queryURL = "https://maps.googleapis.com/maps/api/geocode/json?&address=" + location + "&key=" + apiKey;

    $.ajax({
        url: queryURL,
        method: "GET",
        success: function (response) {
            locLAT = response.results[0].geometry.location.lat;
            locLNG = response.results[0].geometry.location.lng;
            $("#spinner").addClass("loader");

            refineResults(locLAT, locLNG);

        }
    });
});

$("#current-location").on("click", function (event) {
    event.preventDefault();
    $("#spinner").addClass("loader");
    locLAT = geolocation.lat;
    locLNG = geolocation.lng;
    refineResults(locLAT, locLNG);

});

function refineResults(locLAT, locLNG) {
    console.log("latitude " + locLAT);
    console.log("longitude " + locLNG);

    var searchURL =
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" +
        locLAT +
        "," +
        locLNG +
        "&radius=5000&type=restaurant&key=" +
        apiKey;

    jQuery.ajaxPrefilter(function (options) {
        if (options.crossDomain && jQuery.support.cors) {
            options.url = "https://cors-anywhere.herokuapp.com/" + options.url;
        }
    });

    $.ajax({
        url: searchURL,
        method: "GET",
        cache: false
    }).then(function (resp) {
        console.log(resp);
        var newURL =
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json?" +
            "key=" +
            apiKey +
            "&pagetoken=" +
            encodeURIComponent(resp.next_page_token);

        console.log(resp.results.length);
        console.log(resp.results);

        placeArray = resp.results.map(function (item) {
            return {
                rating: item.rating,
                name: item.name,
                address: item.vicinity,
                placeid: item.place_id,
                lat: item.geometry.location.lat,
                lng: item.geometry.location.lng
            };
        });

        placeArray.sort(function (val1, val2) {
            return val1.rating - val2.rating;
        });

        //For debugging purposes only
        console.log("-----------");
        for (var i = 0; i < placeArray.length; i++) {
            console.log(placeArray[i]);
        }

        hideAndGo();
    });
}


//function for hiding the start screen after either of the buttons are clicked
function hideAndGo() {
    $("#start-screen").css("visibility", "hidden");
    $("#start-screen").css("height", "0px");

    $("#info-screen").css("visibility", "visible");

    $("#eat-this").css("display", "block");
    $("#eat-other").css("display", "block");

    $("#google-maps").css("display", "none");

    $("#spinner").removeClass("loader");

    getAndPlay();
    $("#eat-other").on("click", eatOther);
    $("#eat-this").on("click", eatThis);
}

var count = 0;

//To get next restaurant
function eatOther(event) {
    event.preventDefault();
    count++;
    getAndPlay();
}

//function to get current restaurant
function getAndPlay() {
    stop();
    text = randomWords();
    var string =
        text[0] +
        placeArray[count].name +
        "? It received " +
        placeArray[count].rating +
        " out of 5 stars. " + placeArray[count].name + ". " +
        text[1];

    textToSpeech(string);

    //display textToSpeech
    $("#information").text(string);

}

function eatThis(event) {
    event.preventDefault();
    stop();

    $("#eat-this").css("display", "none");
    $("#eat-other").css("display", "none");

    $("#google-maps").css("display", "block");

    //more speaking
    var string = placeArray[count].name + "is located at " + placeArray[count].address + ". I hope you have a terrible time, " + text[2];
    textToSpeech(string);


    //display Restaurant Name
    $("#restaurant-name").text(placeArray[count].name);

    //display Restaurant Address with a link to Google Maps
    $("#information").text(placeArray[count].address);
    $("#google-maps").attr("href", "https://www.google.com/maps/search/?api=1&query=" + placeArray[count].lat + "," + placeArray[count].lng + "&query_place_id=" + placeArray[count].placeid);
}

function start() {
    clearContent();
    //get current location
    geolocate();
    //get our data from database
    getData();
}

function clearContent() {
    $("#start-screen").css("visibility", "visible");
    $("#start-screen").css("height", "");

    $("#info-screen").css("visibility", "hidden");
}


$("#startagain-btn").on("click", function (event) {
    event.preventDefault();
    count = 0;
    placeArray = [];
    stop();

    $("#information").empty();
    $("#restaurant-name").empty();
    $("#google-maps").attr("href", "#");

    $("#eat-other").off();
    $("#eat-this").off();

    clearContent();
});

$(document).ready(function () {
    start();
});