#ifndef SERIAL_HELPERS_H
#define SERIAL_HELPERS_H

#define HANDSHAKE_MESSAGE 'H'
#define HANDSHAKE_VALID_RESPONSE 'W'
#define HANDSHAKE_END_MESSAGE 'A'

#define MESSAGE_TYPE_DEVICES_COUNT 0
#define MESSAGE_TYPE_ID_CHECK_REQUEST_RESPONSE 1
#define MESSAGE_TYPE_DEVICES_SUBMISSION 2

#define MESSAGE_ID_VALID 0
#define MESSAGE_ID_INVALID 1

#define MESSAGE_DEVICES_STREAM_START 0
#define MESSAGE_DEVICE_STREAM_END 255

typedef struct SerialHelpers{
  static void write32bitIntegerIntoBuffer(char* buffer,uint32_t valueToWrite){
    buffer[1] = (char)((valueToWrite & 0xFF000000) >> 24);
		buffer[2] = (char)((valueToWrite & 0x00FF0000) >> 16);
		buffer[3] = (char)((valueToWrite & 0x0000FF00) >> 8);
		buffer[4] = (char)((valueToWrite & 0x000000FF);
  }
};

static bool isHandshakeResponseMessage(char dataBuffer[], int buffer_size){
 return buffer_size == 1 && dataBuffer[0] == HANDSHAKE_VALID_RESPONSE;
}

static void sendHandshakeMessage(){
  Serial.write(HANDSHAKE_MESSAGE);
}

static void sendHandShakeEndMessage(){
  Serial.write(HANDSHAKE_END_MESSAGE);
}

static bool isDevicesCountMessage(char dataBuffer[], int buffer_size){
  return buffer_size == 2 && dataBuffer[0] == MESSAGE_TYPE_DEVICES_COUNT;
}

static bool isIDCheckResponse(char dataBuffer[], int buffer_size){
  return buffer_size == 2 &&  dataBuffer[0] == MESSAGE_TYPE_ID_CHECK_REQUEST_RESPONSE;
}

static void sendIDCheckMessage(uint32_t ID){
  char buffer[5];
  buffer[0] = MESSAGE_TYPE_ID_CHECK_REQUEST_RESPONSE;
  SerialHelpers::write32bitIntegerIntoBuffer(buffer,ID);
  Serial.print(buffer);
}

static void sendDevicesStreamStartMessage(){
  Serial.write((uint8_t)MESSAGE_TYPE_DEVICES_SUBMISSION);
  Serial.write((uint8_t)MESSAGE_DEVICES_STREAM_START);
}

static void sendDevicesStreamEndMessage(){
  Serial.write((uint8_t)MESSAGE_TYPE_DEVICES_SUBMISSION);
  Serial.write((uint8_t)MESSAGE_DEVICE_STREAM_END);
}

static void sendDeviceInfoPacket(uint32_t ID, uint8_t type){
  Serial.write((uint8_t)MESSAGE_TYPE_DEVICES_SUBMISSION);
  //SerialHelpers::write32bitIntegerIntoSerial(ID);
  Serial.write(type);
}


#endif
