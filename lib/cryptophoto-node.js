'use strict';

var
  util = require('util');

function getVisibleIp() {
}
module.exports.getVisibleIp = getVisibleIp;

function CryptoPhotoClient(publicKey, privateKey, server) {
  if (!(this instanceof CryptoPhotoClient)) { return new CryptoPhotoClient(publicKey, privateKey, server); }
}
module.exports.CryptoPhotoClient = CryptoPhotoClient;
