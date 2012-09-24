var http = require('http');
var fs = require('fs');
var amqp = require('amqp');

var connection = amqp.createConnection(
  {url: "<your amqp url>"});

var clients = [];
  
http.createServer(function (request, response) {
  if(request.headers.accept && request.headers.accept == 'text/event-stream') {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Accept' : '*/*',
      'Access-Control-Allow-Origin' : '*'
    });  
  
  clients.push(response);
  console.log('new connection');
  }
  else {
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
  connection.exchange("<exchange name>", options={passive: 'true'}, function(exchange) {

    console.log('connected to exchange: ' + exchange.name);

    // Recieve messages
    connection.queue("<queue name>", function(queue){
      console.log('Created queue: ' + queue.name);
      queue.bind(exchange, '#'); 
      queue.subscribe(function (message, headers, deliveryInfo) {
        
        var encoded_payload = unescape(message.data);
        var payload = JSON.parse(encoded_payload);
        console.log('Recieved a message:');
        
        for(var i=0; i<clients.length; i++){
          clients[i].write('data: ' + JSON.stringify(payload) + '\n\n');
          
          console.log('pushed notification');
        }

      })
    });
  });
});