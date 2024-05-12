<template>
  <div class="container">
    <div id="editor" ref="root"></div>
    <div class="btn-group">
      <button @click="onErase">{{ !isDrawing ? 'Moving' : 'Eraser' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue'
import Pikaso, {
  LineModel,
  PolygonModel,
  ShapeModel,
  convertHtmlToText,
  type Group,
  type ShapeConfig
} from 'pikaso'

let editor: Pikaso
let polygon: PolygonModel
let polygon2: PolygonModel
let lastDrawLine: LineModel

const ERASER_GROUP = 'ERASER_GROUP'
const EVENT_NAMES = {
  MOUSEDOWN_TOUCHSTART: 'mousedown touchstart',
  MOUSEUP_TOUCHEND: 'mouseup touchend',
  MOUSEMOVE: 'mousemove'
}

const root = ref(undefined)
const isDrawing = ref(false)
const isDragging = ref(false)
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
    if (isDrawing.value) return
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
  polygon,
  polygon2,
  lineDrawer: editor.shapes.line
})

const createGroupName = (groupName = '', id = '') => `${groupName}_${id}`

const attachGroup = (groupName = ERASER_GROUP, customShapes: ShapeModel[] = []) => {
  const { groups, allShapes } = shortCut()
  groups.attach(customShapes.length ? customShapes : allShapes, groupName)
}

const stopDrawing = () => {
  if (!isDrawing.value) return
  // const { lineDrawer } = shortCut()
  // lineDrawer.stopDrawing()
  isDrawing.value = false
}

const resetLineBrush = (points = []) => {
  // const { lineDrawer } = shortCut()
  lastDrawLine = editor.shapes.line.insert({
    points,
    stroke: 'blue',
    strokeWidth: 15
  })
  // lineDrawer.draw({
  //   stroke: 'blue',
  //   strokeWidth: 15
  // })
}

const onDrawing = () => {
  console.log('===onDrawing', [selectingShape.groupName, typeof selectingShape.id])
  if (!selectingShape.groupName || typeof selectingShape.id !== 'number') return
  const { groups, allShapes, board } = shortCut()

  board.stage.container().style.cursor = 'crosshair'

  const selectedGroups = allShapes.filter(
    (i) => i.group === selectingShape.groupName || i.node._id === selectingShape.id
  )
  // console.log('===onDrawing', selectingShape.groupName)
  // console.log('===selectedGroups', selectedGroups)

  // tempGroupAllShape.value = {
  //   ...tempGroupAllShape.value,
  //   [selectingShape.groupName]: selectedGroups
  // }
  groups.ungroup(selectingShape.groupName)
  selectingShapes.value = selectedGroups
  selectingShape.currentStartEraseIndex = allShapes.length - 1
  // board.selection.deselectAll()

  // resetLineBrush()
}

const onEndDrawing = () => {
  const { allShapes, board, groups } = shortCut()
  board.stage.container().style.cursor = 'inherit'
  // console.log('===selectingShape.groupName', selectingShape.groupName)
  if (!selectingShape.groupName) return

  stopDrawing()
  // lineDrawer.stopDrawing()

  const newLines = [] as typeof allShapes
  let countingShapeIndex = allShapes.length - 1
  while (countingShapeIndex > selectingShape.currentStartEraseIndex) {
    countingShapeIndex--
    const eachItemPointsLength = allShapes[countingShapeIndex].node.attrs.points?.length
    if (!eachItemPointsLength) continue
    newLines.push(allShapes[countingShapeIndex])
  }

  console.log('===newLines', newLines)
  console.log('===selectingShapes.value', selectingShapes.value)
  // console.log('===groups', groups)
  // console.log('===selectingShape.groupName', selectingShape.groupName)
  // console.log('===attach', [...((selectingShapes.value || []) as any), ...newLines])
  attachGroup(selectingShape.groupName, [...((selectingShapes.value || []) as any), ...newLines])
  // console.log('===groups', groups)
  // board.selection.deselectAll()
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

const onMouseStart = () => {
  // onDrawing()
  isDragging.value = true
  resetLineBrush()
}

const onMouseMoving = (e: any) => {
  const { lineDrawer, board, stage } = shortCut()

  if (isDragging.value && e.target._id === selectingShape.id) {
    console.log(111)

    const pos = stage.getPointerPosition()
    const points: any = [pos?.x, pos?.y] || []
    // if (lineDrawer.isDrawing && board.activeDrawing) return
    // console.log('I AM IN')
    // resetLineBrush()
    lastDrawLine.update({
      points: [...lastDrawLine.node.attrs.points, ...points]
    })
  } else if (isDragging.value && e.target._id !== selectingShape.id) {
    console.log(222)
    // stopDrawing()
    // lineDrawer.stopDrawing()
    // resetLineBrush()
    // onEndDrawing()
  }
  //  else if (!isDragging.value) {
  //   isDragging.value = false
  // }
}

const onMouseEnd = () => {
  // if (!lastDrawLine.node.attrs.points?.length) {
  //   resetLineBrush()
  // }
  resetLineBrush()
  isDragging.value = false
}

watch(
  () => isDrawing.value,
  (newVal) => {
    const { stage } = shortCut()
    if (newVal) {
      stage.on(EVENT_NAMES.MOUSEDOWN_TOUCHSTART, onMouseStart)
      stage.on(EVENT_NAMES.MOUSEMOVE, onMouseMoving)
      stage.on(EVENT_NAMES.MOUSEUP_TOUCHEND, onMouseEnd)
      onDrawing()
    } else {
      stage.off(EVENT_NAMES.MOUSEDOWN_TOUCHSTART, onMouseStart)
      stage.off(EVENT_NAMES.MOUSEMOVE, onMouseMoving)
      stage.off(EVENT_NAMES.MOUSEUP_TOUCHEND, onMouseEnd)
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
