<template>
    <div class="app-container" :style="rootStyle">
        <div class="chords-container overflow-x-scroll card">
            <div class="chords-container-sub clearfix">
                <div v-for="(chord,index) in data.chordsSelect" class="chord-select-container">
                    <h5>Chord {{index+1}}</h5>
                    <div class="input-group mb-3" >
                        <div class="input-group-prepend">
                            <label class="input-group-text" for="chord-select">Type</label>
                        </div>
                        <select name="chord-select" v-model="data.chordsSelect[index].name" class="custom-select">
                            <option :value="item" v-for="item in data.allChords">{{ item }}</option>
                        </select>
                    </div>
                    <div class="input-group mb-3">
                        <div class="input-group-prepend">
                            <label class="input-group-text" for="note-select">Tonic</label>
                        </div>
                        <select name="note-select" v-model="data.chordsSelect[index].note" class="custom-select">
                            <option :value="item" v-for="item in data.notes">{{ item }}</option>
                        </select>
                    </div>
                </div>
                <div class="add-container" @click="addChord">
                    <div class="plus" id="plus">
                        <div class="plus__line plus__line--v">
                            <a href="#" class="plus__link ion-person"></a>
                        </div>
                        <div class="plus__line plus__line--h"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="btn-group action-group">
            <button class="btn btn-primary"  @click="submit">Submit</button>
<!--            <button class="btn btn-info" @click="midi">enable midi</button>-->
        </div>
        <div class="fretboard-figure-container card" v-show="data.dots&&data.dots.length">
            <div class="control">
                <div class="play-container" @click="play">
                    <a id="play-video" class="music-play-button" href="#">
                        <span></span>
                    </a>
                </div>
                <div class="input-group mb-3 display-view-select">
                    <div class="input-group-prepend">
                        <label class="input-group-text" for="note-select">View</label>
                    </div>
                    <select name="note-select" v-model="data.displayView" class="custom-select">
                        <option :value="item" v-for="item in data.displayViewOptions">{{ item }}</option>
                    </select>
                </div>
                <button class="btn btn-primary tuning" data-toggle="popover" data-content="to do">Tuning</button>
            </div>
            <FretboardEL :position="data.dots"></FretboardEL>
        </div>
        <figure id="fretboard"></figure>
        <div id="output"></div>
    </div>
</template>
<script>
import * as Tonal from 'tonal';
import {Fretboard} from '@moonwave99/fretboard.js';
import {Note, notes} from "./components/note";
import {enableMidi} from "./components/midi";
import {playChord} from "./components/sound";
import FretboardEL from "./components/fretboard.vue"

/* For debugging in webstorm: CTRL+SHIFT+CLICK on the localhost link after
npm run dev
 */

let allChords = Tonal.ChordType.symbols()

const tuning = [new Note('E', 4),
    new Note('B', 3),
    new Note('G', 3),
    new Note('D', 3),
    new Note('A', 2),
    new Note('E', 2)];
const numStrings = 6;
const numFrets = 24;
//We represent a fretboard as a matrix of Note objects
const fretboardMatrix = createFretboard(numStrings, numFrets, tuning);

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
                positions.push({string: i, fret: j});
        }
    }
    return positions;
}

