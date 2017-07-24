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

function fillRoomsScreen(container,onClick){
  knex.withSchema('LoRa').select().table('Rooms').then(function(rooms){
    var content = "";
    for(var a = 0; a < rooms.length; a++){
      content+= "<hr>";
      content += "<li class = \"room_element\" id=\""+ rooms[a].ID +"\" onClick = \""+ onClick + "(this.id)\">" + rooms[a].Description + " </li>";
      content += "<hr>";
    }
    container.innerHTML = content;
  });
}

function fillContentDivWithDevices(container,roomID){
  knex.withSchema('LoRa')
  .innerJoin('Device_types','Devices.Type','Device_types.ID')
  .where('Devices.Room',roomID)
  .select('Devices.ID','Devices.Description as desc ','Device_types.Description as dev_type')
  .from('Devices')
  .then(function(devices){
    var content = "<ul>";
    for(var a = 0; a < devices.length; a++){
      content += createDeviceItemForList(devices[a]);
    }
    content += "</ul>"
    container.innerHTML = content;
  });
}

function createDeviceItemForList(device){
    return "<li> "
    + ((device.desc != null)?device.desc:"Dispositivo senza nome")
    + " ("
    + device.dev_type + ")</li>";
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

function queryAllDevicesWithNoRoomAssignedAndShowIn(container){
  knex.withSchema('LoRa')
  .select("Devices.ID as id ","Devices.Description as dev_desc ","Device_types.Description as dev_type","Device_types.ID as dev_type_id")
  .innerJoin('Device_types','Devices.Type','Device_types.ID')
  .from("Devices")
  .whereNull("Room")
  .orderBy('id','asc')
  .then(function(devices){
    var content = "";
    if(devices.length > 0){
      content = "<ul>";
      for(var a = 0; a < devices.length; a++){
          content += populateListItemWithDeviceInfo(devices[a]);
      }
      content += "</ul>";
    }else {
      content = "Nessun dispositivo da collegare ad altre stanze";
    }
    container.innerHTML = content;
  });
}

function populateListItemWithDeviceInfo(device){
  var content = "<li id = \"" + device.id +"\"> "
  + ((device.dev_desc != null)?device.dev_desc:"Dispositivo senza nome")
  + " - " + device.dev_type
  + "<button onClick=\"onDeviceRenameButtonClick(this)\"> Rinomina dispositivo </button>"
  + "<button onClick=\"onDeviceAssignToRoomButtonClick(this)\"> Assegna ad una stanza </button>"
  + ((device.dev_type_id == 2)?"<button onClick =\"onDeviceAssignSensorButtonClick(this)\"> Assegna un sensore </button>":"")
  + " </li>";
  return content;
}

function insertRoomIntoDB(roomName,windowToReload){
  console.log("Inserting : " + roomName);
  knex('Rooms').withSchema('LoRa')
  .insert({Description: roomName}).then(function(){
    windowToReload.reload();
  });;
}

function renameDevice(id,name,windowToReload){
  console.log("ID " + id + " name " + name);
  knex('Devices').withSchema('LoRa')
  .where('ID',id)
  .update('Description', name)
  .then(function(result){
    if(result == 1){
      console.log("Descrizione aggiornata con successo!");
    }
    windowToReload.reload();
  });
}

function fillRoomsList(container){
  knex.withSchema('LoRa')
  .select()
  .table('Rooms')
  .then(function(rooms){
    var content = "";
    for(var a = 0; a < rooms.length; a++){
      content += "<option value = \"" + rooms[a].ID + "\"> " + rooms[a].Description + "</option>";
    }
    container.innerHTML = content;
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
      console.console.log("Sensore assegnato al dispositivo con successo");
    }
  })
}

function checkIfHasRoomAssignedAndSelectSensor(deviceID,selectRoomFunction,selectDeviceFunction){
  knex.withSchema('LoRa')
  .select('Room')
  .from('Devices')
  .where('ID',deviceID)
  .then(function(result){
    if(result.Room != null){
      selectDeviceFunction();
    }else{
      selectRoomFunction(deviceID,true);
    }
  })
}

function fillSensorsList(sensorsListContainer,roomID){
  knex.withSchema('LoRa')
  .select('ID','Description')
  .from('Devices')
  .where('Type',3)
  .then(function(sensors){
    console.log("sensors: " + sensors);
    var content = "";
    for(var a = 0; a < sensors.length; a++){
      content += "<option value = \"" + sensors[a].ID + "\"> " + sensors[a].Description + "</option>";
    }
    sensorsListContainer.innerHTML = content;
  });
}

function fillRoomNameContainer(roomID,roomNameContainer){
  console.log('ROOM:: '+ roomID);
  knex.withSchema('LoRa')
  .select('Description as desc')
  .from('Rooms')
  .where('ID',"=",roomID)
  .then(function(room){
    console.log("r: " + room);
    roomNameContainer.innerHTML += room.desc;
  })
}

module.exports = {
  checkFirstStartupOfSystem: checkFirstStartupOfSystem,
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
  fillRoomNameContainer
}
