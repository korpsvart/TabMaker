import {Note, notes} from "@/components/note";
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

export function getMinFret(positions) {
    //Return the minimum fret between the given positions, open fret (0) excluded

    return Math.min(...positions.filter(x => x.fret > 0 ).map(y => y.fret));
}

export function canApplyBarre(position, frettedNotes) {
    //Check if barre can be applied
    //For now we assume barre can only be done on the minimum fret position

    let minFret = getMinFret(position);
    if (!position || !Array.isArray(position) || !position.length) {
        return false
    }

    if (Math.min(...position.map(x => x.fret)) === 0) return false; //Can never apply barre on open strings
    //(Do not use minFret for checking this, since it can't contain the zero fret)

    let minFretsAmount = position.filter(x => x.fret === minFret).length;

    return frettedNotes - minFretsAmount + 1 < 5; //check if we now can play the chord with less than 5 fingers

}

export function posEqual(pos1, pos2) {

    return pos1.string === pos2.string && pos1.fret === pos2.fret;

}

export function countFrettedNotes(positions) {
    return positions.reduce((x, y) => {
        return y.fret !== 0 ? x + 1 : x;
    }, 0);
}

export function computeDistance(previousVoicing, currentVoicing) {
    if (previousVoicing == null) return 6 - currentVoicing.length;

    let distance=0;
    let totalStringsUsed = 0;
    let stringsNotPlayed = 0;

    for (let i = 0; i < 6; i++) {
        let pos1 = currentVoicing.find(x => x.string === i);
        let pos2 = previousVoicing.find(x => x.string === i);

        if (pos1 !== undefined && pos2 !== undefined) {
            distance += Math.abs(pos1.fret - pos2.fret);
            totalStringsUsed++;
        } else if (pos1 === undefined && pos2 !== undefined) {
            stringsNotPlayed++;
        }
    }

    // Calculate the penalty based on the number of strings not played
    const penalty = stringsNotPlayed * 4; // Adjust the penalty weight as needed

    // Weigh the distance over the total number of strings used
    // and add the penalty to avoid reducing the number of strings from one chord to the next
    return (distance + penalty) / totalStringsUsed;
}

export function buildConstraints(chord, nextChord) {

    let constraint = {'noDouble3rd': false};

    if (nextChord == null) return constraint;

    if (chord.type === 'dominant seventh' && Tonal.Interval.distance(chord.notes[0], nextChord.notes[0])==='4P')
    {
        //Chord has dominant function => avoid doubling the third
        constraint.noDouble3rd = true;
    }

    return constraint;

}

export function addInversionConstraints(constraints, chord, inversion) {

    //Assume constraints was already initialized

    constraints.noDoubleP4 = inversion === 2 || inversion === 1;

    return constraints;
}

