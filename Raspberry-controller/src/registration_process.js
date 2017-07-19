var helpers = require('./SerialHelpers');

var devicesToRegister = 1; //this should be given from the user (1 - 255)
var handshakeSucceded = false;
var isAcceptationIDStreamActive = false;
var accepted_ids = 0;
var onEnd = null;

function start(){
  var portName = '/dev/ttyACM';
  var portnameCounter = 0;
  var result = false;
  var skip = false;
   do{
     if(portnameCounter == 0 || skip || (helpers.onPortOpenedCalled && !helpers.isPortOpen)){
         skip = false;
         var res = helpers.init(portName + portnameCounter);
         portnameCounter++;
         if(res == -1) skip = true;
     }else if(helpers.onPortOpenedCalled && helpers.isPortOpen){
       result = true;
     }else{
       console.log("?");
     }

   }while(!result && portnameCounter < 5);

  helpers.handshakeHandler = handleHandshake;
  helpers.idCheckRequestHandler = handleIDCheckRequest;
  helpers.idStreamStartHandler = handleIDStreamStartMessage;
  helpers.idStreamValueHandler = handleIDStreamValueMessage;
  helpers.idStreamEndHandler = handleIDStreamEndMessage;
}

function handleHandshake(){
  if(!handshakeSucceded){
    handshakeSucceded = true;
    helpers.answerToHandshake();
    helpers.sendDevicesNumberPacket(devicesToRegister);
    return;
  }
  console.log("Warning: unexpected handshake attempt");
}

function handleIDCheckRequest(id){
  if(!checkHendshakeState())
      return;
  if(isAcceptationIDStreamActive){
    console.log("Warning: received ID check request while id submission stream is open [All IDs were already checked]");
    return;
  }
  console.log("Received ID to check: " + id);
  //query mongodb here
  //"SELECT ID FROM devices WHERE ID = \"" + _id + ""\""
  return 0;//Number of lines found in mongo*/
}

function handleIDStreamStartMessage(){
  if(!checkHendshakeState())
      return;
  if(isAcceptationIDStreamActive){
    console.log("Warning: received id stream start packet while stream is already open");
    return;
  }
  isAcceptationIDStreamActive = true;
  console.log("ID stream started");
}

function handleIDStreamValueMessage(id,type){
  if(!checkHendshakeState())
      return;
  if(!isAcceptationIDStreamActive){
    console.log("Warning: received an id stream packet while stream is closed");
    return;
  }
  console.log("\t Device-> ID: " + id + " type: " + type);
  //write data to database
  //LoRa/devices "{\"ID\" : \"" + _id + "\", \"type\" : \"" + type + "\"}"
  accepted_ids++;
}

function handleIDStreamEndMessage(){
  if(!checkHendshakeState())
      return;
  if(!isAcceptationIDStreamActive){
    console.log("Warning: received id stream end message while stream is already closed");
    return;
  }
  isAcceptationIDStreamActive = false;
  console.log("ID stream ended");
  if(accepted_ids == devices_to_register)
      //operation completed, go to device association phase
      console.log("operation completed");
  else {
    console.log("Operation failed");
    //Operation failed, abort
  }
  if(onEnd){
    onEnd(accepted_ids == devices_to_register);
  }
}

function checkHendshakeState(){
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
