#!/usr/bin/env node

var amqp = require('amqplib/callback_api');
const fetch = require('node-fetch');

var args = {
    userName: 'username',
    userPass: 'password',
    apiKey: 'api-key',
    host: 'man1-phx2.deckprismsports.com',
    vHost: 'nfl_main',
    exchange: 'nfl_upstream',
    sport: 'nfl',
    date: getToday()
}

var apiURI = 'https://' + args.host + '/api/lines/' + args.sport + '/' + args.date + '?apikey=' + args.apiKey;
var brokerURI = 'amqps://' + args.userName + ':' + args.userPass + '@' + args.host + '/' + args.vHost + '?heartbeat=15';

const getData = async apiURI => {
    try {
        const response = await fetch(apiURI);
        const data = await response.json();
        console.log(data);
    } catch (err) {
        console.log('Error: ' + err);
    }
};

function brokerConnect() {
    amqp.connect(brokerURI, function (error0, connection) {
        if (error0) {
            console.log(URI);
            throw error0;
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }
            channel.assertQueue('', {
                exclusive: true
            }, function (error2, q) {
                if (error2) {
                    throw error2;
                }
                console.log('\n [*] Waiting for a line change...');
                channel.bindQueue(q.queue, args.exchange);
                channel.consume(q.queue, function (msg) {
                    console.log('\n [X] Line change received:');
                    console.log(JSON.parse(msg.content.toString()));
                    console.log('\n-----------------------------------');
                    console.log('\n [*] Waiting for a line change...');
                }, {
                    noAck: true
                });
            });
        });
    });
}

function getToday() {
    var date = new Date();
    var today = date.getFullYear() + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2);
    return today;
}

console.log(' [*] Pulling current game data from API...');
getData(apiURI).then(() => {
    console.log(' [*] Connecting to broker for live data...');
    brokerConnect();
})
    .catch(err => {
        done(err);
    });