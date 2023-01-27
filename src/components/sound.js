import {AudioSynth} from 'keithwhor-audiosynth-packaged/audiosynth.js';
import {vibrateString} from "@/components/fretboard.vue";

let synth = new AudioSynth;
synth.setVolume(0.18);

let playTime = 2;
let arpCoeff = 500;
let strumCoeff = 1200;

// Function which plays first an arpeggio and then a strum of the chord found
function playChord(chordNotes, positions) {
    // Arpeggio part
    for (let i = 0; i < chordNotes.length; i++) {
        setTimeout(function() {
            synth.play('acoustic', chordNotes[i].pitch, chordNotes[i].octave, playTime);
            let str = positions[i].string;
            vibrateString(str, playTime, arpCoeff);
        }, 650 * i);
    }
    // Strum part
    for (let i = 0; i < chordNotes.length; i++) {
        setTimeout(function() {
            synth.play('acoustic', chordNotes[i].pitch, chordNotes[i].octave, 1.5 * playTime);
            let str = positions[i].string;
            vibrateString(str, playTime, strumCoeff);
        }, 650 * chordNotes.length + playTime * 250 + 70 * i);
    }
}

function stopChordAnimation(){
    document.querySelectorAll('.string').setProperty('--animation-iteration-count','0')
}

function stopSound(){
    synth.pause()
}
function stopChord(){
    stopChordAnimation()
    stopSound()
}

export{playChord,stopChord}
