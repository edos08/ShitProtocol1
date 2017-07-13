Protocollo di registrazione
===========================

[Home](LoRaProtocol_documentation.html)

Descrizione dei pacchetti
-------------------------

I pacchetti di registrazione dai dispositivi verso il server sono vuoti
e hanno `packetLenght = 0`

I pacchetti di registrazione da nodo a dispositivo contengono la
risposta al controllo dell'ID e hanno `packetLenght = 1`\
L'unico byte di payload ha il seguente contenuto:

    * bit 7-8:
        * 0: ID non accettato
        * 1: ID accettato
        * 2: Il nodo non è pronto a ricevere registrazioni
        * 3: Il nodo è ora pronto a ricevere

Costruttori di pacchetti predefiniti
------------------------------------

`static Packet RegistrationPacket(uint32_t dest, uint32_t sender)`

Pacchetto con cui un dispositivo invia il proprio ID al nodo. Il `dest`
deve quindi essere il nodo ed ha valore `0xFFFFFFFF`.

`RegistrationIDDeniedPacket(uint32_t dest, uint32_t sender)`

Pacchetto inviato dal nodo per rifiutare un ID

`static Packet RegistrationIDAcceptedPacket(uint32_t dest, uint32_t sender)`

Pacchetto inviato dal nodo per accettare gli ID

`static Packet RegistrationResumedPacket(uint32_t dest, uint32_t sender)`

Pacchetto inviato dal nodo per avvisare i dispositivi di essere pronto a
ricevere la registrazione

`static Packet RegistrationUnavailablePacket(uint32_t dest, uint32_t sender)`

Pacchetto inviato dal nodo per avvisare i dispositivi di non essere
pronto a ricevere pacchetti di registrazione

Descrizione del protocollo
--------------------------

### Nodo

-   Il dispositivo si accende
-   Riceve il numero di dispositivi da registrare
-   Invia un pacchetto di "registrazione ripresa" in caso ci fossero
    stati tentativi di registrazione durante il monitoraggio
-   A: Aspetta di ricevere dei pacchetti dai dispositivi
    -   1: Leggo l'ID che ricevo nel pacchetto
    -   2: Itero tra tutti gli ID salvati per vedere se l'ID arrivato è duplicato. (Da aggiungere: query al mongodb presente nel raspberry per gli ID già salvati)
        -   2.a: Se non lo è salvo l'ID nella lista degli ID accettabili
            -   2.a.1: Se il numero degli ID accettabili è pari al numero dei dispositivi da registrare allora invio un messaggio di conferma dell'ID a tutti ed esco dalla fase di registrazione
        -   2.b: Se lo è setto il flag "id duplicato" e memorizzo l'ID
            non valido
-   B: Invio all'ID duplicato un pacchetto di rifiuto dell'ID e elimino
    tutte le occorrenze di quell'ID dalla coda degli ID accettabili

### Dispositivo

-   Il dispositivo si accende
-   Controlla se nella EPROM ha un ID salvato
    -   Se si allora inizia il suo normale ciclo di vita a regime
    -   Se no allora inizia la procedura di registrazione:
        -   1: Generazione di un ID casuale
        -   2: Attesa di un tempo casuale tra gli 0,5 e gli 1,5 secondi
            per minimizzare le collisioni
        -   3: Invio del pacchetto contenente l'ID al nodo
        -   4: Attesa della risposta per 8 secondi
            -   4.a Se non riceve risposta prova a reinviare il
                pacchetto presumendo che non sia arrivato\
            -   4.b Se riceve risposta:
                -   4.b.1 Se è positiva allora salva l'ID sulla EPROM ed
                    inizia il suo ciclo di vita a regime
                -   4.b.2 Se è negativa torna al passo 1
                -   4.b.3 Se la risposta è "nodo non disponibile alla
                    registrazione" rimane in attesa di un pacchetto di
                    "registrazione ripresa" dal nodo e a pacchetto
                    ricevuto riprende dal punto 1

------------------------------------------------------------------------
