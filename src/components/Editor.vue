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
import Pikaso, { PolygonModel, ShapeModel, type Group, type ShapeConfig } from 'pikaso'

let editor: Pikaso
let polygon: PolygonModel
let polygon2: PolygonModel

const ERASER_GROUP = 'ERASER_GROUP'

const root = ref(undefined)
const isDrawing = ref(false)
const tempGroupAllShape = ref({} as { [K: string]: any })
const selectingShapes = ref([] as ShapeModel<Group | any, ShapeConfig>[] | undefined)
const currentStartEraseIndex = ref(0)

onMounted(() => {
  editor = new Pikaso({
    container: root.value
  })

  editor.on('selection:change', (e) => {
    selectingShapes.value = e.shapes
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

const shortCut = () => ({
  board: editor.board,
  groups: editor.board.groups,
  allShapes: editor.board.shapes.filter((i) => i.type !== 'group'),
  pencil: editor.shapes.pencil,
  polygon,
  polygon2
})

const createGroupName = (groupName = '', id = '') => `${groupName}_${id}`

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

const onErase = (_e: unknown, groupName = ERASER_GROUP) => {
  const selectedShape = selectingShapes.value?.[0]
  if (!selectedShape) {
    stopDrawing()
    return
  }
  const selectedShapeId = selectedShape.node._id

  selectedShape.node.draggable(false)

  const selectedGroupName =
    selectedShape.type === 'group' && selectedShape.name
      ? selectedShape.name
      : createGroupName(groupName, selectedShapeId)

  const { groups, allShapes, pencil } = shortCut()
  isDrawing.value = !isDrawing.value

  if (isDrawing.value) {
    const selectedGroups = allShapes.filter(
      (i) => i.group === selectedGroupName || i.node._id === selectedShapeId
    )

    tempGroupAllShape.value = {
      ...tempGroupAllShape.value,
      [selectedGroupName]: selectedGroups
    }
    groups.ungroup(selectedGroupName)
    selectingShapes.value = selectedGroups
    currentStartEraseIndex.value = allShapes.length - 1

    pencil.draw({
      stroke: 'blue',
      strokeWidth: 15
    })
    isDrawing.value = true
  } else {
    pencil?.stopDrawing()

    const newLines = [] as typeof allShapes
    let countingShapeIndex = allShapes.length - 1
    while (countingShapeIndex > currentStartEraseIndex.value) {
      newLines.push(allShapes[countingShapeIndex])
      countingShapeIndex--
    }

    attachGroup(selectedGroupName, [...((selectingShapes.value || []) as any), ...newLines])
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
