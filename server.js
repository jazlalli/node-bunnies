var http = require('http');
var fs = require('fs');
var amqp = require('amqp');

var connection = amqp.createConnection(
  {url: "<your amqp url>"});

var clients = new Array();
var todaysData = new Array();
  
http.createServer(function (request, response) {
  // determine whether it is the eventstream request
  if(request.headers.accept && request.headers.accept == 'text/event-stream') {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Accept' : '*/*',
      'Access-Control-Allow-Origin' : '*'
    });  
    
    clients.push(response);
    console.log('New connection');

    for(var i=0; i<clients.length; i++){
      clients[i].write('data: ' + JSON.stringify(todaysData) + '\n\n');
    }
  } else {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(fs.readFileSync(__dirname + '/index.html'));
    response.end();
  }
  
  request.on('close', function(){
		console.log('connection closing');
    if(clients.indexOf(response) >= 0) {
      clients.pop(response);
    }
	});  
}).listen(1337);

console.log('Server running on port 1337');

connection.on('ready', function () {
  // connect to existing exchange
  connection.exchange("Visits Exchange", options={passive: 'true'}, function(exchange) {

    console.log('Connected to: ' + exchange.name);

    // define queue
    connection.queue("Node Visits Queue", function(queue){
      
      console.log('Created queue: ' + queue.name);
      queue.bind(exchange, '#'); 
      
      // receive messages
      queue.subscribe(function (message, headers, deliveryInfo) {
        
        var encoded_payload = unescape(message.data);
        var payload = JSON.parse(encoded_payload);
        var visitData = parse_message(payload);
        
        init_data();
        todaysData.push(visitData);
        
        for(var i=0; i<clients.length; i++){
          clients[i].write('data: ' + JSON.stringify(visitData) + '\n\n');
        }
      })
    });
  });
});

function parse_message(payload) {
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

function init_data(){
  var now = new Date();
  
  var lastMessageTime;
  if(todaysData.length > 1){
    lastMessageTime = new Date(todaysData.length-1).createtime;
  }

  if(lastMessageTime){
    console.log(lastMessageTime);
    if(lastMessageTime.getDay() > now.getDay() || (now.getDay() === 0 && lastMessageTime.getDay() === 6)) {
      todaysData.length = 0;
    }
  }
}
