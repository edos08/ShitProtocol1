var dbHelper = require('../main/DBHelper');

setUpComponents(){
   fillRoomsList();
}

function fillRoomsList(){
    dbHelper.fillRoomsList(document.getElementById('rooms_list'));
}
