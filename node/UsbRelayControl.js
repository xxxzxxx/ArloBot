'use strict';
const personalData = require('./personalData');
const webModel = require('./webModel');
const webModelFunctions = require('./webModelFunctions');
const robotModel = require('./robotModel');
const spawn = require('child_process').spawn;
const ipAddress = require('./ipAddress');

/*
 To get the state of all relays:
 switch_relay_name.sh all state
 Use this to populate a list of relays in webModel,
 and also get their names from
 personalData.relays
 */

class UsbRelay {
    constructor() {
        this.dataHolder = '';
        this.busy = false;
        this.script = __dirname + '/../scripts/switch_relay_name.sh';
        this.updateAllRelayState();
    }

    static findRelayName(relayNumber) {
        for (let key in personalData.relays) {
            if (personalData.relays.hasOwnProperty(key)) {
                if (personalData.relays[key] === relayNumber) {
                    return key;
                }
            }
        }
        return 'empty';
    }

    updateAllRelayState() {
        if (personalData.useUSBrelay && !this.busy) {
            this.busy = true;
            const process = spawn(this.script, ['all', 'state']);
            process.stdout.on('data', (data) => {
                if (data != '') {
                    this.dataHolder += data;
                }
            });

            process.stderr.on('data', (data) => {
                console.log(`UsbRelay output stderr: ${data}`);
            });

            process.on('close', (code) => {
                if (code === null || code === 0) {
                    let linesArray = this.dataHolder.split('\n');
                    let relayStatusArray = [];
                    for (let i = 0; i < linesArray.length; i++) {
                        if (['ON', 'OFF'].indexOf(linesArray[i]) > -1) {
                            relayStatusArray.push(linesArray[i])
                        }
                    }
                    // WARNING: Relays are 1 indexed, not 0!
                    for (let i = 0; i < relayStatusArray.length; i++) {
                        let relayNumber = i + 1;
                        let relayState = relayStatusArray[i];
                        let relayName = UsbRelay.findRelayName(relayNumber);
                        webModelFunctions.publishRelayState(relayNumber, relayState, relayName);
                    }
                    this.dataHolder = '';
                } else {
                    console.log(`UsbRelay State collection failed with code: ${code}`);
                    console.log(this.dataHolder);
                }
                this.busy = false;
            });
        }
    }

    toggle(relayNumber) {
        const relayObject = webModel.relays.find(x => x.number === relayNumber);
        if (relayObject) {
            if (relayObject.relayOn) {
                this.switchRelay(relayNumber, 'off');
            } else {
                this.switchRelay(relayNumber, 'on');
            }
        }
    }

    switchRelay(relayNumber, onOrOff) {
        this.busy = true;
        const state = onOrOff.toLowerCase();
        if (state !== 'on' && state !== 'off') {
            return;
        }
        const process = spawn(this.script, [relayNumber, state]);

        process.stderr.on('data', (data) => {
            console.log(`UsbRelay output stderr: ${data}`);
        });

        process.on('close', (code) => {
            if (code === null || code === 0) {
                webModelFunctions.scrollingStatusUpdate(`Relay ${relayNumber} ${state}`);
            } else {
                console.log(`UsbRelay Switch failed with code: ${code}`);
            }
            this.busy = false;
            this.updateAllRelayState();
        });
    }

}
module.exports = UsbRelay;

if (require.main === module) {
    const usbRelay = new UsbRelay();
    usbRelay.updateAllRelayState();
    setTimeout(function () {
        console.log(webModel.relays);
    }, 1000);
}
