import {countFrettedNotes, getMinFret as getMinFret1, getMinFret, posEqual} from "@/components/utils/fretboardModel";

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

export function checkFeasible(voicing, difficultModeEnabled) {
    //A more in-depth check to see if a voicing is actually feasible,
    //taking into account the fingering

    //The idea is as follows:
    //1) Fingers cannot cross
    //2) We will always play the min fret using index finger
    // (this is a fair assumption, as in most cases were some "spontaneous" fingering may not follow this rule,
    // we can still find an alternative feasible fingering which does follow this rule)
    //3) If difficult mode is disabled: Fret distance between fingers cannot be higher than "finger distance"
    //(This is a more restrictive assumption. It works fairly well with major, minor and 7th chords but it makes
    //many 9 chords impossible to play, since they naturally require at least a stretch of 2 frets for two consecutive
    //fingers.
    //4) if difficultMode is enabled, fret distance must be <= finger distance + 1

    let extraFretSpace = difficultModeEnabled ? 1 : 0;

    let voicingLocal = voicing.slice(); //shallow copy


    let availableFingers = [1, 2, 3];
    let usedFingers = [];

    let frettedNotesCount = countFrettedNotes(voicing);
    let isBarre = canApplyBarre(voicing, frettedNotesCount);

    //Remove all open strings, as they don't need to be checked
    voicingLocal = voicingLocal.filter(x => x.fret !== 0);

    //If all strings are open (unlikely but check it), return true already
    if (voicingLocal.length === 0) return true;

    //Use index finger to play minimum non-zero fret
    let minFret = getMinFret1(voicingLocal);
    //Take one string (doesn't matter which) having min fret
    let indexPos = voicingLocal.find(pos => pos.fret === minFret);

    //Add index finger to usedFingers structure
    usedFingers.push({'finger': 0, 'pos': indexPos});


    //Remove the position assigned to index
    if (isBarre) {
        //If it's a barre chord, then remove all the positions having fret = minFret
        voicingLocal = voicingLocal.filter(pos => pos.fret !== minFret);
    } else {
        //Not a barre chord, remove only one exact position
        voicingLocal = voicingLocal.filter(pos => !posEqual(pos, indexPos));
    }
    //Again, before proceeding check if we run out of positions to cover. In that case return true
    if (voicingLocal.length === 0) return true;
    //Take the next position (doesn't matter which one it is)
    let currentPos = voicingLocal.shift(); //also remove it from the voicing array
    let currentFret = currentPos.fret;
    //Check available fingers for this position
    for (let j = 0; j < availableFingers.length; j++) {
        let finger = availableFingers[j];
        let usable = true;
        for (let k = 0; k < usedFingers.length && usable; k++) {
            //Check distance and check not crossing rule
            let usedFinger = usedFingers[k].finger;
            let usedFret = usedFingers[k].pos.fret;
            let crossing = (finger-usedFinger)*(currentFret-usedFret) < 0; //if one grows and other decreases, they cross
            let fingerDistance = Math.abs(finger-usedFinger);
            let fretDistance = Math.abs(currentFret-usedFret);
            //Add the extra fret space (=1 if difficult mode), but only if it's not between medium and ring finger
            if ((finger+usedFinger)!==3) fretDistance-=extraFretSpace;
            usable = !crossing && fingerDistance >= fretDistance;
        }
        if (usable) {
            //If usable, try using this finger
            //(it means this finger is surely usable, however this might not be the correct choice.
            //To know it for sure we must try fretting all notes. Hence all allowed combinations must be considered.)


            //Shallow copy
            let usedFingersTmp = usedFingers.slice();
            let availableFingersTmp = availableFingers.slice();
            //Add new finger
            usedFingersTmp.push({'finger': finger, 'pos': currentPos});
            //Remove from available fingers
            availableFingersTmp.splice(j, 1);
            //Recursive call
            //Stop as soon as you find a feasible fingering
            if (checkFeasibleIntermediate(voicingLocal, availableFingersTmp, usedFingersTmp, difficultModeEnabled)) return true;
        }
    }
    //If no next finger led to a feasible fingering position
    //(Or there were no more fingers available)
    // then the chord is not feasible
    return false;


}

export function checkFeasibleIntermediate(voicing, availableFingers, usedFingers, difficultModeEnabled)
{


    let extraFretSpace = difficultModeEnabled ? 1 : 0;

    if (voicing.length === 0) return true;

    if (availableFingers.length === 0) return false;

    //Create a local shallow copy of voicing
    let voicingTmp = voicing.slice();

    let currentPos = voicingTmp.shift(); //also remove it from the voicing array
    let currentFret = currentPos.fret;


    //Check available fingers for this position
    for (let j = 0; j < availableFingers.length; j++) {
        let finger = availableFingers[j];
        let usable = true;
        for (let k = 0; k < usedFingers.length && usable; k++) {
            //Check distance and check not crossing rule
            let usedFinger = usedFingers[k].finger;
            let usedFret = usedFingers[k].pos.fret;
            let crossing = (finger-usedFinger)*(currentFret-usedFret) < 0; //if one grows and other decreases, they cross
            let fingerDistance = Math.abs(finger-usedFinger);
            let fretDistance = Math.abs(currentFret-usedFret);
            if ((finger+usedFinger)!==3) fretDistance-=extraFretSpace;
            usable = !crossing && fingerDistance >= fretDistance;
        }
        if (usable) {
            //If usable, try using this finger
            //(it means this finger is surely usable, however this might not be the correct choice.
            //To know it for sure we must try fretting all notes. Hence all allowed combinations must be considered.)


            //Shallow copy
            let usedFingersTmp = usedFingers.slice();
            let availableFingersTmp = availableFingers.slice();
            //Add new finger
            usedFingersTmp.push({'finger': finger, 'pos': currentPos});
            //Remove from available fingers
            availableFingersTmp.splice(j, 1);
            //Recursive call
            //Stop as soon as you find a feasible fingering
            if (checkFeasibleIntermediate(voicingTmp, availableFingersTmp, usedFingersTmp)) return true;
        }
    }
    //If no next finger led to a feasible fingering position
    //(Or there were no more fingers available)
    // then the chord is not feasible
    return false;

}

