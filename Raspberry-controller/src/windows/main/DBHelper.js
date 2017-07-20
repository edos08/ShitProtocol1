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
      content += "<li id=\""+ rooms[a].ID +"\" onClick = \""+ onClick + "(this.id)\">" + rooms[a].Description + " </li>";
    }
    container.innerHTML = content;
  });
}

function fillContentDivWithDevices(container,roomID){
  knex.withSchema('LoRa')
  .select('Devices.ID','Devices.Description','Device_types.Description')
  .from('Devices')
  .innerJoin('Devices.Type','Device_types.ID')
  .where('Room',roomID)
  .then(function(devices){
    var content = "<ul>";
    for(var a = 0; a < devices.length; a++){
        content += "<li> " + devices.Devices.Description + " (" + devices.Device_types.Description + ")</li>";
    }
    content += "</ul>"
    container.innerHTML = content;
  });
}

module.exports = {
  checkFirstStartupOfSystem: checkFirstStartupOfSystem,
  fillRoomsScreen,
  fillContentDivWithDevices
}
