# Arduino Nano 

## Schema di cablatura

| LoRa | Arduino Nano |
|------|--------------|
| GND | GND |
| VCC | 3V3 |
| MISO | MISO (D12) |
| MOSI | MOSI (D11) |
| SCK | SCK (D13) |
| NSS | D8 |
| RESET | D4 |
| DIO0 | D3 |


Chiamando initLoRa si abbia cura di chiamarlo con gli argomenti (indirizzo,8,4,3)

## Errore: 'can't set com state for ...'

All'inizio era un errore molto ricorrente durante il caricamento dello sketch dall'IDE di arduino. La soluzione è semplicemente staccare e riattaccare la microusb dal dispositivo e riprovare fincè parte. Sembra essere quasi scomparso col tempo.

## Errore: Il dispositivo si ferma dopo l'invio di pochi messaggi

Questo errore è dovuto ad un problema di alimentazione, l'arduino nano non riesce a fornire abbastanza ampere di corrente al pin 3v3 del chip LoRa. La soluzione è cablare 3v3 e groung del chip ad un altra fonte di corrente (es raspberry). 

Si può vedere il problema discusso [qui](https://github.com/sandeepmistry/arduino-LoRa/issues/34)


