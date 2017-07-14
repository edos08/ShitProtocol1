#include <SPI.h>

#define Serial SERIAL_PORT_USBVIRTUAL

bool handshakeDone = false;
char inputBuffer[256];

void setup() {
  Serial.begin(9600);
  while(!Serial);
  Serial.print("Hello!");
}

void loop() {
    
    if(Serial.available()){
      serialEvent();
    }

    if(handshakeDone){
      Serial.write("Thanks for welcoming me!, let's get into business");
      while(true);
    }
}

void serialEvent(){
  int index = 0;
  clearBuffer();
  while (Serial.available()) {
    char ch = (char)Serial.read();
    inputBuffer[index] = ch;
    index++;
  }
  String message = String(inputBuffer);
  if(!handshakeDone && message == "Hi!"){
    handshakeDone = true;
  }
}

void clearBuffer(){
  for(int a = 0; a < 256; a++){
    inputBuffer[a] = 0;
  }
}

