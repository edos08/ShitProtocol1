var SerialPort = require('serialport');

const DEVICES_NUMBER_PACKET = 0;
const ID_CHECK_PACKET = 1;
const ID_CONFIRMED_PACKET = 2;
const ID_CONFIRMATION_PROCESS_START = 0;
const ID_CONFERMATION_PROCESS_END = 255;
const HANDSHAKE_RESPONSE = 'W';
const HANDSHAKE_END = 'A';
const HANDSHAKE_MESSAGE = 'H';

var port;

var handshakeHandler;
var handshakeEndHandler;
var idCheckRequestHandler;
var idStreamStartHandler;
var idStreamValueHandler;
var idStreamEndHandler;

function init(portPath,handlers){
  if(portPath != ''){
    console.log("Testing " + portPath);

    handshakeHandler = handlers.handshakeHandler;
    idCheckRequestHandler = handlers.idCheckRequestHandler;
    idStreamStartHandler = handlers.idStreamStartHandler;
    idStreamValueHandler = handlers.idStreamValueHandler;
    idStreamEndHandler = handlers.idStreamEndHandler;
    handshakeEndHandler = handlers.handshakeEndHandler;

    port = new SerialPort(portPath,{
      baudRate: 9600,
      autoOpen: false
    });

    port.open(onPortOpened);
  }
}

function onPortOpened(err){
  if(err != null){
      console.log("Serial port error: ",err.message);
      port = null;
      return -1;
  }
  console.log("Port " + this.path + " opened succesfully");
  this.on('data',(data) =>{
    console.log('Received: \"' + data + "\"");
    if(Buffer.isBuffer(data))
      console.log('lenght = ' + Buffer.byteLength(data));
    if(isHandshakePacket(data)){
      if(handshakeHandler){
        handshakeHandler();
      }
    } else if(isHandshakeEndPacket(data)){
      if(handshakeEndHandler){
        handshakeEndHandler();
      }
    }else if(isIDCheckRequest(data)){
      if(idCheckRequestHandler){
        var _id = read32bitInt(data,1);
        idCheckRequestHandler(_id);
      }
    }else if (isIDStreamStartPacket(data)) {
      if(idStreamStartHandler)
        idStreamStartHandler();
    } else if (isIDStreamEndPacket(data)) {
      if(idStreamEndHandler)
        idStreamEndHandler();
    } else if (isIDStreamValuePacket(data)) {
      if(idStreamValueHandler){
        var _id = globals.read32bitInt(data,1);
        var _type = data[5];
        idStreamValueHandler(_id,_type);
      }
    }
  });
  return 1;
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

function answerToIDCheckRequest(result){
  var buf = Buffer.alloc(2);
  buf[0] = ID_CHECK_PACKET;
  buf[1] = result;
  port.write(buf);
  console.log("check result returned");
}
module.exports = {
  init: init,
  answerToHandshake: answerToHandshake,
  sendDevicesNumberPacket: sendDevicesNumberPacket,
  answerToIDCheckRequest: answerToIDCheckRequest
}
