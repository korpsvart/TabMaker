import {AudioSynth} from 'keithwhor-audiosynth-packaged/audiosynth.js';

let synth = new AudioSynth;
synth.setVolume(0.18);

let chordPlayTime = 2;

// Function which plays first an arpeggio and then a strum of the chord found
function playChord(chordNotes, positions) {
    // Arpeggio part
    for (let i = 0; i < chordNotes.length; i++) {
        setTimeout(function() {
            synth.play('acoustic', chordNotes[i].pitch, chordNotes[i].octave, chordPlayTime);
            let f = positions[i].string;
            document.querySelectorAll('.string').item(f).style.setProperty('--animation-iteration-count','infinite');
            setTimeout(() => { document.querySelectorAll('.string').item(f).style.setProperty('--animation-iteration-count','0'); }, chordPlayTime * 500);
        }, 650 * i);
    }
    // Strum part
    for (let i = 0; i < chordNotes.length; i++) {
        setTimeout(function() {
            synth.play('acoustic', chordNotes[i].pitch, chordNotes[i].octave, 1.5 * chordPlayTime);
            let f = positions[i].string;
            document.querySelectorAll('.string').item(f).style.setProperty('--animation-iteration-count','infinite');
            setTimeout(() => { document.querySelectorAll('.string').item(f).style.setProperty('--animation-iteration-count','0'); }, chordPlayTime * 1200);
        }, 650 * chordNotes.length + chordPlayTime * 250 + 70 * i);
    }
}

export{playChord}