@echo off
pandoc -o ../LoRaProtocol_documentation.html LoRaProtocol_documentation.md --css src/github-pandoc.css
pandoc -o ../Registrazione.html Registrazione.md --css src/github-pandoc.css
pandoc -o ../SerialProtocol.html SerialProtocol.md --css src/github-pandoc.css
pandoc -o ../../ReadMe.html ReadMe.md --css doc/src/github-pandoc.css
pandoc -o ../ArduinoNano.html ArduinoNano.md --css src/github-pandoc.css
echo Build succeded
