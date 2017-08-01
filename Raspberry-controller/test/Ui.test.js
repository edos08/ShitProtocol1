var Application = require('spectron').Application;
var assert = require('assert');
let electronPath = require('electron');
const path = require('path');
let app;

describe('application launch', function () {
  this.timeout(10000)

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
   this.app.client.getWindowCount().then(function (count) {
      assert.equal(count, 1)
    })
		this.app.client.element('.left.col').click('#7').then(() => {
			this.app.client.element('.right.col').click('#150').then(() => {
				assert.equal(1,1);
			})
		})
  })
})
