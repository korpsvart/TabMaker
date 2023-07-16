

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
  setup(props) {
    const state = reactive({
      midiInputs: [],
      activeChords: [],
      recognizedChords: [],
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

          var chordFound = false;
          for (var i = 0; i < state.activeChords.length; i++) {
            var chord = state.activeChords[i];
            var timeDiff = onsetTime - chord.onsetTime;

            if (timeDiff <= state.thresholdTime) { // Add the note to an existing chord
              chord.notes.push(note);
              chordFound = true;
              break;
            }
          }

          if (!chordFound) { // Create a new chord
            state.activeChords.push({
              notes: [note],
              onsetTime: onsetTime
            });
          }
        } else if (messageType === 0x80) { // Note off message
          // Do nothing?
        }

        // Perform chord recognition using the updated activeChords list
        state.recognizedChords =  recognizeChords(state.activeChords);
      }
    }



    function recognizeChords(chords) {
      // Sort the chords based on onset time
      let recognizedChords = [];
      chords.sort(function(a, b) {
        return a.onsetTime - b.onsetTime;
      });

      // Perform chord recognition on each chord
      for (var i = 0; i < chords.length; i++) {
        var chord = chords[i];
        var recognizedChord = recognizeChordFromNotes(chord.notes);
        console.log('Chord', i + 1, ':', recognizedChord);
        recognizedChords.push(recognizedChord);
      }
      return recognizedChords;
    }

    function recognizeChordFromNotes(notes) {
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