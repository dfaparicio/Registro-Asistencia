<template>
  <button class="boton" @click="handleClick" :disabled="disabled">
    <slot></slot>
  </button>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const props = defineProps({
  to: String,
  disabled: Boolean,
});

const emit = defineEmits(["click"]);

function handleClick(event) {
  if (props.disabled) return;
  if (props.to) {
    router.push(props.to);
  } else {
    emit("click", event);
  }
}
</script>


<style scoped>
.boton {
  background: #807257;
  color: #ffffff;
  font-size: clamp(1rem, 2.5vw, 2.5rem);
  padding: clamp(0.5rem, 1.5vw, 1.5rem) clamp(1.2rem, 3vw, 4rem);
  border-radius: 12px;
  border: none;
  cursor: pointer;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
  transition: 0.3s ease, transform 0.3s ease;
  letter-spacing: 10px;
  text-transform: uppercase;
}

.boton:hover {
  transform: translateY(-2px);
  background: #c7a154;
  box-shadow: 10px 10px 8px rgba(0, 0, 0, 1);
}

.boton:active {
  transform: translateY(1px);
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}
</style>
