var serialHelpers = require('../src/SerialHelpers');
const SerialPort = require('serialport');

//mock port opening
SerialPort.prototype.open = jest.fn( (onPortOpened) => onPortOpened(null));

test('should be handshake packet',() => {
  expect(serialHelpers.isHandshakePacket('H')).toBeTruthy();
})


test('should be handshakeEnd packet',() => {
  expect(serialHelpers.isHandshakeEndPacket('A')).toBeTruthy();
})

test('should be idCheckRequest packet',() => {
  var buf = Buffer.alloc(5);
  buf[0] = 1;
  expect(serialHelpers.isIDCheckRequest(buf)).toBeTruthy();
})

test('should be a sendResult packet',() =>{
  var buf = Buffer.alloc(2);
  buf[0] = 6;
  buf[1] = 1;
  expect(serialHelpers.isSendResultPacket(buf)).toBeTruthy();
})

test('should be idStreamStartPacket', () => {
  var buf = Buffer.alloc(2);
  buf[0] = 2;
  expect(serialHelpers.isIDStreamStartPacket(buf)).toBeTruthy();
})

test('should be idStreamEndPacket', () => {
  var buf = Buffer.alloc(2);
  buf[0] = 2;
  buf[1] = 255;
  expect(serialHelpers.isIDStreamEndPacket(buf)).toBeTruthy();
})

test('should be isIDStreamValuePacket', () => {
  var buf = Buffer.alloc(6);
  buf[0] = 2;
  expect(serialHelpers.isIDStreamValuePacket(buf)).toBeTruthy();
})

test('should be registrationModeEnteredPacket',() => {
  var buf = Buffer.alloc(1);
  buf[0] = 3;
  expect(serialHelpers.isRegistrationModeEnteredPacket(buf)).toBeTruthy();
})

test('should read 0xAB192837',() => {
  var buf = Buffer.alloc(4);
  buf[0] = 0xAB;
  buf[1] = 0x19;
  buf[2] = 0x28;
  buf[3] = 0x37;
  var result = serialHelpers.read32bitInt(buf,0)
  expect((result >>> 0)).toBe(0xAB192837);
})

test('should call on port opened: ',() => {
  serialHelpers.openPort();
})

test('check handlers connection',() => {
  serialHelpers.connectHandlers({
     handshakeHandler: () => {},
     handshakeEndHandler: () => {},
     idCheckRequestHandler: () => {},
     idStreamStartHandler: () => {},
     idStreamValueHandler: () => {},
     idStreamEndHandler: () => {},
     registrationModeEnteredHandler: () => {},
     sendResultHandler: () => {}
  });
  expect(serialHelpers.handshakeHandler).not.toBeUndefined();
  expect(serialHelpers.handshakeEndHandler).not.toBeUndefined();
  expect(serialHelpers.idCheckRequestHandler).not.toBeUndefined();
  expect(serialHelpers.idStreamStartHandler).not.toBeUndefined();
  expect(serialHelpers.idStreamValueHandler).not.toBeUndefined();
  expect(serialHelpers.idStreamEndHandler).not.toBeUndefined();
  expect(serialHelpers.registrationModeEnteredHandler).not.toBeUndefined();
  expect(serialHelpers.sendResultHandler).not.toBeUndefined();
})
