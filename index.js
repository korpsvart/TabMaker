const Tonal = require('tonal');
const Fretboard = require('@moonwave99/fretboard.js');
const mainDiv = document.getElementById("main");
const selectChordType = document.createElement("select");
const selectChordTonic = document.createElement("select");
let submitChordButton = document.getElementById("submitChord");

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

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
    let positions = findPositions(fretboard, chord.notes[0].toString());
    let dots = [];
    positions.forEach(x => {
        dots.push({'string': x['string']+1, 'fret': x['fret']});
    })
    fretboardGraphics.setDots(dots).render();
}



fretboard = createFretboard(6, 24, ["E", "B", "G", "D", "A", "E"]);
submitChordButton.onclick = submit;

const fretboardGraphics = new Fretboard.Fretboard({
    el: '#fretboard',
    fretColor: 'blue',
    dotFill: 'red'
});


function findPositions(fretboard, note) {
    //find all positions
    let positions = []; //array of positions
    for (let i = 0; i < fretboard.length; i++) {
        for (let j = 0; j < fretboard[i].length; j++) {
            if (fretboard[i][j]===note)
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
        let noteIndex = notes.indexOf(tuning[i]);
        for (let j = 0; j < numFrets; j++) {
            string.push(notes[noteIndex]);
            noteIndex = (noteIndex + 1) % 12;
        }
        fretboard.push(string);
    }
    return fretboard;
}

