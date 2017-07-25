#include "../LoRaProtocol.h"

class AbstractPhase{
  virtual void handleLoRaPacket(Packet packet) = 0;
  virtual void handleSerialPacket(Packet packet) = 0;
  virtual void start() = 0;
  virtual void stop() = 0;
  virtual bool isActive() = 0;
}
