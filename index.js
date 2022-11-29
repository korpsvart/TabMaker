const Tonal = require('tonal');
const Fretboard = require('@moonwave99/fretboard.js');
const mainDiv = document.getElementById("main");
const selectChordType = document.createElement("select");
const selectChordTonic = document.createElement("select");
let submitChordButton = document.getElementById("submitChord");

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];


class Note {
    constructor(pitch, octave) {
        this.pitch = pitch;
        this.octave = octave;
    }

    equals(other) {
        return this.pitch === other.pitch &&
            this.octave === other.octave;
    }

    equalsIgnoreOctave(other) {
        return this.pitch === other.pitch;
    }

}



const allChords = Tonal.ChordType.symbols();
allChords.forEach(x => {
    let option = document.createElement("option");
    option.value = x;
    option.text = x;
    selectChordType.appendChild(option);
})

notes.forEach(x => {
    let option = document.createElement("option");
    option.value = x;
    option.text = x;
    selectChordTonic.appendChild(option);
})



mainDiv.appendChild(selectChordType);
mainDiv.appendChild(selectChordTonic);


function submit() {
    let chord = Tonal.Chord.getChord(selectChordType.options[selectChordType.selectedIndex].value,
        selectChordTonic.options[selectChordTonic.selectedIndex].value);
    let positions = findPositions(fretboard, new Note(chord.notes[0].toString(), 0), true);
    let dots = [];
    positions.forEach(x => {
        dots.push({'string': x['string']+1, 'fret': x['fret']});
    })
    fretboardGraphics.setDots(dots).render();
}

const tuning = [new Note('E', 4),
    new Note('B', 3),
    new Note('G', 3),
    new Note('D', 3),
    new Note('A', 2),
    new Note('E', 2)];


//We represent a fretboard as a matrix of Note objects
fretboard = createFretboard(6, 24, tuning);
submitChordButton.onclick = submit;

const fretboardGraphics = new Fretboard.Fretboard({
    el: '#fretboard',
    fretColor: 'blue',
    dotFill: 'red'
});


function findPositions(fretboard, note, ignoreOctave = true) {
    //Find all positions corresponding to a particular note
    //If ignoreOctave = true it returns all positions corresponding
    //to the pitch class
    let positions = []; //array of positions
    for (let i = 0; i < fretboard.length; i++) {
        for (let j = 0; j < fretboard[i].length; j++) {
            let condition = (fretboard[i][j].equalsIgnoreOctave(note) && ignoreOctave) ||
                            fretboard[i][j].equals(note);
            if (condition)
                positions.push({'string': i, 'fret': j});
        }
    }
    return positions;
}

function createFretboard(numString, numFrets, tuning) {
    //Return a matrix fretboard of notes
    let fretboard = [];
    for (let i = 0; i < numString; i++) {
        let string = [];
        let noteIndex = notes.indexOf(tuning[i].pitch);
        let octave = tuning[i].octave;
        for (let j = 0; j < numFrets; j++) {
            let pitch = notes[noteIndex];
            let note = new Note(pitch, octave);
            string.push(note);
            noteIndex = (noteIndex + 1) % 12;
            if (noteIndex === 0) octave++; //we reached a new octave
        }
        fretboard.push(string);
    }
    return fretboard;
}
