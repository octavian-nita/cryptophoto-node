'use strict';

var cryptophoto = require('../lib/cryptophoto-node');

cryptophoto.proxy = {
  host: '158.169.131.13',
  port: 8012,
  user: '*****',
  pass: '*****',
  headers: {
    Cookie: 'BCIDSLB=*****'
  }
};

cryptophoto.visibleIp(function(error, ip) {
  var cpClient;

  console.log('Visible IP: ' + ip);

  if (error) { return console.error(error.toString()); }

  cpClient = cryptophoto.createClient(process.env['CP_PUBLIC_KEY'] || 'efe925bda3bc2b5cd6fe3ad3661075a7',
                                      process.env['CP_PRIVATE_KEY'] || '384b1bda2dafcd909f607083da22fef0');

  cpClient.getSession('octavian', ip, function(error, session) {
    if (error) { return console.error(error.toString()); }

    console.log(session);

    console.log(cpClient.getTokenGenerationWidget(session));

    console.log(cpClient.getChallengeWidget(session));

    // cpClient.verify('selector', 'row', 'col', 'cph', 'octavian', ip, function(error, verification) {});
  });
});
