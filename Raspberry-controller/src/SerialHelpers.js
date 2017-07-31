var SerialPort = require('serialport');

const DEVICES_NUMBER_PACKET = 0;
const ID_CHECK_PACKET = 1;
const ID_CONFIRMED_PACKET = 2;
const ID_CONFIRMATION_PROCESS_START = 0;
const ID_CONFIRMATION_PROCESS_END = 255;
const HANDSHAKE_RESPONSE = 'W';
const HANDSHAKE_END = 'A';
const HANDSHAKE_MESSAGE = 'H';
const HANDSHAKE_RESET = 'R';
const MESSAGE_TYPE_ENTER_REGISTRATION_MODE = 3;
const SENSOR_SUBMISSION_PACKET = 4;
const LIGHT_VALUE_CHANGED_PACKET = 5;
const SEND_RESULT_PACKET = 6;

const masks = [
  0xFF000000,
  0x00FF0000,
  0x0000FF00,
  0x000000FF
]

let port;

var portNumber = 0;

var registrationMode = false;

var handshakeHandler;
var handshakeEndHandler;
var idCheckRequestHandler;
var idStreamStartHandler;
var idStreamValueHandler;
var idStreamEndHandler;
var registrationModeEnteredHandler;
var sendResultHandler;

var onOpenFunction;

function init(handlers,onOpenCallback){
  connectHandlers(handlers);
  onOpenFunction = onOpenCallback;

  if(port != null && port.isOpen)
      return;

  openPort();
}

function connectHandlers(handlers){
  this.handshakeHandler = handlers.handshakeHandler;
  this.idCheckRequestHandler = handlers.idCheckRequestHandler;
  this.idStreamStartHandler = handlers.idStreamStartHandler;
  this.idStreamValueHandler = handlers.idStreamValueHandler;
  this.idStreamEndHandler = handlers.idStreamEndHandler;
  this.handshakeEndHandler = handlers.handshakeEndHandler;
  this.registrationModeEnteredHandler = handlers.registrationModeEnteredHandler;
  this.sendResultHandler = handlers.sendResultHandler;
}

function openPort(){
    var portPath = '/dev/ttyACM' + portNumber;

    console.log("Testing " + portPath);

    port = new SerialPort(portPath,{
      baudRate: 9600,
      autoOpen: false
    });
    portNumber++;
    port.open(onPortOpened);
}

function onPortOpened(err){
  if(err != null){
      console.log("Serial port error: ",err.message);
      port = null;
      openPort();
      return;
  }

  console.log("Port " + this.path + " opened succesfully");
  port.on('data',(data) =>{
    console.log('Received: \"' + data + "\"");
    console.log('lenght = ' + Buffer.byteLength(data));
    callPacketHandler(data);
  });

  port.on('error',(error) =>{
    Console.log('Errore di connessione seriale ' + error);
  });

  port.on('close',(error) =>{
    port = null;
  });

  if(onOpenFunction)
    onOpenFunction();
}

function callPacketHandler(data){
  if(isHandshakePacket(data) && this.handshakeHandler){
    return this.handshakeHandler();
  }
  if(isHandshakeEndPacket(data) && this.handshakeEndHandler){
    return this.handshakeEndHandler();
  }
  if(isIDCheckRequest(data) && this.idCheckRequestHandler){
    var _id = read32bitInt(data,1);
    return this.idCheckRequestHandler(_id);
  }
  if (isIDStreamStartPacket(data) && this.idStreamStartHandler) {
    return this.idStreamStartHandler();
  }
  if (isIDStreamEndPacket(data) && this.idStreamEndHandler) {
    return this.idStreamEndHandler();
  }
  if (isIDStreamValuePacket(data) && this.idStreamValueHandler) {
    var _id = read32bitInt(data,1);
    var _type = data[5];
    return this.idStreamValueHandler(_id,_type);
  }
  if(isRegistrationModeEnteredPacket(data) && this.registrationModeEnteredHandler){
    return this.registrationModeEnteredHandler();
  }
  if(isSendResultPacket(data) && this.sendResultHandler){
    return this.sendResultHandler(data[1]);
  }

  console.log("Unrecognized serial");

}

