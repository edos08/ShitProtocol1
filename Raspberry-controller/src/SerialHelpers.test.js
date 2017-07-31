var serialHelpers = require('./SerialHelpers');


test('test only handshakeHandler should be connected',() => {
  serialHelpers.connectHandlers({
    handshakeHandler: function() {}
  });
  expect(serialHelpers.handshakeHandler).not.toBeUndefined();
})
