void photo(int brightness){
  int dimmer = 0;
  int brightMenos = 0;
  int brightPlus = 0;
  Serial.print("Photocell: ");
  Serial.println(brightness);
  if (brightness > maxBrightness){
    brightMenos = brightness - maxBrightness;
    //Serial.println(brightMenos);
    brightnessMenos(brightMenos); 
  }else if(brightness < minBrightness){
    brightPlus = minBrightness - brightness;
    //Serial.println(brightPlus);
    brightnessPlus(brightPlus);
  }
  if (dimmerTot < 0){
    dimmerTot = 0;
  }else if (dimmerTot > 1000){
    dimmerTot = 1000;
  }
  Serial.print("Dimmer: ");
  Serial.println(dimmerTot);
  analogWrite(13, dimmerTot/4);
  delay(5000);
}

void brightnessPlus(int brightness){
  int dimmer = 0;
  if (brightness < 20){
    dimmer += 10;
  }
  if (brightness > 20 && brightness < 50){
    dimmer += 20;
  }
  if (brightness > 50 && brightness < 100){
    dimmer += 50;
  }
  if (brightness > 100 && brightness < 250){
    dimmer += 100;
  }
  if (brightness > 250 && brightness < 500){
    dimmer += 250;
  }
  if (brightness > 500){
    dimmer += 500; 
  }
  dimmerTot += dimmer;
}
void brightnessMenos(int brightness){
  int dimmer = 0;
  if (brightness < 20){
    dimmer += 10;
  }
  if (brightness > 20 && brightness < 50){
    dimmer += 20;
  }
  if (brightness > 50 && brightness < 100){
    dimmer += 50;
  }
  if (brightness > 100 && brightness < 250){
    dimmer += 100;
  }
  if (brightness > 250 && brightness < 500){
    dimmer += 250;
  }
  if (brightness > 500){
    dimmer += 500; 
  }
  dimmerTot -= dimmer;
}
