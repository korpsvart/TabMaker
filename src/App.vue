<template>
    <div>
        <div>
            <select name="chords" v-model="data.chordSelect">
                <option :value="item" v-for="item in data.allChords">{{ item }}</option>
            </select>
            <select name="notes" v-model="data.notesSelect">
                <option :value="item" v-for="item in data.notes">{{ item }}</option>
            </select>
        </div>
        <div id="main">
            <button id="submitChord" ref="submit" @click="submit">Submit</button>
        </div>
        <figure id="fretboard"></figure>
        <div id="output"></div>
    </div>
</template>
<script>
import * as Tonal from 'tonal';
import * as Fretboard from '@moonwave99/fretboard.js'

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

let notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
let allChords = Tonal.ChordType.symbols()

const tuning = [new Note('E', 4),
    new Note('B', 3),
    new Note('G', 3),
    new Note('D', 3),
    new Note('A', 2),
    new Note('E', 2)];
//We represent a fretboard as a matrix of Note objects
const fretboardMatrix = createFretboard(6, 24, tuning);

let fretboardGraphics;

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

function findPositionsAboveOctave(fretboard, note) {
    //Find all positions corresponding to a particular pitch class
    //and octave equal or above the one provided
    let positions = []; //array of positions
    for (let i = 0; i < fretboard.length; i++) {
        for (let j = 0; j < fretboard[i].length; j++) {
            let condition = fretboard[i][j].equalsIgnoreOctave(note) && (fretboard[i][j].octave >= note.octave);
            if (condition)
                positions.push({'string': i, 'fret': j});
        }
    }
    return positions;
}

function getNote(position, fretboard) {
    //Return the note corresponding to a given position on the fretboard
    return fretboard[position.string][position.fret];
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

function findRootPosVoicing(chord, fretboard) {
    //Return the positions of a voicing for the given chord
    //in root position (tonic is the lower note)
    //And possibly using lower numbered frets

    //Find tonic positions
    let allTonicPositions = findPositions(fretboard, new Note(chord.notes[0].toString(), 0), true);
    //Select only frets before the 5th one
    let posBefore5 = allTonicPositions.filter(pos => pos.fret < 5);
    //Pick the position on the lowest string (highest numbered)
    let tonicPos = posBefore5.filter(pos => posBefore5.every(pos2 => pos2.string <= pos.string));

    //Get the exact note corresponding to the position found
    //(we need to know the octave)
    let tonicNote = getNote(tonicPos[0], fretboard);

    let chordVoicings = []; //will be filled with all the voicings for the complete chord
    //This will be a list of lists. The elements of this list in fact will be sequences of positions


    //Descend on the strings one by one
    for (let i = tonicPos.string - 1; i >= 0; i--) {

    }

    //Find positions for the third
    //Since we are in root position, all other chord tones will need to have octave
    //>= wrt to the root octave
    let thirdPositions = findPositionsAboveOctave(fretboard, new Note(chord.notes[1].toString(), tonicNote.octave));

    //Find positions for the fifth
    let fifthPositions = findPositionsAboveOctave(fretboard, new Note(chord.notes[2].toString(), tonicNote.octave));

    return tonicPos;

}

function containsChordTones(previousPositions, chordNotes) {
    //TODO
    //If the chord has only three notes, then check if it contains all of them
    //If the chord has more than 3 notes, some notes can be skipped (for example the 5th)
    //But this should be refined

    return false;
}

function canApplyBarre(previousPositions) {
    //TODO
    //Check if barre can be applied
    //Simply check if there is a "column" of notes played on the same fret
    //And no frets are played before that column position
    return false;
}

function findNextPositions(lastPosition, lastNote, minFret) {
    //TODO

    //Return the next candidate positions, based on three principles
    //1) fret distance is not > 2 frets compared to lastPosition fret
    //2) note is different from lastNote (check both note and octave)
    //3) distance from min fret is not > 4 frets


    return undefined;
}

function recursivePositionSearch(previousPositions, lastPosition, lastNote, minFret, chordNotes, validPositions) {
    //Recursively find valid positions for a chord
    //Check if this voicing is acceptable
    //1) Only check if we have at least 3 notes (otherwise we don't consider it a chord yet)
    if (previousPositions.length > 2) {
        //2) Check if it contains the necessary chord tones
        //(If it doesn't do not skip yet, unless we've already reached the last string)
        if (containsChordTones(previousPositions, chordNotes)) {
            const frettedNotes = previousPositions.reduce((x, y) => {
                if (y.fret !== 0) return x + 1;
            }, 0);
            if (frettedNotes > 4) {
                //Check if we can use barre
                if (canApplyBarre(previousPositions)) {
                    validPositions.push(previousPositions);
                } else {
                    //Chord is not valid, discard (return, so to avoid also following paths)
                    return;
                }
            } else {
                //Simply add it to valid positions
                validPositions.push(previousPositions);
            }
        }
    }
    //Check if this is not the last string
    //If it is then stop the recursion
    if (lastPosition.string !== 0) {
        //Find next positions and do recursive call
        //Implement a function that returns that next possible positions based on the basic constraints
        let nextPositions = findNextPositions(lastPosition, lastNote, minFret);
        //Find all possible valid voicings with more notes
        for (const nextPosition in nextPositions) {
            //Update minFret if necessary
            if (previousPositions.every(x => x.fret > nextPosition.fret)) minFret = nextPosition.fret;
            recursivePositionSearch(previousPositions.push(nextPosition), nextPosition, getNote(nextPosition, fretboardMatrix),
                minFret, chordNotes, validPositions);
        }
    }
}


export default {
    data() {
        let data = {
            notes,
            notesSelect: notes[0],
            allChords,
            chordSelect: allChords[0]
        }
        return {data}
    },
    mounted() {
        fretboardGraphics = new Fretboard.Fretboard({
            el: '#fretboard',
            fretColor: 'blue',
            dotFill: 'red'
        })
    },
    methods: {
        submit() {
            let me = this
            let data = me.data
            let chord = Tonal.Chord.getChord(data.chordSelect, data.notesSelect);
            let positions = findRootPosVoicing(chord, fretboardMatrix);
            let dots = [];
            positions.forEach(x => {
                dots.push({'string': x['string'] + 1, 'fret': x['fret']});
            })
            fretboardGraphics.setDots(dots).render();
        }
    },
}


</script>
<style scoped>
</style>
