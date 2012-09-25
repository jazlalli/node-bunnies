var http = require('http');
var fs = require('fs');
var amqp = require('amqp');

var connection = amqp.createConnection({
  url: "<your amqp url>"
});

var AppData = {
  clients : [],
  visitsToday : []
};

http.createServer(function (request, response) {
  // determine whether it is the eventstream request
  if (request.headers.accept && request.headers.accept === 'text/event-stream') {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Accept' : '*/*',
      'Access-Control-Allow-Origin' : '*'
    });

    AppData.clients.push(response);
    console.log('New connection');

    for (var i=0; i<AppData.clients.length; i++){
      AppData.clients[i].write('data: ' + JSON.stringify(AppData.visitsToday) + '\n\n');
    }
  } 
  else {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(fs.readFileSync(__dirname + '/index.html'));
    response.end();
  }
  
  request.on('close', function () {
		console.log('connection closing');
    if (AppData.clients.indexOf(response) >= 0) {
      AppData.clients.pop(response);
    }
	});  
}).listen(1337);

console.log('Server running on port 1337');

connection.on('ready', function () {
  // connect to existing exchange
  connection.exchange("Visits Exchange", options={passive: 'true'}, function (exchange) {
    console.log('Connected to: ' + exchange.name);
    // define queue
    connection.queue("Node Visits Queue", function (queue) {
      
      console.log('Created queue: ' + queue.name);
      queue.bind(exchange, '#'); 
      
      // receive messages
      queue.subscribe(function (message, headers, deliveryInfo) {
        
        var encoded_payload = unescape(message.data);
        var payload = JSON.parse(encoded_payload);
        var visitData = parse_message(payload);
        
        init_dataObj();
        AppData.visitsToday.push(visitData);
        
        for (var i=0; i<AppData.clients.length; i++){
          AppData.clients[i].write('data: ' + JSON.stringify([visitData]) + '\n\n');
        }
      })
    });
  });
});

// make a nice object
function parse_message (payload) {
  var urlParam = payload.QUERY_STRING.split('&')[1];
  var url = urlParam.substr(4, urlParam.length);
  
  return {
    url : url,
    ipaddress : payload.REMOTE_ADDR,
    useragent : payload.HTTP_USER_AGENT,
    site : payload.mi_urlinfo_site,
    product : payload.mi_urlinfo_product,
    pagetype : payload.mi_urlinfo_type,
    mediasource : payload.MediaSource,
    campaign : payload.Campaign,
    adgroup : payload.AdGroup,
    referrer : payload.Referrer,
    userid : payload['MI-LifeTimeCookie'],
    createtime : payload.CreateTime
  };
}

// keep using global object, or clean it out and start again
function init_dataObj () {
  var now = new Date();
  
  var lastMessageDate;

  if (AppData.visitsToday.length > 0){
    lastMessageDate = parse_date(AppData.visitsToday[AppData.visitsToday.length-1].createtime);
  }

  if (lastMessageDate){
    if (lastMessageDate.getDate() > now.getDate() || (now.getDate() === 1 && lastMessageDate.getDate() > 1)) {
      AppData.visitsToday.length = 0;
    }
  }
}

// make a nice date object from string dd/mm/YYYY HH:MM:ss
function parse_date (lastMessageTimeStr) {
  var formattedDateStr = lastMessageTimeStr.split(' ')[0];

  var dayStr = formattedDateStr.split('-')[0],
      monthStr = formattedDateStr.split('-')[1],
      yearStr = formattedDateStr.split('-')[2];

  if (monthStr.substr(0, 1) === '0'){
    monthStr = monthStr.substr(1, 1);
  }

  var day = parseInt(dayStr),
      month = parseInt(monthStr),
      year = parseInt(yearStr);

  return new Date(year, month-1, day);
}