import { Brush, BrushHistory, type BrushPainter, MarkingBrush, TimePoint } from './brush'

/**
 * 导入的用户图片
 */
export type InputImage = HTMLImageElement | ImageBitmap

/** 导出的历史记录 */
export interface PaperHistory {
  /** 画布宽度 */
  width: number,

  /** 画布高度 */
  height: number,

  /** 历史记录 */
  histories: BrushHistory []
}

/**
 * 画纸
 */
export class Paper {
  /** 根布局 */
  private readonly root: HTMLElement

  /** 画布父布局 */
  private readonly parent: HTMLElement

  /** 画布 */
  private readonly canvas: CanvasRenderingContext2D

  /** 用户涂鸦底图 */
  private readonly image: InputImage

  /** 画布位置 */
  private readonly position: Position

  /** 用户历史记录 */
  private readonly histories: BrushHistory[]

  /** 用户重做历史记录 */
  private readonly redoHistories: BrushHistory[]

  /** 动画控制器 */
  private readonly animCtrl: AnimationController

  /** 最大缩放比例 */
  private readonly maxScale: number

  /** 窗口监听 */
  private readonly windowListener: () => void

  /** 涂鸦宽度 */
  private width!: number

  /** 涂鸦高度 */
  private height!: number

  /** 笔刷 */
  private brush: Brush

  /** 最后一次触摸位移中心点 */
  private lastFocus: Offset = { x: 0, y: 0 }

  /** 最后一次双指之间的长度，用于计算缩放 */
  private lastLength: number = 0

  /** 最后一次缩放中心点 */
  private lastScaleFocus: Offset = { x: 0, y: 0 }

  /** 工作模式，0 表示不工作，1 表示绘制模式，2 表示移动缩放模式 */
  private workMode: number = 0

  /** 兼容新浏览器大小调整时监听 */
  private resizeObserver?: ResizeObserver

  /**
   * 初始化涂鸦板
   *
   * @param root          涂鸦板根布局
   * @param parent        涂鸦板画布父布局
   * @param canvasElement 涂鸦板涂鸦画布
   * @param image         涂鸦底图，如果图片格式为 `HTMLImageElement` 必须已经加载图片完成，且加载成功
   * @param maxScale      最大缩放比例，取值范围 [1.5 ~ 3]
   * @param history       用户历史记录，如果不存在，则创建新的记录
   * @param brush         默认画笔
   */
  public constructor(
    root: HTMLElement,
    parent: HTMLElement,
    canvasElement: HTMLCanvasElement,
    image: InputImage,
    maxScale: number = 2,
    brush?: Brush,
    history?: PaperHistory
  ) {
    const self = this
    this.root = root
    this.parent = parent
    this.canvas = canvasElement.getContext('2d')!
    this.image = image
    this.animCtrl = new AnimationController()
    this.position = { oScale: 1, ox: 0, oy: 0, scale: 1, x: 0, y: 0, width: 0, height: 0 }
    this.brush = brush ?? new MarkingBrush()
    this.histories = history?.histories || []
    this.redoHistories = []
    this.maxScale = clampNumber(maxScale, 1.5, 3)
    this.windowListener = () => Paper.onResize(self)

    this.initImageAndCanvas()
    this.initListeners()
    this.loadSizeAndPosition()

    // 如果尺寸不符合，删除历史记录
    if (history && (history.width !== this.width || history.height !== this.height)) {
      this.histories.splice(0)
    }

    this.updateState()
    this.redraw()
  }

  /** 获取当前笔刷 */
  public get currentBrush(): Brush {
    return this.brush
  }

  /** 设置当前笔刷 */
  public set currentBrush(brush: Brush) {
    this.brush = brush
  }

  /** 是否允许撤销操作 */
  public get canUndo(): boolean {
    return this.histories.length > 0
  }

  /** 执行撤销操作，如果执行失败返回 `false` */
  public undo(): boolean {
    if (!this.canUndo) return false
    const item = this.histories.pop()
    if (!item) return false
    this.redoHistories.push(item)
    this.redraw() // 执行重绘
    return true
  }

  /** 是否允许重做操作 */
  public get canRedo(): boolean {
    return this.redoHistories.length > 0
  }

