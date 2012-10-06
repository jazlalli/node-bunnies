var http = require('http');

function createRequest (ip) {
	
	if(Math.random() > 0.5) {
		var options = {
			method: 'GET',
			port: 80,
			hostname: 'api.ipinfodb.com',
			path: '/v3/ip-city/?key=412188ad591298ddd12b5ab67f6523bb7b89075d4f81965a15a7d4b985e0a994&ip=' + ip + '&format=json'
		}
	}
	else {
		var options = {
			method: 'GET',
			port: 80,
			hostname: 'freegeoip.net',
			path: '/json/' + ip
		}
	}

	return options;
}

function execute (options, callback) {
	http.request(options, function (response) {
		response.setEncoding('utf8');

		var data = '';
		response.on('data', function (chunk) {
			data += chunk;
		});

		response.on('end', function() {
			callback(data);
		});
	}).end();
};

function locate (ip, callback) {
	var options = createRequest(ip);
	execute(options, callback);
}

module.exports = {
	locate: locate
};