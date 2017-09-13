#include <SPI.h>
#include <WorkingProtocol.h>
#include <avr/eeprom.h>

#define NODE_ADDRESS 0xFFFFFFFF
#define RETRY_WAITING_TIME 8000
#define SENSOR_SEND_DATA_WAITING_TIME 5000
#define TYPE DEVICE_TYPE_SENSOR


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

int sensorPin = A0;
uint16_t sensorValue = 0;

void setup() {
  eraseEEPROM(0);
  Serial.begin(9600);
  while(!Serial);
  uint32_t memoryContent = readEEPROM();
  Serial.print("Memory content ");
  Serial.println(memoryContent,HEX);
  if(memoryContent == 0xFFFFFFFF){
    randomSeed(analogRead(0));
    randomAddress = generateRandomAddress();
    Serial.println("RANDOM");
  }else{
    randomAddress = memoryContent;
    isFirstBoot = false;
  }
  initLoRa(randomAddress, 8, 4, 3);
  subscribeToReceivePacketEvent(handleResponsePacket);
  
  Serial.println("INITS");
}

void loop() {
  checkIncoming();
  if(!isFirstBoot){
    if(!isWaitingRegularDelay()){
      sensorValue = analogRead(sensorPin);
      Serial.print("Valore fotoresistenza: ");
      Serial.println(sensorValue);
      int result = sendPacket(SensorValuePacket(randomAddress,sensorValue));
      Helpers::printResponseMessage(result);
      regularDelayStart = millis();
    }
    return;
  }

  if(!registrationDenied){
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
        sendPacket(RegistrationPacket(NODE_ADDRESS,randomAddress,TYPE));
        Serial.print("My ID 0x");
        Serial.println(randomAddress,HEX);
        idSent = true;
        timerStartTime = millis();
        while(true);
      }else{
        if(millis() - timerStartTime > RETRY_WAITING_TIME)
          waitingTimedOut = true;
      }
    }else{
      Serial.print("My ID 0x");
      Serial.print(randomAddress,HEX);
      Serial.println(" has been accepted");
      writeEEPROM();
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

  if(isRegistrationResponsePacket(response.type, response.packetLength)){
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
  }
}

bool isWaitingRegularDelay(){
  if(millis() < SENSOR_SEND_DATA_WAITING_TIME) return true;
  return (millis() - SENSOR_SEND_DATA_WAITING_TIME) <= regularDelayStart; 
}

uint32_t readEEPROM(){
  uint32_t result = 0;
  int shifter = 24;
  for(int a = 0; a < 4; a++){
      uint8_t c_byte = /*EEPROM.read(a);*/eeprom_read_word(a);
      result |= (((uint32_t)c_byte) << shifter);
      shifter -= 8;
  }
  return result;
}

void writeEEPROM(){
  uint8_t byte1 = (randomAddress & 0xFF000000) >> 24;
  uint8_t byte2 = (randomAddress & 0x00FF0000) >> 16;
  uint8_t byte3 = (randomAddress & 0x0000FF00) >> 8;
  uint8_t byte4 = (randomAddress & 0x000000FF) >> 0;
  eeprom_write_word(0,byte1);
  eeprom_write_word(1,byte2);
  eeprom_write_word(2,byte3);
  eeprom_write_word(3,byte4);
}

void eraseEEPROM(int offset){
  for(int a = 0; a < 4; a++)
     eeprom_write_word(offset + a,0xFF);
}
