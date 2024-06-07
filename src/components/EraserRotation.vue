<template>
  <div class="container">
    <div id="editor" ref="root"></div>
    <div class="btn-group">
      <button @click="onDraw">Draw</button>
      <button @click="onExport">Export</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive, onBeforeUnmount } from 'vue'
import Pikaso, { ImageModel, PencilDrawer } from 'pikaso'
import type { LineConfig } from 'konva/lib/shapes/Line'

const IMG_URL = 'https://i.imgur.com/GPpYtJ5.png'
// const IMG_URL = 'https://i.imgur.com/L9HJIRN.png'
const THETA = 45

const editorRef = ref(null as Pikaso | null)
const root = ref(undefined)
const lineDrawer = ref(null as PencilDrawer | null)
const imgRef = ref(null as ImageModel | null)

const lineDrawerConfigs = reactive({
  stroke: 'blue',
  strokeWidth: 15,
  draggable: false,
  lineCap: 'round',
  lineJoin: 'round',
  x: 0,
  y: 0
} as Partial<LineConfig>)

onMounted(() => {
  editorRef.value = new Pikaso({
    container: root.value
  })
})

const onDraw = () => {
  lineDrawer.value?.isDrawing
    ? lineDrawer.value.stopDrawing()
    : lineDrawer.value.draw(lineDrawerConfigs)
}

const onExport = () => {
  const canvas = editorRef.value?.board.stage.container().querySelector('canvas')
  console.log('===export', canvas.toDataURL('image/webp', 1))
}

const clippingCanvas = (config?: any) => {
  const canvas = editorRef.value?.board.stage.container().querySelector('canvas')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = {
    x: 100,
    y: 100,
    width: 500,
    height: 500,
    ...config
  }

  // Translate and rotate context to align with rectangle
  ctx.translate(rect.x, rect.y) // Move the origin (0,0) to the top-left corner of the rectangle
  const angleInRadians = (rect.rotation * Math.PI) / 180 // Convert rotation angle to radians
  ctx.rotate(angleInRadians)

  // Define the clipping region
  ctx.beginPath()
  ctx.rect(0, 0, rect.width, rect.height) // Define a rectangle that covers the original position of the rect
  ctx.clip() // Make anything drawn outside this rectangle invisible

  // Clear the canvas within the clipping region
  ctx.clearRect(0, 0, canvas.width, canvas.height) // Clear the entire canvas, but only the clipped area is affected

  // Restore the context to its original state
  ctx.rotate((-rect.rotation * Math.PI) / 180) // Rotate the context back to the original angle
  ctx.translate(-rect.x, -rect.y) // Move the origin back to its initial position (0,0)
}

watch(
  () => editorRef.value,
  (newVal) => {
    if (!newVal) return

    lineDrawer.value = newVal.shapes.pencil

    const canvas = editorRef.value?.board.stage.container().querySelector('canvas')
    if (!canvas) return

    newVal.shapes.image.insert(IMG_URL, {}).then((ei) => {
      imgRef.value = ei
      ei.isSelectable = false

      newVal.rotation.straighten(THETA)

      const largestDiagonal = Math.sqrt(
        Math.pow(ei.node.width(), 2) + Math.pow(ei.node.height(), 2)
      )

      // Make sure the overlay should not be overlapped with largest diagonal of the image
      const stage = newVal.board.stage
      if (largestDiagonal > stage.width() || largestDiagonal > stage.height()) {
        ei.node.x() < 0 && ei.node.x(0)
        ei.node.y() < 0 && ei.node.y(0)

        newVal.board.stage.width(largestDiagonal)
        newVal.board.stage.height(largestDiagonal)
      }

      const contStyle = newVal.board.stage.container().style
      contStyle.width = contStyle.height = `${largestDiagonal}px`
      //

      const rect = {
        x: ei.node.x(),
        y: ei.node.y(),
        width: ei.node.width(),
        height: ei.node.height(),
        rotation: THETA
      }
      clippingCanvas(rect)
    })
  }
)
</script>

<style>
#editor {
  width: 80%;
  height: 70vh;
  background: #ccc;
}
.btn-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
