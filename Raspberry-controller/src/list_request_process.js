var serialHelpers = require('./SerialHelpers');
var dbHelper = require('./windows/main/DBHelper');

var sensorToInform;
var hasRetreivedTable;
var list = [];
var listIndex;

function init(){
  serialHelpers.init({
    listRequestHandler: handleListRequest
  });
}

function handleListRequest(id){
  if(listHasEnded()){
    sensorToInform = id;
    dbHelper.retreiveDevicesList(id,list,sendDevice);
  }else if(id == sensorToInform){
    sendDevice();
  }
}

function sendDevice(){
  if(list.length != 0 && listIndex < list.length){
    serialHelpers.sendDeviceListItem(list[listIndex]);
    listIndex++;
  }else{
    serialHelpers.sendDeviceListEndMessage(sensorToInform);
  }
}

function listHasEnded(){
  return list.length == 0 || listIndex == list.length;
}

function sendDeviceDeletedMessage(sensorID, deviceID){
}

module.exports = {
  init,
  sendDeviceDeletedMessage,
  sendDeviceAddedMessage
}
