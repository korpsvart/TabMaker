import {AudioSynth} from 'keithwhor-audiosynth-packaged/audiosynth.js';

// Create a Synth object which will play the notes and setting up its volume
let synth = new AudioSynth;
synth.setVolume(0.18);

// Fixed chord play time duration
let chordPlayTime = 2;

// Function which plays first an arpeggio and then a strum of the chord found
function playChord(chordNotes) {
    // Arpeggio part
    for (let i = 0; i < chordNotes.length; i++) {
        // Notes are well spaced in time, to give the feeling of an arpeggio
        setTimeout(function() {
            // The Synth will play each note of the chord with 'acoustic' guitar timbre,
            // each note lasts chordPlayTime seconds
            synth.play('acoustic', chordNotes[i].pitch, chordNotes[i].octave, chordPlayTime);
        }, 650 * i);
    }
    // Strum part
    for (let i = 0; i < chordNotes.length; i++) {
        // Notes are played rapidly, to give the feeling of a strum (after the arpeggio)
        setTimeout(function() {
            // The Synth will play each note of the chord with 'acoustic' guitar timbre,
            // each note lasts more than chordPlayTime seconds (more tail)
            synth.play('acoustic', chordNotes[i].pitch, chordNotes[i].octave, 1.5 * chordPlayTime);
        }, 650 * chordNotes.length + chordPlayTime * 250 + 70 * i);
    }
}

export{playChord}