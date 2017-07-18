#ifndef SERIAL_HELPERS_H
#define SERIAL_HELPERS_H

#include <stdint.h>

#define HANDSHAKE_MESSAGE 'H'
#define HANDSHAKE_VALID_RESPONSE 'W'

#define MESSAGE_TYPE_DEVICES_COUNT 0
#define MESSAGE_TYPE_ID_CHECK_REQUEST_RESPONSE 1
#define MESSAGE_TYPE_DEVICES_SUBMISSION 2

#define MESSAGE_ID_VALID 0
#define MESSAGE_ID_INVALID 1

#define MESSAGE_DEVICES_STREAM_START 0
#define MESSAGE_DEVICE_STREAM_END 255

typedef struct SerialHelpers{
  static void write32bitIntegerIntoSerial(uint32_t valueToWrite){
    Serial.write((valueToWrite & 0xFF000000) >> 24);
		Serial.write((valueToWrite & 0x00FF0000) >> 16);
		Serial.write((valueToWrite & 0x0000FF00) >> 8);
		Serial.write(valueToWrite & 0x000000FF);
  }
};

static bool isHandshakeResponseMessage(char dataBuffer[], int buffer_size){
 return buffer_size == 1 && dataBuffer[0] == HANDSHAKE_VALID_RESPONSE;
}

static void sendHandshakeMessage(){
  Serial.write(HANDSHAKE_MESSAGE);
}

static bool isDevicesCountMessage(char dataBuffer[], int buffer_size){
  return buffer_size == 2 && dataBuffer[0] == MESSAGE_TYPE_DEVICES_COUNT;
}

static bool isIDCheckResponse(char dataBuffer[], int buffer_size){
  return buffer_size == 2 &&  dataBuffer[0] == MESSAGE_TYPE_ID_CHECK_REQUEST_RESPONSE;
}

static void sendIDCheckMessage(uint32_t ID){
  Serial.write((uin8_t)MESSAGE_TYPE_ID_CHECK_REQUEST_RESPONSE);
  SerialHelpers::write32bitIntegerIntoSerial(ID);
}

static void sendDevicesStreamStartMessage(){
  Serial.write((uin8_t)MESSAGE_TYPE_DEVICES_SUBMISSION);
  Serial.write((uin8_t)MESSAGE_DEVICES_STREAM_START);
}

static void sendDevicesStreamEndMessage(){
  Serial.write((uin8_t)MESSAGE_TYPE_DEVICES_SUBMISSION);
  Serial.write((uin8_t)MESSAGE_DEVICE_STREAM_END);
}

static void sendDeviceInfoPacket(uint32_t ID, uint8_t type){
  Serial.write((uin8_t)MESSAGE_TYPE_DEVICES_SUBMISSION);
  SerialHelpers::write32bitIntegerIntoSerial(ID);
  Serial.write(type);
}


#endif
