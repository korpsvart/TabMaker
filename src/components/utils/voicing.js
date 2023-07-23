import {Note} from "@/components/utils/Note";
import * as Tonal from "tonal";
import * as feasibilityUtils from "@/components/utils/feasibility";
import {canApplyBarre} from "@/components/utils/feasibility";
import {countFrettedNotes, findInterval, findPositions, getMinFret, getNote} from "@/components/utils/fretboardModel";


export function countTritonesResolutions(voicing1, voicing2, chord1, chord2, fretboard) {
    if (voicing1===null) return 0;
    let intervals1 = findIntervals(voicing1, chord1.notes, fretboard);
    let intervals2 = findIntervals(voicing2, chord2.notes, fretboard);

    let tritoneRes = 0;

    for (let i = 0; i < intervals1.length; i++) {
        let interval1 = intervals1[i];
        let interval2 = intervals2.find(interv => interv.string1 === interval1.string1 && interv.string2 === interval1.string2);
        if (interval2!==undefined)
        {
            let condition = interval1.interval==='5d' && (interval2.interval ==='3M' || interval2.interval==='4P') ||
                interval1.interval==='4A' && (interval2.interval ==='5P' || interval2.interval==='6m');

            if (condition) tritoneRes++;
        }
    }


    //return 0; //to deactivate the function use this
    return tritoneRes;

}

