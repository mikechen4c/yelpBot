'use strict';

// TODO clean up handler function

// Import Facebook modules with functions that make API requests
let FACEBOOK = new require('./facebook');

// Import YELP module with functions that make API requests
let YELP = new require('./yelp');

// Express Framework
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Current User's latitude and longitude
let lat = 0;
let long = 0;

// Start on Local:5000 or env.PORT
app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function (req, res) {
    res.send('Facebook Tokens Verified!')
});

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === FACEBOOK.verify_token) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
});

// Spin up the server
app.listen(app.get('port'), function () {
    console.log("Messenger Bot is starting...");
});

// Post to Facebook webhook
app.post('/webhook/', handler);

// Handler for incoming requests / making requests
function handler(req, res) {
    let messaging_events = req.body.entry[0].messaging;

    // Iterate through each message
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i];
        let sender = event.sender.id;

        // if the event was a post back
        if (event.message && event.message.quick_reply) {

            let payload = event.message.quick_reply.payload;

            // Check which POST back statement was made
            if (payload === 'hungry') {
                FACEBOOK.sendLocationButton(sender);
            } else if (payload === 'notHungry') {
                FACEBOOK.sendTextMessage(sender, "awww... I'll be waiting then :(");
            } else if (payload === '1' || payload == '2' || payload =='3') {
                YELP.yelpSearch(long, lat, payload, sender, FACEBOOK.sendResturants);
            }
            continue
        }

        // Check if sender is myself
        if (sender != '680930332088116') {
            if (event.message && event.message.text) {

                // TODO check for state of the conversation and then process
                let text = event.message.text;
                if (text === 'hi' || text === 'Start' || text === 'start' || text === 'hungry' || text === 'Hungry') {
                    console.log("Sending Start Button");
                    FACEBOOK.sendStartButton(sender);
                    continue;
                }
                FACEBOOK.sendTextMessage(sender, "Sorry! Im not that smart yet. Please say 'start' or 'hungry' to begin :)");

            }

            // Check if it's a coordinate
            // TODO check for the state rather than the coordinates

            if (event.message && event.message.attachments && event.message.attachments[0].payload) {
                let location = event.message.attachments[0].payload.coordinates;
                long = location.long;
                lat = location.lat;
                FACEBOOK.sendPriceRangeButton(sender);
                continue
            }



        }
    }
    // Need to send status back to Facebook
    res.sendStatus(200);
}

