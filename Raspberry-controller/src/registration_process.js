var helpers = require('./SerialHelpers');
var dbHelper = require('./windows/main/DBHelper');


var devicesToRegister = 1; //this should be given from the user (1 - 255)
var handshakeSucceded = false;
var isAcceptationIDStreamActive = false;
var accepted_ids = 0;
var onEnd;

function start(){
  var portName = '/dev/ttyACM2';
  var handlers = {
    handshakeHandler: handleHandshake,
    idCheckRequestHandler: handleIDCheckRequest,
    idStreamStartHandler: handleIDStreamStartMessage,
    idStreamValueHandler: handleIDStreamValueMessage,
    idStreamEndHandler: handleIDStreamEndMessage,
    handshakeEndHandler: handleHandshakeEnd
  };
  helpers.init(portName,handlers);
}

function handleHandshake(){
  if(!handshakeSucceded){
    helpers.answerToHandshake();
    return;
  }
  console.log("Warning: unexpected handshake attempt");
}

function handleHandshakeEnd(){
  if(!handshakeSucceded){
      console.log("Handshake ended!");
      handshakeSucceded = true;
      helpers.sendDevicesNumberPacket(devicesToRegister);
  }else{
    console.log("Warning: unexpected handshake attempt");
  }
}

function handleIDCheckRequest(id){
  if(!checkHandshakeState())
      return;
  if(isAcceptationIDStreamActive){
    console.log("Warning: received ID check request while id submission stream is open [All IDs were already checked]");
    return;
  }
  console.log("Received ID to check: " + (id >>> 0).toString(16));
  dbHelper.checkIfIdIsInDB(id,helpers.answerToIDCheckRequest);
}

function handleIDStreamStartMessage(){
  if(!checkHandshakeState())
      return;
  if(isAcceptationIDStreamActive){
    console.log("Warning: received id stream start packet while stream is already open");
    return;
  }
  isAcceptationIDStreamActive = true;
  console.log("ID stream started");
}

function handleIDStreamValueMessage(id,type){
  if(!checkHandshakeState())
      return;
  if(!isAcceptationIDStreamActive){
    console.log("Warning: received an id stream packet while stream is closed");
    return;
  }
  console.log("\t Device-> ID: " + (id >>> 0).toString(16) + " type: " + type);
  dbHelper.insertDeviceIntoDB("0x" + ((id >>> 0).toString(16)),type);
  accepted_ids++;
}

function handleIDStreamEndMessage(){
  if(!checkHandshakeState())
      return;
  if(!isAcceptationIDStreamActive){
    console.log("Warning: received id stream end message while stream is already closed");
    return;
  }
  handshakeSucceded = false;
  isAcceptationIDStreamActive = false;
  console.log("ID stream ended");
  if(accepted_ids == devicesToRegister)
      //operation completed, go to device association phase
      console.log("operation completed");
  else {
    console.log("Operation failed");
    //Operation failed, abort
  }
  accepted_ids = 0;
  if(onEnd){
    onEnd(accepted_ids == devicesToRegister);
  }
}

function checkHandshakeState(){
  if(!handshakeSucceded){
    console.log("Warning: received a serial message without completing the handshake");
    return false;
  }
  return true;
}

module.exports = {
  start,
  onEnd
}
