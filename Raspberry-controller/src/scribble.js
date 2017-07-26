
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

var buf = Buffer.alloc(4);

write32BitInt(buf,0,0x01020304);

console.log(buf);
