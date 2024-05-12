import { reactive, ref, watch, type Ref } from 'vue'
import Pikaso, { LineModel, ShapeModel, type Group, type ShapeConfig } from 'pikaso'

const ERASER_GROUP = 'ERASER_GROUP'
const EVENT_NAMES = {
  MOUSEDOWN_TOUCHSTART: 'mousedown touchstart',
  MOUSEUP_TOUCHEND: 'mouseup touchend',
  MOUSEMOVE: 'mousemove touchmove'
}

export const useDrawer = (editor: Ref<Pikaso | null>) => {
  const state = ref(null as any)
  watch(() => editor.value, (newVal) => {
    if (!newVal) return

    state.value = drawer(newVal)

  })

  return state
}

const drawer = (editor: Pikaso) => {
  let lastDrawLine: LineModel | null

  const isDrawing = ref(false)
  const isDragging = ref(false)
  const selectingShapes = ref([] as ShapeModel<Group | any, ShapeConfig>[] | undefined)
  const selectingShape = reactive({
    id: null,
    groupName: '',
    range: {
      xMax: 0,
      yMax: 0,
      xMin: 0,
      yMin: 0,
    },
    currentStartEraseIndex: 0
  })

  const shortCut = () => ({
    board: editor.board,
    stage: editor.board.stage,
    groups: editor.board.groups,
    allShapes: editor.board.shapes.filter((i) => i.type !== 'group'),
    lineDrawer: editor.shapes.pencil
  })

  const createGroupName = (groupName = '', id = '') => `${groupName}_${id}`

  const attachGroup = (groupName = ERASER_GROUP, customShapes: ShapeModel[] | any[] = []) => {
    const { groups, allShapes } = shortCut()
    groups.attach(customShapes.length ? customShapes : allShapes, groupName)
  }

  const stopActiveDrawing = () => {
    const { lineDrawer, board } = shortCut()
    lineDrawer.stopDrawing()
    board.setActiveDrawing(null)
    lastDrawLine = null
  }

  const stopDrawing = () => {
    stopActiveDrawing()
    isDrawing.value = false
  }

  const resetLineBrush = () => {
    // if (lastDrawLine) return

    const { board, lineDrawer } = shortCut()
    // stopDrawing()
    // lineDrawer.stopDrawing()
    board.setActiveDrawing("Pencil")
    // lastDrawLine = editor.shapes.line.insert({
    //   points,
    //   stroke: 'blue',
    //   strokeWidth: 15
    // })
    lineDrawer.draw({
      stroke: 'blue',
      strokeWidth: 15,
      draggable: false,
      lineCap: 'round',
      lineJoin: 'round',
    })
  }

  const onDrawing = () => {
    // console.log('===onDrawing', [selectingShape.groupName, typeof selectingShape.id])
    if (!selectingShape.groupName || typeof selectingShape.id !== 'number') return
    const { groups, allShapes, board } = shortCut()

    const group = groups.findOrCreate(selectingShape.groupName)
    if (group.children.length) {
      // selectingShape.id = group.children[0].node.attrs._id
      selectingShapes.value = allShapes.filter(
        (i) => i.group === selectingShape.groupName || i.node._id === selectingShape.id
      )
    }

    selectingShape.currentStartEraseIndex = allShapes.length - 1
    groups.ungroup(selectingShape.groupName)
    board.selection.deselectAll()

    stopActiveDrawing()
    resetLineBrush()
  }

  const onEndDrawing = () => {
    const { allShapes, board, groups } = shortCut()
    if (!selectingShape.groupName) return

    stopDrawing()
    // lineDrawer.stopDrawing()

    const newLines = [] as typeof allShapes
    let countingShapeIndex = allShapes.length - 1
    while (countingShapeIndex > selectingShape.currentStartEraseIndex) {
      const eachItemPointsLength = allShapes[countingShapeIndex].node.attrs.points?.length
      if (!eachItemPointsLength) continue
      newLines.push(allShapes[countingShapeIndex])
      countingShapeIndex--
    }

    // console.log('===newLines', newLines)
    // console.log('===selectingShapes.value', selectingShapes.value)
    // console.log('===groups', groups)
    // console.log('===selectingShape.groupName', selectingShape.groupName)
    // console.log('===attach', [...((selectingShapes.value || []) as any), ...newLines])
    attachGroup(selectingShape.groupName, [...((selectingShapes.value || []) as any), ...newLines])

    const newGr = groups.find(selectingShape.groupName)
    if (!newGr) return
    board.selection.add(newGr.container)
  }

  const onErase = (_e: PointerEvent, groupName = ERASER_GROUP) => {
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
    selectingShape.range = {
      xMax: selectedShape.x() + selectedShape.width() / 2,
      yMax: selectedShape.y() + selectedShape.height() / 2,
      xMin: selectedShape.x() - selectedShape.width() / 2,
      yMin: selectedShape.y() - selectedShape.height() / 2,
    }

    isDrawing.value = !isDrawing.value
  }

  const checkInRange = (x: number, y: number) => {
    const range = selectingShape.range
    if (!range) return
    const isX = x < range.xMax && x > range.xMin
    const isY = y < range.yMax && y > range.yMin
    return isX && isY
  }

  const onMouseStart = (e) => {
    // onDrawing()
    isDragging.value = true
    // resetLineBrush()
    const { groups } = shortCut()
    // console.log("===e", [e.target.attrs.x, e.target.attrs.y, e.target.width(), e.target.height()])
    // console.log("===target", e.target._id)
  }

  const onMouseMoving = (e: any) => {
    const { stage, board, allShapes } = shortCut()
    const mousePos = stage.getPointerPosition()
    if (!mousePos) return
    const isMovingInsideShape = checkInRange(mousePos.x, mousePos.y)

    // if (!isDragging.value) return

    if (!allShapes.length) return
    const lastLine = allShapes[allShapes.length - 1]
    const points = lastLine.node.attrs.points
    if (!points?.length) return
    let pointsLastIndex = points.length - 1
    while (pointsLastIndex >= 0 && !checkInRange(points[pointsLastIndex - 1], points[pointsLastIndex])) {
      points.pop()
      points.pop()
      pointsLastIndex -= 2
    }
    // console.log("===points", points)

    // const es = stage.getIntersection(mousePos as any)
    // console.log("==es", es)
    // const isMovingInsideShape = es?.getClientRect({ relativeTo: es.getStage() as any })
    // console.log("==isMovingInsideShape", isMovingInsideShape)
    // console.log("===", mousePos)
    // console.log("===realtive", stage.ge)

    if (isDragging.value && isMovingInsideShape) {

      // console.log(board.activeDrawing)
      // if (!board.activeDrawing) {
      //   console.log("INNNNN")
      //   // resetLineBrush()
      // }
      // console.log(111)

      // resetLineBrush()

      // const pos = stage.getPointerPosition()
      // const points: any = [pos?.x, pos?.y] || []
      // lastDrawLine?.node.setAttr("points", [...(lastDrawLine?.node.attrs.points || []), ...points])
    } else if (isDragging.value && !isMovingInsideShape) {
      console.log(222)


      // console.log("===allShapes", allShapes)
      // lineDrawer.stopDrawing()
      // console.log(e.target._id)
      // console.log(selectingShape.id)
      // console.log(e)

      // stopActiveDrawing()
    }
  }

  const onMouseEnd = () => {
    console.log("ENDDDDD")
    // stopActiveDrawing()
    isDragging.value = false
  }

  watch(
    () => isDrawing.value,
    (newVal) => {
      const { stage } = shortCut()
      if (newVal) {
        onDrawing()
        // stage.on(EVENT_NAMES.MOUSEDOWN_TOUCHSTART, onMouseStart)
        // stage.on(EVENT_NAMES.MOUSEMOVE, onMouseMoving)
        // stage.on(EVENT_NAMES.MOUSEUP_TOUCHEND, onMouseEnd)
      } else {
        // stage.off(EVENT_NAMES.MOUSEDOWN_TOUCHSTART, onMouseStart)
        // stage.off(EVENT_NAMES.MOUSEMOVE, onMouseMoving)
        // stage.off(EVENT_NAMES.MOUSEUP_TOUCHEND, onMouseEnd)
        onEndDrawing()
      }
    }
  )

  return {
    onErase,
    isDrawing,
    selectingShapes
  }
}