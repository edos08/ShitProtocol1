let knex = require('knex')({
  client: 'pg',
  version: '9.4',
  connection: {
    host : '127.0.0.1',
    user : 'pi',
    password : 'raspberry',
    database : 'LoRaServices'
  }
});

function checkFirstStartupOfSystem(action){
  knex.withSchema('LoRa').select().table('Devices').then(function(devices){
    if(devices.length == 0)
        action();
  });
}

function fillRoomsScreen(after){
  knex.withSchema('LoRa').select().table('Rooms').then(function(rooms){
    after(rooms);
  });
}

function fillContentDivWithDevices(roomID,after){
  knex.withSchema('LoRa')
  .innerJoin('Device_types','Devices.Type','Device_types.ID')
  .where('Devices.Room',roomID)
  .select('Devices.ID','Devices.Description as desc ','Device_types.Description as dev_type','Device_types.ID as type')
  .from('Devices')
  .orderBy('ID','asc')
  .then(function(devices){
    after(devices);
  });
}

function checkIfIdIsInDB(id,resultHandler){
  knex.withSchema('LoRa')
  .select('ID')
  .from('Devices')
  .where('ID',id)
  .then(function(devices){
    resultHandler(devices.length);
  });
}

function insertDeviceIntoDB(id,type){
  console.log("Inserting : " + id + " - " + type);
  var k = knex('Devices').withSchema('LoRa')
  .insert({Address: id,Type: type}).then(function(){});
}

function queryAllDevicesWithNoRoomAssignedAndShowIn(after){
  knex.withSchema('LoRa')
  .select("Devices.ID as id ","Devices.Description as dev_desc ","Device_types.Description as dev_type","Device_types.ID as dev_type_id")
  .innerJoin('Device_types','Devices.Type','Device_types.ID')
  .from("Devices")
  .whereNull("Room")
  .orderBy('id','asc')
  .then(function(devices){
    after(devices);
  });
}

function queryAllDevicesWithRoomAssignedButNoSensorAndShowIn(after){
  knex.withSchema('LoRa')
  .select("Devices.ID as id ","Devices.Description as dev_desc ","Device_types.Description as dev_type","Device_types.ID as dev_type_id")
  .innerJoin('Device_types','Devices.Type','Device_types.ID')
  .from("Devices")
  .whereNull("Devices.Sensor")
  .whereNotNull("Devices.Room")
  .andWhere("Devices.Type",2)
  .orderBy('id','asc')
  .then(function(devices){
    after(devices);
  });
}

function insertRoomIntoDB(roomName,windowToReload,errorAction){
  console.log("Inserting : " + roomName);
  knex('Rooms').withSchema('LoRa')
  .insert({Description: roomName})
  .then(function(){
    windowToReload.reload();
  })
  .catch((error) =>{
    errorAction();
  })

}

function renameDevice(id,name,after,errorAction){
  console.log("ID " + id + " name " + name);
  knex('Devices').withSchema('LoRa')
  .where('ID',id)
  .update('Description', name)
  .then(function(result){
    if(result == 1){
      console.log("Descrizione aggiornata con successo!");
    }
    after();
  })
  .catch((error) => {
    errorAction();
  })
}

function fillRoomsList(after){
  knex.withSchema('LoRa')
  .select()
  .table('Rooms')
  .then(function(rooms){
    after(rooms);
  });
}

function assignDeviceToRoom(deviceID,roomID){
  knex('Devices').withSchema('LoRa')
  .where('ID',deviceID)
  .update('Room',roomID)
  .then(function(result){
    if(result == 1){
      console.log("Dispositivo assegnato alla stanza con successo!");
    }
  })
}

function assignSensorToController(controllerID,sensorID){
  knex('Devices').withSchema('LoRa')
  .where('ID',controllerID)
  .update('Sensor',sensorID)
  .then(function(result){
    if(result == 1){
      console.log("Sensore assegnato al dispositivo con successo");
    }
  })
}

function getAddressesForControllerAndSensor(controllerID,sensorID,after){
  knex.withSchema('LoRa')
  .select('Address')
  .from('Devices')
  .where('ID',controllerID)
  .orWhere('ID',sensorID)
  .orderBy('Type','asc')
  .then((devices) => {
    after(devices[0].Address,devices[1].Address);
  })
}

