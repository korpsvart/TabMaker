<template>
    <div class="app-container" :style="rootStyle">
        <notifications position="top right">
            <template #body="props">
                <div class="my-notification">
                    <div :class="[props.item.title]" class="alert d-flex align-items-center" role="alert">
                        <p>{{ props.item.text }}</p>
                    </div>
                </div>
            </template>
        </notifications>
        <div class="card submit-container" >
            <div class="chords-container overflow-x-scroll">
                <div class="chords-container-sub clearfix">
                    <div v-for="(chord,index) in data.chordsSelect" class="chord-select-container" :class="chordHighlightClass(index)">
                        <img @click="deleteChord(index)" class="chord-delete" src="@/assets/close.svg">
                        <h5 >Chord {{index+1}}</h5>
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
                <img @click="share" class="share-btn" src="@/assets/share.svg">
                <!--            <button class="btn btn-info" @click="midi">enable midi</button>-->
            </div>
        </div>
        <div class="fretboard-figure-container card" v-show="data.dots&&data.dots.length">
            <div class="control">
                <div class="music-control-container clearfix">
                    <div class="play-container" @click="play" v-if="!data.playing">
                        <a class="music-play-button" href="#">
                            <span></span>
                        </a>
                    </div>
                    <div class="pause-container" @click="pause">
                        <div class="music-pause-line"></div>
                        <div class="music-pause-line-2"></div>
                    </div>
                    <div class="skip-forward" @click="skip(true)">
                        <img class="skip-forward-btn" src="@/assets/skip-forward.svg"/>
                    </div>
                    <div class="skip-back" @click="skip(false)">
                        <img class="skip-back-btn" src="@/assets/skip-forward.svg"/>
                    </div>
                </div>
                <div class="input-group mb-3 display-view-select">
                    <div class="input-group-prepend">
                        <label class="input-group-text" for="note-select">View</label>
                    </div>
                    <select name="note-select" v-model="data.displayView" class="custom-select">
                        <option :value="item" v-for="item in data.displayViewOptions">{{ item }}</option>
                    </select>
                </div>
                <button class="btn btn-primary tuning" @click="data.showTuning = true">Tuning</button>
                <Teleport to="body">
                  <!-- use the modal component, pass in the prop -->
                  <tuning :tuning=data.tuning :show="data.showTuning" @close="(newTuning) =>  {changeTuning(newTuning); data.showTuning = false;}">
                    <template #header>
                      <h3>Change tuning</h3>
                    </template>
                  </tuning>
                </Teleport>
            </div>
            <FretboardEL v-show="isFretboardView()" :position="data.dots" :standard_tuning="this.data.tuning.map(x => x.pitch).reverse()">

            </FretboardEL>
            <Tab v-show="!isFretboardView()" :playingStatus="playingStatus" :playingPosition="data.playingPosition" :position="data.tab" v-if="data.dots.length"></Tab>
        </div>
        <figure id="fretboard"></figure>
        <div id="output"></div>
    </div>
</template>
<script>
import * as Tonal from 'tonal'
import {Note, notes} from "./components/note"
import {enableMidi} from "./components/midi"
import {playChord, stopChord} from "./components/sound"
import FretboardEL from "./components/fretboard.vue"
import Tab from "./components/tablature.vue"
import Tuning from './components/tuning.vue'

/* For debugging in webstorm: CTRL+SHIFT+CLICK on the localhost link after
npm run dev
 */

let allChords = Tonal.ChordType.symbols()

// let tuning = [new Note('E', 4),
//     new Note('B', 3),
//     new Note('G', 3),
//     new Note('D', 3),
//     new Note('A', 2),
//     new Note('E', 2)];
const numStrings = 6;
const numFrets = 24;
//We represent a fretboard as a matrix of Note objects
//let fretboardMatrix = createFretboard(numStrings, numFrets, tuning);

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


