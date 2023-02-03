<script>
import {Note, notes} from "./note.js"
export default {
  props: {
    show: Boolean,
    tuning: Array,
  },
  methods: {
    increment(note)
    {
      note.plus();
    },

    decrement(note)
    {
      note.minus();
    }
  }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-mask">
      <div class="modal-container">
        <div class="modal-header">
          <slot name="header">default header</slot>
        </div>

        <div class="modal-body">
          <slot name="body">

          <li class="tuning-list" v-for="item in tuning">
            <div class="tuning-item-container">
            <button class="up-down-button" @click="decrement(item)">
              <img src="../assets/arrow.svg" alt="submit" />
            </button>
              <div class="note-name">{{ item.pitch + " " + item.octave }}</div>
            <button class="up-down-button" style="transform: scaleY(-1);" @click="increment(item)">
              <img src="../assets/arrow.svg" alt="submit" />
            </button>
            </div>
          </li>

          </slot>

        </div>


        <div class="modal-footer">
          <slot name="footer">
            <button
                class="modal-default-button"
                @click="$emit('close', this.tuning)"
            >Apply</button>
          </slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  transition: opacity 0.3s ease;
}

.modal-container {
  width: 300px;
  margin: auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
}

.modal-header h3 {
  margin-top: 0;
  color: #42b983;
}

.modal-body {
  margin: 20px 0;
  left:50%;
  transform: translateX(-50%);
}

.modal-default-button {
  float: right;
}

.up-down-button {
  width: 33%;
  margin: 5px 10px;
  border-radius: 3px;

}

.tuning-list {
  list-style-type: none;
}

.tuning-item-container {
  display:flex;
  width: 80%;
}

.note-name {
  width: 33%;
  text-align: center;
  text-align-all: ;
}

/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 *
 * You can easily play with the modal transition by editing
 * these styles.
 */

.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>