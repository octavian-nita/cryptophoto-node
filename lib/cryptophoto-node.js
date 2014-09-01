/** @module cryptophoto-node */

'use strict';

var
  crypto = require('crypto'),
  http = require('http'),
  url = require('url');

/**
 * If <code>proxy</code> and <code>proxy.host</code> module properties are defined, wraps <code>requestUrl</code>
 * in an <code>options</code> object configured for Proxy-Authorization, to be used instead in calls to
 * {@link http://nodejs.org/api/http.html#http_http_request_options_callback http.request(options, [callback])}. The
 * <code>proxy</code> module property can also contain <code>port</code>, <code>user</code> and <code>pass</code>
 * or <code>password</code> properties as well as a <code>headers</code> object with additional request headers.
 *
 * @param {string} requestUrl
 * @returns {*} an <code>options</code> {object} or <code>requestUrl</code> if <code>proxy</code> or
 *              <code>proxy.host</code> module properties are not defined
 */
function proxy(requestUrl) {
  var options, header;

  if (!exports.proxy || !exports.proxy.host) { return requestUrl; }

  options = {
    host: exports.proxy.host,
    path: requestUrl,
    headers: {
      Host: url.parse(requestUrl).host
    }
  };

  if (exports.proxy.port) {
    options.port = exports.proxy.port;
  }

  if (exports.proxy.user) {
    options.headers['Proxy-Authorization'] = 'Basic ' + new Buffer(exports.proxy.user + ':' +
                                                                   (exports.proxy.pass || exports.proxy.password ||
                                                                    '')).toString('base64');
  }

  if (exports.proxy.headers) {
    for (header in exports.proxy.headers) {
      if (exports.proxy.headers.hasOwnProperty(header)) {
        options.headers[header] = exports.proxy.headers[header];
      }
    }
  }

  return options;
}

/**
 * Empty by default, can be set up to contain proxy information:
 * <ul>
 *   <li>host</li>
 *   <li>port</li>
 *   <li>user</li>
 *   <li>pass or password</li>
 *   <li>headers (for additional request headers, in case the proxy authorization requires it)</li>
 * </ul>
 */
exports.proxy = {};

/**
 * Tries to determine the visible ip address and upon success, asynchronously calls <code>callback</code> passing the ip
 * as second argument. If <code>process.CP_VISIBLE_IP</code> is set, no further detection takes place and callback is
 * called in the next tick. Intended mostly for testing purposes.
 */
function visibleIp(callback) {
  if (process.CP_VISIBLE_IP) {
    return process.nextTick(function() { callback(null, process.CP_VISIBLE_IP); });
  }

  http.get(proxy('http://cp.vu/show_my_ip'), function(response) {
    var ip = '';

    response.on('data', function(chunk) { ip += chunk; });
    response.on('end', function() { callback(null, ip); });

  }).on('error', function(error) { callback(error); }).end();
}
exports.visibleIp = visibleIp;

/**
 * Initializes a Cryptophoto API client that uses the specified keys to make requests to <code>server</code>. If server
 * is not specified, http://cryptophoto.com is used by default.
 *
 * @constructor
 */
function Client(publicKey, privateKey, server) {
  if (!publicKey || !privateKey) { throw new Error('cannot use null/undefined public/private CryptoPhoto keys'); }

  if (!(this instanceof Client)) { return new Client(publicKey, privateKey, server); }

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
            '&signature=', encodeURIComponent(signature), '&ip=', encodeURIComponent(ip)].join('');

  post(this._server + '/api/get/session', data, function(error, cpResponse) {
    var lines, status, cpSession;

    if (error) { return callback(error); }

    if (!cpResponse) { return callback(new Error('unexpected CryptoPhoto response: empty response')); }

    lines = cpResponse.split(/(\r?\n)+/).filter(function(elem) { return elem && elem.trim().length > 0; });
    if (lines.length < 2) { return callback(new Error('unexpected CryptoPhoto response: less than 2 lines')); }

    switch (status = lines[0].trim().toLowerCase()) {
    case 'success':
      cpSession = {
        id: lines[1].trim(),
        valid: 'true'
      };
      break;
    case 'error':
      cpSession = {
        error: lines[1].trim(),
        valid: 'false'
      };
      break;
    default:
      return callback(new Error('unexpected CryptoPhoto response status: ' + status));
    }

    if (lines.length > 2) {
      cpSession.token = lines[2].trim();
    }
    if (lines.length > 3) {
      cpSession.signature = lines[3].trim();
    }

    callback(null, cpSession);
  });
};

