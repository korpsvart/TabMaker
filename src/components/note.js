class Note {
    constructor(pitch, octave) {
        this.pitch = pitch;
        this.octave = octave;
    }

    equals(other) {
        return this.pitch === other.pitch &&
            this.octave === other.octave;
    }

    equalsIgnoreOctave(other) {
        return this.pitch === other.pitch;
    }

}
export {Note}

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

export {notes}
