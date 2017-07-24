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
  if(!handshakeSucceded){
    helpers.answerToHandshake();
    return;
  }
  console.log("Warning: unexpected handshake attempt");
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
