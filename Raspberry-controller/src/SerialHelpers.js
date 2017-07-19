var SerialPort = require('serialport');

var DEVICES_NUMBER_PACKET = 0;
var ID_CHECK_PACKET = 1;
var ID_CONFIRMED_PACKET = 2;
var ID_CONFIRMATION_PROCESS_START = 0;
var ID_CONFERMATION_PROCESS_END = 255;

var port;

var handshakeHandler;
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
    console.log('Received: ' + data + "\n");
    if(isHandshakePacket(data)){
      if(handshakeHandler){
        handshakeHandler();
      }else{
        console.log("No handler");;
      }
    } else if(isIDCheckRequest(data)){
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
  port.write(Buffer.alloc(1,DEVICES_NUMBER_PACKET));
  port.write(Buffer.alloc(1,devicesNumber));
  console.log("done");
}

function answerToHandshake(){
    port.write("W");
    console.log("Handshake completed");
}

function read32bitInt(data,startIndex){
  var _id = 0;
  var shifter = 24;
  for(var a = startIndex; a < startIndex+4; a++){
    id |= (data[a] << shifter);
    shifter -= 8;
  }
  return _id;
}

function isHandshakePacket(data){
  return data == 'H';
}

function isIDStreamStartPacket(data){
  return data.lenght == 2 && data[0] == ID_CONFIRMED_PACKET && data[1] == ID_CONFIRMATION_PROCESS_START;
}

function isIDStreamEndPacket(data){
  return data.lenght == 2 && data[0] == ID_CONFIRMED_PACKET && data[1] == ID_CONFIRMATION_PROCESS_END;
}

function isIDStreamValuePacket(data){
  return data.lenght == 6 && data[0] == ID_CONFIRMED_PACKET;
}

function isIDCheckRequest(data){
  return data.length == 5 && data[0] == ID_CHECK_PACKET;
}

function answerToIDCheckRequest(result){
  port.write(Buffer.alloc(1,ID_CHECK_PACKET));
  port.write(Buffer.alloc(1,result));
}
module.exports = {
  init: init,
  answerToHandshake: answerToHandshake,
  sendDevicesNumberPacket: sendDevicesNumberPacket,
  handshakeHandler: handshakeHandler,
  idCheckRequestHandler: idCheckRequestHandler,
  idStreamStartHandler: idStreamStartHandler,
  idStreamValueHandler: idStreamValueHandler,
  idStreamEndHandler: idStreamEndHandler,
  answerToIDCheckRequest: answerToIDCheckRequest
}
