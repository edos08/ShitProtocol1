var date = (new Date).toISOString().replace(/z|t/gi,' ');
date = date.substr(0,date.length - 5);
console.log(date);
//"2015-07-03 10:50:22.481 "
