<template>
    <div class="fretboard-container" :style="rootStyle">
<!--        <label for="number_of_frets_selector">Number of frets: </label>-->
<!--        <input type="number" id="number_of_frets_selector" min="5" max="36" value="15" @change="numberOfFretsSelector">-->
        <div class="accidental_selector" @click="accidentalSelector">
            <input type="radio" class="acc_select" id="flats" name="accidentals" value="flats" checked>
            <label for="flats">♭</label>

            <input type="radio" class="acc_select" id="sharps" name="accidentals" value="sharps">
            <label for="sharps">♯</label>
        </div>
        <div class="fretboard">
            <div v-for="item in fretboard" class="string" :class="item.className">
                <div v-if="!!item.children" class="note" :note="note.noteName" v-for="note in item.children" :class="note.className">
                    <div v-if="!!note.children" v-for="mark_octave in note.children" :class="mark_octave.className"></div>
                </div>
            </div>
        </div>
    </div>

</template>

<script>

let accidentals = 'sharps';
let sharp_notes = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
let flat_notes = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

let standard_tuning = ['E', 'A', 'D', 'G', 'B', 'E'];

export default {
    name: "fretboard",
    props:{
        position:{
            type: Array,
        },
        number_of_frets:{
            type: Number,
            default: 15
        },
        number_of_strings:{
            type: Number,
            default: 6
        }
    },
    data(){
        return{
            fretboard: this.createFretboardData(),
        }
    },
    computed:{
        rootStyle(){
            return {
                '--number_of_strings': this.number_of_strings
            }
        },
    },
    watch:{
        position(){
            let me = this
            me.fretboard = this.createFretboardData()
        }
    },
    methods:{
        // returns the note names according to the accidentals type selected
        noteName(i, j, accidentals) {
            let note_type = [];
            if(accidentals === 'sharps') {
                note_type = sharp_notes;
            }
            if(accidentals === 'flats') {
                note_type = flat_notes;
            }
            let index = (j + note_type.indexOf(standard_tuning[this.number_of_strings - i - 1])) % 12;
            return note_type[index];
        },
        // changes the type of accidentals according to the selected radio button
        accidentalSelector(event) {
            if(!event.target.classList.contains('acc_select')){
                return
            }
            accidentals = event.target.value;
            this.createFretboardData();
        },
        // creates the fretboard data
        createFretboardData(){
            let me = this
            let arr = []
            let position = me.position
            // creates the strings
            for(let i = 0; i < me.number_of_strings; i++) {
                let string = {className: [],children: []}
                string.className.push('string')
                // creates frets all over the fretboard
                for(let j = 0; j <= me.number_of_frets; j++) {
                    let note = {className: [], children: []}
                    note.className.push('note')
                    note.noteName = this.noteName(i, j,  accidentals);
                    // shows the note of the found chord
                    if(position.some(chord_note => (chord_note.string === i + 1 && chord_note.fret === j))) {
                        note.className.push('chord_note');
                    }
                    // creates marks on frets 3, 5, 7 and their corresponding in the next octaves
                    if(i === 0 && j % 2 !== 0 && j % 12 !== 1 && j % 11 !== Math.floor(j / 12)) {
                        note.className.push('mark');
                    }
                    // creates the upper mark for the next octave
                    if(i === 0 && j % 12 === 0 && j !== 0) {
                        note.className.push('mark_octave_upper');
                    }
                    // creates the lower mark for the next octave
                    if(i === (me.number_of_strings - 1) && j % 12 === 0 && j !== 0) {
                        note.className.push('mark_octave_lower');
                    }
                    // put a cross mark on strings to mute
                    if( !position.some(chord_note => chord_note.string === i + 1) && j === 0) {
                        note.className.push('note_not_played');
                    }
                    // inserts in string children
                    string.children.push(note)
                }
                arr.push(string)
            }
            return arr
        },
    },
}

</script>

<style scoped lang="less">

.fretboard-container {
    display: block;
    width: 100%;
    overflow: hidden;
    height: calc( 50px * var(--number_of_strings) );
    --number_of_strings: 6;
    --string_height: 9px;
    --mark_diameter: 20px;
    --notes_diameter: 33px;
    --top_margins: 10px;
    --min_width_zero_fret: 75px;
    --dot_opacity: 0;
    --fretboard_height: calc( 50px * var(--number_of_strings) );
    --first_string_top: calc( ( var(--fretboard_height) / var(--number_of_strings) - var(--string_height) ) / 2 );
    --mark_top: calc( var(--fretboard_height) / 2 );
    --mark_octave: calc( var(--fretboard_height) / 4 );
    --animation-iteration-count: 0;
}

.fretboard {
    display: flex;
    flex-direction: column;
    width: 100%;
    //width: 100vw;
    height: var(--fretboard_height);
    position: relative;
    margin-top: var(--top_margins);
    overflow: hidden;
}
.fretboard:after {
    content: "";
    width: 100%;
    height: 800%;
    position: absolute;
    transform: rotate(90deg) translate(-50% , 0%);
    z-index: 10;
    background-image: url(@/assets/wood-pattern.png);
    background-color: #380000;
}

@keyframes vibrate {
  0% {
    transform: translateY(-1px)
  }
  50% {
    transform: translateY(1px)
  }
  100% {
    transform: translateY(-1px)
  }
}
.string {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
}
.string:before {
    content: '';
    width: 100%;
    height: var(--string_height);
    position: absolute;
    top: var(--first_string_top);
    z-index: 20;
    background: repeating-linear-gradient(-60deg, #eee, #444 5px, #eee 5px);
    box-shadow: var(--min_width_zero_fret) 4px 3px #000000;
    animation-name: vibrate;
    animation-duration: 100ms;
    animation-iteration-count: var(--animation-iteration-count);
    animation-timing-function: ease-in-out;
}

.note {
    display: flex;
    flex: 1;
    position: relative;
    border-right: 8px solid;
    border-image: linear-gradient(to left, #4d4d4d, #ededed, #4d4d4d) 1 100%;
    justify-content: center;
    align-items: center;
}
.note:first-child {
    min-width: var(--min_width_zero_fret);
    border-right: 12px solid;
    background: #000000;
    border-image: linear-gradient(to left, #bbb, #fff, #bbb) 1 100%;
    flex-grow: 0;
    flex-shrink: 0;
}
.note:before {
    font-family: Comic Sans MS, serif;
    content: attr(note);
    width: var(--notes_diameter);
    height: var(--notes_diameter);
    border-radius: 50%;
    border-style: solid;
    border-width: 1px;
    border-color: black;
    line-height: var(--notes_diameter);
    text-align: center;
    background: #8FBC8F;
    z-index: 20;
    color: #000000;
    opacity: var(--dot_opacity);
}
.note_not_played:after {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    content: "\274c"; /* use the hex value here... */
    font-size: 30px;
    color: #FFF;
    z-index: 20;
    line-height: 100px;
    text-align: center;
    transform: translate(0, -50%);
}
.chord_note:before {
    opacity: 1;
}

.mark:after, .mark_octave_upper:after, .mark_octave_lower:after {
    content: "";
    width: var(--mark_diameter);
    height: var(--mark_diameter);
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(to left, #C0C0C0, #f7f7f7, #C0C0C0);
}
.mark:after {
    top: var(--mark_top);
    transform: translate(0, -50%);
}
.mark_octave_upper:after {
  top: var(--mark_octave);
  transform: translate(0, -50%);
}
.mark_octave_lower:after {
  bottom: var(--mark_octave);
  transform: translate(0, 50%);
}

</style>
