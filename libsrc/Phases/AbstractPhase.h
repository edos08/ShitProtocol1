#include "../LoRaProtocol.h"

class AbstractPhase{

public:
  virtual void handleLoRaPacket(Packet packet) = 0;
  virtual void handleSerialPacket(char buffer[],int bufferSize) = 0;
  virtual void action() = 0;
  virtual void start() = 0;
  virtual void stop() = 0;
  virtual bool isActive() = 0;
}
