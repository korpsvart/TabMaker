import {WebMidi} from "webmidi";
import * as Tone from 'tone'
const player = new Tone.Synth().toDestination();

let synth;
let synthNotes = [];
let synthAllNotes = [];

function enableMidi() {
    WebMidi.enable().then(onEnabled).catch(err => alert(err));
}

function onEnabled() {
    // Display available MIDI input devices
    if (WebMidi.inputs.length < 1) {
        console.log('fail')
    } else {
        console.log('success')
        WebMidi.inputs.forEach((device, index) => {
            console.log(`${index}: ${device.name}`)
        });
    }
    synth = WebMidi.inputs[0];
    addEvent()
}

function addEvent(){
    // every 1s chord
    synth.channels[1].addListener("noteon", e => {
        let identifier = e.note.identifier
        synthAllNotes.push({identifier,time:Date.now()})
        //play a middle 'C' for the duration of an 8th note
        player.triggerAttackRelease(identifier, "8n");
    });
}

function clearNotesArray(){

}

function getInputNotes(){
    return synthNotes
}

function getAllInputNotes(){
    return synthAllNotes
}

export {enableMidi,getInputNotes}