  /** 执行重做操作，如果执行失败返回 `false` */
  public redo(): boolean {
    if (!this.canRedo) return false
    const item = this.redoHistories.pop()
    if (!item) return false
    this.histories.push(item)
    this.redraw() // 执行重绘
    return true
  }

  /** 获取画笔透明度 */
  public get canvasOpacity(): number {
    return parseFloat(this.canvas.canvas.style.opacity) || 1.0
  }

  /** 设置画布透明度 */
  public set canvasOpacity(opacity: number) {
    this.canvas.canvas.style.opacity = clampNumber(opacity, 0.0, 1.0).toString()
  }

  /** 导出历史记录 */
  public exportHistory(): PaperHistory {
    return {
      width: this.width,
      height: this.height,
      histories: this.histories.map(x => x.clone())
    }
  }

  /**
   * 返回一个包含涂鸦的 Data URI
   * @param type 图片格式，Safari 浏览器不支持 `image/webp`
   * @param quality 图片质量，图片为 png 时不可用，取值范围 0 ~ 1
   */
  public toDataURL(type: 'image/png' | 'image/webp', quality?: any): string {
    return this.canvas.canvas.toDataURL(type, quality)
  }

  /** 居中显示（动画） */
  public fitCenter(): void {
    this.animCtrl.reset()
    this.animateTo(0, 0, 1, 200)
  }

