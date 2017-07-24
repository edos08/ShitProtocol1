var helpers = require('./SerialHelpers');

var onEnd;

function init(){
  var handlers = {
    handshakeHandler: handleHandshake,
    handshakeEndHandler: handleHandshakeEnd
  };
  helpers.init(handlers);
}

function handleHandshake(){
  helpers.answerToHandshake();
  return;
}

function handleHandshakeEnd(){
    console.log("Handshake ended!");
    if(onEnd)
      onEnd();
}


module.exports = {
  init,
  onEnd
}
