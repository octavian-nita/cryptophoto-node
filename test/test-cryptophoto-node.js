/**
 * @todo Write proper tests / use a proper testing framework
 *
 * NOTE: In order to make these tests work, one should set up her / his own (test / demo) account at cryptophoto.com.
 * The code in this file is mostly to show how the cryptophoto-node module can be used.
 */

'use strict';

var
  os = require('os'),
  cryptophoto = require('../lib/cryptophoto-node');

// If behind a proxy, define the proxy module property with respective attributes:
// cryptophoto.proxy = {
//   host: '192.168.1.1',
//   port: 9876,
//   user: '*****',
//   pass: '*****',
//   headers: { // optional, some proxies might need additional headers in the request...
//     Cookie: '*****'
//   }
// };

cryptophoto.visibleIp(function(error, visibleIp) {
  var cpClient, userId = 'octavian';

  if (error) { return console.error(error.toString()); }

  console.log('Visible IP: ' + visibleIp + os.EOL);

  cpClient = cryptophoto.createClient(process.CP_PUBLIC_KEY || 'efe925bda3bc2b5cd6fe3ad3661075a7',
                                      process.CP_PRIVATE_KEY || '384b1bda2dafcd909f607083da22fef0');

  cpClient.getSession(userId, visibleIp, function(error, cpSession) {
    if (error) { return console.error(error.toString()); }

    console.log('Session details:');
    console.log(cpSession);

    console.log(os.EOL + 'Token Generation Widget code: ' + cpClient.getTokenGenerationWidget(cpSession));
    console.log(os.EOL + '       Challenge Widget code: ' + cpClient.getChallengeWidget(cpSession));

    // cpClient.verify('selector', 'row', 'col', 'cph', 'octavian', ip, function(error, verification) {});
  });
});
