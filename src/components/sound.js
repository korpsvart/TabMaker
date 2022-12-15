let c = new AudioContext();

function playChord(chordNotes,notes) {
    let chordPlayTime = 2;
    for (let i = 0; i < chordNotes.length; i++) {
        setTimeout(function() {
            let g = c.createGain();
            g.connect(c.destination);
            g.gain.linearRampToValueAtTime(0, c.currentTime + chordPlayTime);
            let o = c.createOscillator();
            o.connect(g);
            o.type = "sawtooth";
            let noteIndex = notes.indexOf(chordNotes[i].pitch) - 9 - 12*(4-chordNotes[i].octave);
            let f = 440 * Math.pow(2,noteIndex/12);
            o.frequency.setValueAtTime(f, c.currentTime);
            o.start(c.currentTime);
            o.stop(c.currentTime + chordPlayTime);
        }, 650 * i);
    }
    for (let i = 0; i < chordNotes.length; i++) {
        setTimeout(function() {
            let g = c.createGain();
            g.connect(c.destination);
            g.gain.linearRampToValueAtTime(0, c.currentTime + chordPlayTime);
            let o = c.createOscillator();
            o.connect(g);
            o.type = "sawtooth";
            let noteIndex = notes.indexOf(chordNotes[i].pitch) - 9 - 12*(4-chordNotes[i].octave);
            let f = 440 * Math.pow(2,noteIndex/12);
            o.frequency.setValueAtTime(f, c.currentTime);
            o.start(c.currentTime);
            o.stop(c.currentTime + chordPlayTime);
        }, 650 * chordNotes.length + chordPlayTime * 300 + 70 * i);
    }
}
export{playChord}