<template>
  <label :for="id + '_button'" :class="{'active': modelValue}" class="toggle__button">
    <span v-if="modelValue" class="toggle__label">{{ labelEnableText }}</span>
    <span v-if="!modelValue" class="toggle__label">{{ labelDisableText }}</span>

    <input type="checkbox" :disabled="disabled" :id="id + '_button'" :checked="modelValue" @change="toggle">
    <span class="toggle__switch"></span>
  </label>
</template>

<script>

//A simple toggle button component

export default {
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    labelEnableText: {
      type: String,
      default: 'On'
    },
    labelDisableText: {
      type: String,
      default: 'Off'
    },
    id: {
      type: String,
      default: 'primary'
    },
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  methods: {
    toggle() {
      this.$emit('update:modelValue', !this.modelValue);
    }
  }
}
</script>



<style scoped>
.toggle__button {
  vertical-align: middle;
  user-select: none;
  cursor: pointer;
}
.toggle__button input[type="checkbox"] {
  opacity: 0;
  position: absolute;
  width: 1px;
  height: 1px;
}
.toggle__button .toggle__switch {
  display:inline-block;
  height:12px;
  border-radius:6px;
  width:40px;
  background: #BFCBD9;
  box-shadow: inset 0 0 1px #BFCBD9;
  position:relative;
  margin-left: 10px;
  transition: all .25s;
}

.toggle__button .toggle__switch::after,
.toggle__button .toggle__switch::before {
  content: "";
  position: absolute;
  display: block;
  height: 18px;
  width: 18px;
  border-radius: 50%;
  left: 0;
  top: -3px;
  transform: translateX(0);
  transition: all .25s cubic-bezier(.5, -.6, .5, 1.6);
}

.toggle__button .toggle__switch::after {
  background: #4D4D4D;
  box-shadow: 0 0 1px #666;
}
.toggle__button .toggle__switch::before {
  background: #4D4D4D;
  box-shadow: 0 0 0 3px rgba(0,0,0,0.1);
  opacity:0;
}

.active .toggle__switch {
  background: #adedcb;
  box-shadow: inset 0 0 1px #adedcb;
}

.active .toggle__switch::after,
.active .toggle__switch::before{
  transform:translateX(40px - 18px);
}

.active .toggle__switch::after {
  left: 23px;
  background: #53B883;
  box-shadow: 0 0 1px #53B883;
}
</style>