function getNote(position) {
    //Return the note corresponding to a given position on the fretboard
    return fretboardMatrix[position.string][position.fret];
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

function sortVoicings(voicings) {
  //Sort voicings from the "best" to the worst based on some principles
  //This is useful because when building a voicing sequence the voicings are analyzed
  //in the list from first to last, and in case of equal properties the first one wins.

  voicings.sort((x, y) => compareVoicings(y, x));


}

function compareVoicings(voicingA, voicingB) {

  //Compare function for voicings sorting

  //More distinct pitch classes wins
  let voicingAPitches = voicingA.map(x => getNote(x).pitch);
  let voicingBPitches = voicingB.map(x => getNote(x).pitch);
  let distinctPitchesA = new Set(voicingAPitches);
  let distinctPitchesB = new Set(voicingBPitches);
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

function findVoicings(chord, fretboard, inversion = 0) {
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
    let bassNote = getNote(bassPos[0]);

    let chordVoicings = []; //will be filled with all the voicings for the complete chord
    //This will be a list of lists. The elements of this list in fact will be sequences of positions

    let chordNotes = chord.notes.map(x => x.toString());

    recursivePositionSearch(bassPos, bassNote, chordNotes, chordVoicings);

    return chordVoicings;

}

// e.g chordNotes = [ 'C', 'E', 'G' ]
// e.g positions = [ {5,3} , {4,2} , {3,0} ]
function containsChordTones(positions, fretboard, chordNotes) {

    /* If this is a check to only accept 3 or more notes chord, I think this should be done somewhere else */
    // if ( chordNotes.length < 3 ) {
    //   return false;
    // }

    //Set of the notes which have been found during positions research
    let notesFound = [];
    for (let i = 0; i < positions.length; i++) {
      notesFound.push(getNote(positions[i]));
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

function getMinFret(positions) {
  //Return the minimum fret between the given positions, open fret (0) excluded

  return Math.min(...positions.filter(x => x.fret > 0 ).map(y => y.fret));
}

function canApplyBarre(position, frettedNotes) {
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

function findPositionsOnString(string, lastPosition, lastNote, minFret, chordNotes) {

  //Need to do some fixes on minFret (minFret should never be 0)
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
  let pos = {'string': string, 'fret': 0};
  let posNote = getNote(pos);
  //Check if it's part of chord notes and it's not equal to lastNote (both in pitch class and octave)
  if (chordNotes.some(x => posNote.equalsIgnoreOctave(new Note(x, 0))) && !posNote.equals(lastNote)) positions.push(pos);
  for (let j = startIndex; j <= stopIndex; j++) {
    pos = {'string': string, 'fret': j};
    posNote = getNote(pos);
    if (chordNotes.some(x => posNote.equalsIgnoreOctave(new Note(x, 0))) && !posNote.equals(lastNote)) positions.push(pos);
  }
  return positions;
}

function findNextPositions(positions, lastNote, chordNotes) {
  //TODO

  //Return the next candidate positions, based on three principles
  //1) fret distance is not > 2 frets compared to lastPosition fret
  //2) note is different from lastNote (check both note and octave)
  //3) distance from min fret is not > 4 frets
  //4)Notes belong to the chord (chordNotes)
  //5)Special exceptional rules applies for the 0 fret
  let lastPosition = positions[positions.length-1];
  let string = lastPosition.string - 1;
  let minFret = getMinFret(positions);
  return findPositionsOnString(string, lastPosition, lastNote, minFret, chordNotes);

}

function recursivePositionSearch(previousPositions, lastNote, chordNotes, validPositions) {
    //Recursively find valid positions for a chord
    //Check if this voicing is acceptable
    //1) Only check if we have at least 3 notes (otherwise we don't consider it a chord yet)
    let lastPosition = previousPositions[previousPositions.length-1];
    if (previousPositions.length > 2) {
        //2) Check if it contains the necessary chord tones
        //(If it doesn't do not skip yet, unless we've already reached the last string)
        if (containsChordTones(previousPositions, fretboardMatrix, chordNotes)) {
            const frettedNotes = previousPositions.reduce((x, y) => {
                return y.fret !== 0 ? x + 1 : x;
            }, 0);
            if (frettedNotes > 4) {
                //Check if we can use barre
                if (canApplyBarre(previousPositions, frettedNotes)) {
                    validPositions.push(previousPositions);
                } else {
                    //Chord is not valid, discard (return, so to avoid also following paths)
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
        let nextPositions = findNextPositions(previousPositions, lastNote, chordNotes);
        //Find all possible valid voicings with more notes
        for (let i in nextPositions) {
            let nextPosition = nextPositions[i];
            //Update minFret if necessary (never update minFret if new fret is zero)
            //Also skip comparison for zero frets
            let newPositions = previousPositions.slice();
            newPositions.push(nextPosition); //add the new element
            //Again I use splice to create shallow copy, otherwise we will add other voicings together
            recursivePositionSearch(newPositions, getNote(nextPosition), chordNotes, validPositions);
        }
    }
}


function computeOverlap(previousVoicing, currentVoicing) {
    //Compute number of common tones for two voicings
    if (previousVoicing === null) return 0;
    return previousVoicing.filter(x => currentVoicing.some(y => y.fret === x.fret && y.string === x.string)).length;
}

function pickBestVoicingSequence(chordsVoicings, previousVoicing, i) {

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
    let maxOverlap = 0;
    let bestSequence = [];
    for (let j = 0; j < currentVoicings.length; j++) {
        let overlap = computeOverlap(previousVoicing, currentVoicings[j]);
        if (i < chordsVoicings.length - 1) {
            let recursiveResult = pickBestVoicingSequence(chordsVoicings, currentVoicings[j], i + 1);
            overlap = overlap + recursiveResult.overlap;
            if (overlap > maxOverlap) {
                maxOverlap = overlap;
                //Make copy of recursiveResult to avoid mess
                bestSequence = recursiveResult.sequence.slice();
                bestSequence.unshift(currentVoicings[j]); //add picked voicing
            }
        } else { //no recursive call
            if (overlap > maxOverlap) {
                maxOverlap = overlap;
                bestSequence = [currentVoicings[j]];
            }
        }
    }

    return {'overlap': maxOverlap, 'sequence': bestSequence};


}

function getVoicingSequence(chords) {

    let chordsVoicings = [];

    for (let i = 0; i < chords.length; i++) {
      let chordVoicings = findVoicings(chords[i], fretboardMatrix);
      sortVoicings(chordVoicings); //Sort voicings from highest to lowest priority
      //chordVoicings = chordVoicings.concat(findVoicings(chords[i], fretboardMatrix, 1));
      //chordVoicings = chordVoicings.concat(findVoicings(chords[i], fretboardMatrix, 2));
      chordsVoicings.push({'chord': chords[i], 'voicings': chordVoicings});
    }

    let bestSequence = pickBestVoicingSequence(chordsVoicings, null, 0);

    return bestSequence;

}


export default {
    data() {
        let data = {
            notes,
            allChords,
            chordsSelect: [{name: 'm7', note: 'D'}, {name: '7', note: 'G'}, {name: 'maj7', note: 'C'}],
            dots: [],
            displayView:'Fretboard',
            displayViewOptions:['Fretboard','Tab'],
        }
        return {data}
    },
    components: {
        FretboardEL
    },
    mounted() {
        $('[data-toggle="popover"]').popover()
    },
    computed:{
        rootStyle(){
            return {
                '--number_of_chords': this.data.chordsSelect.length
            }
        },
    },
    methods: {
        openTuningDialog(){

        },
        addChord() {
            let me = this
            me.data.chordsSelect.push({name: 'm7', note: 'D'})
        },
        midi() {
            enableMidi();
        },
        submit() {
            let me = this
            let data = me.data
            console.log(data.chordsSelect)
            let chordArray = data.chordsSelect.map((v) => {
                return Tonal.Chord.getChord(v.name, v.note)
            })
            let voicingSequence = getVoicingSequence(chordArray).sequence;

            function firstVoicing() {
                data.dots = voicingSequence[0].map(x => {
                    return {'string': x['string'] + 1, 'fret': x['fret']}
              })
            }

            firstVoicing();
        },
        play() {
            let me = this
            let data = me.data
            let chordArray = data.chordsSelect.map((v) => {
                return Tonal.Chord.getChord(v.name, v.note)
            })
            let voicingSequence = getVoicingSequence(chordArray).sequence;
            let T = [ 0 ];
            for(let i = 1; i < voicingSequence.length; i++) {
                T.push(720 * voicingSequence[i-1].length + 3200 + T[i-1]);
            }

            function loopVoicings() {
                for(let k = 0; k < voicingSequence.length; k++) {
                    setTimeout(function () {
                        data.dots = voicingSequence[k].map(x => {
                            return {'string': x['string'] + 1, 'fret': x['fret']}
                        });
                        let foundNotes = [];
                        for (let i = 0; i < voicingSequence[k].length; i++) {
                            foundNotes.push(getNote(voicingSequence[k][i]));
                        }
                        playChord(foundNotes, voicingSequence[k]);
                    }, T[k]);
                }
            }

            loopVoicings();
        }
    },
}

</script>
<style lang="less" scoped>
.app-container{
    position: relative;
    width: 100vw;
    height: 100vh;
    color: #333;
    background: #f5f5f5
    //background: radial-gradient(ellipse at center, #f5f5f5 0%,#ddd 100%);
}
.fretboard-figure-container{
    margin-top: 100px;
    padding:15px;
    position: relative;
    width: 100%;
    bottom: 0;
    z-index: 10;
}
.clearfix::after {
    content: "";
    clear: both;
    display: table;
}
.chords-container{
    position: relative;
    width: 100%;
    overflow-x: auto;
    .chords-container-sub{
        position: relative;
        width: calc( 220px * var(--number_of_chords) + 110px );
    }
    .chord-select-container{
        margin: 10px;
        float: left;
        width: 200px;
    }
}
.add-container{
    position: relative;
    top: 50%;
    margin-top:40px;
    float: left;
    margin-left: 15px;
}
.plus {
    width: 80px;
    cursor:pointer;
    transition: all .3s ease 0s;
    height: 80px;
    background: #ffe581;
    border-radius: 50%;
    display: flex;
    position: relative;
    &__line {
        width: 6px;
        height: 50px;
        background: #000;
        border-radius:10px;
        position: absolute;
        left: calc(50% - 3px);
        top: calc(50% - 25px);
        &--h {
            transform: rotate(90deg);
        }
        &--v {
            display: flex;
            align-items: center;
            justify-content: space-around;
            overflow: hidden;
            transition: all .4s ease 0s;
        }
    }
    &__link {
        color: #fff;
        font-size: 30px;
        opacity: 0;
        visibility: hidden;
        transition : .3s ease 0s;
        transform:scale(.5);
    }
    &--active {
        height:32px;
        border-radius:30px;
        .plus__line--v {
            height: 68px;
            top: calc(-100% - 60px);
            padding:0 5px;
            box-sizing:border-box;
            width: 220px;
            border-radius: 60px;
            left: calc(50% - 110px);
        }
        .plus__link{
            opacity:1;
            visibility:visible;
            transform:scale(1);
            transition-delay: .05s;
        }
    }
}
.action-group{
    width: 200px;
    position: relative;
    //left: 50%;
    //margin-left: -100px;
    margin-top: 15px;
}
.play-container{
    position: relative;
    top:-50px;
    //left: 50%;
    //margin-left: -16px;
    width: 32px;
    height: 44px;
    margin:0 auto;
}
.music-play-button {
    position: relative;
    z-index: 30;
    box-sizing: content-box;
    display: block;
    width: 32px;
    height: 44px;
    /* background: #fa183d; */
    border-radius: 50%;
    padding: 18px 20px 18px 28px;
}

.music-play-button:before {
    content: "";
    position: absolute;
    z-index: 0;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    display: block;
    width: 80px;
    height: 80px;
    background: #ba1f24;
    border-radius: 50%;
    animation: pulse-border 1500ms ease-out infinite;
}

.music-play-button:after {
    content: "";
    position: absolute;
    z-index: 1;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    display: block;
    width: 80px;
    height: 80px;
    background: #fa183d;
    border-radius: 50%;
    transition: all 200ms;
}

.music-play-button:hover:after {
    background-color: darken(#fa183d, 10%);
}

.music-play-button img {
    position: relative;
    z-index: 3;
    max-width: 100%;
    width: auto;
    height: auto;
}

.music-play-button span {
    display: block;
    position: relative;
    z-index: 3;
    width: 0;
    height: 0;
    border-left: 32px solid #fff;
    border-top: 22px solid transparent;
    border-bottom: 22px solid transparent;
}

@keyframes pulse-border {
    0% {
        transform: translateX(-50%) translateY(-50%) translateZ(0) scale(1);
        opacity: 1;
    }
    100% {
        transform: translateX(-50%) translateY(-50%) translateZ(0) scale(1.5);
        opacity: 0;
    }
}
.display-view-select{
    width: 200px;
    float: left;
    margin-right: 15px;
}
</style>
