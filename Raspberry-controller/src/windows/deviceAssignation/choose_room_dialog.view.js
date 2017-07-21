var dbHelper = require('../main/DBHelper');

function setUpComponents(){
   fillRoomsList();
}

function fillRoomsList(){
    dbHelper.fillRoomsList(document.getElementById('rooms_list'));
}
