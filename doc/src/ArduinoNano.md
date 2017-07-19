# Arduino Nano (versione cinese)

Documentazione scritta in seguito alla risoluzione del seguente problema:
Impossibile caricare sketch su arduino nano atmega328.

## Soluzioni tentate:

| Tentativo | Esito | Motivazione |
|-----------|-------|-------------|
| Scaricare ed installare driver FTDI | Negativo | I driver FTDI sono per l'arduino nano originale |
| Scaricare ed installare driver CH340G | Parziale | I dirver sono giusti ma non ha risolto il problema |
| Cambio della cablatura del chip LoRa | Positivo | Spiegate sotto |

## Cambio del cablaggio

### Nuovo schema di cablatura

| LoRa | Arduino Nano |
|------|--------------|
| GND | GND |
| VCC | 3V3 |
| MISO | MISO (D12) |
| MOSI | MOSI (D11) |
| SCK | SCK (D13) |
| NSS | D10 |
| RESET | D9 |
| DIO0 | D3 |

Il DIO0 deve rimanere sul 3 perchè i pin 2 e 3 sono gli unici a cui ci si può iscrivere per ricevere cambiamenti di stato (callback)

NSS e RESET non devono andare sui pin 6,7,8 perchè altrimenti non carica lo sketch

Chiamando initLoRa si abbia cura di chiamarlo con gli argomenti (indirizzo,10,9,3)

# Errore 'can't set com state for ...'

Succede quando si stacca la scheda dalla corrente.

Occorre togliere il modulo lora, ricaricare lo sketch e reinserire il modulo LoRa
