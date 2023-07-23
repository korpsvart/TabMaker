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
                <button class="btn btn-primary" @click="data.showOptions=true">Options</button>
                <Teleport to="body">
                  <!-- use the modal component, pass in the prop -->
                  <options :options=data.options :show="data.showOptions" @close="(newOptions) =>  {changeOptions(newOptions); data.showOptions = false;}">
                    <template #header>
                      <h3>Options</h3>
                    </template>
                  </options>
                </Teleport>
              <!-- Enable/Disable MIDI button -->
              <button class="btn btn-primary" @click="toggleMidiEnabled">
                {{ data.midiEnabled ? 'Disable Midi' : 'Enable Midi'}}
              </button>
              <button class="btn btn-primary" @click="clearSequence">
                Clear sequence
              </button>
                <img @click="share" class="share-btn" src="@/assets/share.svg">
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
            <Tab v-show="!isFretboardView()" :playingStatus="playingStatus" :playingPosition="data.playingPosition" :position="data.tab" v-if="data.dots.length"
            :number_of_bars="data.tab.length+1"></Tab>
        </div>
        <figure id="fretboard"></figure>
        <div id="output"></div>
    </div>
</template>
<script>
import * as Tonal from 'tonal'
import {notes} from "./components/utils/note"
import {playChord, stopChord} from "./components/utils/sound"
import FretboardEL from "./components/Fretboard.vue"
import Tab from "./components/Tablature.vue"
import Tuning from './components/Tuning.vue'
import Options from './components/Options.vue'
import * as voicingUtils from './components/utils/voicing'
import * as tuningUtils from './components/utils/tuning'
import * as midiInputUtils from './components/utils/midiInput'
import {setMIDIEnabled} from './components/utils/midiInput'
import {createFretboard, getNote} from "./components/utils/fretboardModel";

/* For debugging in webstorm: CTRL+SHIFT+CLICK on the localhost link after
npm run dev
 */

let allChords = Tonal.ChordType.symbols()
//Current implementation only support 7th chords
allChords = allChords.filter(chord => {let n = Tonal.Chord.getChord(chord, "C").notes.length; return n===3 || n===4;} );


//Only keep at most 4 notes chords

const numStrings = 6;
const numFrets = 24;
//We represent a fretboard as a matrix of Note objects


export default {
    data() {
        let data = {
            playingPosition:0,
            numStrings:6,
            numFrets:24,
            midiEnabled: false,
            tuning:tuningUtils.getStandardTuning(),
            fretboardMatrix:createFretboard(numStrings, numFrets, tuningUtils.getStandardTuning()),
            playing:false,
            notes,
            showTuning:false,
            showOptions: false,
            options: {"difficultMode": false, "allowInversions": true},
            allChords,
            chordsSelect: [{name: 'm7', note: 'D'}, {name: '7', note: 'G'}, {name: 'maj7', note: 'C'}],
            voicingSequence: null,
            dots: [],
            tab:[],
            //Recursive depth bounds the max amount of previous chords
            //Which are considered when picking the best sequence
            //Increasing this number could lead to better sequences but also drastically worsens performances.
            //Furthermore, it's unlikely that values above 4 will lead to any change in the resulting voicing
            recursiveDepth: 4,
            backupDots:[],
            displayView:'Fretboard',
            displayViewOptions:['Fretboard','Tab'],
        }
        return {data}
    },
    components: {
        FretboardEL,
        Tab,
        Tuning,
        Options
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
        midiInputUtils.activateMIDI(recChord => this.addChordFromMidi(recChord));
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
        toggleMidiEnabled() {
          this.data.midiEnabled = !this.data.midiEnabled;
          setMIDIEnabled(this.data.midiEnabled);
        },
        clearSequence() {
          this.data.chordsSelect = [];
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
        addChord() {
            let me = this
            me.data.chordsSelect.push({name: 'm7', note: 'D'})
        },
        addChordFromMidi(recognizedChord) {
          let chordObj = Tonal.Chord.get(recognizedChord[0]);
          this.data.chordsSelect.push({name: chordObj.aliases[0], note: chordObj.tonic});
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

      changeOptions(newOptions) {
        //Not so efficient, just for a quick implementation
        let me = this
        me.data.options = newOptions;
      },
        submit() {
            let me = this
            me.stop()
            let data = me.data
            let chordArray = data.chordsSelect.map((v) => {
                return Tonal.Chord.getChord(v.name, v.note, v.note)
            })
            me.voicingSequence = voicingUtils.getVoicingSequence(chordArray, data.fretboardMatrix, data.numFrets,data.options.allowInversions, data.recursiveDepth);
            console.log(me.voicingSequence);


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
              me.voicingSequence = voicingUtils.getVoicingSequence(chordArray, data.fretboardMatrix, data.numFrets, data.options.allowInversions, data.recursiveDepth).sequence;
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
                    foundNotes.push(getNote(me.voicingSequence[k][i], this.data.fretboardMatrix));
                }
                await playChord(foundNotes, me.voicingSequence[k],id);
            }
            if(data.playing&&data.playingID===id){
                me.stop()
            }
        },


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
