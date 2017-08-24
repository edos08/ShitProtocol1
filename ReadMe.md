# Giude for the content of this directory:

* doc: contains the documentation for the LoRa Project, read it before reading and modifying the code
* libsrc: contains the ardiuni library files needed to make the communication between the devices work. Everything is explained in the documentation
* Serial-communication: contains the Node.js app with the startup code for the raspberry and an arduino test client. The code in the test should be added to the startup arduino sketches. The javascript server is already ready for use
* startup: contains the startup registration code for the devices
* startup_node: contains the startup registration code for the node wired in serial to the raspberry

## RASPBERRY:
 scaricare la repository:

 ```bash
sudo git clone --depth=1 https://github.com/edos08/ShitProtocol1        
 ```

 copiare il contenuto di `ShitProtocol1/libsrc` in `/opt/arduino-1.8.3/libraries/LoRa`:    

 ```bash     
Desktpo: ./copy_lib.sh 
 ```



