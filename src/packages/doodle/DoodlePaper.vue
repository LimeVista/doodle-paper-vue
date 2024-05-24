<template>
  <div class="paper-full paper-clip" ref="paperRoot">
    <div class="paper-container" ref="paperParent">
      <canvas class="paper-full paper-canvas" ref="paperCanvas" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { type InputImage, Paper, type PaperHistory } from './paper'
import type { Brush } from '@/packages/doodle/brush'

////////////////////////////////////////////////////////////////

/** 导出接口 */
export interface DoodlePaperController {
  /** 是否允许撤销操作 */
  get canUndo(): boolean,

  /** 是否允许重做操作 */
  get canRedo(): boolean,

  /** 获取当前笔刷 */
  get brush(): Brush,

  /** 设置当前笔刷 */
  set brush(brush: Brush),

  /** 获取画笔透明度 */
  get canvasOpacity(): number,

  /** 设置画布透明度 */
  set canvasOpacity(opacity: number),

  /** 执行撤销操作，如果执行失败返回 `false` */
  undo(): boolean,

  /** 执行重做操作，如果执行失败返回 `false` */
  redo(): boolean,

  /** 导出历史记录，如果不存在返回 undefined */
  exportHistory(): PaperHistory | undefined,

  /**
   * 返回一个包含涂鸦的 Data URI
   * @param type 图片格式，Safari 浏览器不支持 `image/webp`
   * @param quality 图片质量，图片为 png 时不可用，取值范围 0 ~ 1
   */
  toDataURL(type: 'image/png' | 'image/webp', quality?: any): string,

  /** 居中显示 */
  fitCenter(): void
}

////////////////////////////////////////////////////////////////

/** 定义传入参数 */
let props = defineProps<{
  /** 用户传入的图片，必填，这是涂鸦的底图 */
  image: InputImage,

  /** 当前绘制的历史记录，请保证历史记录和上一次的底图相同 */
  history?: PaperHistory,

  /** 默认画笔，为空时使用马克笔 */
  brush?: Brush,

  /** 最大缩放比，1.5 ~ 3，默认 2 */
  maxScale?: number
}>()

////////////////////////////////////////////////////////////////

/** 定义组件变量 */
let paperCanvas = ref<HTMLCanvasElement>()
let paperParent = ref<HTMLElement>()
let paperRoot = ref<HTMLElement>()
let image = ref(props.image)
let maxScale = ref(props.maxScale)
let brush = ref(props.brush)
let history = ref(props.history)
let paper: Paper | undefined = undefined

////////////////////////////////////////////////////////////////

/** 定义导出参数 */
defineExpose<DoodlePaperController>({
  get brush(): Brush {
    return paper!.currentBrush
  },
  set brush(brush: Brush) {
    if (!paper) return
    paper.currentBrush = brush
  },
  get canRedo(): boolean {
    return paper?.canRedo ?? false
  },
  get canUndo(): boolean {
    return paper?.canUndo ?? false
  },
  get canvasOpacity(): number {
    return paper?.canvasOpacity ?? 1
  },
  set canvasOpacity(opacity: number) {
    if (!paper) return
    paper.canvasOpacity = opacity
  },
  redo: () => paper?.redo() ?? false,
  undo: () => paper?.undo() ?? false,
  exportHistory: () => paper?.exportHistory(),
  fitCenter: () => paper?.fitCenter(),
  toDataURL: (type, quality) => paper?.toDataURL(type, quality) ?? ''
})

////////////////////////////////////////////////////////////////

onMounted(() => {
  paper = paper ?? new Paper(
    paperRoot.value!,
    paperParent.value!,
    paperCanvas.value!,
    image.value!,
    maxScale.value,
    brush.value as Brush | undefined,
    history.value
  )
})

onUnmounted(() => {
  paper?.dispose()
  paper = undefined
})

</script>

<style scoped>
/* 设置画布优先级 */
.paper-canvas {
  display: block;
  position: absolute;
  z-index: 2;
  left: 0;
  top: 0;
}

/* 用于撑满父布局 */
.paper-full {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

/* 定义容器，用于包裹画布 */
.paper-container {
  padding: 0;
  margin: 0;
  position: relative;
  transform-origin: top left;
}

/* 避免移动后溢出 */
.paper-clip {
  overflow: hidden;
}
</style>