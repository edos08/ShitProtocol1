var SerialPort = require('serialport');



function testRead(port){
  var expected = 'H';

  var valueRead = port.read(1);

  if(expected == valueRead)
    return console.log("Read operation test is succesful");
  else{
    return console.log("Reading test failed: expected " + expected + ", actual " + valueRead);
  }
}

function testWrite(port){
    port.write('H');
    port.drain();
    console.log("H written");
    testRead(port);
}



module.exports = {
  testRead: testRead,
  testWrite: testWrite
}
