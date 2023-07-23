

// MIDI input logic
import {Chord, Midi} from "tonal";

let midiInputs = [];
let midiEnabled = false;
let activeChord =  {notes: [], onsetTime: 0};
let thresholdTime = 200; //200 msec
let chordFoundCallback = null;

export function setMIDIEnabled(midiEn)
{
    midiEnabled = midiEn;
}

function onMIDISuccess(midiAccess) {
    const inputs = midiAccess.inputs;

    for (const input of inputs.values()) {
        input.onmidimessage = onMIDIMessageReceived;
        midiInputs.push(input);
    }
}

function onMIDIFailure(error) {
    console.log('Failed to access MIDI devices:', error);
}

// MIDI message received callback
function onMIDIMessageReceived(event) {
    if (midiEnabled){
        var message = event.data;
        var messageType = message[0] & 0xf0;

        if (messageType === 0x90) { // Note on message
            var note = message[1];
            var onsetTime = event.timeStamp; // Get the onset time of the note

            var chord = activeChord;
            if (chord.notes.length>0 && onsetTime - chord.onsetTime<= thresholdTime) {
                chord.notes.push(note);
            } else
            {
                if (chord.notes.length>2)
                {
                    //if the current chord has at least 3 notes, before replacing it
                    //recognize it and add it to the current list

                    // Perform chord recognition on current chord
                    recognizeAndAdd();
                }
                activeChord = {
                    notes: [note],
                    onsetTime: onsetTime
                };
            }

        } else if (messageType === 0x80) { // Note off message

            //same as above, in case the chord is the last in the sequence
            if (activeChord.notes.length>2)
            {
                //if the current chord has at least 3 notes, before replacing it
                //recognize it and add it to the current list

                // Perform chord recognition on current chord
                recognizeAndAdd();

                //reset active chord
                activeChord = {
                    notes: [],
                    onsetTime: 0
                };
            }
        }

    }
}

function recognizeAndAdd() {
    var recognizedChord = recognizeChordFromNotes(activeChord.notes);
    console.log('Chord recognized: ' + recognizedChord);
    chordFoundCallback(recognizedChord);
}

function recognizeChordFromNotes(notes) {
    //The notes are sorted in order of onset time, so sort them instead by midi number
    //(same as sorting them by frequency)
    //This is to avoid weird results produced by chord detection
    notes.sort();
    let noteNames = notes.map(note => Midi.midiToNoteName(note));
    return Chord.detect(noteNames);
}

export function activateMIDI(chordCallback) {
    navigator.requestMIDIAccess()
        .then(onMIDISuccess)
        .catch(onMIDIFailure);

    chordFoundCallback = chordCallback;
}