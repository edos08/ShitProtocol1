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
  .select('Devices.ID','Devices.Description as desc ','Device_types.Description as dev_type')
  .from('Devices')
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

function insertRoomIntoDB(roomName,windowToReload){
  console.log("Inserting : " + roomName);
  knex('Rooms').withSchema('LoRa')
  .insert({Description: roomName}).then(function(){
    windowToReload.reload();
  });;
}

function renameDevice(id,name,after){
  console.log("ID " + id + " name " + name);
  knex('Devices').withSchema('LoRa')
  .where('ID',id)
  .update('Description', name)
  .then(function(result){
    if(result == 1){
      console.log("Descrizione aggiornata con successo!");
    }
    after();
  });
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

function checkIfHasRoomAssignedAndSelectSensor(deviceID,selectRoomFunction,selectDeviceFunction){
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

function retreiveDevicesList(id,list,sendDevice){
  knex.withSchema('LoRa')
  .select("Address")
  .from('Devices')
  .where('Sensor',id)
  .then(function(devices){
    list = [];
    for(var a = 0; a < devices.length; a++){
      list.push(devices[a].Address);
    }
    sendDevice();
  });
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
  retreiveDevicesList
}