Client.prototype.getTokenGenerationWidget = function(cpSession) {
  if (!cpSession) { throw new Error('cannot obtain a token generation widget using an empty CryptoPhoto session'); }

  if ('true' !== String(cpSession.valid).toLowerCase()) { throw new Error('invalid CryptoPhoto session'); }

  return '<script type="text/javascript" src="' + this._server + '/api/token?sd=' + cpSession.id + '"></script>';
};

Client.prototype.getChallengeWidget = function(cpSession) {
  if (!cpSession) { throw new Error('cannot obtain a challenge widget using an empty CryptoPhoto session'); }

  if ('true' !== String(cpSession.valid).toLowerCase()) { throw new Error('invalid CryptoPhoto session'); }

  return '<script type="text/javascript" src="' + this._server + '/api/challenge?sd=' + cpSession.id + '"></script>';
};

Client.prototype.verify = function(selector, responseRow, responseCol, cph, userId, ip, callback) {
  var
    time = new Date().getTime() / 1000,
    signature = this._sign(this._privateKey + time + userId + this._publicKey),
    data = ['publickey=', encodeURIComponent(this._publicKey), '&uid=', encodeURIComponent(userId), '&time=', time,
            '&signature=', encodeURIComponent(signature), '&response_row=', encodeURIComponent(responseRow),
            '&response_col=', encodeURIComponent(responseCol), '&selector=', encodeURIComponent(selector), '&cph=',
            encodeURIComponent(cph), '&ip=', encodeURIComponent(ip)].join('');

  post(this._server + '/api/verify', data, function(error, cpResponse) {
    var lines, status, cpVerification;

    if (error) { return callback(error); }

    if (!cpResponse) { return callback(new Error('unexpected CryptoPhoto response: empty response')); }

    lines = cpResponse.split(/(\r?\n)+/).filter(function(elem) { return elem && elem.trim().length > 0; });
    if (lines.length < 1) { return callback(new Error('unexpected CryptoPhoto response: less than 1 line')); }

    switch (status = lines[0].trim().toLowerCase()) {
    case 'success':
      cpVerification = { valid: 'true' };
      if (lines.length > 1) {
        cpVerification.message = lines[1].trim();
      }
      break;
    case 'error':
      cpVerification = { valid: 'false' };
      if (lines.length > 1) {
        cpVerification.error = lines[1].trim();
      }
      break;
    default:
      return callback(new Error('unexpected CryptoPhoto response status: ' + status));
    }

    if (lines.length > 2) {
      cpVerification.signature = lines[2].trim();
    }

    callback(null, cpVerification);
  });
};

Client.prototype._sign = function(data) {
  return crypto.createHmac('sha1', this._privateKey).update(data).digest('hex');
};

function post(toUrl, data, callback) {
  var options = proxy(toUrl), request;

  if (typeof options !== 'object') {
    options = url.parse(toUrl);
  }
  options.method = 'POST';
  if (!options.headers) {
    options.headers = {};
  }
  options.headers['Content-Length'] = Buffer.byteLength(data, 'utf8');
  options.headers['Content-Type'] = 'application/x-www-form-urlencoded';

  request = http.request(options, function(response) {
    var data = '';

    response.on('data', function(chunk) { data += chunk; });
    response.on('end', function() { callback(null, data); });

  }).on('error', function(error) { callback(error); });

  request.write(data);
  request.end();
}
