<template>
  <div class="container">
    <div id="editor" ref="root"></div>
    <div class="btn-group">
      <button @click="onErase">{{ !isDrawing ? 'Moving' : 'Eraser' }}</button>
      <button @click="onGrouping">Group</button>
      <button @click="onUnGroup">UnGroup</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Pikaso, { PolygonModel, ShapeModel } from 'pikaso'

let editor: Pikaso
let polygon: PolygonModel

const ERASER_GROUP = 'ERASER_GROUP'

const root = ref(undefined)
const isDrawing = ref(false)
const tempGroupAllShape = ref({} as { [K: string]: any })

onMounted(() => {
  editor = new Pikaso({
    container: root.value
  })

  editor.on('selection:change', (e) => {
    console.log(e)
  })

  polygon = editor.shapes.polygon.insert({
    x: 250,
    y: 250,
    radius: 90,
    sides: 6,
    fill: 'tomato'
  })
})

const shortCut = () => ({
  board: editor.board,
  groups: editor.board.groups,
  allShapes: editor.board.shapes.filter((i) => i.type !== 'group'),
  pencil: editor.shapes.pencil,
  polygon
})

const attachGroup = (groupName = ERASER_GROUP, customShapes: ShapeModel[] = []) => {
  const { groups, allShapes } = shortCut()
  groups.attach(customShapes.length ? customShapes : allShapes, groupName)
}

const stopDrawing = () => {
  if (!isDrawing.value) return
  const { pencil } = shortCut()
  pencil?.stopDrawing()
  isDrawing.value = false
}

const onErase = (_e, groupName = ERASER_GROUP) => {
  const { groups, allShapes, pencil } = shortCut()
  isDrawing.value = !isDrawing.value
  // console.log(allShapes)

  if (isDrawing.value) {
    tempGroupAllShape.value = {
      ...tempGroupAllShape.value,
      [groupName]: allShapes.filter((i) => i.group === groupName || i.type === 'polygon')
    }
    groups.ungroup(groupName)
    pencil.draw({
      stroke: 'blue',
      strokeWidth: 15
    })
    isDrawing.value = true
  } else {
    pencil?.stopDrawing()
    attachGroup(groupName, [...tempGroupAllShape.value[groupName], allShapes[allShapes.length - 1]])
  }
}

const onGrouping = () => {
  stopDrawing()
  attachGroup()
}

const onUnGroup = () => {
  stopDrawing()
  const { groups } = shortCut()
  groups.ungroup(ERASER_GROUP)
}
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
