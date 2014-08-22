'use strict';

var cryptophoto = require('../lib/cryptophoto-node');

cryptophoto.visibleIp(function(error, ip) {
  var cpClient, cpSession;
  if (error) { return console.error(error.toString()); }

  cpClient = cryptophoto.createClient(process.env['CP_PUBLIC_KEY'] || 'efe925bda3bc2b5cd6fe3ad3661075a7',
                                      process.env['CP_PRIVATE_KEY'] || '384b1bda2dafcd909f607083da22fef0');

  cpClient.getSession('octavian', ip, function(error, session) {
    if (error) { return console.error(error); }

    console.log(session);
  });
});
