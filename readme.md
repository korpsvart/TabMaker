# TabMaker

TabMaker is a JavaScript (Vue) application designed to find and generate guitar chords voicings for a given chord sequence, while ensuring both playability and "musical quality".

An hosted running version of the app can be found at: ...

## Table of Contents

- [Overview](#overview)
- [Usage](#usage)
- [Build and Run the App Locally](#build-and-run-the-app-locally)
- [Documentation](#documentation)
  - [getVoicingSequence](#getvoicingsequence)
  - [buildConstraints](#buildconstraints)
  - [findVoicings](#findvoicings)
  - [recursivePositionSearch](#recursivepositionsearch)
  - [findNextPositions](#findnextpositions)
  - [sortVoicings](#sortvoicings)
  - [pickBoundedVoicingSequence](#pickboundedvoicingsequence)
  - [checkFeasible](#checkfeasible)
  - [canApplyBarre](#canapplybarre)
  - [compareVoicings](#comparevoicings)

## Overview


The voicings are not found in a database look-up fashion but in an algorithmic way. While this increases the generation time, it offers some advantages:
- not constrained by stored and common positions;
- works with alternate tunings;
- works with more or less strings (theoretically, not implemented at the moment).


## Usage

...insert screenshot of GUI, when ready.


### Chord Sequence Input

The upper part of the GUI is dedicated to the selection of the chord sequence.

UPPER GUI IMAGE

For each chord, the user can specify:
- fundamental note;
- type (e.g. Major (M), Minor (m), Major seventh (maj7), Minor seventh (m7), Dominant seventh (7)...)

Chords can also be added by clicking the "plus" button and removed using the small crosses in the top right corners.

The "options" button opens a pop-up menu that contains some toggle buttons for controlling the generation mechanism. The customizable options are:
- Chords difficulty: it controls the technical complexity of the generated voicing sequence. In "Easy mode", adjacent fingers must be on the same or adjacent frets and can not stretch over more than 4 frets. "Hard mode" allows for one fret stretch between two consecutive fingers (except for middle and ring finger), bringing the maximum total stretch to 5 frets.
- Allow inversions: it allows the use of chord inversions when generating voicings (except for the first one). Inversions are allowed by default and it's recommended to use them, although it could be desirable to switch them off when chord progressions only involve simple triads.

The "share" button copies the customized URL which embeds the current chord sequence, so that it can be shared or saved for later use without the need to re-select the entire progression from scratch.

The "Enable/Disable MIDI" button toggles the MIDI input mode for the selection of the chord sequence. When this mode is enabled, the program will listen to incoming MIDI data, apply a chord recognition algorithm and append the recognized chords at the end of the progression.

The "clear" button clears the input chord sequence, making it empty.

The "submit" button starts the generation algorithm with the currently selected chord sequence.


### Voicing Visualization

The lower part of the GUI is dedicated to the visualization and playing of the generated sequence, and the tuning customization.


## Build and Run the App Locally

If you whish to build or run the app in you local environment, you will need to:
- install [Node.js](https://nodejs.org/en/download)
- install the dependencies with the command ```npm install```
- either launch the app by
  - command ```npm run dev``` (development mode)
  - building the production version with ```npm run build``` and pre-viewing it locally with ```npm run preview```


## Documentation

To be filled, but maybe we will skip this part here (or keep it minimal).


### getVoicingSequence

### buildConstraints


### findVoicings

### recursivePositionSearch

### findNextPositions



### sortVoicings

### pickBoundedVoicingSequence


### checkFeasible


### canApplyBarre


### compareVoicings
