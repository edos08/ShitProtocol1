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

function fillRoomsScreen(container){
  knex.withSchema('LoRa').select('Description').then(function(rooms){
    var content = "";
    for(var a = 0; a < rooms.length; a++){
      content += "<li>" + rooms[a] + " </li>";
    }
    container.innerHTML = content;
  });
}
module.exports = {
  checkFirstStartupOfSystem: checkFirstStartupOfSystem,
  fillRoomsScreen
}
