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
  var k = knex.withSchema('LoRa')
  .insert({ID: 0,Address: id,Type: type});
  console.log(k);
}


module.exports = {
  checkFirstStartupOfSystem: checkFirstStartupOfSystem,
  fillRoomsScreen,
  fillContentDivWithDevices,
  checkIfIdIsInDB,
  insertDeviceIntoDB
}
