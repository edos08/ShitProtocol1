# Utilizzo della Libreria LoraProtocol

Qui viene spiegato come utilizzare la libreria LoRaProtocol nei programmi arduino (`*.ino`)

## Setup

Nella fase di setup occorre connettersi con il chip LoRa e impostare le proprie preferenze sulla ricezione dei pacchetti. Le funzioni da utilizzare sono:

```c
 initLora(address, NSSpin, resetPin, dio0pin); 
```

Inizializza il chip con i pin passati come argomento e imposta l'indirizzo da utilizzare in invio e ricezione

---

```c
 subscribeToReceivePacketEvent(function);
```

Imposta la funzione che deve essere chiamata ogni volta che si riceve un messaggio. La funzione passata come argomento deve conformarsi al formato:

```c
 void onPacketReceived(Packet response);
```

## Loop 

Nella fase di loop occorre controllare se sono stati ricevuti pacchetti ed eventualmente inviarne altri. 

```c
 checkIncoming();
```

Controlla se è arrivato un nuovo pacchetto e se è così richiama automaticamente la funzione passata a `subscribeToReceivePacketEvent()`

```c
 sendPacket(Packet);
```

Invia il pacchetto che viene passato come argomento. I pacchetti da inviare possono essere creati manualmente con il costruttore della classe packet ma ci sono già diverse funzioni che creano pacchetti già "pronti". Vedere [registrationProtocol](html/_registration_protocol_8h.html), [workingProtocol](_working_protocol_8h.html) 

### Nota

Si consiglia di non inviare pacchetti dentro la funzione che li riceve, ma piuttosto si consiglia di utlizzare il pattern a "flag", in cui la funzione di ricezione setta un flag che invierà il pacchetto dal loop

# Esempio

```c

#include <WorkingProtocol.h>

uint32_t myAddress = 0xDEADBEEF; //address

bool hasReceivedPing = false;    //flag 

void setup() {

    Serial.begin(9600);
    while(!Serial);      //Inizializzazione della comunicazione seriale
    initLora(myAddress, 8, 4, 3);
    subscribeToReceivePacketEvent(handleResponsePacket); 
}

void loop() {

    checkIncoming();

    if(hasReceivedPing){
        hasReceivedPing = false;
        sendPacket(PingPacket(...));
    }
}

void handleResponsePacket(Packet packet) {
    if(isPingPacket(packet)){
        hasReceivedPing = true;
    }
}

```

Le funzioni `PingPacket(...)` e `isPingPacket(packet)` non esistono e sono nell'esempio solo per chiarezza. 


