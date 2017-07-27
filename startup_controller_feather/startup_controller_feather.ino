#include <SPI.h>
#include <WorkingProtocol.h>
//#include <avr/eeprom.h>

#define NODE_ADDRESS 0xFFFFFFFF
#define RETRY_WAITING_TIME 8000
#define TYPE DEVICE_TYPE_CONTROLLER


bool idSent = false;
bool idAccepted = false;
bool idDenied = false;
bool registrationDenied = false;
bool registrationResumed = false;
bool waitingTimedOut = false;

uint32_t randomAddress;
unsigned long long timerStartTime = 0;

bool isFirstBoot = true;

uint32_t mySensor = 0xFFFFFFFF;
uint16_t lightCurrentValue = 290;

int dimmerTot = 500;
int maxBrightness = 700;
int minBrightness = 300;

int photocellPin = 7;

void setup() {
  Serial.begin(9600);
  while(!Serial);
  //uint32_t memoryContent = readEEPROM(0);
  //Serial.print("Memory content ");
  //Serial.println(memoryContent,HEX);
  //if(memoryContent == 0xFFFFFFFF){
    randomSeed(analogRead(0));
    randomAddress = generateRandomAddress();
    Serial.println("RANDOM");
  /*}else{
      randomAddress = memoryContent;
      mySensor = readEEPROM(4);
      isFirstBoot = false;
  }*/
  initLoRa(randomAddress, 8, 4, 3);
  Serial.println("INIITS");
  subscribeToReceivePacketEvent(handleResponsePacket);
}

void loop() {
  if(!isFirstBoot){
    //Serial.print("I have already an ID and it is ");
    //Serial.println(randomAddress,HEX);
    //Serial.print("I'm listening to the sensor ");
    //Serial.println(mySensor,HEX);

    //adjust light dimmer
    photo(lightCurrentValue);

    //delay(5000);
    return;
  }

  if(!registrationDenied){
    if(!idAccepted){

      if(idDenied){
        Serial.println("Id denied");
        Serial.flush();
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
        Serial.println("About to send");
        Serial.flush();
        int result = sendPacket(RegistrationPacket(NODE_ADDRESS,randomAddress,TYPE));
        Helpers::printResponseMessage(result);
        Serial.print("My ID 0x");
        Serial.println(randomAddress,HEX);
        Serial.flush();
        idSent = true;
        timerStartTime = millis();
      }else{
        if(millis() - timerStartTime > RETRY_WAITING_TIME)
          waitingTimedOut = true;
      }
    }else{
      Serial.print("My ID 0x");
      Serial.print(randomAddress,HEX);
      Serial.println(" has been accepted, I SOULD now write it in my EPROM and start my regular program");
      Serial.flush();
      //writeEEPROM(randomAddress,0);
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
  Serial.print("ID generated = ");
  Serial.println(randomNumber, HEX);
  return randomNumber;
}

int generateRandomWaitingTime(){
  return random(500, 1501);
}

void handleResponsePacket(Packet response){
Serial.print("Packet received ");
  if(isRegistrationResponsePacket(response.type, response.packetLength)){
    
    switch(response_result((uint8_t)response.body[0])){
      case REGISTRATION_RESPONSE_ID_DENIED:
        Serial.println("ID denied");
        Serial.flush();
        idDenied = true;
        break;
      case REGISTRATION_RESPONSE_ID_ACCEPTED:
        Serial.println("ID accepted");
        Serial.flush();
        idAccepted = true;
        break;
      case REGISTRATION_RESPONSE_REGISTRATION_DENIED:
        Serial.println("Registration denied");
        Serial.flush();
        registrationDenied = true;
        break;
      case REGISTRATION_RESPONSE_REGISTRATION_RESUMED:
        Serial.println("Registration resumed");
        Serial.flush();
        if(registrationDenied)
          registrationResumed = true;
        break;
    }
  }else if(!isFirstBoot && isSensorSubmissionPacket(response.type,response.packetLength)){
    mySensor = Helpers::read32bitInt((uint8_t*)response.body);
    Serial.print("My sensor :");
    Serial.println(mySensor,HEX);
    //writeEEPROM(mySensor,4);
  }  else if( !isFirstBoot && isSensorValuePacket(response.type, response.packetLength)){
    if(response.sender == mySensor){
       lightCurrentValue = 0;
       lightCurrentValue |= (((uint16_t) response.body[0]) << 8);
       lightCurrentValue |= (uint8_t) response.body[1];
       Serial.print("Light changed: ");
       Serial.println(lightCurrentValue);
    }
  } else if(!isFirstBoot && isLightValueChangedPacket(response.type, response.packetLength)){
    uint16_t lightValue = (((uint16_t) response.body[0]) << 8);
    lightValue |= (uint16_t) response.body[1];
    maxBrightness = lightValue + 100;
    minBrightness = lightValue - 100;
  } else {
    Serial.println("Pacchetto sconosciuto");
  }
}

/*
uint32_t readEEPROM(int offset){
  uint32_t result = 0;
  int shifter = 24;
  for(int a = 0; a < 4; a++){
      uint8_t c_byte = eeprom_read_word(offset + a);
      Serial.print("Byte: ");
      Serial.println(c_byte,HEX);
      result |= (((uint32_t)c_byte) << shifter);
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

void eraseEEPROM(){
  for(int a = 0; a < 4; a++)
     eeprom_write_word(a,0xFF);
}*/
