

<script>
import {onMounted, reactive} from 'vue';
import {Chord, Midi} from "tonal";

export default {
  name: 'MidiInput',
  props:
      {
        midiEnabled: Boolean,
      },
  methods: {

  },
  setup(props, context) {
    const state = reactive({
      midiInputs: [],
      activeChord: {notes: [], onsetTime: 0},
      thresholdTime: 200, //200 ms
    });


    // MIDI input logic
    function onMIDISuccess(midiAccess) {
      const inputs = midiAccess.inputs;

      for (const input of inputs.values()) {
        input.onmidimessage = onMIDIMessageReceived;
        state.midiInputs.push(input);
      }
    }

    function onMIDIFailure(error) {
      console.log('Failed to access MIDI devices:', error);
    }

// MIDI message received callback
    function onMIDIMessageReceived(event) {
      if (props.midiEnabled){
        var message = event.data;
        var messageType = message[0] & 0xf0;

        if (messageType === 0x90) { // Note on message
          var note = message[1];
          var onsetTime = event.timeStamp; // Get the onset time of the note

          var chord = state.activeChord;
          if (chord.notes.length>0 && onsetTime - chord.onsetTime<= state.thresholdTime) {
            chord.notes.push(note);
          } else
          {
            if (chord.notes.length>2)
            {
              //if the current chord has at least 3 notes, before replacing it
              //recognize it and add it to the current list

              // Perform chord recognition on current chord
              recognizeAndAdd();
            }
            state.activeChord = {
              notes: [note],
              onsetTime: onsetTime
            };
          }

        } else if (messageType === 0x80) { // Note off message

          //same as above, in case the chord is the last in the sequence
          if (state.activeChord.notes.length>2)
          {
            //if the current chord has at least 3 notes, before replacing it
            //recognize it and add it to the current list

            // Perform chord recognition on current chord
            recognizeAndAdd();

            //reset active chord
            state.activeChord = {
              notes: [],
              onsetTime: 0
            };
          }
        }

      }
    }

    function recognizeAndAdd() {
      var recognizedChord = recognizeChordFromNotes(state.activeChord.notes);
      console.log('Chord recognized: ' + recognizedChord);
      context.emit('chordFound', recognizedChord);
    }

    function recognizeChordFromNotes(notes) {
      //The notes are sorted in order of onset time, so sort them instead by midi number
      //(same as sorting them by frequency)
      //This is to avoid weird results produced by chord detection
      notes.sort();
      let noteNames = notes.map(note => Midi.midiToNoteName(note));
      return Chord.detect(noteNames);
    }

    onMounted(() => {
      // Request MIDI access when the component is mounted
      navigator.requestMIDIAccess()
          .then(onMIDISuccess)
          .catch(onMIDIFailure);
    });

    return { state };
  }
}
</script>


<style scoped>

</style>