function filterVoicings(voicings, chord, nextChord) {

  //If the chord has dominant function, then we should not double the leading tone
  if (chord.type === 'dominant seventh' && Tonal.Interval.distance(chord.notes[0], nextChord.notes[0])==='P5')
  {
    for (let i = 0; i < voicings.length; i++) {

    }
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

function checkFeasibleIntermediate(voicing, availableFingers, usedFingers)
{

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

function posEqual(pos1, pos2) {

  return pos1.string === pos2.string && pos1.fret === pos2.fret;

}

function checkFeasible(voicing) {
  //A more in-depth check to see if a voicing is actually feasible,
  //taking into account the fingering

  //The idea is as follows:
  //1) Fingers cannot cross
  //2) We will always play the min fret using index finger
  // (this is a fair assumption, as in most cases were some "spontaneous" fingering may not follow this rule,
  // we can still find an alternative feasible fingering which does follow this rule)
  //3) Fret distance between fingers cannot be higher than "finger distance"
  //(This is a more restrictive assumption. It works fairly well with major, minor and 7th chords but it makes
  //many 9 chords impossible to play, since they naturally require at least a stretch of 2 frets for two consecutive
  //fingers.
  //TODO (difficult, mid priority): relax this assumption by allowing (in some contexts) a stretch of 2 frets


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
  let minFret = getMinFret(voicingLocal);
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
        if (checkFeasibleIntermediate(voicingLocal, availableFingersTmp, usedFingersTmp)) return true;
      }
    }
    //If no next finger led to a feasible fingering position
    //(Or there were no more fingers available)
    // then the chord is not feasible
    return false;


}

function countFrettedNotes(positions) {
  return positions.reduce((x, y) => {
    return y.fret !== 0 ? x + 1 : x;
  }, 0);
}

function computeOverlap(previousVoicing, currentVoicing) {
    //Compute number of common tones for two voicings
    if (previousVoicing === null) return 0;
    return previousVoicing.filter(x => currentVoicing.some(y => y.fret === x.fret && y.string === x.string)).length;
}

function computeStepRes(previousVoicing, currentVoicing) {
  //Only on same string
  if (previousVoicing == null) return 0;
  let count = 0;
  for (let i = 0; i < previousVoicing.length; i++) {
    let pos = previousVoicing[i];
    if (currentVoicing.filter(x => x.string === pos.string && Math.abs(x.fret - pos.fret) === 1).length > 0)
      count++;
  }
  return count;
}

function computeDistance(previousVoicing, currentVoicing) {
  if (previousVoicing == null) return 0;
  let distance = 0;
  let totalStringsUsed = 0;

  for (let i = 0; i < 6; i++) {
    let pos1= currentVoicing.find(x => x.string === i);
    let pos2 = previousVoicing.find(x => x.string === i);
    if ((pos1!==undefined && pos2 === undefined) ||
        (pos1===undefined && pos2 !== undefined))
    {
      //When one string appears in only one of the chord, I count it as distance 4
      //This is to avoid prioritizing chords with less notes
      distance+=4;
      totalStringsUsed++;
    }
    else if (pos1!== undefined && pos2!== undefined) {
      distance = distance + Math.abs(pos1.fret - pos2.fret);
      totalStringsUsed++;
    }
  }

  // for (let i = 0; i < previousVoicing.length; i++) {
  //   let sameStringPos = currentVoicing.filter(x => x.string === previousVoicing[i].string);
  //   if (sameStringPos && sameStringPos.length > 0) {
  //     sameStringPos = sameStringPos[0];
  //     distance = distance + Math.abs(sameStringPos.fret - previousVoicing[i].fret);
  //   } else {
  //     //When one string appears in only one of the chord, I count it as distance 1
  //     //This is to avoid prioritizing chords with less notes
  //     distance = distance + 1;
  //   }
  // }

  //Weigh the distance over the total number of strings used
  //This is used, again, to prevent the algorithm from choosing chords with less notes
  return distance/totalStringsUsed;
}

function buildConstraints(chord, nextChord) {

  let constraint = {'dominant': false};

  if (nextChord == null) return constraint;

  if (chord.type === 'dominant seventh' && Tonal.Interval.distance(chord.notes[0], nextChord.notes[0])==='4P')
  {
    constraint.dominant = true; //chord has dominant function
  }

  return constraint;

}

function addInversionConstraints(constraints, chord, inversion) {

  //Assume constraints was already initialized

  constraints.noDoubleP4 = inversion === 2 || inversion === 1;

  return constraints;
}




export default {
    data() {
        let data = {
            playingPosition:0,
            tuning:[new Note('E', 4),
              new Note('B', 3),
              new Note('G', 3),
              new Note('D', 3),
              new Note('A', 2),
              new Note('E', 2)],
            fretboardMatrix:createFretboard(numStrings, numFrets, [new Note('E', 4),
                new Note('B', 3),
                new Note('G', 3),
                new Note('D', 3),
                new Note('A', 2),
                new Note('E', 2)]),
            playing:false,
            notes,
            showTuning:false,
            allChords,
            chordsSelect: [{name: 'm7', note: 'D'}, {name: '7', note: 'G'}, {name: 'maj7', note: 'C'}],
            voicingSequence: null,
            dots: [],
            tab:[],
            backupDots:[],
            displayView:'Fretboard',
            displayViewOptions:['Fretboard','Tab'],
        }
        return {data}
    },
    components: {
        FretboardEL,
        Tab,
        Tuning
    },
    mounted() {
        let me = this;
        // read url info
        let search = location.search.split('=')[1]
        if(search){
           // set chord select
            let passedData;
            try{
                passedData = JSON.parse(decodeURIComponent(search))
            }catch (err){
                console.log(err)
            }
            if(passedData){
                me.data.chordsSelect = passedData
            }
        }
        me.genURL()
        $('[data-toggle="popover"]').popover()
    },
    watch:{
        'data.chordsSelect':{
            handler() {
                let me = this
                me.genURL()
            },
            deep: true
        }
    },
    computed:{
        playingStatus(){
            let me = this
            let data = me.data
            if(data.playing) return 'playing'
            if(data.pause) return 'pausing'
            if(!data.pause&&!data.playing) return 'stop'
        },
        rootStyle(){
            return {
                '--number_of_chords': this.data.chordsSelect.length
            }
        },
    },
    methods: {
        // type: success, warning, danger
        notify(txt,type='success'){
            let map = {
                success:'alert-success',
                warning:'alert-warning',
                danger:'alert-danger'
            }
            let me = this;
            me.$notify({
                // trick: just wrap title as class to template
                title:map[type],
                text: txt,
            });
        },
        genURL(){
            let me = this
            let arrStr = encodeURIComponent(JSON.stringify(me.data.chordsSelect))
            window.history.replaceState('', '', location.origin + location.pathname + `?chords=${arrStr}`);
        },
        share(){
            let text = 'URL copied to clipboard';
            let me = this
            navigator.clipboard.writeText(location.href).then(function() {
                me.notify(text)
            }, function(err) {
                console.error('Async: Could not copy text: ', err);
            });
        },
        deleteChord(index){
            let me = this;
            me.data.chordsSelect.splice(index,1)
        },
        chordHighlightClass(chordIndex){
            let me = this
            if(me.playingStatus==='stop')return
            if(me.data.playingPosition===chordIndex)return {'highlight':true}
        },
        isFretboardView(){
            return this.data.displayView ==='Fretboard'
        },
        openTuningDialog(){

        },
        addChord() {
            let me = this
            me.data.chordsSelect.push({name: 'm7', note: 'D'})
        },
        midi() {
            enableMidi();
        },
        changeTuning(newTuning) {
          //Not so efficient, just for a quick implementation
          let me = this
          me.data.tuning = newTuning;
          me.data.fretboardMatrix = createFretboard(numStrings, numFrets, me.data.tuning);
          if (me.voicingSequence !== null)
          {
            //Regenerate voicing sequence
            me.submit();
          }

        },

      propsToPass() {
        let result = ['E', 'A', 'D', 'G', 'B', 'E'];

        if (this.data.tuning) {
          result = this.data.tuning.map(note => note.pitch);
        }

        return result;
      },
        submit() {
            let me = this
            me.stop()
            let data = me.data
            let chordArray = data.chordsSelect.map((v) => {
                return Tonal.Chord.getChord(v.name, v.note, v.note)
            })
            me.voicingSequence = this.getVoicingSequence(chordArray).sequence;

            function firstVoicing() {
                data.dots = me.voicingSequence[0].map(x => {
                    return {'string': x['string'] + 1, 'fret': x['fret']}
              })
            }
            firstVoicing();
            data.backupDots = [...me.data.dots]
            // gen array for tab view
            data.tab = me.voicingSequence.map((chord)=>{
                return chord.map(note=>{
                    return {'string': note['string'] + 1, 'fret': note['fret']}
                })
            })
        },
        skip(forward=false){
            let me = this
            let data = me.data
            let index = data.playingPosition
            let len = data.tab.length
            if(forward){
                index+=1
            }
            else {
                index-=1
            }
            // range loop
            if(index<0){
                index+=len
            }
            if(index+1>len){
                index-=len
            }
            if(me.playingStatus!=='stop'){
                me.stop()
            }
            data.playingPosition = index
            me.play()
        },
        pause(){
            let me = this
            me.data.playing = false
            me.data.pause = true
            // stop the playing sound
            stopChord()
        },
        stop(){
            let me = this
            // set stop status
            me.data.playing = false
            me.data.pause = false
            // stop the playing sound
            stopChord()
            me.data.playingPosition = 0
            // reset fretboard view
            // me.data.dots = me.data.backupDots
        },
        async play() {
            let id = Math.random()
            let me = this
            let data = me.data
            data.playingID = id
            let chordArray = data.chordsSelect.map((v) => {
                return Tonal.Chord.getChord(v.name, v.note)
            })
            if(data.playing){return}
            data.playing = true;
            data.pause = false;
            //Generate voicing sequence if it wasn't already
            if (me.voicingSequence===null)
              me.voicingSequence = this.getVoicingSequence(chordArray).sequence;
            for(let k = me.data.playingPosition||0; k < me.voicingSequence.length; k++) {
                if(!data.playing||data.playingID!==id){
                    return
                }
                data.playingPosition = k;
                data.dots = me.voicingSequence[k].map(x => {
                    return {'string': x['string'] + 1, 'fret': x['fret']}
                });
                let foundNotes = [];
                for (let i = 0; i < me.voicingSequence[k].length; i++) {
                    foundNotes.push(this.getNote(me.voicingSequence[k][i]));
                }
                await playChord(foundNotes, me.voicingSequence[k],id);
            }
            if(data.playing&&data.playingID===id){
                me.stop()
            }
        },

      getVoicingSequence(chords, allowInversions = true) {

  let chordsVoicings = [];

  //I added support for constraints but we are not using them now
  for (let i = 0; i < chords.length; i++) {
    let constraints = null;
    let inversion = 0;
    if (i < chords.length-1)
    {
      constraints = buildConstraints(chords[i], chords[i+1]);
    } else {
      constraints = buildConstraints(chords[i], null)
    }
    let chordVoicings = this.findVoicings(chords[i], this.data.fretboardMatrix, 0, constraints);
    this.sortVoicings(chordVoicings); //Sort voicings from highest to lowest priority
    //Uncomment next line to keep only the first n voicings in case the algorithm is really slow
    //(which might happen for 6 or more chords sequences. But it's not so common after implementation of
    //the in-depth feasibility check)
    chordVoicings = chordVoicings.slice(0, 5);

    //if inversions are allowed, add them
    if (allowInversions && i > 0) {
      for (inversion = 1; inversion < 3; inversion++) {
        constraints = addInversionConstraints(constraints, chords[i], inversion);
        let chordVoicingsInverted = this.findVoicings(chords[i], this.data.fretboardMatrix, inversion, constraints);
        this.sortVoicings(chordVoicingsInverted);
        chordVoicingsInverted = chordVoicingsInverted.slice(0, 5);
        chordVoicingsInverted = chordVoicingsInverted.filter(voicing => checkFeasible(voicing));
        chordVoicings = chordVoicings.concat(chordVoicingsInverted);
      }
    }


    //In-depth feasibility check (considering fingering)
    chordVoicings = chordVoicings.filter(voicing => checkFeasible(voicing));

    chordsVoicings.push({'chord': chords[i], 'voicings': chordVoicings});
  }
  let bestSequence = this.pickBestVoicingSequence(chordsVoicings, null, 0);

  return bestSequence;

},


      getNote(position, chordNotes=null) {
  //Return the note corresponding to a given position on the fretboard

  //Optional parameter chord is used because sometimes we want the returned note as
  //it would appear inside a given chord, and getNote on its own may return a different but
  //enhamornically equivalent note


  let note = this.data.fretboardMatrix[position.string][position.fret];
  if (chordNotes===null) return note;

  if (chordNotes.find(x => x === note.pitch)!==undefined)
  {
    return note;
  } else
  {
    //Find the correct enharmonic note that fits in the chord
    for (let i = 0; i < chordNotes.length; i++) {
      if (note.equalsIgnoreOctave(new Note(chordNotes[i], null)))
        return new Note(chordNotes[i], note.octave);
    }

    //As a last check, if someone passes a note which is not contained inside chord notes
    //here we return that note
    return note;
  }
},
      recursivePositionSearch(previousPositions, lastNote, chordNotes, validPositions, constraints) {
  //Recursively find valid positions for a chord
  //Check if this voicing is acceptable
  //1) Only check if we have at least 3 notes (otherwise we don't consider it a chord yet)
  let lastPosition = previousPositions[previousPositions.length-1];
  if (previousPositions.length > 2) {
    //2) Check if it contains the necessary chord tones
    //(If it doesn't do not skip yet, unless we've already reached the last string)
    if (this.containsChordTones(previousPositions, this.data.fretboardMatrix, chordNotes)) {
      const frettedNotes = countFrettedNotes(previousPositions);
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
    let nextPositions = this.findNextPositions(previousPositions, lastNote, chordNotes, constraints);
    //Find all possible valid voicings with more notes
    for (let i in nextPositions) {
      let nextPosition = nextPositions[i];
      //Update minFret if necessary (never update minFret if new fret is zero)
      //Also skip comparison for zero frets
      let newPositions = previousPositions.slice();
      newPositions.push(nextPosition); //add the new element
      //Again I use splice to create shallow copy, otherwise we will add other voicings together
      this.recursivePositionSearch(newPositions, this.getNote(nextPosition, chordNotes), chordNotes, validPositions, constraints);
    }
  }
},

      getDistinctPitchesFromVoicing(voicing) {
  let voicingPitches = voicing.map(x => this.getNote(x).pitch);
  return new Set(voicingPitches);
},

      findVoicings(chord, fretboard, inversion = 0, constraints) {
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
  let bassNote = this.getNote(bassPos[0]);

  let chordVoicings = []; //will be filled with all the voicings for the complete chord
  //This will be a list of objects of the form
  //{'positions': [list of positions], 'isBarre': bool}

  let chordNotes = chord.notes.map(x => x.toString());

  this.recursivePositionSearch(bassPos, bassNote, chordNotes, chordVoicings, constraints);

  return chordVoicings;

},



// e.g chordNotes = [ 'C', 'E', 'G' ]
// e.g positions = [ {5,3} , {4,2} , {3,0} ]
      containsChordTones(positions, fretboard, chordNotes) {

  /* If this is a check to only accept 3 or more notes chord, I think this should be done somewhere else */
  // if ( chordNotes.length < 3 ) {
  //   return false;
  // }

  //Set of the notes which have been found during positions research
  let notesFound = [];
  for (let i = 0; i < positions.length; i++) {
    notesFound.push(this.getNote(positions[i]));
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
},

      findPositionsOnString(previousPositions, lastNote, minFret, chordNotes, constraints) {

  //Need to do some fixes on minFret (minFret should never be 0)
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

    if (constraints.noDoubleP4 && this.findIntervals(previousPositions, chordNotes).find(x => x.interval === '4P')!==undefined)
    {
      chordNotes = chordNotes.filter(note => Tonal.Interval.distance(lastNote.pitch, note)!=='4P')


    }


    if (constraints.dominant && previousPositions.filter(x => this.getNote(x).pitch === chordNotes[1]).length > 0)
    {
      chordNotes.splice(1, 1); //avoid doubling the third of a dominant function chord (it's the 7th)
    }


  }
  let pos = {'string': string, 'fret': 0};
  let posNote = this.getNote(pos);
  //Check if it's part of chord notes and it's not equal to lastNote (both in pitch class and octave)
  if (chordNotes.some(x => posNote.equalsIgnoreOctave(new Note(x, 0))) && !posNote.equals(lastNote)) positions.push(pos);
  for (let j = startIndex; j <= stopIndex; j++) {
    pos = {'string': string, 'fret': j};
    posNote = this.getNote(pos);
    if (chordNotes.some(x => posNote.equalsIgnoreOctave(new Note(x, 0))) && !posNote.equals(lastNote)) positions.push(pos);
  }
  return positions;
},

      findInterval(pos1, pos2, chordNotes) {
  return Tonal.Interval.distance(this.getNote(pos1, chordNotes).pitch+this.getNote(pos1, chordNotes).octave,
      this.getNote(pos2, chordNotes).pitch + this.getNote(pos2, chordNotes).octave);
},

      sortVoicings(voicings) {
  //Sort voicings from the "best" to the worst based on some principles
  //This is useful because when building a voicing sequence the voicings are analyzed
  //in the list from first to last, and in case of equal properties the first one wins.

  voicings.sort((x, y) => this.compareVoicings(y, x));


},


      compareVoicings(voicingA, voicingB) {

  //Compare function for voicings sorting

  //More distinct pitch classes wins
  let distinctPitchesA = this.getDistinctPitchesFromVoicing(voicingA)
  let distinctPitchesB = this.getDistinctPitchesFromVoicing(voicingB);
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



},
      findNextPositions(positions, lastNote, chordNotes, constraints) {
  //TODO

  //Return the next candidate positions, based on three principles
  //1) fret distance is not > 2 frets compared to lastPosition fret
  //2) note is different from lastNote (check both note and octave)
  //3) distance from min fret is not > 4 frets
  //4)Notes belong to the chord (chordNotes)
  //5)Special exceptional rules applies for the 0 fret
  let minFret = getMinFret(positions);
  return this.findPositionsOnString(positions, lastNote, minFret, chordNotes, constraints);

},


      findIntervals(voicing, chordNotes) {
  let intervals = [];
  for (let i = 0; i < voicing.length-1; i++) {
    let string1 = voicing[i].string;
    let string2 = voicing[i+1].string;
    let interval = this.findInterval(voicing[i], voicing[i+1], chordNotes);
    intervals.push({'string1': string1, 'string2': string2, 'interval': interval});
  }
  return intervals;
},



      countTritonesResolutions(voicing1, voicing2, chord1, chord2) {
  if (voicing1===null) return 0;
  let intervals1 = this.findIntervals(voicing1, chord1.notes);
  let intervals2 = this.findIntervals(voicing2, chord2.notes);

  let tritoneRes = 0;

  for (let i = 0; i < intervals1.length; i++) {
    let interval1 = intervals1[i];
    let interval2 = intervals2.find(interv => interv.string1 === interval1.string1 && interv.string2 === interval1.string2);
    if (interval2!==undefined)
    {
      //let condition = interval1.interval ==='4A' || interval1.interval === '5d';
      // let fretDiff1 = Math.abs(voicing1.find(pos => pos.string === interval1.string1).fret -
      //                 voicing2.find(pos => pos.string === interval1.string1).fret);
      // let fretDiff2 = Math.abs(voicing1.find(pos => pos.string === interval1.string2).fret -
      //     voicing2.find(pos => pos.string === interval1.string2).fret);
      // condition = condition && (fretDiff1 ===1) && (fretDiff2 ===1);

      //
      //
      let condition = interval1.interval==='5d' && (interval2.interval ==='3M' || interval2.interval==='4P') ||
          interval1.interval==='4A' && (interval2.interval ==='5P' || interval2.interval==='6m');

      if (condition) tritoneRes++;
    }
  }


  //return 0; //to deactivate the function use this
  return tritoneRes;

},

 pickBestVoicingSequence(chordsVoicings, previousVoicing, i, previousChord) {

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
    let tritoneRes = this.countTritonesResolutions(previousVoicing, currentVoicings[j], previousChord, currentChord);
    let distance = computeDistance(previousVoicing, currentVoicings[j]);
    if (i < chordsVoicings.length - 1) {
      let recursiveResult = this.pickBestVoicingSequence(chordsVoicings, currentVoicings[j], i + 1, currentChord);
      distance = distance + recursiveResult.distance;
      tritoneRes = tritoneRes + recursiveResult.tritoneRes;
      if (tritoneRes > maxTritoneRes) {
        maxTritoneRes = tritoneRes;
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
    margin-top: 60px;
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
    padding: 20px 0;
    .chords-container-sub{
        position: relative;
        width: calc( 300px * var(--number_of_chords) + 110px );
    }
    .chord-select-container{
        padding:15px 25px;
        margin: 0 15px;
        float: left;
        width: 250px;
        border:1px solid #ced4da;
        border-radius: 5px;
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
    margin:15px;
    margin-top:0;
}
.music-control-container{
    position: absolute;
    width: 80px;
    height: 80px;
    left:50%;
    margin-left: -40px;
}
.play-container{
    position: relative;
    top:-50px;
    //left: 50%;
    //margin-left: -16px;

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
@stop-container-width:80px;
@stop-width:30px;
@stop-margin:-15px;
.pause-container{
    position: absolute;
    left:0;
    cursor: pointer;
    top:-50px;
    float: left;
    width: @stop-container-width;
    height: @stop-container-width;
    border-radius: 50%;
    background: #000;
    z-index: 10;
    &:hover{
        opacity: .8;
    }
}
.music-pause-line{
    position: absolute;
    top:50%;
    margin-top:-17.5px;
    left:25px;
    background: #fff;
    width: 10px;
    height: 35px;
}
.music-pause-line-2{
    position: absolute;
    top:50%;
    margin-top:-17.5px;
    right: 25px;
    background: #fff;
    width: 10px;
    height: 35px;
}
.chord-select-container.highlight{
    border: 1px solid #ffe581;
    background: #ffe581;
}
.chord-delete{
    width: 20px;
    height: 20px;
    position: absolute;
    right: 10px;
    top:10px;
    &:hover{
        cursor: pointer;
    }
}
.share-btn{
    position: relative;
    top:5px;
    margin-left: 15px;
    cursor: pointer;
    width: 30px;
    height: 30px;
}
.skip-forward{
    cursor: pointer;
    position: absolute;
    top:-40px;
    right: -70px;
}
.skip-forward-btn,.skip-back-btn{
    position: relative;
    width: 50px;
    height: 50px;
    color:red;
}
.skip-back{
    cursor: pointer;
    position: absolute;
    top:-40px;
    left: -70px;
    .skip-back-btn{
        rotate: 180deg;
    }
}
</style>
