#ifndef SERIAL_HELPERS_H
#define SERIAL_HELPERS_H

#define HANDSHAKE_MESSAGE 'H'
#define HANDSHAKE_VALID_RESPONSE 'W'
#define HANDSHAKE_END_MESSAGE 'A'
#define HANDSHAKE_RESET 'R'

#define MESSAGE_TYPE_DEVICES_COUNT 0
#define MESSAGE_TYPE_ID_CHECK_REQUEST_RESPONSE 1
#define MESSAGE_TYPE_DEVICES_SUBMISSION 2
#define MESSAGE_TYPE_ENTER_REGISTRATION_MODE 3
#define MESSAGE_TYPE_SENSOR_SUBMISSION 4
#define MESSAGE_TYPE_LIGHT_VALUE_CHANGED 5
#define MESSAGE_TYPE_SEND_RESULT 6
#define MESSAGE_TYPE_CHECK_SENSOR_STATUS 7
#define MESSAGE_TYPE_CHECK_CONTROLLER_STATUS 8

#define MESSAGE_ID_VALID 0
#define MESSAGE_ID_INVALID 1

#define MESSAGE_LIST_ENDED 0

#define MESSAGE_DEVICES_STREAM_START 0
#define MESSAGE_DEVICES_STREAM_END 255

uint8_t devices_to_register = -1;
uint32_t* devices_ids;
uint8_t* devices_types;
int devices_ids_index = 0;

bool isWaitingForDeviceIDCheck = false;
uint32_t idToCheck = 0;
uint8_t typeOfIdToCheck = -1;

bool alertDoubledDevicesTrigger = false;
uint32_t doubled_ID;
bool notifyDevicesIDsAcceptedTrigger = false;

uint8_t identified_devices = 0;

bool handshakeCompleted = false;
bool hasReceivedNumberOfDevicesToRegister = false;
bool stream_started = false;
bool stream_ended = false;

typedef struct SerialHelpers{
  static void write32bitIntegerIntoBuffer(char* buffer,uint32_t valueToWrite){
    buffer[1] = (char)((valueToWrite & 0xFF000000) >> 24);
		buffer[2] = (char)((valueToWrite & 0x00FF0000) >> 16);
		buffer[3] = (char)((valueToWrite & 0x0000FF00) >> 8);
		buffer[4] = (char)(valueToWrite & 0x000000FF);
  }
};

static void sendHandshakeMessage(){
  Serial.write(HANDSHAKE_MESSAGE);
}

static void sendRegistrationModeStartedMessage(){
  Serial.write(MESSAGE_TYPE_ENTER_REGISTRATION_MODE);
}

void enterRegistrationMode(){
  if(devices_ids != NULL)
      delete[] devices_ids;
  if(devices_types != NULL)
    delete[] devices_types;
  hasReceivedNumberOfDevicesToRegister = false;
  devices_to_register = -1;
  devices_ids_index = 0;
  isWaitingForDeviceIDCheck = false;
  idToCheck = 0;
  typeOfIdToCheck = -1;
  alertDoubledDevicesTrigger = false;
  notifyDevicesIDsAcceptedTrigger = false;
  identified_devices = 0;
  stream_started = false;
  stream_ended = false;
  sendRegistrationModeStartedMessage();
}

static bool isResetMessage(char dataBuffer[], int buffer_size){
  return buffer_size == 1 && dataBuffer[0] == HANDSHAKE_RESET;
}

static bool isEnterRegistrationModeMessage(char dataBuffer[], int buffer_size){
  return buffer_size == 1 && dataBuffer[0] == MESSAGE_TYPE_ENTER_REGISTRATION_MODE;
}

static bool isHandshakeResponseMessage(char dataBuffer[], int buffer_size){
 return buffer_size == 1 && dataBuffer[0] == HANDSHAKE_VALID_RESPONSE;
}


static bool isDevicesCountMessage(char dataBuffer[], int buffer_size){
  return buffer_size == 2 && dataBuffer[0] == MESSAGE_TYPE_DEVICES_COUNT;
}

static bool isIDCheckResponse(char dataBuffer[], int buffer_size){
  return buffer_size == 2 &&  dataBuffer[0] == MESSAGE_TYPE_ID_CHECK_REQUEST_RESPONSE;
}

static bool isSensorSubmissionMessage(char dataBuffer[],int buffer_size){
  return buffer_size == 9 && dataBuffer[0] == MESSAGE_TYPE_SENSOR_SUBMISSION;
}

static bool isLightValueChangedMessage(char dataBuffer[], int buffer_size){
  return buffer_size == 7 && dataBuffer[0] == MESSAGE_TYPE_LIGHT_VALUE_CHANGED;
}


static bool isCheckSensorStatePacket(char dataBuffer[], int buffer_size){
  return buffer_size == 5 && dataBuffer[0] == MESSAGE_TYPE_CHECK_SENSOR_STATUS;
}

static bool isCheckControllerStatePacket(char dataBuffer[], int buffer_size){
  return buffer_size == 5 && dataBuffer[0] == MESSAGE_TYPE_CHECK_CONTROLLER_STATUS;
}

static void sendSensorStatePacket(uint32_t address, uint16_t value){
  char buffer[7];
  buffer[0] = 7;
  SerialHelpers::write32bitIntegerIntoBuffer(buffer,address);
  buffer[5] = ((value & 0xFF00) >> 8);
  buffer[6] = ((value & 0x00FF) >> 0);
  Serial.write(buffer,7);
}

static void sendControllerStatePacket(uint32_t address, uint16_t value){
  char buffer[7];
  buffer[0] = 8;
  SerialHelpers::write32bitIntegerIntoBuffer(buffer,address);
  buffer[5] = ((value & 0xFF00) >> 8);
  buffer[6] = ((value & 0x00FF) >> 0);
  Serial.write(buffer,7);
}

static void sendIDCheckMessage(uint32_t ID){
  char buffer[5];
  buffer[0] = MESSAGE_TYPE_ID_CHECK_REQUEST_RESPONSE;
  SerialHelpers::write32bitIntegerIntoBuffer(buffer,ID);
  Serial.write(buffer,5);
}

static void sendHandShakeEndMessage(){
  Serial.write(HANDSHAKE_END_MESSAGE);
}

static void sendDevicesStreamStartMessage(){
  char buffer[2];
  buffer[0] = MESSAGE_TYPE_DEVICES_SUBMISSION;
  buffer[1] = MESSAGE_DEVICES_STREAM_START;
  Serial.write(buffer,2);
}

static void sendDevicesStreamEndMessage(){
  char buffer[2];
  buffer[0] = MESSAGE_TYPE_DEVICES_SUBMISSION;
  buffer[1] = MESSAGE_DEVICES_STREAM_END;
  Serial.write(buffer,2);
}

static void sendDeviceInfoPacket(uint32_t ID, uint8_t type){
  char buffer[6];
  buffer[0] = MESSAGE_TYPE_DEVICES_SUBMISSION;
  SerialHelpers::write32bitIntegerIntoBuffer(buffer,ID);
  buffer[5] = type;
  Serial.write(buffer,6);
}

static void sendResultMessage(int result){
  char buffer[2];
  buffer[0] = MESSAGE_TYPE_SEND_RESULT;
  buffer[1] = result;
  Serial.write(buffer,2);
}

#endif
