const SerialPort = require('serialport/test');
const MockBinding = SerialPort.Binding;

const expect = require('chai').expect;
const sinon = require('sinon');
const PubSub = require('pubsub-js');

const SerialHelpers = require('../SerialHelpers');

describe('SerialHelpers module',function(){
  describe('the init function',function(){
    it('calls itself',function(){
      this.sandbox = sinon.sandbox.create();
      var callback = sinon.stub(SerialHelpers,'init');
      MockBinding.createPort('COM7', { echo: false });
      SerialHelpers.init('COM7');
      assertTrue(callback.called);
      this.sandbox.restore()
    })
  })
})

function assertTrue(data){
  expect(data).to.be.true;
}
