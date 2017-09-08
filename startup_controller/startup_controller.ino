#include <SPI.h>
#include <WorkingProtocol.h>
#include <avr/eeprom.h>

#define NODE_ADDRESS 0xFFFFFFFF
#define RETRY_WAITING_TIME 8000
#define TYPE DEVICE_TYPE_CONTROLLER

#define ADJUST_LIGHT_INTERVAL 5000


bool idSent = false;
bool idAccepted = false;
bool idDenied = false;
bool registrationDenied = false;
bool registrationResumed = false;
bool waitingTimedOut = false;

uint32_t randomAddress;
unsigned long long timerStartTime = 0;

unsigned long long regularDelayStart = 0;

bool isFirstBoot = true;

uint32_t mySensor = 0xFFFFFFFF;
uint16_t lightCurrentValue = 0;

int dimmerTot = 500;
int maxBrightness = 600;
int minBrightness = 400;
int lightValue = 500;

int photocellPin = 6;

bool hasToSendPingResponse = false;

void setup() {
  //eraseEEPROM(0);
  //eraseEEPROM(4);
  Serial.begin(9600);
  while(!Serial);
  uint32_t memoryContent = readEEPROM(0);
  Serial.print("Memory content ");
  Serial.println(memoryContent,HEX);
  //if(memoryContent == 0xFFFFFFFF){
    randomSeed(analogRead(0));
    randomAddress = generateRandomAddress();
    Serial.println("RANDOM");
  /*}else{
      randomAddress = memoryContent;
      mySensor = readEEPROM(4);
      Serial.print("Sensor: ");
      Serial.println(mySensor,HEX);
      lightValue = readEEPROM16(8);
      Serial.print("LightValue: ");
      Serial.println(lightValue);
      maxBrightness = lightValue + 100;
      minBrightness = lightValue - 100;
      isFirstBoot = false;
  }*/
  initLoRa(randomAddress, 8, 4, 3);
  Serial.println("INIITS");
  subscribeToReceivePacketEvent(handleResponsePacket);
}

void loop() {
  checkIncoming();
  if(!isFirstBoot){
    if(hasToSendPingResponse){
      sendPacket(PingResponsePacket(NODE_ADDRESS,randomAddress,dimmerTot));
      hasToSendPingResponse = false;
    }
    if(!isWaitingRegularDelay()){
      photo(lightCurrentValue);
      regularDelayStart = millis();
    }

  }else if(!registrationDenied){
    if(!idAccepted){

      if(idDenied){
        randomAddress = generateRandomAddress();
        changeAddress(randomAddress);
        idSent = false;
        idDenied = false;
      } else if(waitingTimedOut){
          idSent = false;
          waitingTimedOut = false;
      }

      if(!idSent){
        delay(generateRandomWaitingTime());
        int result = sendPacket(RegistrationPacket(NODE_ADDRESS,randomAddress,TYPE));
        Serial.print("My ID 0x");
        Serial.println(randomAddress,HEX);
        idSent = true;
        timerStartTime = millis();
      }else{
        if(millis() - timerStartTime > RETRY_WAITING_TIME)
          waitingTimedOut = true;
      }
    }else{
      Serial.print("My ID 0x");
      Serial.print(randomAddress,HEX);
      Serial.println(" has been accepted");
      writeEEPROM(randomAddress,0);
      isFirstBoot = false;
    }
  }else{
      if(registrationResumed)
        registrationDenied = false;
      else
        delay(2);
  }
}


uint32_t generateRandomAddress(){
  uint32_t randomNumber = 0;
  uint16_t leftHalf = random(1,0xFFFF);
  uint16_t rightHalf = random(1,0xFFFF);
  randomNumber |= ((uint32_t)(leftHalf)) << 16;
  randomNumber |= rightHalf;
  return randomNumber;
}

int generateRandomWaitingTime(){
  return random(500, 1501);
}

void handleResponsePacket(Packet response){
  Serial.println("got");
  if(isFirstBoot && isRegistrationResponsePacket(response.type, response.packetLength)){

    switch(response_result((uint8_t)response.body[0])){
      case REGISTRATION_RESPONSE_ID_DENIED:
        idDenied = true;
        break;
      case REGISTRATION_RESPONSE_ID_ACCEPTED:
        idAccepted = true;
        break;
      case REGISTRATION_RESPONSE_REGISTRATION_DENIED:
        registrationDenied = true;
        break;
      case REGISTRATION_RESPONSE_REGISTRATION_RESUMED:
        if(registrationDenied)
          registrationResumed = true;
        break;
    }
    return;
  }
  if(isSensorSubmissionPacket(response.type,response.packetLength)){
    mySensor = Helpers::read32bitInt((uint8_t*)response.body);
    writeEEPROM(mySensor,4);
  }  else if(isSensorValuePacket(response.type, response.packetLength)){
    if(response.sender == mySensor){
       lightCurrentValue = 0;
       lightCurrentValue |= (((uint16_t) response.body[0]) << 8);
       lightCurrentValue |= (uint8_t) response.body[1];
    }
  } else if(isLightValueChangedPacket(response.type, response.packetLength)){
    lightValue = 0;
    lightValue = (((uint16_t) response.body[0]) << 8);
    lightValue |= (uint8_t) response.body[1];
    maxBrightness = lightValue + 100;
    minBrightness = lightValue - 100;
    writeEEPROM16(lightValue,8);
  } else if(isPingRequestPacket(response.type,response.packetLength)){
     hasToSendPingResponse = true;
  }

}

bool isWaitingRegularDelay(){
  if(millis() < ADJUST_LIGHT_INTERVAL) return true;
  return (millis() - ADJUST_LIGHT_INTERVAL) <= regularDelayStart; 
}


uint32_t readEEPROM(int offset){
  uint32_t result = 0;
  int shifter = 24;
  for(int a = 0; a < 4; a++){
      uint8_t c_byte = eeprom_read_word(offset + a);
      result |= (((uint32_t)c_byte) << shifter);
      shifter -= 8;
  }
  return result;
}

uint32_t readEEPROM16(int offset){
  uint16_t result = 0;
  int shifter = 8;
  for(int a = 0; a < 2; a++){
      uint8_t c_byte = eeprom_read_word(offset + a);
      result |= (((uint16_t)c_byte) << shifter);
      shifter -= 8;
  }
  return result;
}

void writeEEPROM(uint32_t value,int offset){
  uint8_t byte1 = (value & 0xFF000000) >> 24;
  uint8_t byte2 = (value & 0x00FF0000) >> 16;
  uint8_t byte3 = (value & 0x0000FF00) >> 8;
  uint8_t byte4 = (value & 0x000000FF) >> 0;
  eeprom_write_word(offset + 0,byte1);
  eeprom_write_word(offset + 1,byte2);
  eeprom_write_word(offset + 2,byte3);
  eeprom_write_word(offset + 3,byte4);
}

void writeEEPROM16(uint16_t value,int offset){
  uint8_t byte1 = (value & 0xFF00) >> 8;
  uint8_t byte2 = (value & 0x00FF) >> 0;
  eeprom_write_word(offset + 0,byte1);
  eeprom_write_word(offset + 1,byte2);
}

void eraseEEPROM(int offset){
  for(int a = 0; a < 4; a++)
     eeprom_write_word(offset + a,0xFF);
}
