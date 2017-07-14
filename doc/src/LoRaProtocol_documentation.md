# LoRa protocol

* [LoRa](LoRaProtocol_documentation.html)
* [Registrazione](Registrazione.html)
* [Seriale](SerialProtocol.html)

Questo protocollo è stato creato per l'utilizzo all'interno di una rete LoRa per la comunicazione wireless tra vari dispositivi

Legenda:

I bit vengono considerati ordinati da sinistra a desta in questo modo:

|1BYTE|||||||
|---|--|-|-|-|-|-|-|
| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |


Il bit 1 è il più significativo (128)

***

## Descrizione del formato del pacchetto

Il pacchetto è diviso in due parti:

* Header
* Payload

L'insieme di queste due parti non può superare i 255 byte.

### Header

L'header di un pacchetto LoRa è formato da 11 bytes:

 * 4 bytes per l'indirizzo del destinatario
 * 4 bytes per l'indirizzo del mittente
 * 1 byte per il tipo di messaggio
 * 1 byte per il numero di sequenza del pacchetto
 * 1 byte per la lunghezza del payload (par avere un leggero controllo d'integrità, considerare l'uso di un crc16 o 32)

Descrizione del byte riservato per il tipo di messaggio:

 * bit 1  : indica se il pacchetto contiene un messaggio (bit settato a 1) oppure se è un messaggio ACK (bit settato a 0)
 * bit 2-6: riservati per usi futuri per indicare il tipo di messaggio (status report, comando, keep alive...) **
 * bit 7-8: indicano il livello di QoS utilizzato: 0 = no ACK, 1 = ACK, 2 = ACK a tre passi

 **[Nota]: Valori di tipologia del pacchetto:

* 1: [Pacchetti di registrazione](Registrazione.html)

### Payload

Il payload del masseaggio varia a seconda del tipo di pacchetto scelto.

Per i pacchetti ACK il payload è vuoto ed il byte di lunghezza del payload deve essere settato a 0

I pacchetti non ack avranno un payload diverso a seconda del tipo spacificato dei bit 2-6 del campo tipo (Il loro formato non è ancora stato deciso)


***

## Documentazione tecnica della libreria LoRaProtocol

`class Packet`: rappresenta un pacchetto spedito od inviato tramite LoRa.    
Attributi:

* `dest` : il destinatario del pacchetto
* `sender` : il mittente del pacchetto
* `type` : il tipo di pacchetto
* `packetLenght`: la lunghezza del payload
* `packetNumber` : il numero di sequenza del pacchetto
* `body` : il payload del pacchetto

Metodi:

* `isAck()` : controlla se il pacchetto è un'ack
* `requestsAck()`: controlla se il pacchetto richiede un ack in risposta
* `isUninitialized()`: controlla se il pacchetto è stato inizializzato o meno

***

`struct Helpers`: medodi helpers per scrivere interi a più bytes nel flusso in uscita e leggerli dal flusso in entrata

Unico metodo da utilizzare al di fuori della libreria:

* `printResponseMessage(int response_code)` : stampa la stringa equivalente al risultato di un'operazione di tipo `sendPacket`

Utilizzo:

```    
int result = sendPacket(myPacket);
Helpers::printResponseMessage(result);
```

***

Costruttori di pacchetti predefiniti:

`static Packet MessagePacket(uint32_t dest, uint32_t sender, char body[], uint8_t packetLenght)`

Crea un pacchetto di tipo messaggio rivolto al mittente `dest` dal dispositivo `sender` contenente il messaggio `body`. Il valore di packetLenght deve essere al massimo della lunghezza del campo body

`static Packet MessageAckPacket(uint32_t dest, uint32_t sender, char body[], uint8_t packetLenght)`

Uguale al metodo soprastante, ma richiede un'ACK in risposta, riprovando ad inviare tre volte il pacchetto in caso di mancata ricezione

`static Packet AckPacket(uint32_t dest, uint32_t sender, uint8_t reponsePacketNumber)`

Crea un pacchetto di ACK di risposta, utilizzato all'interno della libreria e non deve essere utilizzato all'interno dello sketch

_Per tipi di pacchetti aggiuntivi consultare le sezioni relative  alle singole tipologie specifiche di messaggio_

***

`void initLoRa(int _myAddress, int csPin, int resetPin, int irqPin)` : inizializza la scheda LoRa sui pin dati ed imposta il proprio indirizzo per lo scambio di messaggio    

`int sendPacket(Packet packet)` : invia un pacchetto e ritorna: 1 se il pacchetto &egrave; stato inviato, 0 altrimenti    


`void activateReceiveMode()` : mette la scheda in modalità ascolto (chiamato automaticamente ogni volta che serve dalla libreria, utilizzarlo solo se si richiama esplicitamente `LoRa.idle()`)

`void receivePacket(int packetSize)` : chiamata automaticamente quando un pacchetto viene ricevuto in modalità ascolto, risponde con un ack se necessario

### Importante!

`void subscribeToReceivePacketEvent(functionCall function)`: passa alla libreria la funzione da richiamare automaticamente ogni volta che si riceve un pacchetto

Utilizzo:

creare un metodo del tipo:

`void receivedPacketHandler(Packet myPacket)`

nel setup dello sketch utilizzare la funzione nel seguente modo:

`subscribeToReceivePacketEvent(receivedPacketHandler);`

La funzione receivedPacketHandler sarà automaticamente richiamata ogni volta che si riceve un pacchetto

!!! Attenzione !!! Non è possibile chiamare la funzione `sendPacket` all'interno della funzione fornita se i messaggi richiedono ack ed è ALTAMENTE SCONSIGLIATO in ogni altro caso
