# TabMaker

TabMaker is a JavaScript (Vue) application designed to generate guitar voicings for a chosen chord sequence, ensuring both playability and "musical quality".

An hosted running version of the app can be found at: https://korpsvart.github.io/TabMaker/

## Table of Contents

- [Overview](#overview)
- [Usage](#usage)
- [Build and Run the App Locally](#build-and-run-the-app-locally)
- [Dependencies](#dependencies)
- [Documentation](#documentation)

## Overview

Chord voicings are not found in a database look-up fashion but in an algorithmic way. While this increases generation time, it offers some advantages:
- the user is not constrained by stored and common positions;
- it works with custom tunings;
- it potentially works with more or less strings (not implemented yet).

## Usage

### Chord Sequence Input

The upper part of the GUI is dedicated to the selection of the chord sequence.

![GUI_upper](/img/upper.png)

For each chord, the user can specify:
- fundamental note;
- type (e.g. Major (M), Minor (m), Major seventh (maj7), Minor seventh (m7), Dominant seventh (7), ...).

Chords can also be added by clicking the "Plus" button and removed using the small crosses in the top right corners.

The "Options" button opens a pop-up menu that contains some toggle buttons for controlling the generation mechanism. The customizable options are:
- "Chords difficulty": it controls the technical complexity of the generated voicing sequence. In "Easy mode", adjacent fingers must be on the same or adjacent frets and the total stretch can't cover more than 4 frets. "Hard mode" allows for one fret stretch between two consecutive fingers (except for middle and ring finger), bringing the maximum total stretch to 5 frets;
- "Allow inversions": it allows the use of chord inversions when generating voicings (except for the first one). Inversions are allowed by default and it's recommended to use them, although it could be desirable to switch them off when chord progressions only involve simple triads.

<img src="/img/options.png" width="181" height="220">

The "Share" button copies the customized URL which embeds the current chord sequence, so that it can be shared or saved for later use without the need to re-select the entire progression from scratch.

The "Enable/Disable MIDI" button toggles the MIDI input mode for the selection of the chord sequence. When this mode is enabled, the program will listen to incoming MIDI data, apply a chord recognition algorithm and append the recognized chords at the end of the progression.

The "Submit" button starts the generation algorithm with the currently selected chord sequence.

### Sequence Playback and Visualization

The lower part of the GUI is dedicated to the visualization and playing of the generated sequence, and the tuning customization (this section appears once the "Submit" button has been clicked).

![GUI_lower](/img/lower.png)

The "Play" button starts the sequence playback: each chord is reproduced with a brief strum from the lowest string to the highest one. During the playback phase, it switches to a "Pause" button which can be used to interrupt the sound.

The "Fast forward" and "Rewind"  buttons can be used to navigate the sequence during playback.

The "Tuning" button opens a pop-up menu which allows the user to select the note for each open string: this option is useful to find voicings on customized tunings and enables expert musicians to experiment new sonorities.

<img src="/img/tuning.png" width="181" height="322">

There are two available visualization modes:
- Fretboard: chord positions and note names are shown on a guitar fretboard. As the progression is played back, voicings are displayed one after the other together with the sound;

<img src="/img/fretboard.png" width="402" height="200">

- TAB: the entire chord sequence is shown using tablature notation, which illustrates the fingering to be used on the fretboard. As the progression is played back, the current chord is highlighted in sync with the sound.

<img src="/img/tab.png" width="500" height="160">

## Build and Run the App Locally

If you whish to build or run the app in you local environment, you will need to:
- install [Node.js](https://nodejs.org/en/download)
- install the dependencies with the command ```npm install```
- either launch the app by
  - command ```npm run dev``` (development mode)
  - building the production version with ```npm run build``` and pre-viewing it locally with ```npm run preview```

## Dependencies

The applications relies mainly on three dependencies:
- Vue.js: active as the main framework;
- tonal.js: used for chord selection (chord tones database), chord recognition and computation of intervallic distance between notes;
- audiosynth.js: employed for acoustic guitar sound synthesis (to avoid the use of samples).

## Documentation

Here the main functions of the generation algorithm are listed and described.

### getVoicingSequence

This function gets as input:
- the chord sequence (fundamental notes and types).
- the "recursiveDepth", that is the maximum number of valid sequences which can be found before stopping the recursive search (for now it is set equal to 4 by default).

After, it calls "buildConstraints" and then "findVoicings".

### buildConstraints

This function sets two constraints for the generation of the voicings, based on the chord type and inversion:
- it prohibits the doubling of the third if the chord have a dominant function (the type is "dominant seventh" and there's a perfect fourth between its root and the following chord one).
- it prevents the voicing from having two perfect fourth intervals if the chord is inverted.

### findVoicings

This function finds all the possible voicings for a single chord, considering the provided constraints. It performs the following steps:
1. finds the bass position (whenever possible, among the first 5 frets and on the lowest string possible);
2. calls "recursivePositionSearch";
3. calls "sortVoicings";
4. keeps only the first 5 voicings obtained in the previous step;
5. applies the in-depth feasibility check to filter returned voicings by calling "checkFeasible";
6. if chord inversions are allowed ("allowInversions" == true), then repeats the above process using the other chord tones in bass position and adds the found voicings to the list (notes: inversions with seventh in bass position are not allowed and the first chord can not be inverted).

Finally, it calls "pickBoundedVoicingSequence" to build the best voicing sequences from the lists of voicings found for each chord of the progression.

### recursivePositionSearch

This function recursively finds valid voicings for the chord. 
At first, it performs some checks:
- voicing completeness (checks if it contains all the chord tones, with the exception of the fifth for a tetrade);
- search for more extended version of the chord (if completeness is guaranteed and there are free guitar strings left to analyze);
- barre voicing (if there are more than four fretted notes).

Then it searches for new notes by calling "findNextPositions", which finds all possible frets to be played on the next string. Each valid position is added to the current voicing and "findNextPositions" is recursively called the on the updated voicing.

### computeDistance

This function computes the distance between the previous voicing and the current one:
- for the first element of the sequence (no previous chords are present) simply returns the difference bewteen the number of strings and the length of the chord voicing.
- for the other chords, it computes the total the distance (sum of the distances between each note of the actual and previous voicings) and a "penalty factor" (which is four times the number of unused strings). Then these two factors are summed and weighted by the number of strings used iin the voicing.

The weighted result is needed to prioritize the choice of chords with a higher number of played notes.

### findNextPositions

This function returns the next candidate note positions (on the next string), based on the following principles:
- fret distance is not greater than two frets, compared to "lastPosition" fret (actually, the fret chosen for the previously examined string);
- note is different from "lastNote" (at least the note or the octave must be different);
- the distance from "minFret" is not greater than four frets (the distance from the first fret considered and the actual one must not exceed four);
- the notes belong to the chord (the tones of the chord are gathered in "chordNotes");
- special exceptional rules applies for the zero fret (open string) (WHICH ONES???????????????????).

Notice that this function does not perform a perfect check on chords playability: it only excludes the ones which are obviously not playable. The in-depth check will be done by the "checkFeasible" function.

### sortVoicings

This function sorts the possible voicings found for a chord, according to the output of "compareVoicings".

### pickBoundedVoicingSequence

This function tries to find the best sequence of voicings, based on the following criteria:
- the least distance (the output of the function "computeDistance"), to prioritize voicing sequences with the highest number of played notes whenever possible;
- the highest number of tritone resolutions (a tritone resolution is present if there is a sequence of two intervals, between two consecutive voicings, played on the same strings where a diminished fifth is followed by a major third/perfect fourth, or an augmented fourth is followed by a perfect fith/minor sixth).

To improve performance, the "recursiveDepth" variable is employed: it decides how long is the sequence of chords to consider when building the best voicing sequence. For example, if the recursiveDepth is four, there is a "sliding window" of four chords which is considered to create the sequence. Chords which come after this window are not kept into account (otherwise the algorithm would be extremely slow). However, the last chord before the window is always considered (except for the first one), in order to avoid "ugly" changes at the boundaries between two analysis windows.

### checkFeasible

This function performs a more in-depth check to determine the feasibility of a voicing by analyzing the fingering: 
- fingers can not cross;
- the minimum fret is always played with the index finger (even in situations where spontaneous fingering may not follow this principle, an alternative one which respects such rule can typically be found);
- if the "difficultMode" is disabled, no stretches between consecutive fingers are allowed (this assumption is quite restrictive since it makes many ninth chords impossible to play. However, it works well for major, minor, and seventh chords);
- if the "difficultMode" is enabled, one fret stretch between two consecutive fingers (except for middle and ring finger) is allowed.

It works recursively and it stops as soon as a feasible fingering is found.

### canApplyBarre

This function checks if the barre technique can be applied to a chord voicing. It is called when the number of fretted notes is greater than four:
- it returns true if the ???????????????????????
- it returns false otherwise (the voicing is actually judged unplayable).

A simplyfing assumption is made: barre can be applied only on the leftmost fret, with the index finger.

### compareVoicings

This function is employed to sort the possible voicings found for a chord:
- it prioritizes chords with more distinct pitch classes and, in case these are always equal, it puts first the chord with the highest overall number of notes;
- it leaves the order as it is (returns 0) if the controls performed before give a negative feedback (e.g. there are the exact same pitches and number of notes in each voicing).

### createFretboard

This function builds the fretboard data as a matrix of "note" objects: each row represents a string and each column a different fret.