  /** 销毁 */
  public dispose(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    } else {
      window.removeEventListener('resize', this.windowListener)
    }
  }

  /** 初始化各类监听 */
  private initListeners(): void {
    const root = this.root, self = this
    const options: AddEventListenerOptions = { passive: false }

    root.addEventListener('touchstart', (evt) => Paper.onTouchStart(self, evt), options)
    root.addEventListener('touchend', (evt) => Paper.onTouchEnd(self, evt), options)
    root.addEventListener('touchmove', (evt) => Paper.onTouchMove(self, evt), options)
    root.addEventListener('touchcancel', (evt) => Paper.onTouchCancel(self, evt), options)

    // 监听是否改变
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(this.windowListener)
      this.resizeObserver.observe(root)
    } else {
      window.addEventListener('resize', this.windowListener)
    }
  }

  /** 载入尺寸和坐标，确定变化阈值 */
  private loadSizeAndPosition(): void {
    const rw = this.root.offsetWidth
    const rh = this.root.offsetHeight
    const iw = this.width
    const ih = this.height
    const { ow, oh } = rw / rh > iw / ih ? { ow: iw * rh / ih, oh: rh } : { ow: rw, oh: ih * rw / iw }
    this.position.width = ow
    this.position.height = oh
    this.position.ox = (rw - ow) / 2
    this.position.oy = (rh - oh) / 2
    this.position.oScale = ow / this.width
  }

  /** 初始化图片和画布 */
  private initImageAndCanvas(): void {
    const image = this.image
    let imageElement: HTMLElement

    if (image instanceof HTMLImageElement) {
      if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        throw new Error('Image Error.')
      }
      this.width = image.naturalWidth
      this.height = image.naturalHeight
      imageElement = image
    } else {
      if (image.width <= 0 || image.height <= 0) {
        throw new Error('ImageBitmap Error.')
      }
      this.width = image.width
      this.height = image.height

      const imageCanvas: HTMLCanvasElement = document.createElement('canvas')
      imageCanvas.width = this.width
      imageCanvas.height = this.height
      imageCanvas.getContext('2d')!.drawImage(image, 0, 0)

      imageElement = imageCanvas
    }

    const canvasElement = this.canvas.canvas
    canvasElement.width = this.width
    canvasElement.height = this.height

    imageElement.style.zIndex = '1'
    imageElement.style.width = '100%'
    imageElement.style.height = '100%'
    imageElement.style.position = 'absolute'
    imageElement.style.left = '0'
    imageElement.style.top = '0'
    if (imageElement instanceof HTMLImageElement) {
      imageElement.style.objectFit = 'contain'
    }

    this.parent.insertBefore(imageElement, canvasElement)
  }

  private static onTouchMove(self: Paper, event: TouchEvent): void {
    event.preventDefault()
    self.onTouchMoveProxy(event, self.root.getBoundingClientRect())
  }

  private static onTouchStart(self: Paper, event: TouchEvent): void {
    event.preventDefault()
    self.onTouchStartProxy(event, self.root.getBoundingClientRect())
  }

  private static onTouchEnd(self: Paper, event: TouchEvent): void {
    event.preventDefault()
    self.onTouchEndProxy(event, self.root.getBoundingClientRect())
  }

  private static onTouchCancel(self: Paper, event: TouchEvent): void {
    event.preventDefault()
    self.onTouchEndProxy(event, self.root.getBoundingClientRect())
  }

  private static onResize(self: Paper): void {
    self.loadSizeAndPosition()
    self.position.x = 0
    self.position.y = 0
    self.position.scale = 1
    self.updateState()
  }

  private onTouchStartProxy(event: TouchEvent, rect: DOMRect): void {
    const touchCount = event.targetTouches.length
    if (touchCount == 1) {
      if (this.animCtrl.animating) {
        this.workMode = 0
        return
      }
    } else if (this.workMode == 0) {
      return
    }

    this.workMode = touchCount <= 1 ? 1 : 2 // 如果为单指则为绘制模式
    this.lastFocus = this.computeFocus(event, rect)

    if (this.workMode == 1) {
      const x = this.lastFocus.x, y = this.lastFocus.y
      this.brush.drawDown(this.relativePositionToTimePoint(x, y), this.canvas)
    } else {
      // 进入移动模式，取消当前绘制的一笔
      this.cleanCurrentDraw()
      this.lastLength = this.computeLength(event, rect)
      this.lastScaleFocus = this.lastFocus
    }
  }

  private onTouchMoveProxy(event: TouchEvent, rect: DOMRect): void {
    const focus = this.computeFocus(event, rect)
    if (this.workMode === 0) return
    if (this.workMode === 1) {
      const x = focus.x, y = focus.y
      this.brush.drawMove(this.relativePositionToTimePoint(x, y), this.canvas)
      return
    }

    let updated = false
    const delta: Offset = { x: focus.x - this.lastFocus.x, y: focus.y - this.lastFocus.y }

    // 判断是否发生缩放
    if (event.targetTouches.length > 1) {
      const curLength = this.computeLength(event, rect)
      const deltaScale = curLength / this.lastLength
      if (Math.abs(deltaScale - 1.0) > 0.005) {
        updated = true
        const offset = this.computeScaleOffset(focus, deltaScale)
        delta.x += offset.x
        delta.y += offset.y

        this.position.scale *= deltaScale
        this.lastLength = curLength
        this.lastScaleFocus = focus
      }
    }

    // 判断是否发生位移
    if (updated || delta.x * delta.x + delta.y * delta.y > 0.25) {
      updated = true
      this.position.x += delta.x
      this.position.y += delta.y
      this.lastFocus = focus
    }

    // 更新 UI
    if (updated) {
      this.updateState()
    }
  }

  private onTouchEndProxy(event: TouchEvent, rect: DOMRect): void {
    if (this.workMode === 0) return
    // 如果为绘制模式
    if (this.workMode === 1) {
      this.brush.drawUp(this.canvas)

      // 添加到历史记录
      const painter: BrushPainter = this.brush as any as BrushPainter
      const history = painter.cleanHistory()
      if (!history) return
      this.histories.push(history)
      this.redoHistories.splice(0) // 清空重做历史
      return
    }

    // 当不是绘制模式时
    if (event.targetTouches.length > 1) {
      this.lastFocus = this.computeFocus(event, rect)
      this.lastLength = this.computeLength(event, rect)
      this.lastScaleFocus = this.lastFocus
    } else if (event.targetTouches.length > 0) {
      this.lastFocus = this.computeFocus(event, rect)
    } else {
      this.overBound()
    }
  }

  /** 越界检测 */
  private overBound(): void {
    const scaleTo = clampNumber(this.position.scale, 1, this.maxScale)
    if (scaleTo <= 1) {
      this.animateTo(0, 0, 1, 200, true)
      return
    }

    const offset = this.computeScaleOffset(this.lastScaleFocus, scaleTo / this.position.scale)
    offset.x += this.position.x + this.position.ox
    offset.y += this.position.y + this.position.oy

    const cx = this.root.offsetWidth - this.position.width * scaleTo
    const cy = this.root.offsetHeight - this.position.height * scaleTo
    const minX = Math.min(cx, 0.0)
    const minY = Math.min(cy, 0.0)
    const maxX = Math.max(cx, 0.0)
    const maxY = Math.max(cy, 0.0)

    this.animateTo(
      clampNumber(offset.x, minX, maxX) - this.position.ox,
      clampNumber(offset.y, minY, maxY) - this.position.oy,
      scaleTo,
      200,
      true
    )
  }

  /**
   * 执行变换动画，缩放到指定大小，并移动到合适位置
   *
   * @param ex 目标坐标，横坐标
   * @param ey 目标坐标，横坐标
   * @param es 目标缩放比例
   * @param maxDuration 动画最大时长
   * @param lost 允许取消时不对其进行赋值
   * @private
   */
  private animateTo(ex: number, ey: number, es: number, maxDuration: number = 200, lost: boolean = false): void {
    const sx = this.position.x, sy = this.position.y, ss = this.position.scale
    const self = this

    // 计算动画时长
    const dt = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2)) * 4
    const ds = Math.abs(es - ss) * 1000
    const duration = Math.max(clampNumber(dt, 0, maxDuration), clampNumber(ds, 0, maxDuration))

    // 根本不需要动
    if (duration <= 0) return

    // 小于 16 毫秒，不播放动画
    if (duration < 16) {
      this.position.x = ex
      this.position.y = ey
      this.position.scale = es
      this.updateState()
      return
    }

    this.animCtrl.execute(
      duration,
      (_, value) => {
        self.position.x = sx + (ex - sx) * value
        self.position.y = sy + (ey - sy) * value
        self.position.scale = ss + (es - ss) * value
        self.updateState()
      },
      undefined,
      lost ? undefined : () => {
        self.position.x = ex
        self.position.y = ey
        self.position.scale = es
        self.updateState()
      }
    )
  }

  /** 更新视图状态 */
  private updateState(): void {
    this.parent.style.width = this.position.width + 'px'
    this.parent.style.height = this.position.height + 'px'
    this.parent.style.left = (this.position.ox + this.position.x) + 'px'
    this.parent.style.top = (this.position.oy + this.position.y) + 'px'
    this.parent.style.transform = `scale(${this.position.scale}, ${this.position.scale})`
  }

  /** 丢弃当前绘制的这笔 */
  private cleanCurrentDraw(): void {
    const painter: BrushPainter = this.brush as any as BrushPainter
    const prev = painter.cleanHistory()
    if (prev) this.redraw()
  }

  /**
   * 相对坐标转笔触坐标
   *
   * @param x 画布根布局相对横坐标
   * @param y 画布根布局相对纵坐标
   */
  private relativePositionToTimePoint(x: number, y: number): TimePoint {
    const p = this.position
    const cx = x - (p.x + p.ox)
    const cy = y - (p.y + p.oy)
    const scale = p.oScale * p.scale
    return new TimePoint(cx / scale, cy / scale, new Date().getTime())
  }

  /**
   * 重新执行绘制
   */
  private redraw(): void {
    // 清理画布
    this.canvas.clearRect(0, 0, this.width, this.height)
    for (const item of this.histories) {
      if (!item.valid) continue
      const brush = Brush.fromConfig(item.configs)
      const painter = brush as any as BrushPainter
      for (let i = 2; i < item.points.length; i++) {
        painter.draw(this.canvas, item.points[i - 2], item.points[i - 1], item.points[i])
      }
    }
  }

  /**
   * 计算缩放偏移
   *
   * @param focus 屏幕中心点
   * @param scale 缩放比例
   * @private
   */
  private computeScaleOffset(focus: Offset, scale: number): Offset {
    const px = focus.x - (this.position.x + this.position.ox) // 计算放大中心点
    const py = focus.y - (this.position.y + this.position.oy) // 计算放大中心点
    return { x: px - px * scale, y: py - py * scale }
  }

  /** 计算两指之前长度 */
  private computeLength(event: TouchEvent, rect: DOMRect): number {
    const a = this.getTouch(event, rect, 0)
    const b = this.getTouch(event, rect, 1)
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
  }

  /** 获取指定触摸手指位置信息 */
  private getTouch(event: TouchEvent, rect: DOMRect, index: number = 0): Offset {
    const touch = event.targetTouches[index] ?? event
    return this.getTouchFromRawTouch(touch, rect)
  }

  /** 获取指定触摸手指位置信息 */
  private getTouchFromRawTouch(touch: Touch, rect: DOMRect): Offset {
    const x = touch.pageX - rect.x
    const y = touch.pageY - rect.y
    return { x, y }
  }

  /** 计算焦点 */
  private computeFocus(event: TouchEvent, rect: DOMRect): Offset {
    let sumX = 0, sumY = 0
    for (const target of event.targetTouches) {
      const offset = this.getTouchFromRawTouch(target, rect)
      sumX += offset.x
      sumY += offset.y
    }
    const size = event.targetTouches.length
    return { x: sumX / size, y: sumY / size }
  }
}

