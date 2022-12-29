class Note {
    constructor(pitch, octave) {
        this.pitch = pitch;
        this.octave = octave;
    }

    equals(other) {
        //Now also returns equal for enharmonic notes

        return this.pitchEquals(other) &&
            this.octave === other.octave;
    }

    equalsIgnoreOctave(other) {
        return this.pitchEquals(other);
    }

    pitchEquals(other) {
        return this.pitch === other.pitch ||
            enharmonic[this.pitch] === enharmonic[other.pitch];
    }

}
export {Note}

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

const enharmonic = {};

//Generate enharmonics algorithmically


for (let i = 0; i < notes.length; i++) {
    let note = notes[i];
    if (note.length === 1) {
        //For sharp enharmonics
        enharmonic[note + "#"] = notes[(i + 1) % 12]; //one sharp
        enharmonic[note + "##"] = notes[(i + 2) % 12]; //two sharps
        //For flat enharmonics
        let prevIndex = (i - 1) >= 0 ? i - 1 : 11;
        enharmonic[note + "b"] = notes[prevIndex]; //one flat
        prevIndex = (prevIndex - 1) >= 0 ? prevIndex - 1 : 11;
        enharmonic[note + "bb"] = notes[prevIndex]; //two flats
        //Also include "trivial" enharmonics (same note for non-altered notes, so we can check equality more easily)
        //If we don't include this, then the pitchEquals function above won't work, because it will find "undefined"
        //for all non-altered notes and thus return true also for non equal notes (example: F and C)
        enharmonic[note] = notes[i];
    }

}

console.log("only for debug");


export {notes}
