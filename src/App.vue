<template>
  <div>
    <Editor />
  </div>
</template>

<script setup lang="ts">
import Editor from './components/Editor.vue'
</script>

<style>
body {
  margin: 0;
  padding: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.container {
  display: flex;
  gap: 50px;
  width: 1000px;

  button {
    width: 100px;
    height: 60px;
  }
}
</style>