/** 偏移 */
interface Offset {
  x: number,
  y: number
}

/** 画布坐标 */
interface Position {
  /** 原始横坐标偏移 */
  ox: number

  /** 原始纵坐标偏移 */
  oy: number

  /** 原始缩放 */
  oScale: number

  /** 用户横坐标偏移 */
  x: number

  /** 用户纵坐标偏移 */
  y: number

  /** 用户缩放 */
  scale: number

  /** 容器宽度 */
  width: number,

  /** 容器高度 */
  height: number
}

type AnimationCallback = (controller: AnimationController, value: number) => void;

/** 动画控制器 */
class AnimationController {
  /** 当前动画 */
  private holder?: AnimationHolder

  /** 是否在动画过程中 */
  public get animating(): boolean {
    return this.holder !== undefined && this.holder !== null
  }

  /**
   * 重置动画
   * 如果动画存在，动画会被取消，否则无事发生
   */
  public reset(): void {
    if (!this.animating) return
    this.holder!.canceled = true
    this.holder = undefined
  }

  /**
   * 执行动画，如果存在动画，则不执行
   *
   * @param duration 动画持续时间
   * @param frameCallback 动画帧回调
   * @param completedCallback 完成动画回调
   * @param canceledCallback 取消动画回调
   */
  public execute(
    duration: number,
    frameCallback: AnimationCallback,
    completedCallback?: AnimationCallback,
    canceledCallback?: AnimationCallback
  ): void {
    if (this.animating) return
    const holder: AnimationHolder = {
      duration,
      frameCallback,
      completedCallback,
      canceledCallback,
      tick: performance.now(),
      canceled: false
    }
    this.holder = holder
    AnimationController.requestAnimationFrame(holder, this)
  }