function sendDevicesNumberPacket(devicesNumber){
  console.log(("Sending devices number"));
  var buf = Buffer.alloc(2);
  buf[0] = DEVICES_NUMBER_PACKET;
  buf[1] = devicesNumber;
  port.write(buf);
  console.log(buf);
}

function answerToHandshake(){
    port.write('W');
    console.log("Handshake answered");
}

function read32bitInt(data,startIndex){
  var _id = 0;
  var shifter = 24;
  for(var a = startIndex; a < startIndex+4; a++){
    _id |= (data[a] << shifter);
    shifter -= 8;
  }
  return _id;
}


function write32BitInt(buffer,offset,address){
  for(var a = 0; a < 4; a++){
    buffer[offset + a] = ((address & masks[a]) >> (8 * (3-a)));
  }
}

function isHandshakePacket(data){
  return data == HANDSHAKE_MESSAGE;
}

function isSendResultPacket(data){
  return Buffer.byteLength(data) == 2 && data[0] == SEND_RESULT_PACKET;
}

function isIDStreamStartPacket(data){
  return Buffer.byteLength(data) == 2 && data[0] == ID_CONFIRMED_PACKET && data[1] == ID_CONFIRMATION_PROCESS_START;
}

function isIDStreamEndPacket(data){
  return Buffer.byteLength(data) == 2 && data[0] == ID_CONFIRMED_PACKET && data[1] == ID_CONFIRMATION_PROCESS_END;
}

function isIDStreamValuePacket(data){
  return Buffer.byteLength(data) == 6 && data[0] == ID_CONFIRMED_PACKET;
}

function isIDCheckRequest(data){
  return Buffer.byteLength(data) == 5 && data[0] == ID_CHECK_PACKET;
}

function isHandshakeEndPacket(data){
  return data == HANDSHAKE_END;
}

function isRegistrationModeEnteredPacket(data){
  return data[0] == MESSAGE_TYPE_ENTER_REGISTRATION_MODE;
}

function answerToIDCheckRequest(result){
  var buf = Buffer.alloc(2);
  buf[0] = ID_CHECK_PACKET;
  buf[1] = result;
  port.write(buf);
  console.log("check result returned");
}

function sendEntrerRegistrationModeMessage(){
  var buf = Buffer.alloc(1);
  buf[0] = MESSAGE_TYPE_ENTER_REGISTRATION_MODE;
  port.write(buf);
}

function startRegistration(){
  if(port != null && port.isOpen){
    sendEntrerRegistrationModeMessage();
  }
}

function sendSensorSubmissionPacket(controllerID,sensorID){
  console.log("Sending sensor submission packet");
  console.log("controllerID: " + controllerID);
  console.log("sensorID: " + sensorID);
  var buf = Buffer.alloc(9);
  buf[0] = SENSOR_SUBMISSION_PACKET;
  write32BitInt(buf,1,controllerID);
  write32BitInt(buf,5,sensorID);
  console.log(buf);
  port.write(buf);
}

function terminate(){
  if(port != null){
    port.close();
  }
}

function sendResetMessage(){
  port.write('R');
}

function sendLightValueChangedPacket(controllerAddress,newValue){
  console.log("Adddress: " + controllerAddress);
  console.log("New value: " + newValue);
  var buf = Buffer.alloc(7);
  buf[0] = LIGHT_VALUE_CHANGED_PACKET;
  write32BitInt(buf,1,controllerAddress);
  buf[5] = ((newValue & 0xFF00) >> 8);
  buf[6] = ((newValue & 0x00FF) >> 0);
  port.write(buf);
}

module.exports = {
  init,
  answerToHandshake,
  sendDevicesNumberPacket,
  answerToIDCheckRequest,
  terminate,
  startRegistration,
  sendSensorSubmissionPacket,
  sendResetMessage,
  sendLightValueChangedPacket,
   //for testing purposes
  connectHandlers,
  isHandshakePacket,
  isHandshakeEndPacket,
  isIDCheckRequest,
  isSendResultPacket,
  isIDStreamStartPacket,
  isIDStreamEndPacket,
  isIDStreamValuePacket,
  isRegistrationModeEnteredPacket,
  read32bitInt,
  write32BitInt,
  callPacketHandler
}
