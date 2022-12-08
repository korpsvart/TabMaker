import {WebMidi} from "webmidi";

function enableMidi() {
    WebMidi.enable().then(onEnabled).catch(err => alert(err));
}

function onEnabled() {
    // Display available MIDI input devices
    if (WebMidi.inputs.length < 1) {
        document.body.innerHTML += "No device detected.";
    } else {
        console.log('success')
        WebMidi.inputs.forEach((device, index) => {
            console.log(`${index}: ${device.name}`)
        });
    }
    const mySynth = WebMidi.inputs[0];
    // const mySynth = WebMidi.getInputByName("TYPE NAME HERE!")

    mySynth.channels[1].addListener("noteon", e => {
        console.log(e.note.octave,e.note.name,e.note.identifier)
    });
}

export {enableMidi}