  /**
   * 执行动画帧
   *
   * @param holder 动画绑定数据
   * @param controller 动画控制器
   * @private
   */
  private static requestAnimationFrame(
    holder: AnimationHolder,
    controller: AnimationController
  ): void {
    window.requestAnimationFrame(() => {
      const now = performance.now()
      const value = (now - holder.tick) / holder.duration

      // 执行一帧
      holder.frameCallback(controller, clampNumber(value, 0, 1))

      if (value >= 1) {
        // 完成动画
        holder.completedCallback?.(controller, 1)
        controller.cleanFinishAnimation(holder)
      } else if (holder.canceled) {
        holder.canceledCallback?.(controller, value)
        controller.cleanFinishAnimation(holder)
      } else {
        AnimationController.requestAnimationFrame(holder, controller)
      }
    })
  }

  /** 解绑当前动画 */
  private cleanFinishAnimation(holder: AnimationHolder): void {
    if (this.holder !== holder) return
    this.holder = undefined
  }
}

/** 动画执行容器 */
interface AnimationHolder {
  /** 每一帧回调 */
  frameCallback: AnimationCallback

  /** 完成回调 */
  completedCallback?: AnimationCallback

  /** 取消回调 */
  canceledCallback?: AnimationCallback

  /** 动画持续时间 */
  duration: number,

  /** 当前动画执行时间 */
  tick: number,

  /** 是否取消动画 */
  canceled: boolean
}

/**
 * 将值约束在范围内
 *
 * @param value 值
 * @param min 最小值
 * @param max 最大值
 * @private
 */
function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