export function findIntervals(voicing, chordNotes, fretboard) {
    let intervals = [];
    for (let i = 0; i < voicing.length-1; i++) {
        let string1 = voicing[i].string;
        let string2 = voicing[i+1].string;
        let interval = findInterval(voicing[i], voicing[i+1], chordNotes, fretboard);
        intervals.push({'string1': string1, 'string2': string2, 'interval': interval});
    }
    return intervals;
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

export function findPositionsOnString(previousPositions, lastNote, minFret, chordNotes, constraints, lastInterval, fretboard, numFrets) {

    let lastPosition = previousPositions[previousPositions.length-1];
    let string = lastPosition.string - 1;
    let positions = [];
    let lastFret = lastPosition.fret;
    //Initialize indexes by default values
    let startIndex = 1;
    let stopIndex = numFrets - 1;
    if (minFret !== 0 && minFret !== Infinity) { //If minFret is zero then we don't need to perform any check
        //minFret === Infinity when there are only open strings, so we need to perform this check too
        if (lastFret !== 0) {
            //Check only positions which are at most 2 frets away from lastFret or at most 4 frets from minFret
            startIndex = Math.max(lastFret - 2, minFret - 4, 1); //1 as safety bound (not 0 because we treat it separately)
            stopIndex = Math.min(lastFret + 2, minFret + 4, numFrets - 1); //numFrets-1 as safety bound
        } else {
            //if lastFret is zero, then ignore the last fret constraint
            startIndex = Math.max(minFret - 4, 1); //1 as safety bound (not 0 because we treat it separately)
            stopIndex = Math.min(minFret + 4, numFrets - 1); //numFrets-1 as safety bound
        }
    }

    //Zero fret must always be considered separately
    chordNotes = chordNotes.slice(); //shallow copy just to be sure
    //Check constraints, if present
    if (constraints !== null)
    {
        //Possibly some checks

        if (constraints.noDoubleP4 && findIntervals(previousPositions, chordNotes, fretboard).find(x => x.interval === '4P')!==undefined)
        {
            chordNotes = chordNotes.filter(note => Tonal.Interval.distance(lastNote.pitch, note)!=='4P')


        }


        if (constraints.noDouble3rd && previousPositions.filter(x => getNote(x, fretboard).pitch === chordNotes[1]).length > 0)
        {
            chordNotes.splice(1, 1); //avoid doubling the third (e.g. of a dominant function chord (it's the 7th))
        }


    }
    let pos = {'string': string, 'fret': 0};
    let posNote = getNote(pos, fretboard);
    //Check if it's part of chord notes and it's not equal to lastNote (even different octave)
    if (checkNoteValidity(chordNotes, posNote, lastNote, lastInterval, previousPositions, fretboard)) positions.push(pos);
    for (let j = startIndex; j <= stopIndex; j++) {
        pos = {'string': string, 'fret': j};
        posNote = getNote(pos, fretboard);
        if (checkNoteValidity(chordNotes, posNote, lastNote, lastInterval, previousPositions, fretboard)) positions.push(pos);
    }
    return positions;
}

export function findNextPositions(positions, lastNote, chordNotes, constraints, lastInterval, fretboard, numFrets) {

    //Return the next candidate positions, based on three principles
    //1) fret distance is not > 2 frets compared to lastPosition fret
    //2) note is different from lastNote (check both note and octave)
    //3) distance from min fret is not > 4 frets
    //4)Notes belong to the chord (chordNotes)
    //5)Special exceptional rules applies for the 0 fret
    let minFret = getMinFret(positions);
    return findPositionsOnString(positions, lastNote, minFret, chordNotes, constraints, lastInterval, fretboard, numFrets);
}

export function checkNoteValidity(chordNotes, posNote, lastNote, lastInterval, previousPositions, fretboard)
{
    //Do not repeat notes having both equal pitch and octave
    //Do not place a P8 interval between two adjacent strings
    let cond1 = chordNotes.some(x => posNote.equalsIgnoreOctave(new Note(x, 0))) && !posNote.equalsIgnoreOctave(lastNote);
    let currentInterval = Tonal.Interval.distance(lastNote.pitch, posNote.pitch);
    //Do not stack two tritone intervals (create strong dissonance)
    let cond2 = (lastInterval!=='4A' && lastInterval!=='5d') ||(currentInterval!=='4A' && currentInterval!=='5d');
    //Avoid tripling tones (overemphasize that tone)
    let cond3 = previousPositions.filter(x => getNote(x, fretboard).equalsIgnoreOctave(posNote)).length < 2;
    return cond1 && cond2 && cond3;
}

export function findVoicings(chord, fretboard, numFrets, inversion = 0, constraints) {
    //Return the positions of a voicing for the given chord
    //given the inversion
    //(inversion = 0 => root position (default), inversion = 1 => third in the bass, ecc...)
    //And possibly using lower numbered frets


    //Find bass position
    let allBassPositions = findPositions(fretboard, new Note(chord.notes[inversion].toString(), 0), true);
    //Select only frets before the 5th one
    let posBefore5 = allBassPositions.filter(pos => pos.fret < 5);
    //Pick the position on the lowest string (highest numbered)
    let bassPos = posBefore5.filter(pos => posBefore5.every(pos2 => pos2.string <= pos.string));

    //Get the exact note corresponding to the position found
    //(we need to know the octave)
    let bassNote = getNote(bassPos[0], fretboard);

    let chordVoicings = []; //will be filled with all the voicings for the complete chord
    //This will be a list of objects of the form
    //{'positions': [list of positions], 'isBarre': bool}

    let chordNotes = chord.notes.map(x => x.toString());

    recursivePositionSearch(bassPos, bassNote, chordNotes, chordVoicings, constraints, fretboard, numFrets);

    return chordVoicings;

}

export function recursivePositionSearch(previousPositions, lastNote, chordNotes, validPositions, constraints, fretboard, numFrets, lastInterval=null) {
    //Recursively find valid positions for a chord
    //Check if this voicing is acceptable
    //1) Only check if we have at least 3 notes (otherwise we don't consider it a chord yet)
    let lastPosition = previousPositions[previousPositions.length-1];
    if (previousPositions.length > 2) {
        //2) Check if it contains the necessary chord tones
        //(If it doesn't do not skip yet, unless we've already reached the last string)
        if (containsChordTones(previousPositions, fretboard, chordNotes)) {
            const frettedNotes = countFrettedNotes(previousPositions);
            if (frettedNotes > 4) {
                //Check if we can use barre
                if (canApplyBarre(previousPositions, frettedNotes)) {
                    validPositions.push(previousPositions);
                } else {
                    // Chord is not valid, discard (return, so to avoid also following paths)
                    return;
                }
            } else {
                //Simply add it to valid positions
                //I use slice to create shallow copy, not to modify it later
                validPositions.push(previousPositions.slice());
            }
        }
    }
    //Check if this is not the last string
    //If it is then stop the recursion
    if (lastPosition.string !== 0) {
        //Find next positions and do recursive call
        //Implement a function that returns that next possible positions based on the basic constraints
        let nextPositions = findNextPositions(previousPositions, lastNote, chordNotes, constraints, lastInterval, fretboard, numFrets);
        //Find all possible valid voicings with more notes
        for (let i in nextPositions) {
            let nextPosition = nextPositions[i];
            //Update minFret if necessary (never update minFret if new fret is zero)
            //Also skip comparison for zero frets
            let newPositions = previousPositions.slice();
            newPositions.push(nextPosition); //add the new element
            //Again I use splice to create shallow copy, otherwise we will add other voicings together
            let nextNote = getNote(nextPosition, fretboard, chordNotes);
            lastInterval = Tonal.Interval.distance(lastNote.pitch, nextNote.pitch);
            recursivePositionSearch(newPositions, getNote(nextPosition, fretboard, chordNotes), chordNotes,
                validPositions, constraints, fretboard, numFrets, lastInterval);
        }
    }
}

export function getVoicingSequence(chords, fretboard, numFrets, allowInversions, recursiveDepth = 4) {

    let chordsVoicings = [];

    //I added support for constraints but we are not using them now
    for (let i = 0; i < chords.length; i++) {
        console.log("chord: " + chords[i].notes);
        let constraints = null;
        let inversion = 0;
        if (i < chords.length-1)
        {
            constraints = buildConstraints(chords[i], chords[i+1]);
        } else {
            constraints = buildConstraints(chords[i], null)
        }
        let chordVoicings = findVoicings(chords[i], fretboard,numFrets,  0, constraints);
        sortVoicings(chordVoicings, fretboard); //Sort voicings from highest to lowest priority
        //Uncomment next line to keep only the first n voicings in case the algorithm is really slow
        //(which might happen for 6 or more chords sequences. But it's not so common after implementation of
        //the in-depth feasibility check)
        chordVoicings = chordVoicings.slice(0, 5);

        //In-depth feasibility check (considering fingering)
        chordVoicings = chordVoicings.filter(voicing => feasibilityUtils.checkFeasible(voicing));

        //if inversions are allowed, add them
        if (allowInversions && i > 0) {
            for (inversion = 1; inversion < 3; inversion++) {
                constraints = addInversionConstraints(constraints, chords[i], inversion);
                let chordVoicingsInverted = findVoicings(chords[i], fretboard, numFrets, inversion, constraints);
                sortVoicings(chordVoicingsInverted, fretboard);
                chordVoicingsInverted = chordVoicingsInverted.slice(0, 5);
                chordVoicingsInverted = chordVoicingsInverted.filter(voicing => feasibilityUtils.checkFeasible(voicing));
                chordVoicings = chordVoicings.concat(chordVoicingsInverted);
            }
        }

        if (chordVoicings.length === 0)
        {
            window.alert("Unable to find a playable shape for the chord: " + chords[i].name);
            return [];
        }


        chordsVoicings.push({'chord': chords[i], 'voicings': chordVoicings});
    }
    return pickBoundedVoicingSequence(chordsVoicings, recursiveDepth, fretboard);

}

export function getDistinctPitchesFromVoicing(voicing, fretboard) {
    let voicingPitches = voicing.map(x => getNote(x, fretboard).pitch);
    return new Set(voicingPitches);
}

// e.g chordNotes = [ 'C', 'E', 'G' ]
// e.g positions = [ {5,3} , {4,2} , {3,0} ]
export function containsChordTones(positions, fretboard, chordNotes) {

    /* If this is a check to only accept 3 or more notes chord, I think this should be done somewhere else */
    // if ( chordNotes.length < 3 ) {
    //   return false;
    // }

    //Set of the notes which have been found during positions research
    let notesFound = [];
    for (let i = 0; i < positions.length; i++) {
        notesFound.push(getNote(positions[i], fretboard));
    }
    //If the chord has only three notes, then check if it contains all of them
    if (chordNotes.length === 3) {
        return chordNotes.every((note) => notesFound.some(foundNote => foundNote.equalsIgnoreOctave(
            new Note(note, 0)
        )));
    }


    //If the chord has 4 notes, a note can be eventually skipped (the 5th)
    if (chordNotes.length === 4) {
        let mandatoryNotes = chordNotes.slice(); //to clone the object, otherwise we are modifying chordNotes!
        mandatoryNotes.splice(2, 1); //to remove the fifth
        return mandatoryNotes.every((note) => notesFound.some(foundNote => foundNote.equalsIgnoreOctave(
            new Note(note, 0)
        )));
    }
}

export function sortVoicings(voicings, fretboard) {
    //Sort voicings from the "best" to the worst based on some principles
    //This is useful because when building a voicing sequence the voicings are analyzed
    //in the list from first to last, and in case of equal properties the first one wins.

    voicings.sort((x, y) => compareVoicings(y, x, fretboard));


}

export function compareVoicings(voicingA, voicingB, fretboard) {

    //Compare function for voicings sorting

    //More distinct pitch classes wins
    let distinctPitchesA = getDistinctPitchesFromVoicing(voicingA, fretboard)
    let distinctPitchesB = getDistinctPitchesFromVoicing(voicingB, fretboard);
    if (distinctPitchesA.size > distinctPitchesB.size) {
        return 1;
    } else if (distinctPitchesA.size < distinctPitchesB.size) {
        return -1;
    }

    //If same number of distinct pitches, then compare number of overall notes
    if (voicingA.length > voicingB.length) {
        return 1;
    } else if (voicingA.length < voicingB.length) {
        return -1;
    }

    //If same number of overall notes
    //Then choose the one...


    //For now return 0
    return 0;



}

export function pickBoundedVoicingSequence(chordsVoicings, bound, fretboard) {
    let start = 0;
    let bestSequence = [];
    let previousVoicing = null;
    let previousChord = null;
    let chordsWindow = chordsVoicings.slice(start,start+bound);
    let currentVoicings = null;
    while (chordsWindow.length > 0){

        currentVoicings = pickBestVoicingSequence(chordsWindow, previousVoicing, 0, previousChord, fretboard).sequence;
        console.log(currentVoicings);
        bestSequence = bestSequence.concat(currentVoicings);
        //Prepare next iteration
        previousChord = chordsWindow[chordsWindow.length-1];
        previousVoicing = currentVoicings[currentVoicings.length-1];
        console.log(previousVoicing);
        start = start + bound;
        console.log(start);
        chordsWindow = chordsVoicings.slice(start,start+bound);
        console.log(chordsWindow);
        console.log(bestSequence);
    }
    console.log(bestSequence);
    return bestSequence;
}

export function pickBestVoicingSequence(chordsVoicings, previousVoicing, i, previousChord, fretboard) {

    //Will return the best voicing
    //(For now based only on highest number of common tones)
    //Later I'll probably add typical 3th-7th voice leading guideline
    // Works in a recursive fashion, by analyzing all possible
    //combinations. Could get computationally really heavy for long sequences though

    //Input is a sequence of objects of the form
    //{ 'chord': { see Tonal chord object }, 'voicings': [an array of voicings] }

    let currentChordVoicings = chordsVoicings[i];
    let currentChord = currentChordVoicings.chord; //unused for now
    let currentVoicings = currentChordVoicings.voicings;
    let minDistance = Infinity;
    let maxTritoneRes = -1;
    let bestSequence = [];
    for (let j = 0; j < currentVoicings.length; j++) {
        let tritoneRes = countTritonesResolutions(previousVoicing, currentVoicings[j], previousChord, currentChord, fretboard);
        let distance = computeDistance(previousVoicing, currentVoicings[j]);
        if (i < chordsVoicings.length - 1) {
            let recursiveResult = pickBestVoicingSequence(chordsVoicings, currentVoicings[j], i + 1, currentChord, fretboard);
            distance = distance + recursiveResult.distance;
            tritoneRes = tritoneRes + recursiveResult.tritoneRes;
            if (tritoneRes > maxTritoneRes) {
                maxTritoneRes = tritoneRes;
                minDistance = distance;
                //Make copy of recursiveResult to avoid mess
                bestSequence = recursiveResult.sequence.slice();
                bestSequence.unshift(currentVoicings[j]); //add picked voicing
            } else if (tritoneRes === maxTritoneRes) {
                if (distance < minDistance) {
                    minDistance = distance;
                    //Make copy of recursiveResult to avoid mess
                    bestSequence = recursiveResult.sequence.slice();
                    bestSequence.unshift(currentVoicings[j]); //add picked voicing
                }
            }
        } else { //no recursive call
            if (tritoneRes > maxTritoneRes) {
                minDistance = distance;
                maxTritoneRes = tritoneRes;
                //Make copy of recursiveResult to avoid mess
                bestSequence = [currentVoicings[j]];
            } else if (tritoneRes === maxTritoneRes) {
                if (distance < minDistance) {
                    minDistance = distance;
                    bestSequence = [currentVoicings[j]];
                }
            }
        }
    }

    maxTritoneRes = Math.max(0, maxTritoneRes);

    return {'distance': minDistance, 'sequence': bestSequence, tritoneRes: maxTritoneRes};


}

