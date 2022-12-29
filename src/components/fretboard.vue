<template>
    <div class="container" :style="rootStyle">
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

let accidentals = 'flats';
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
            type:Number,
            default:15
        },
        number_of_strings:{
            type:Number,
            default: 6
        }
    },
    data(){
        return{
            fretboard:this.createFretboardData(),
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
        noteName(i, j, accidentals) {
            let note_type = [];
            if(accidentals==='sharps') {
                note_type = sharp_notes;
            }
            if(accidentals==='flats') {
                note_type = flat_notes;
            }
            let index = (j+note_type.indexOf(standard_tuning[this.number_of_strings-i-1]))%12;
            return note_type[index];
        },
        accidentalSelector(event) {
            if(!event.target.classList.contains('acc_select')){
                return
            }
            accidentals = event.target.value;
            this.createFretboardData();
        },
        createFretboardData(){
            let me = this
            let arr = []
            let position = me.position
            for(let i=0; i<me.number_of_strings; i++) {
                let string = {className:[],children:[]}
                string.className.push('string')
                for(let j=0; j<=me.number_of_frets; j++) {
                    let note = {className:[],children:[]}
                    note.className.push('note')
                    note.noteName = this.noteName(i, j,  accidentals);
                    if(position.some(chord_note => (chord_note.string === i + 1 && chord_note.fret === j))) {
                        note.className.push('chord_note');
                    }
                    if(i===0 && j%2!==0 && j%12!==1 && j%11!==Math.floor(j/12)) {
                        note.className.push('mark');
                    }
                    if(i===0 && j%12===0 && j!==0) {
                        let mark_octave = {className:[]}
                        mark_octave.className.push('mark_octave');
                        note.children.push(mark_octave)
                    }
                    // insert in string children
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
.container {
    --number_of_strings: 6;
    --string_height: 9px;
    --mark_diameter: 20px;
    --notes_diameter: 33px;
    --top_margins: 10px;
    --dot_opacity: 0;
    --fretboard_height: calc( 50px * var(--number_of_strings) );
    --first_string_top: calc( ( var(--fretboard_height) / var(--number_of_strings) - var(--string_height) ) / 2 );
    --mark_top: calc( var(--fretboard_height) / 2 );
    --mark_octave_top: calc( var(--fretboard_height) / 4 );
    --mark_octave_bottom: calc( var(--fretboard_height) - var(--fretboard_height) / 4 );
}

.fretboard {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 1500px;
    height: var(--fretboard_height);
    position: relative;
    margin-top: var(--top_margins);
    overflow: hidden;
}
.fretboard:after {
    content: "";
    width: 100%;
    height: 500%;
    position: absolute;
    transform: rotate(90deg);
    z-index: -1;
    background-image: url(@/assets/wood-pattern.png);
    background-color: #380000;
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
    z-index: 2;
    background: linear-gradient(#eee, #999);
    box-shadow: 76px 3px 9px #000000;
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
    min-width: 76px;
    border-right: 12px solid;
    background: #000000;
    border-image: linear-gradient(to left, #bbb, #fff, #bbb) 1 100%;
    flex-grow: 0;
    flex-shrink: 0;
}
.note:before {
    font-family: Comic Sans MS;
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
    z-index: 2;
    color: #000000;
    opacity: var(--dot_opacity);
}
.chord_note:before {
    opacity: 1;
}
.mark:after, .mark_octave:before, .mark_octave:after {
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
.mark_octave:before {
    top: var(--mark_octave_top);
    transform: translate(-130%, -50%);
}
.mark_octave:after {
    top: var(--mark_octave_bottom);
    transform: translate(-130%, -50%);
}

</style>
