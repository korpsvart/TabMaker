<template>
  <div class="tab-container" :style="rootStyle">
    <div class="tab">
      <div v-for="t in tab" :class="t.className">
          <div v-for="line in t.children" :class="line.className">
              {{line.txt}}
              <div v-for="space in line.children" :class="space.className">{{space.txt}}</div>
          </div>
        </div>
      </div>
    </div>
</template>

<script>

let TAB = ['T', 'A', 'B'];

export default {
  name: "tab",
  props:{
    position:{
      type: Array,
    },
    number_of_bars:{
      type: Number,
      default: 4
    },
    number_of_lines:{
      type: Number,
      default: 6
    }
  },
  data(){
    return{
      tab: this.createTabData()
    }
  },
  computed:{
    rootStyle(){
      return {
        '--number_of_lines': this.number_of_lines,
        '--number_of_bars': this.number_of_bars
      }
    }
  },
  watch:{
    position() {
      this.tab = this.createTabData()
    }
  },
  methods:{
    noteSet(chord, j) {
      let note = {className: [], children: [], txt: ''}
      note.className.push('note')
      if(chord.some(x => x.string === j + 1)) {
        let s = chord.findIndex(x => x.string === j + 1)
        note.txt += chord[s].fret
      }
      else {
        note.txt += 'X'
      }
      return note;
    },
    createTabData(){
      let me = this
      let arr = []
      let chords = me.position
      // creates the bars
      for(let i = 0; i < me.number_of_bars; i++) {
        let bar = {className: [], children: []}
        bar.className.push('bar')
        // creates a line for each string
        for(let j = 0; j <= me.number_of_lines; j++) {
          let line = {className: [], children: [], txt: ''}
          line.className.push('line')
          // creates the 'TAB' characters in the first bar
          if(i === 0) {
            for(let k = 0; k < TAB.length; k++) {
              let letter = {className: [], children: [], txt: ''}
              letter.className.push(TAB[k])
              letter.txt += TAB[k]
              bar.children.push(letter)
            }
          }
          else {
            // push a spacer in a bar
            let space = {className: [], children: []}
            space.className.push('space')
            line.children.push(space)
            // push a note in a bar
            let note = me.noteSet(chords[i-1], j)
            line.children.push(note)
          }
          // push lines in a bar
          bar.children.push(line)
        }
        arr.push(bar)
      }
      console.log(arr)
      return arr
    }
  }
}
</script>

<style scoped lang="less">

.tab-container {
  display: block;
  width: 100%;
  --number_of_lines: 6;
  --number_of_bars: 4;
  --tab_height: calc( var(--number_of_lines) * 21px );
  --bar_width: 150px;
  --bar_line_thickness: 1px;
  --line_thickness: 1px;
  --spacer_dimensions: 12px;
  --margin_note_space: 15px;
  --top_selector: 15px;
  --selector_color: #fff;
  --first_bar_width: calc( var(--bar_width) / 3 );
  --text_size: calc( var(--tab_height) / 3 );
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: sans-serif;
}

.tab {
  margin: 30px auto;
  display: flex;
  width: calc( ( var(--number_of_bars) - 1 ) * var(--bar_width) + var(--first_bar_width) );
  height: 100%;
}

.bar {
  height: var(--tab_height);
  width: var(--bar_width);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: var(--bar_line_thickness) solid;
}
.bar:first-child {
  max-width: var(--first_bar_width);
  border-left: var(--bar_line_thickness) solid;
  border-right: none;
}

.T, .A, .B {
  position: absolute;
  width: var(--text_size);
  height: var(--text_size);
  text-align: center;
  vertical-align: middle;
  line-height: var(--text_size);
  font-size: var(--text_size);
}
.A {
  margin-top: var(--text_size);
}
.B {
  margin-top: calc( 2 * var(--text_size) );
}

.line {
  height: var(--line_thickness);
  width: 100%;
  background: black;
}

.note, .space {
  display: inline-block;
  width: var(--spacer_dimensions);
  height: var(--spacer_dimensions);
  line-height: var(--spacer_dimensions);
  background: #fff;
  text-align: center;
  transform: translateY(-100%);
  margin-left: var(--margin_note_space);
}
.space {
  opacity: 0;
}
.note {
  background: var(--selector_color);
}

.selector {
  position: absolute;
  margin-left: calc( var(--margin_note_space) + 2 * var(--spacer_dimensions) );
  margin-top: calc( -1 * var(--top_selector) );
  width: calc( var(--margin_note_space) + var(--spacer_dimensions) );
  height: calc( var(--tab_height) + 2 * var(--top_selector) );
  background: var(--selector_color);
  z-index: -1;
}

</style>
