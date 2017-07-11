#include <stdint.h>    
#include "LoRa.h"
#include <SPI.h>

#define PACKET_TYPE_ACK 0
#define PACKET_TYPE_NORM 1

class Packet{
    public:
     uint32_t dest;
     uint32_t sender;
     uint8_t type;
     uint8_t packetNumber;
     char body[245];
     int packetLenght;
     Packet(uint32_t _dest, uint32_t _sender, uint8_t _type, uint8_t _packetNumber, char* _body, int _packetLenght){
         dest = _dest;
         sender = _sender;
         type = _type;
         packetNumber = _packetNumber;
         for(int a = 0; a < _packetLenght; a++)
            body[a] = _body[a];
         packetLenght = _packetLenght;
     }
     Packet(){
        dest = 0; sender = 0; type = -1; packetNumber = -1; packetLenght = 0;
     }

    bool operator == ( const Packet &rhs) {
            if(packetLenght != rhs.packetLenght)
                return false;
            for(int a = 0; a < packetLenght; a++)
                if(body[a] != rhs.body[a])
                    return false;

            return dest == rhs.dest && sender == rhs.sender && type == rhs.type && packetNumber == rhs.packetNumber;
    }

    bool operator != (const Packet& rhs){return !(*this == rhs);}
};

extern Packet lastReceivedPacket;

void initLoRa(int _myAddress, int csPin, int resetPin, int irqPin);
void activateReceiveMode();

int sendPacket(Packet packet);
void receivePacket(int packetSize);


uint32_t read32bitInt(uint8_t byte1, uint8_t byte2, uint8_t byte3, uint8_t byte4);






