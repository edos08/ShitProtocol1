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
var listRequestHandler;

var onOpenFunction;

function init(handlers,onOpenCallback){
  connectHandlers(handlers);
  onOpenFunction = onOpenCallback;

  if(port != null && port.isOpen)
      return;

  openPort();
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

function connectHandlers(handlers){
  if(handlers.handshakeHandler)
    handshakeHandler = handlers.handshakeHandler;
  if(handlers.idCheckRequestHandler)
    idCheckRequestHandler = handlers.idCheckRequestHandler;
  if(handlers.idStreamStartHandler)
    idStreamStartHandler = handlers.idStreamStartHandler;
  if(handlers.idStreamValueHandler)
    idStreamValueHandler = handlers.idStreamValueHandler;
  if(handlers.idStreamEndHandler)
    idStreamEndHandler = handlers.idStreamEndHandler;
  if(handlers.handshakeEndHandler)
    handshakeEndHandler = handlers.handshakeEndHandler;
  if(handlers.registrationModeEnteredHandler)
    registrationModeEnteredHandler = handlers.registrationModeEnteredHandler;
  if(handlers.listRequestHandler)
    listRequestHandler = handlers.listRequestHandler;
}

function onPortOpened(err){
  if(err != null){
      console.log("Serial port error: ",err.message);
      port = null;
      openPort();
      return;
  }

  console.log("Port " + this.path + " opened succesfully");
  this.on('data',(data) =>{
    console.log('Received: \"' + data + "\"");
    console.log('lenght = ' + Buffer.byteLength(data));

    if(isHandshakePacket(data) && handshakeHandler){
      handshakeHandler();
    } else if(isHandshakeEndPacket(data) && handshakeEndHandler){
      handshakeEndHandler();
    }else if(isIDCheckRequest(data) && idCheckRequestHandler){
      var _id = read32bitInt(data,1);
      idCheckRequestHandler(_id);
    }else if (isIDStreamStartPacket(data) && idStreamStartHandler) {
      idStreamStartHandler();
    } else if (isIDStreamEndPacket(data) && idStreamEndHandler) {
      idStreamEndHandler();
    } else if (isIDStreamValuePacket(data) && idStreamValueHandler) {
      var _id = read32bitInt(data,1);
      var _type = data[5];
      idStreamValueHandler(_id,_type);
    } else if(isRegistrationModeEnteredPacket(data) && registrationModeEnteredHandler){
      registrationModeEnteredHandler();
    } else if(isListRequestPacket(data) && listRequestHandler){
      var _id = read32bitInt(data,1);
      listRequestHandler(_id);
    }

  });

  this.on('error',(error) =>{
    Console.log('Errore di connessione seriale ' + error);
  });

  this.on('close',(error) =>{
    port = null;
  });

  onOpenFunction();

}



function sendDevicesNumberPacket(devicesNumber){
  console.log(("Sending devices number.."));
  var buf = Buffer.alloc(2);
  buf[0] = DEVICES_NUMBER_PACKET;
  buf[1] = devicesNumber;
  port.write(buf);
  console.log(buf);
  console.log("done");
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

function isHandshakePacket(data){
  return data == HANDSHAKE_MESSAGE;
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
  if(Buffer.isBuffer(data))
    return data[0] == MESSAGE_TYPE_ENTER_REGISTRATION_MODE;
  else
    return data == MESSAGE_TYPE_ENTER_REGISTRATION_MODE;
}

function isListRequestPacket(data){
  return Buffer.byteLength(data) == 5 && data[0] == LIST_REQUEST_PACKET;
}

function answerToIDCheckRequest(result){
  var buf = Buffer.alloc(2);
  buf[0] = ID_CHECK_PACKET;
  buf[1] = result;
  port.write(buf);
  console.log(buf);
  console.log("done");
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
  }else{
    console.log("I ain't sending anything");
  }
}

function sendSensorSubmissionPacket(controllerID,sensorID){
  console.log("Sending sensor submission packet");
  var buf = Buffer.alloc(9);
  buf[0] = SENSOR_SUBMISSION_PACKET;
  write32BitInt(buf,1,controllerID);
  write32BitInt(buf,5,sensorID);
  port.write(buf);
}

function write32BitInt(buffer,offset,address){
  var mask = 0xFF;
  for(var a = 0; a < 4; a++){
    var currMask = mask >>  (8 * a);
    buffer[offset + a] = ((address & currMask) >> (8 * (3-a)))
  }
}

function terminate(){
  if(port != null){
    port.close();
  }
}

function sendResetMessage(){
  port.write('R');
}

module.exports = {
  init,
  answerToHandshake: answerToHandshake,
  sendDevicesNumberPacket: sendDevicesNumberPacket,
  answerToIDCheckRequest: answerToIDCheckRequest,
  terminate,
  startRegistration,
  sendSensorSubmissionPacket,
  sendResetMessage
}
