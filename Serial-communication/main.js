var SerialPort = require('serialport');
var globals = require('./globals');

var devices_to_register = 1; //this should be given from the user (1 - 255)
var handshakeSucceded = false;
var id_acceptation_stream_active = false;
var accepted_ids = 0;

var port = new SerialPort('COM7',{
  baudRate: 9600
}, onPortOpened);

port.on('data',(data) =>{
  console.log('Received: ' + data);
  if(!handshakeSucceded){
    handshakeSucceded = assertHandshake(data);
    if(handshakeSucceded){
        port.write(globals.DEVICES_NO_PACKET);
        port.write(devices_to_connect);
    }
  } else if(globals.isIDCheckRequest(data)){
    var _id = globals.read32bitInt(data,1);
    //query mongodb here
    //"SELECT ID FROM devices WHERE ID = \"" + _id + ""\""
    return 0;//Number of lines found in mongo
  }else if (!id_acceptation_stream_active && globals.isIDStreamStartPacket(data)) {
    id_acceptation_stream_active = true;
  } else if (id_acceptation_stream_active && globals.isIDStreamEndPacket(data)) {
    !id_acceptation_stream_active = false;
    if(accepted_ids == devices_to_register)
        //operation completed, go to device association phase
    else {
      //Operation failed, abort
    }
  } else if (id_acceptation_stream_active && globals.isIDStreamValuePacket(data)) {
    var _id = globals.read32bitInt(data,1);
    var type = data[5];
    //write data to database
    //LoRa/devices "{\"ID\" : \"" + _id + "\", \"type\" : \"" + type + "\"}"
    accepted_ids++;
  }
});

function onPortOpened(err){
  if(err != null){
      return console.log("Serial port error: ",err.message);
  }
  console.log("Port " + this.path + " opened succesfully");
}

function assertHandshake(data){
  if(data == "H"){
    port.write("W");
    return true;
  }
  console.log("Message received was not expected");
  return false;
}
