var DEVICES_NO_PACKET = 0;
var ID_CHECK_PACKET = 1;
var ID_CONFIRMED_PACKET = 2;
var ID_CONFIRMATION_PROCESS_START = 0;
var ID_CONFERMATION_PROCESS_END = 255;

module.exports = {
  read32bitInt: function(data,startIndex){
    var _id = 0;
    var shifter = 24;
    for(int a = startIndex; a < startIndex+4; a++){
      id |= (data[a] << shifter);
      shifter -= 8;
    }
    return _id;
  },
  isIDStreamStartPacket: function(data){
    return data.lenght == 2 && data[0] == ID_CONFIRMED_PACKET && data[1] == ID_CONFIRMATION_PROCESS_START;
  },
  isIDStreamEndPacket: function(data){
    return data.lenght == 2 && data[0] == ID_CONFIRMED_PACKET && data[1] == ID_CONFIRMATION_PROCESS_END;
  },
  isIDStreamValuePacket: function(data){
    return data.lenght == 6 && data[0] == ID_CONFIRMED_PACKET;
  },
  isIDCheckRequest: function(data){
    return data.length == 5 && data[0] == ID_CHECK_PACKET;
  },
  DEVICES_NO_PACKET: DEVICES_NO_PACKET
}
