var Application = require('spectron').Application;
var assert = require('assert');
let electronPath = require('electron');
const path = require('path');
let app = new Application({
	path: electronPath,
	args: [
		path.join(__dirname,"..",'src','app')
	]
})


app.start().then(() => {
	return app.browserWindow.isVisible();
}).then((isVisible) => {
	assert.equal(isVisible,true);
}).then(() =>{
	app.client.element('.left.col').click('#7').then(() => {
		app.client.element('.right.col').click('#150').then(() => {
			assert.equal(1,1);
		})
	})
}).then(() => {
	return app.stop();
}).catch((error) => {
	console.error('Test failed',error.message);
})
