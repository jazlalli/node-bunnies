var http = require('http');
var express = require('express');
var fs = require('fs');
var amqp = require('amqp');

var geoService = require('./utils/geoip');
var messageObject = require('./utils/message');

var clients = [];

var connection = amqp.createConnection({
    url: "amqp://a556ed26-bd69-48f7-b97e-2744796b258a_apphb.com:IRebEvT0LoS4KAVwLq9iny7nJ-AltUDl@bunny.cloudamqp.com/a556ed26-bd69-48f7-b97e-2744796b258a_apphb.com"
});

var app = express.createServer();
app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public/'));
    app.use(express.static(__dirname + '/styles'));
    app.use(app.router);
});

app.get('/', function (request, response) {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });
    response.write(fs.readFileSync(__dirname + '/index.html'));
    response.end();
});

app.get('/subscribe', function (request, response) {
    if (request.headers.accept && request.headers.accept === 'text/event-stream') {
        response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Accept': '*/*',
            'Access-Control-Allow-Origin': '*'
        });

        clients.push(response);
        console.log('New connection');
    }

    request.on('close', function () {
        console.log('Connection closing');
        if (clients.indexOf(response) >= 0) {
            clients.pop(response);
        }
    });
});

connection.addListener('ready', function() {
    
    //connect to existing exchange
    connection.exchange('Visits Exchange', options = {
        passive: 'true'
    }, function (exchange) {
        
        //define queue and bind to exchange
        var queue = connection.queue('Node Visits Queue', function (queue) {
            queue.bind(exchange, '#');
        });

        //define message handler
        queue.subscribe(function (message, headers, deliveryInfo) {
            
            //quotes in url so encode again
            var encoded_payload = unescape(escape(message.data));
            var payload = JSON.parse(encoded_payload);

            var m = messageObject.create(payload);

            console.log('new hit: ' + m.url);

            if(m.site === 'Luma') {
                //augment message with geo data and broadcast
                geoService.locate(m.ipaddress, function (data) {
                    var geoInfo = JSON.parse(data);

                    m.latitude = geoInfo.latitude;
                    m.longitude = geoInfo.longitude;

                    for (var i = 0; i < clients.length; i++) {
                        clients[i].write('data: ' + JSON.stringify([m]) + '\n\n');
                    }
                });
            }
        });
    });
});

var port = process.env.PORT || 1337;
app.listen(port);

console.log('Server running on port ' + port);