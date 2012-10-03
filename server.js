var http = require('http');
var express = require('express');
var fs = require('fs');
var amqp = require('amqp');

var app = express();
app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public/'));
    app.use(app.router);
});

var connection = amqp.createConnection({
    url: "amqp://a556ed26-bd69-48f7-b97e-2744796b258a_apphb.com:IRebEvT0LoS4KAVwLq9iny7nJ-AltUDl@bunny.cloudamqp.com/a556ed26-bd69-48f7-b97e-2744796b258a_apphb.com"
});

var AppData = {
    clients: []
};

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

        AppData.clients.push(response);
        console.log('New connection');
    }

    request.on('close', function () {
        console.log('Connection closing');
        if (AppData.clients.indexOf(response) >= 0) {
            AppData.clients.pop(response);
        }
    });
});

var port = process.env.PORT || 1337;
app.listen(port);

console.log('Server running on port ' + port);

connection.on('ready', function () {
    // connect to existing exchange
    connection.exchange("Visits Exchange", options = {
        passive: 'true'
    }, function (exchange) {
        console.log('Connected to: ' + exchange.name);

        // define queue
        connection.queue("Node Visits Queue", function (queue) {
            console.log('Created queue: ' + queue.name);
            queue.bind(exchange, '#');

            // receive messages
            queue.subscribe(function (message, headers, deliveryInfo) {
                var encoded_payload = unescape(escape(message.data));
                var payload = JSON.parse(encoded_payload);
                var visitData = parse_message(payload);

                // send only luma messages
                if (visitData.url.indexOf('luma.co.uk') !== -1) {
                    console.log(visitData.url);
                    for (var i = 0; i < AppData.clients.length; i++) {
                        AppData.clients[i].write('data: ' + JSON.stringify([visitData]) + '\n\n');
                    }
                }
            })
        });
    });
});

// make a nice object
function parse_message(payload) {
    var urlParam = payload.QUERY_STRING.split('&')[1];
    var url = urlParam.substr(4, urlParam.length);

    return {
        url: url,
        ipaddress: payload.REMOTE_ADDR,
        useragent: payload.HTTP_USER_AGENT,
        site: payload.mi_urlinfo_site,
        product: payload.mi_urlinfo_product,
        pagetype: payload.mi_urlinfo_type,
        mediasource: payload.MediaSource,
        campaign: payload.Campaign,
        adgroup: payload.AdGroup,
        referrer: payload.Referrer,
        userid: payload['MI-LifeTimeCookie'],
        createtime: payload.CreateTime,
        latitude: '',
        longitude: ''
    };
}

// make a nice date object from string dd/mm/YYYY HH:MM:ss
// function parse_date (lastMessageTimeStr) {
//   var formattedDateStr = lastMessageTimeStr.split(' ')[0];

//   var dayStr = formattedDateStr.split('-')[0],
//       monthStr = formattedDateStr.split('-')[1],
//       yearStr = formattedDateStr.split('-')[2];

//   if (monthStr.substr(0, 1) === '0'){
//     monthStr = monthStr.substr(1, 1);
//   }

//   var day = parseInt(dayStr),
//       month = parseInt(monthStr),
//       year = parseInt(yearStr);

//   return new Date(year, month-1, day);
// }