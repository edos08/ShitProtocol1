var knex = require('knex')({
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
    console.log("devices: " + devices);
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
    console.log(devices[0]);
    var content = "<ul>";
    for(var a = 0; a < devices.length; a++){
        content += "<li> " + devices[a].desc + " (" + devices[a].dev_type + ")</li>";
    }
    content += "</ul>"
    container.innerHTML = content;
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

function queryAllDevicesWithNoRoomAssignedAndShowIn(container){
  knex.withSchema('LoRa')
  .select("Devices.ID as id ","Devices.Description as dev_desc ","Device_types.Description as dev_type")
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
  + "<button onClick=\"onDeviceAssignToRoomButton(this)\"> Assegna ad una stanza </button>"
  + " </li>";
  console.log(device);
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

module.exports = {
  checkFirstStartupOfSystem: checkFirstStartupOfSystem,
  fillRoomsScreen,
  fillContentDivWithDevices,
  checkIfIdIsInDB,
  insertDeviceIntoDB,
  insertRoomIntoDB,
  queryAllDevicesWithNoRoomAssignedAndShowIn,
  renameDevice,
  fillRoomsList
}
