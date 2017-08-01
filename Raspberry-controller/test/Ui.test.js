var Application = require('spectron').Application;
var assert = require('assert');
let electronPath = require('electron');
const path = require('path');
let app;

var


describe('application launch', function () {
  //this.timeout(10000)

  beforeEach(function () {
    this.app = new Application({
      path: electronPath,
			args: [
				path.join(__dirname,"..",'src','app')
			]
    })
    return this.app.start()
  })

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  })

  it('shows an initial window', function () {
    return this.app.client.getWindowCount().then(function (count) {
      assert.equal(count, 1)
    })
  })
})
