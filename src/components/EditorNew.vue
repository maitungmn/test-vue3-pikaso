<template>
  <div class="container">
    <div id="editor" ref="root"></div>
    <div class="btn-group">
      <button @click="drawerState.onErase">
        {{ !drawerState?.isDrawing ? 'Moving' : 'Eraser' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Pikaso, { PolygonModel } from 'pikaso'
import { useDrawer } from '@/hooks/useDrawer'

let editor: Pikaso
let polygon: PolygonModel
let polygon2: PolygonModel

const root = ref(undefined)
const editorRef = ref(null as Pikaso | null)

const drawerState = useDrawer(editorRef as any)

onMounted(() => {
  editor = new Pikaso({
    container: root.value
  })

  editorRef.value = editor

  editor.on('selection:change', (e) => {
    if (!e.shapes?.length) return
    drawerState.value.selectingShapes = e.shapes
  })

  polygon = editor.shapes.polygon.insert({
    x: 250,
    y: 250,
    radius: 90,
    sides: 6,
    fill: 'tomato'
  })
  polygon2 = editor.shapes.polygon.insert({
    x: 450,
    y: 450,
    radius: 90,
    sides: 6,
    fill: 'brown'
  })
})
</script>

<style>
#editor {
  width: 100%;
  height: 70vh;
  background: #ccc;
}
.btn-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
