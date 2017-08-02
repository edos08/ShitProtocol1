var helpers = require('./SerialHelpers');
var dbHelper = require('../windows/main/DBHelper');


var devicesToRegister = 1; //this should be given from the user (1 - 255)
var isAcceptationIDStreamActive = false;
var accepted_ids = 0;
var onEnd;
let action;

function init(){
  helpers.init({
    idCheckRequestHandler: handleIDCheckRequest,
    idStreamStartHandler: handleIDStreamStartMessage,
    idStreamValueHandler: handleIDStreamValueMessage,
    idStreamEndHandler: handleIDStreamEndMessage,
    registrationModeEnteredHandler: handleRegistrationModeEntered,
    sendResultHandler: handleSendResultPackets,
    checkSensorStateHandler: handleCheckState,
    isCheckControllerStatePacket: handleCheckState
  });
}

function handleCheckState(address,value){
  dbHelper.insertCheckStateResult(address,value);
}

function start(processEndHandler,devicesNumber){
  devicesToRegister = devicesNumber;
  isAcceptationIDStreamActive = false;
  helpers.startRegistration();
  onEnd = processEndHandler;
}

function handleRegistrationModeEntered(){
  helpers.sendDevicesNumberPacket(devicesToRegister);
}

function handleIDCheckRequest(id){
  if(isAcceptationIDStreamActive){
    console.log("Warning: received ID check request while id submission stream is open [All IDs were already checked]");
    return;
  }
  console.log("Received ID to check: " + (id >>> 0).toString(16));
  dbHelper.checkIfIdIsInDB(id,helpers.answerToIDCheckRequest);
}

function handleIDStreamStartMessage(){
  if(isAcceptationIDStreamActive){
    console.log("Warning: received id stream start packet while stream is already open");
    return;
  }
  isAcceptationIDStreamActive = true;
  console.log("ID stream started");
}

function handleIDStreamValueMessage(id,type){
  if(!isAcceptationIDStreamActive){
    console.log("Warning: received an id stream packet while stream is closed");
    return;
  }
  console.log("\t Device-> ID: " + (id >>> 0).toString(16) + " type: " + type);
  dbHelper.insertDeviceIntoDB("0x" + ((id >>> 0).toString(16)),type);
  accepted_ids++;
}

function handleIDStreamEndMessage(){
  if(!isAcceptationIDStreamActive){
    console.log("Warning: received id stream end message while stream is already closed");
    return;
  }
  handshakeSucceded = false;
  isAcceptationIDStreamActive = false;
  console.log("ID stream ended");
  if(accepted_ids == devicesToRegister)
      console.log("operation completed");
  else {
    console.log("Operation failed");
  }
  if(onEnd){
    onEnd(accepted_ids == devicesToRegister);
  }
  accepted_ids = 0;
}

function handleSendResultPackets(result){
  action(result);
}

function setAction(_action){
  action = _action;
}

function terminate(){
  helpers.terminate();
}

module.exports = {
  init,
  start,
  onEnd,
  terminate,
  sendSensorSubmissionPacket: helpers.sendSensorSubmissionPacket,
  sendLightValueChangedPacket: helpers.sendLightValueChangedPacket,
  setAction
}
