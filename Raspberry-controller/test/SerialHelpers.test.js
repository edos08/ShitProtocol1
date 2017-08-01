var assert = require('assert');
var proxyquire = require('proxyquire').noCallThru();
var sinon = require('sinon');

var isOpen = false;

var openFunc = function(onPortOpened){
  onPortOpened();
}

function mockSerialPort(){
  this.write = sinon.stub();
  this.open = openFunc;
  this.on = sinon.stub();
  this.isOpen = isOpen;
}


var serialHelpers = proxyquire('../src/SerialHelpers',{
  'serialport' : mockSerialPort
});

const mockFunc = sinon.stub().returns(1);

describe('serial Helpers:',() => {

  describe('bitwise write',() => {
    it('should write : 0xAB, 0x19, 0x28, 0x37',() => {
      var buf = Buffer.alloc(4);
      serialHelpers.write32BitInt(buf,0,0xAB192837);
      assert.equal(buf[0], 0xAB);
      assert.equal(buf[1], 0x19);
      assert.equal(buf[2], 0x28);
      assert.equal(buf[3], 0x37);
    })
  })

  describe('packet reception',() => {
    it('check handshake connection and call',() => {
      serialHelpers.init({
         handshakeHandler: mockFunc
      });
      var handshakeMessage = Buffer.alloc(1,'H');
      assert.equal(serialHelpers.callPacketHandler(handshakeMessage), 1);
    })

    it('check handshakeEnd connection and call',() => {
      serialHelpers.init({
         handshakeEndHandler: mockFunc
      });
      var handshakeEndMessage = Buffer.alloc(1,'A');
      assert.equal(serialHelpers.callPacketHandler(handshakeEndMessage), 1);
    })

    it('check idCheckRequest connection and call',() => {
      var fixedID = 0xAB192837;
      serialHelpers.init({
         idCheckRequestHandler: (_id) => {return _id;}
      });
      var idCheckMessage = Buffer.alloc(5);
      idCheckMessage[0] = 1;
      serialHelpers.write32BitInt(idCheckMessage,1,fixedID);
      assert.equal((serialHelpers.callPacketHandler(idCheckMessage)) >>> 0, 0xAB192837);
    })

    it('check idStreamStart connection and call',() => {
      serialHelpers.init({
         idStreamStartHandler: mockFunc
      });
      var idStreamStartMessage = Buffer.alloc(2);
      idStreamStartMessage[0] = 2;
      idStreamStartMessage[1] = 0;
      assert.equal(serialHelpers.callPacketHandler(idStreamStartMessage), 1);
    })

    it('check idStreamEnd connection and call',() => {
      serialHelpers.init({
         idStreamEndHandler: mockFunc
      });
      var idStreamEndMessage = Buffer.alloc(2);
      idStreamEndMessage[0] = 2;
      idStreamEndMessage[1] = 255;
      assert.equal(serialHelpers.callPacketHandler(idStreamEndMessage), 1);
    })

    it('check idStreamValue connection and call',() => {
      serialHelpers.init({
         idStreamValueHandler: mockFunc
      });
      var idStreamValueMessage = Buffer.alloc(6);
      idStreamValueMessage[0] = 2;
      assert.equal(serialHelpers.callPacketHandler(idStreamValueMessage), 1);
    })

    it('check registrationModeEntered connection and call',() => {
      serialHelpers.init({
         registrationModeEnteredHandler: mockFunc
      });
      var registrationModeEnteredMessage = Buffer.alloc(1,3);
      assert.equal(serialHelpers.callPacketHandler(registrationModeEnteredMessage), 1);
    })

    it('check idStreamValue connection and call',() => {
      serialHelpers.init({
         sendResultHandler: mockFunc
      });
      var sendResultMessage = Buffer.alloc(2);
      sendResultMessage[0] = 6;
      assert.equal(serialHelpers.callPacketHandler(sendResultMessage), 1);
    })
  })

  describe('packet sending',() => {
    it('check sendLightValueChangedPacket format',() => {
      var packet = serialHelpers.sendLightValueChangedPacket(0xAB192837,600);
      assert.equal(Buffer.byteLength(packet), 7);
      assert.equal(packet[0], 5);
      assert.equal(packet[1], 0xAB);
      assert.equal(packet[2], 0x19);
      assert.equal(packet[3], 0x28);
      assert.equal(packet[4], 0x37);
      var light = packet[5] << 8;
      light |= packet[6];
      assert.equal(light, 600);
    })

    it('check sendResetMessage format',() =>{
      var packet = serialHelpers.sendResetMessage();
      assert.equal(Buffer.byteLength(packet), 1);
      assert.equal(packet[0], 'R'.charCodeAt(0));
    })

    it('check sendSensorSubmissionPacket format',() => {
      var packet = serialHelpers.sendSensorSubmissionPacket(0xAB192837,0xCEA06823);
      assert.equal(Buffer.byteLength(packet), 9);
      assert.equal(packet[0], 4);
      assert.equal(packet[1], 0xAB);
      assert.equal(packet[2], 0x19);
      assert.equal(packet[3], 0x28);
      assert.equal(packet[4], 0x37);
      assert.equal(packet[5], 0xCE);
      assert.equal(packet[6], 0xA0);
      assert.equal(packet[7], 0x68);
      assert.equal(packet[8], 0x23);
    })

    it('check answerToIDCheckRequest format',() => {
      var packet = serialHelpers.answerToIDCheckRequest(0);
      assert.equal(Buffer.byteLength(packet), 2);
      assert.equal(packet[0], 1);
      assert.equal(packet[1], 0);
    })

    it('check sendDevicesNumberPacket format',() => {
      var packet = serialHelpers.sendDevicesNumberPacket(168);
      assert.equal(Buffer.byteLength(packet), 2);
      assert.equal(packet[0], 0);
      assert.equal(packet[1], 168);
    })

    it('check answerToHandshake format',() =>{
      var packet = serialHelpers.answerToHandshake();
      assert.equal(Buffer.byteLength(packet), 1);
      assert.equal(packet[0], 'W'.charCodeAt(0));
    })
  })

  describe('port opening',() => {

    var shouldBeCalled = sinon.spy();

    it('should call onPortOpened',() => {
      serialHelpers.init({},shouldBeCalled);
      assert.equal(shouldBeCalled.called,true);
    })

    it('should not call onPortOpened',() => {
      serialHelpers.init({},null);
      assert.equal(shouldBeCalled.calledOnce,true);
    })

    it('should throw an error',() => {
      var shouldNotBeCalled = sinon.spy();
      openFunc = function(onPortOpened){
        onPortOpened({
          message: 'stub error'
        });
      }
      serialHelpers.init({},shouldNotBeCalled);
      assert.equal(shouldNotBeCalled.called,false);
    })
  })
})
