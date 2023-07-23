import {Note, notes} from "@/components/utils/note";
import * as Tonal from "tonal";

export function findPositions(fretboard, note, ignoreOctave = true) {
    //Find all positions corresponding to a particular note
    //If ignoreOctave = true it returns all positions corresponding
    //to the pitch class
    let positions = []; //array of positions
    for (let i = 0; i < fretboard.length; i++) {
        for (let j = 0; j < fretboard[i].length; j++) {
            let condition = (fretboard[i][j].equalsIgnoreOctave(note) && ignoreOctave) ||
                fretboard[i][j].equals(note);
            if (condition)
                positions.push({string: i, fret: j});
        }
    }
    return positions;
}

export function createFretboard(numString, numFrets, tuning) {
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

export function getNote(position, fretboard, chordNotes = null) {
    //Return the note corresponding to a given position on the fretboard

    //Optional parameter chord is used because sometimes we want the returned note as
    //it would appear inside a given chord, and getNote on its own may return a different but
    //enhamornically equivalent note


    let note = fretboard[position.string][position.fret];
    if (chordNotes === null) return note;

    if (chordNotes.find(x => x === note.pitch) !== undefined) {
        return note;
    } else {
        //Find the correct enharmonic note that fits in the chord
        for (let i = 0; i < chordNotes.length; i++) {
            if (note.equalsIgnoreOctave(new Note(chordNotes[i], null)))
                return new Note(chordNotes[i], note.octave);
        }

        //As a last check, if someone passes a note which is not contained inside chord notes
        //here we return that note
        return note;
    }
}

export function findInterval(pos1, pos2, chordNotes, fretboard) {
    return Tonal.Interval.distance(getNote(pos1, fretboard, chordNotes).pitch + getNote(pos1, fretboard, chordNotes).octave,
        getNote(pos2, fretboard, chordNotes).pitch + getNote(pos2, fretboard, chordNotes).octave);
}

export function countFrettedNotes(positions) {
    return positions.reduce((x, y) => {
        return y.fret !== 0 ? x + 1 : x;
    }, 0);
}

export function posEqual(pos1, pos2) {

    return pos1.string === pos2.string && pos1.fret === pos2.fret;

}

export function getMinFret(positions) {
    //Return the minimum fret between the given positions, open fret (0) excluded

    return Math.min(...positions.filter(x => x.fret > 0).map(y => y.fret));
}