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
import { ref, onMounted, reactive, watch } from 'vue'
import Pikaso, { PolygonModel, ShapeModel, type Group, type ShapeConfig } from 'pikaso'

let editor: Pikaso
let polygon: PolygonModel
let polygon2: PolygonModel

const ERASER_GROUP = 'ERASER_GROUP'
const EVENT_NAMES = {
  MOUSEDOWN_TOUCHSTART: 'mousedown touchstart',
  MOUSEUP_TOUCHEND: 'mouseup touchend',
  MOUSEMOVE: 'mousemove touchmove'
}

const root = ref(undefined)
const isDrawing = ref(false)
const isDragging = ref(false)
const tempGroupAllShape = ref({} as { [K: string]: any })
const selectingShapes = ref([] as ShapeModel<Group | any, ShapeConfig>[] | undefined)
const selectingShape = reactive({
  id: null,
  groupName: '',
  currentStartEraseIndex: 0
})

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
  stage: editor.board.stage,
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

const onDrawing = () => {
  if (!selectingShape.groupName || typeof selectingShape.id !== 'number') return

  const { stage, groups, allShapes, pencil } = shortCut()

  const selectedGroups = allShapes.filter(
    (i) => i.group === selectingShape.groupName || i.node._id === selectingShape.id
  )

  // tempGroupAllShape.value = {
  //   ...tempGroupAllShape.value,
  //   [selectingShape.groupName]: selectedGroups
  // }
  groups.ungroup(selectingShape.groupName)
  selectingShapes.value = selectedGroups
  selectingShape.currentStartEraseIndex = allShapes.length - 1

  pencil.draw({
    stroke: 'blue',
    strokeWidth: 15
  })
  // isDrawing.value = true

  // stage.on(EVENT_NAMES.MOUSEDOWN_TOUCHSTART, () => (isDragging.value = true))
  // stage.on(EVENT_NAMES.MOUSEMOVE, (e) => {
  //   if (isDragging.value && e.target._id === selectedShapeId) {
  //     console.log(111)
  //     pencil.draw({
  //       stroke: 'blue',
  //       strokeWidth: 15
  //     })
  //     isDrawing.value = true
  //   } else {
  //     console.log(222)
  //     // stopDrawing()
  //   }
  // })
  // stage.on(EVENT_NAMES.MOUSEUP_TOUCHEND, () => (isDragging.value = false))
}

const onEndDrawing = () => {
  if (!selectingShape.groupName) return

  const { stage, allShapes, pencil } = shortCut()

  pencil?.stopDrawing()

  const newLines = [] as typeof allShapes
  let countingShapeIndex = allShapes.length - 1
  while (countingShapeIndex > selectingShape.currentStartEraseIndex) {
    newLines.push(allShapes[countingShapeIndex])
    countingShapeIndex--
  }

  attachGroup(selectingShape.groupName, [...((selectingShapes.value || []) as any), ...newLines])

  // stage.off(EVENT_NAMES.MOUSEDOWN_TOUCHSTART)
  // stage.off(EVENT_NAMES.MOUSEMOVE)
  // stage.off(EVENT_NAMES.MOUSEUP_TOUCHEND)
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

  selectingShape.id = selectedShapeId
  selectingShape.groupName = selectedGroupName

  isDrawing.value = !isDrawing.value
}

watch(
  () => isDrawing.value,
  (newVal) => {
    if (newVal) {
      onDrawing()
    } else {
      onEndDrawing()
    }
  }
)
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
