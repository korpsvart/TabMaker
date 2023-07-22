import {AudioSynth} from 'keithwhor-audiosynth-packaged/audiosynth.js';
import {vibrateString} from "@/components/fretboard.vue";
import {sleep} from "@/components/utils/misc";

let playTime = 2;
let arpCoeff = 500;
let strumCoeff = 1200;
let speed = 2;
let playArpeggio = false;
let playingStatus = false
let id;
// Function which plays first an arpeggio and then a strum of the chord found
async function playChord(chordNotes, positions,idNum) {
    id = idNum
    let synth = new AudioSynth;
    synth.setVolume(0.18);

    playingStatus = true
    // Arpeggio part
    if (playArpeggio)
    {
        for (let i = 0; i < chordNotes.length; i++) {
            if(!playingStatus||idNum!==id){
                return
            }
            synth.play('acoustic', chordNotes[i].pitch, chordNotes[i].octave, playTime);
            let str = positions[i].string;
            vibrateString(str, playTime, arpCoeff);
            await sleep(600/speed)
        }
    }

    // Strumming part
    await sleep(playTime*250/speed)
    for (let i = 0; i < chordNotes.length; i++) {
        if(!playingStatus||idNum!==id){
            return
        }
        synth.play('acoustic', chordNotes[i].pitch, chordNotes[i].octave, 1.5 * playTime);
        let str = positions[i].string;
        vibrateString(str, playTime, strumCoeff);
        await sleep(62)
    }
    await sleep(3200/speed)
}

function stopChordAnimation(){
    $('.string').css('--animation-iteration-count','0')
}

function stopChord(){
    playingStatus = false
    stopChordAnimation()
}

export{playChord,stopChord}
