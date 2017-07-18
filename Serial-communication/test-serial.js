//var SerialPort = require('serialport');

function testFindDuplicateFunction(){
  var givenDevicesIds = [0xCCC,0xFF3,0xAB123];
  thenIdSouldBeInvalid(givenDevicesIds,0xCCC);
  thenIdSouldBeValid(givenDevicesIds,0xA);
}

function isDuplicateId(devices,id){
  var idsFound = 0;
  for(var a = 0; a < devices.length; a++){
    if(devices[a] == id){
      idsFound++;
    }
  }
  return idsFound > 0;
}

function thenIdSouldBeInvalid(devices,id){
  console.log("Id should be invalid: " + isDuplicateId(devices,id));
}


function thenIdSouldBeValid(devices,id){
  console.log("Id should be valid: " + !isDuplicateId(devices,id));
}

testFindDuplicateFunction();
