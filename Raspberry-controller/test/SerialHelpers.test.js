var serialHelpers = require('../src/SerialHelpers');

const mockFunc = jest.fn(() => 1);

test('should read 0xAB192837',() => {
  var buf = Buffer.alloc(4);
  buf[0] = 0xAB;
  buf[1] = 0x19;
  buf[2] = 0x28;
  buf[3] = 0x37;
  var result = serialHelpers.read32bitInt(buf,0)
  expect((result >>> 0)).toBe(0xAB192837);
})

test('should write : 0xAB, 0x19, 0x28, 0x37',() => {
  var buf = Buffer.alloc(4);
  serialHelpers.write32BitInt(buf,0,0xAB192837);
  expect(buf[0]).toBe(0xAB);
  expect(buf[1]).toBe(0x19);
  expect(buf[2]).toBe(0x28);
  expect(buf[3]).toBe(0x37);
})

test('check handshake connection and call',() => {
  serialHelpers.connectHandlers({
     handshakeHandler: mockFunc
  });
  var handshakeMessage = Buffer.alloc(1,'H');
  expect(serialHelpers.callPacketHandler(handshakeMessage)).toBe(1);
})

test('check handshakeEnd connection and call',() => {
  serialHelpers.connectHandlers({
     handshakeEndHandler: mockFunc
  });
  var handshakeEndMessage = Buffer.alloc(1,'A');
  expect(serialHelpers.callPacketHandler(handshakeEndMessage)).toBe(1);
})

test('check idCheckRequest connection and call',() => {
  serialHelpers.connectHandlers({
     idCheckRequestHandler: mockFunc
  });
  var idCheckMessage = Buffer.alloc(5,1);
  expect(serialHelpers.callPacketHandler(idCheckMessage)).toBe(1);
})

test('check idStreamStart connection and call',() => {
  serialHelpers.connectHandlers({
     idStreamStartHandler: mockFunc
  });
  var idStreamStartMessage = Buffer.alloc(2);
  idStreamStartMessage[0] = 2;
  idStreamStartMessage[1] = 0;
  expect(serialHelpers.callPacketHandler(idStreamStartMessage)).toBe(1);
})

test('check idStreamEnd connection and call',() => {
  serialHelpers.connectHandlers({
     idStreamEndHandler: mockFunc
  });
  var idStreamEndMessage = Buffer.alloc(2);
  idStreamEndMessage[0] = 2;
  idStreamEndMessage[1] = 255;
  expect(serialHelpers.callPacketHandler(idStreamEndMessage)).toBe(1);
})

test('check idStreamValue connection and call',() => {
  serialHelpers.connectHandlers({
     idStreamValueHandler: mockFunc
  });
  var idStreamValueMessage = Buffer.alloc(6);
  idStreamValueMessage[0] = 2;
  expect(serialHelpers.callPacketHandler(idStreamValueMessage)).toBe(1);
})

test('check registrationModeEntered connection and call',() => {
  serialHelpers.connectHandlers({
     registrationModeEnteredHandler: mockFunc
  });
  var registrationModeEnteredMessage = Buffer.alloc(1,3);
  expect(serialHelpers.callPacketHandler(registrationModeEnteredMessage)).toBe(1);
})

test('check idStreamValue connection and call',() => {
  serialHelpers.connectHandlers({
     sendResultHandler: mockFunc
  });
  var sendResultMessage = Buffer.alloc(2);
  sendResultMessage[0] = 6;
  expect(serialHelpers.callPacketHandler(sendResultMessage)).toBe(1);
})
