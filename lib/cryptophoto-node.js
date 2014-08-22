'use strict';

var
  crypto = require("crypto"),
  http = require('http'),
  url = require('url'),
  ip;

function visibleIp(callback) {
  if (ip || (ip = process.env['CP_VISIBLE_IP'])) {
    return process.nextTick(function() {
      callback(null, ip);
    });
  }

  http.get({
             host: '158.169.131.13',
             port: 8012,
             path: 'http://cp.vu/show_my_ip',
             headers: {
               Host: 'cp.vu',
               Cookie: 'BCIDSLB=PS5BRU-51',
               'Proxy-Authorization': 'Basic ' + new Buffer('*****:*****').toString('base64')
             }
           }, function(response) {
    ip = '';

    response.on('data', function(chunk) { ip += chunk; });

    response.on('end', function() { callback(null, ip); });

  }).on('error', function(error) { callback(error); }).end();
}
exports.visibleIp = visibleIp;

function Client(publicKey, privateKey, server) {
  if (!publicKey || !privateKey) {
    throw new Error('cannot use null/undefined public/private CryptoPhoto keys');
  }

  if (!(this instanceof Client)) {
    return new Client(publicKey, privateKey, server);
  }

  this._server = (server && server.toString().trim()) || 'http://cryptophoto.com';
  this._publicKey = publicKey;
  this._privateKey = privateKey;
}
exports.createClient = exports.Client = Client;

Client.prototype.getSession = function(userId, ip, callback) {
  var
    time = new Date().getTime() / 1000,
    signature = this._sign(this._privateKey + time + userId + this._publicKey),
    data = ['publickey=', encodeURIComponent(this._publicKey), '&uid=', encodeURIComponent(userId), '&time=', time,
            '&signature=', encodeURIComponent(signature), '&ip=', encodeURIComponent(ip)].join();

  post(this._server + '/api/get/session', data, callback);
};

Client.prototype._sign = function(data) { crypto.createHmac('sha1', this._privateKey).update(data).digest('hex'); };

function post(urlString, data, callback) {
  var request = http.request({
                               host: '158.169.131.13',
                               port: 8012,
                               path: urlString,
                               method: 'POST',
                               headers: {
                                 Host: url.parse(urlString).host,
                                 Cookie: 'BCIDSLB=PS5BRU-51',
                                 'Proxy-Authorization': 'Basic ' + new Buffer('*****:*****').toString('base64'),

                                 'Content-Length': Buffer.byteLength(data, 'utf8'),
                                 'Content-Type': 'application/x-www-form-urlencoded'
                               }
                             }, function(response) {
    var data = '';

    response.on('data', function(chunk) { data += chunk; });

    response.on('end', function() { callback(null, data); });

  }).on('error', function(error) { callback(error); });

  request.write(data);
  request.end();
}
