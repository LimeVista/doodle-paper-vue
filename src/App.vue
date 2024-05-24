<template>
  <main class="main">
    <h3 style="text-align: center">涂鸦测试</h3>
    <div class="paper-div">
      <DoodlePaper ref="paper" v-if="completed" :image="image" :brush="markingBrush" />
    </div>
    <div style="height: 8px" />
    <div class="toolbar">
      <button @click="onCanvasOpacityClick" v-if="completed" v-html="canvasOpacity" />
      &nbsp;&nbsp;
      <button @click="onBrushClick" v-if="completed" v-html="brushName" />
      &nbsp;&nbsp;
      <button @click="onUndoClick" v-if="completed">撤销</button>
      &nbsp;&nbsp;
      <button @click="onRedoClick" v-if="completed">重做</button>
      &nbsp;&nbsp;
      <button @click="onFitCenterClick" v-if="completed">居中</button>
      &nbsp;&nbsp;
      <button @click="onSaveClick" v-if="completed">保存</button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { DoodlePaper } from '@/packages'
import bg from '@/assets/bg.jpg'
import { ref } from 'vue'
import type { DoodlePaperController } from '@/packages/doodle/DoodlePaper.vue'
import { BrushType, EraserBrush, MarkingBrush } from '@/packages/doodle/brush'

let completed = ref(false)
let brushName = ref('橡皮')
let canvasOpacity = ref('透明')
const paper = ref<DoodlePaperController>()
const markingBrush = new MarkingBrush()
const eraserBrush = new EraserBrush()

// 设置画笔粗细
markingBrush.strokeSize = 32
eraserBrush.strokeSize = 36

// 加载图片
const image = new Image()
image.onload = () => completed.value = true
image.src = bg

/** 撤销点击 */
function onUndoClick() {
  paper.value?.undo()
}

/** 重做点击 */
function onRedoClick() {
  paper.value?.redo()
}

/** 居中显示 */
function onFitCenterClick() {
  paper.value?.fitCenter()
}

/** 画笔点击 */
function onBrushClick() {
  const p = paper.value!
  p.brush = p.brush.type === BrushType.marking ? eraserBrush : markingBrush
  brushName.value = p.brush.type === BrushType.marking ? '橡皮' : '画笔'
}

/** 设置涂鸦画板透明度 */
function onCanvasOpacityClick() {
  const p = paper.value!
  p.canvasOpacity = p.canvasOpacity >= 1.0 ? 0.75 : 1.0
  canvasOpacity.value = p.canvasOpacity >= 1.0 ? '透明' : '不透'
}

/** 保存涂鸦点击 */
function onSaveClick() {
  const dataUri = paper.value!.toDataURL('image/png')
  const byteString = atob(dataUri.split(',')[1])
  const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0]
  const buffer = new ArrayBuffer(byteString.length)
  const array = new Uint8Array(buffer)
  for (let i = 0; i < byteString.length; i++) {
    array[i] = byteString.charCodeAt(i)
  }

  const blob = new Blob([buffer], { type: mimeString })
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = 'doodle-image.png' // The name of the file to be saved
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

</script>

<style scoped>

.paper-div {
  width: 100%;
  height: 100vw;;
  border-top: black solid 1px;
  border-bottom: black solid 1px;
}

.main {
  width: 100%;
}

.toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>
