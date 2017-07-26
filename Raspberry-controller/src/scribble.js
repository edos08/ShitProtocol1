
const masks = [
  0xFF000000,
  0x00FF0000,
  0x0000FF00,
  0x000000FF
]

function write32BitInt(buffer,offset,address){
  for(var a = 0; a < 4; a++){
    buffer[offset + a] = ((address & masks[a]) >> (8 * (3-a)))
  }
}

function sendSensorSubmissionPacket(){
  console.log("Sending sensor submission packet");
  var buf = Buffer.alloc(9);
  buf[0] = 4;
  write32BitInt(buf,1,0xC38ABB77);
  write32BitInt(buf,5,0x6ECDF57C);
  console.log(buf);
  //port.write(buf);
}

sendSensorSubmissionPacket()
