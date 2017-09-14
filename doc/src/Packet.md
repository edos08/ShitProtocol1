# Pacchetti

Qui viene descritto il formato dei pacchetti utilizzati nelle trasmissioni LoRa con [LoRaProtocol](LoRaProtocol.html).

Legenda:

I bit vengono considerati ordinati da sinistra a desta in questo modo:

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|--|-|-|-|-|-|-|


Il bit 1 è il più significativo (128)

## Descrizione del formato del pacchetto

Il pacchetto è diviso in due parti:

* Header
* Payload

L'insieme di queste due parti non può superare i 255 byte.

## Header

L'header di un pacchetto LoRa è formato da 11 bytes:

 * 4 bytes per l'indirizzo del destinatario
 * 4 bytes per l'indirizzo del mittente
 * 1 byte per il tipo di messaggio
 * 1 byte per il numero di sequenza del pacchetto
 * 1 byte per la lunghezza del payload (per avere un leggero controllo d'integrità, considerare l'uso di un crc16 o 32)

 | 1 - 2 - 3 - 4 | 5 - 6 - 7 - 8 | 9 | 10 | 11 |
 | ------- | --------| - | -- | -- |
 | Destinatario | Mittente | Tipo | Numero | Lunghezza | 

Descrizione del byte riservato per il tipo di messaggio:

 * bit 1  : indica se il pacchetto contiene un messaggio (bit settato a 1) oppure se è un messaggio ACK (bit settato a 0)
 * bit 2-6: riservati per indicare il tipo di messaggio (specifici per ogni applicazione)
 * bit 7-8: indicano il livello di QoS (Quality of service) utilizzato: 
     * 0 = no ACK.
     * 1 = ACK.
     * 2 = ACK a tre passi. (Non ancora implementato per non utilizzo). 

## Byte di tipo per questa applicazione

Qui sono riportati i valori che può assumere il byte di tipo per i tre livelli:

### Livello 1: flag

```c    
    00000000 (0)   // pacchetto ack
    10000000 (128) // pacchetto con messaggio
```

### Livello 2: tipo

```c
    00000100 (4)  // pacchetto di registrazione
    00001000 (8)  // pacchetto di iscrizione di una lampada ad un sensore
    00001100 (12) // pacchetto di invio del valore di un sensore
    00010000 (16) // pacchetto di invio variazione di impostazioni di luminosità
    00010100 (20) // pacchetto di ping
```

### Livello 3: QoS

```c
    00000000 (0) // pacchetto che non richiede ack
    00000001 (1) // pacchetto che richiede ack
    00000010 (2) // pacchetto che richiede ack a tre livelli (non ancora implementato)
```

Naturalmente i tre livelli possono essere sovrapposti, in questo modo il byte tipo di un pacchetto con messaggio di registrazione che richiede ack è:

```c
    1|00001|01 (133) 
```

## Payload

Il payload del messaggio varia a seconda del tipo di pacchetto scelto.

Per i pacchetti ACK il payload è vuoto ed il byte di lunghezza del payload deve essere settato a 0

I pacchetti non ack avranno un payload diverso a seconda del tipo specificato nei bit 2-6 del campo tipo

# Indirizzi speciali

Il nodo deve avere indirizzo `0xFFFFFFFF`.    
L'indirizzo di broadcast è `0x00000000`.
