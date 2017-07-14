@echo off
pandoc -o ../LoRaProtocol_documentation.html LoRaProtocol_documentation.md --css src/github-pandoc.css
pandoc -o ../Registrazione.html Registrazione.md --css src/github-pandoc.css
pandoc -o ../SerialProtocol.html SerialProtocol.md --css src/github-pandoc.css
echo Build succeded