function checkIfHasRoomAssignedAndSelectSensor(deviceID,selectRoomFunction,selectDeviceFunction){
  console.log("test-" + deviceID);
  knex.withSchema('LoRa')
  .select('Room')
  .from('Devices')
  .where('ID',deviceID)
  .then(function(result){
    if(result[0].Room != null){
      selectDeviceFunction(deviceID,result[0].Room);
    }else{
      selectRoomFunction(deviceID,true);
    }
  })
}

function fillSensorsList(roomID,after){
  knex.withSchema('LoRa')
  .select('ID','Description')
  .from('Devices')
  .where('Type',3)
  .andWhere('Room', roomID)
  .then(function(sensors){
    after(sensors);
  });
}

function fillRoomNameContainer(roomID,after){
  console.log('ROOM:: '+ roomID);
  knex.withSchema('LoRa')
  .select('Description')
  .from('Rooms')
  .where('ID',"=",roomID)
  .then(function(rooms){
    after(rooms[0].Description);
  })
}

function getDeviceInfo(deviceID,after){
  knex.withSchema('LoRa')
  .select('devs.ID as id','devs.Type as type','devs.Description as description','devs.Sensor as sensorID','devs2.Description as sensor','devs.LightValue as value','desc.Time as time')
  .leftJoin('Devices as devs2','devs.Sensor','devs2.ID')
  .leftJoin('Status_log as stats','devs.ID','stats.ID')
  .from('Devices as devs')
  .where('devs.ID',deviceID)
  .orderBy('stats.Time','desc')
  .then((devices) =>{
    after(devices[0]);
  })
}

function changeLightValue(deviceID, newValue, after){
  knex('Devices').withSchema('LoRa')
  .update('LightValue',newValue)
  .where('ID',deviceID)
  .then(()=>{
    after();
  })
}

function getAddressForController(controllerID,after){
  knex.withSchema('LoRa')
  .select('Address')
  .from('Devices')
  .where('ID',controllerID)
  .then((devices) => {
    after(devices[0].Address);
  })
}

function deleteRoom(roomID,after){
  knex('Rooms').withSchema('LoRa')
  .where('ID',roomID)
  .del()
  .then(() =>{
    after();
  })
}

function insertCheckStateResult(address,value,callback){
  var date = (new Date).toISOString().replace(/z|t/gi,' ');
  date = date.substr(0,date.length - 5);
  address = (address >>> 0).toString(16);
  while(address.length < 8){
    address = "0" + address;
  }
  address = "0x" + address;
  knex.withSchema('LoRa')
  .select('ID as dev_id')
  .from('Devices')
  .where('Address',address)
  .then((devices) => {
    console.log(devices);
    knex('Status_log').withSchema('LoRa')
    .insert({
      Device: devices[0].dev_id,
      Value: value,
      Time: date
    })
    .then(function(){
      console.log('Succesful');
      callback(value);
    })

  })
}

function queryAllDevicesAddresses(callback){
  knex.withSchema('LoRa')
  .select('Devices.Address as Address','Devices.Type as Type','Devices.Description as Description','Device_types.Description as T_Description')
  .innerJoin('Device_types','Devices.Type','Device_types.ID')
  .from('Devices')
  .where('Type','<>',1)
  .then((devices) => {
    callback(devices);
  })
}

module.exports = {
  checkFirstStartupOfSystem,
  fillRoomsScreen,
  fillContentDivWithDevices,
  checkIfIdIsInDB,
  insertDeviceIntoDB,
  insertRoomIntoDB,
  queryAllDevicesWithNoRoomAssignedAndShowIn,
  renameDevice,
  fillRoomsList,
  assignDeviceToRoom,
  assignSensorToController,
  checkIfHasRoomAssignedAndSelectSensor,
  fillSensorsList,
  fillRoomNameContainer,
  queryAllDevicesWithRoomAssignedButNoSensorAndShowIn,
  getAddressesForControllerAndSensor,
  getDeviceInfo,
  changeLightValue,
  getAddressForController,
  deleteRoom,
  insertCheckStateResult,
  queryAllDevicesAddresses
}
