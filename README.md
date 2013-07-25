# Siren of Shame Client

## Install on a Raspberry Pi

* Download node source code, extract, `./configure`, `make`, `sudo make install`
* Install libusb: `sudo apt-get install libusb-dev`
* `git clone git@github.com:AutomatedArchitecture/node-sos-client.git`
* `cd node-sos-client`
* `npm install`
* Copy config.json.example to config.json and edit.
* `sudo node build/sos-client.js`
