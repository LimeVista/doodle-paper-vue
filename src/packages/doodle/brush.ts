/**
 * 混合模式
 *
 * "source-over": 在现有画布上绘制新图形。
 * "source-in": 仅在新形状和目标画布重叠的地方绘制新形状。其他的都是透明的。
 * "source-out": 在不与现有画布内容重叠的地方绘制新图形。
 * "source-atop": 只在与现有画布内容重叠的地方绘制新图形。
 * "destination-over": 在现有画布内容的后面绘制新的图形。
 * "destination-in": 仅保留现有画布内容和新形状重叠的部分。其他的都是透明的。
 * "destination-out": 仅保留现有画布内容和新形状不重叠的部分。
 * "destination-atop": 仅保留现有画布内容和新形状重叠的部分。新形状是在现有画布内容的后面绘制的。
 * "lighter": 两个重叠图形的颜色是通过颜色值相加来确定的。
 * "copy": 只显示新图形。
 * "xor": 形状在重叠处变为透明，并在其他地方正常绘制。
 * "multiply": 将顶层像素与底层相应像素相乘，结果是一幅更黑暗的图片。
 * "screen": 像素被倒转、相乘、再倒转，结果是一幅更明亮的图片（与 `multiply` 相反）。
 * "overlay": `multiply` 和 `screen` 的结合。原本暗的地方更暗，原本亮的地方更亮。
 * "darken": 保留两个图层中最暗的像素。
 * "lighten": 保留两个图层中最亮的像素。
 * "color-dodge": 将底层除以顶层的反置。
 * "color-burn": 将反置的底层除以顶层，然后将结果反过来。
 * "hard-light": 类似于 `overlay`，`multiply` 和 `screen` 的结合——但上下图层互换了。
 * "soft-light": 柔和版本的 `hard-light`。纯黑或纯白不会导致纯黑或纯白。
 * "difference": 从顶层减去底层（或反之亦然），始终得到正值。
 * "exclusion": 与 `difference` 类似，但对比度较低。
 * "hue": 保留底层的亮度（luma）和色度（chroma），同时采用顶层的色调（hue）。
 * "saturation": 保留底层的亮度和色调，同时采用顶层的色度。
 * "color": 保留了底层的亮度，同时采用了顶层的色调和色度。
 * "luminosity": 保持底层的色调和色度，同时采用顶层的亮度。
 */
export type BrushBlendMode = 'source-over' | 'source-in' | 'source-out' | 'source-atop'
  | 'destination-over' | 'destination-in' | 'destination-out' | 'destination-atop' | 'lighter'
  | 'copy' | 'xor' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge'
  | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation'
  | 'color' | 'luminosity'

/**
 * 线段末端的属性
 *
 * https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/lineCap
 *
 * `butt`: 线段末端以方形结束。
 * `round`: 线段末端以圆形结束。
 * `square`: 线段末端以方形结束，但是增加了一个宽度和线段相同，高度是线段厚度一半的矩形区域。
 */
export type BrushLineCap = 'butt' | 'round' | 'square'

/**
 * 用来设置 2 个长度不为 0 的相连部分（线段、圆弧、曲线）如何连接在一起的属性
 *
 * https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/lineJoin
 *
 * `round`: 通过填充一个额外的，圆心在相连部分末端的扇形，绘制拐角的形状。圆角的半径是线段的宽度。
 * `bevel`: 在相连部分的末端填充一个额外的以三角形为底的区域，每个部分都有各自独立的矩形拐角。
 * `miter`: 通过延伸相连部分的外边缘，使其相交于一点，形成一个额外的菱形区域。
 */
export type BrushLineJoin = 'bevel' | 'round' | 'miter'

/**
 * 笔刷类型
 */
export enum BrushType {
  /**
   * 记号笔
   */
  marking = 'marking',

  /**
   * 橡皮擦
   */
  eraser = 'eraser',
}

/**
 * 画笔配置
 */
export interface BrushConfigs {
  /**
   * 笔刷类型
   */
  type: BrushType

  /**
   * 颜色，这里请使用不包含 Alpha 通道的颜色值
   *
   * 例如：FF0000 -> RR GG BB
   */
  color: number

  /**
   * 画笔不透明度 0 ~ 1
   */
  alpha: number,

  /**
   * 画笔大小，画笔宽度
   *
   * 当小于等于 0 时，不进行绘制
   */
  size: number

  /**
   * 线段末端的属性
   */
  cap: BrushLineCap

  /**
   * 用来设置 2 个长度不为 0 的相连部分（线段、圆弧、曲线）如何连接在一起的属性
   */
  join: BrushLineJoin

  /**
   * 混合模式
   */
  blendMode: BrushBlendMode
}

/**
 * 时间点
 * 记录默认时间下的一个 2D 坐标
 */
export class TimePoint {

  /** 横坐标，浮点类型 */
  public readonly x: number

  /** 纵坐标，浮点类型 */
  public readonly y: number

  /** 时间，整数类型 */
  public readonly time: number

  /** 构造时间点*/
  public constructor(x: number, y: number, time: number = 0) {
    this.x = x
    this.y = y
    this.time = time
  }

  /** 向量长度，返回浮点类型 */
  public len(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  /** 叉积 A x B = |A||B|Sin(θ)，返回浮点类型 */
  public cross(o: TimePoint): number {
    return this.x * o.y - this.y * o.x
  }

  /** 两个坐标之间的距离，返回浮点类型 */
  public distance(o: TimePoint): number {
    const dx = o.x - this.x
    const dy = o.y - this.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /** 计算两个坐标的中点 */
  public static middle(p0: TimePoint, p1: TimePoint): TimePoint {
    return new TimePoint(
      (p0.x + p1.x) / 2,
      (p0.y + p1.y) / 2,
      Math.floor((p0.time + p1.time) / 2)
    )
  }

  /** 判断两个类是否相等 */
  public equals(o: any): boolean {
    if (o instanceof TimePoint) {
      return o.x === this.x &&
        o.y === this.y &&
        o.time === this.time
    }
    return false
  }
}

/**
 * 笔刷基类
 */
export abstract class Brush {
  /**
   * 从配置创建笔刷
   *
   * @param configs
   */
  public static fromConfig(configs: BrushConfigs): Brush {
    switch (configs.type) {
      case BrushType.marking:
        return new MarkingBrush(undefined, configs)
      case BrushType.eraser:
        return new EraserBrush(undefined, configs)
    }
  }

  /**
   * 画笔配置
   */
  protected readonly configs: BrushConfigs

  /**
   * 传入配置对画笔进行构造
   */
  protected constructor(config: BrushConfigs) {
    this.configs = config
  }

  /** 画笔类型 */
  public get type(): BrushType {
    return this.configs.type
  }

  /**
   * 画笔颜色
   *
   * @see BrushConfigs.color
   */
  public get color(): number {
    return this.configs.color
  }

  /**
   * 画笔颜色
   *
   * @see BrushConfigs.color
   */
  public set color(color: number) {
    if (!Number.isInteger(color)) return
    if (color < 0) {
      color = 0
    } else if (color > 0xFFFFFF) {
      color = 0xFFFFFF
    }
    this.configs.color = color
  }

  /**
   * 画笔混合模式
   *
   * @see BrushConfigs.blendMode
   */
  public get blendMode(): BrushBlendMode {
    return this.configs.blendMode
  }

  /**
   * 画笔混合模式
   *
   * @see BrushConfigs.blendMode
   */
  public set blendMode(mode: BrushBlendMode) {
    this.configs.blendMode = mode
  }

  /**
   * 画笔大小
   *
   * @see BrushConfigs.size
   */
  public get strokeSize(): number {
    return this.configs.size
  }


  /**
   * 画笔大小
   *
   * @see BrushConfigs.size
   */
  public set strokeSize(size: number) {
    this.configs.size = size
  }

  /**
   * 画笔颜色
   *
   * 用 #RRGGBBAA 表示
   */
  public get strokeStyle(): string {
    let color = this.color.toString(16)
    while (color.length < 6) {
      color = '0' + color
    }

    let alpha = Math.floor(this.configs.alpha * 255).toString(16)
    while (alpha.length < 2) {
      alpha = '0' + color
    }

    return '#' + color + alpha
  }

  /**
   * 起笔
   *
   * @param point 当前点击点
   * @param canvas 画布
   */
  public abstract drawDown(point: TimePoint, canvas: CanvasRenderingContext2D): void

  /**
   * 走笔
   *
   * @param point 当前点击点
   * @param canvas 画布
   */
  public abstract drawMove(point: TimePoint, canvas: CanvasRenderingContext2D): void

  /**
   * 抬笔
   *
   * @param canvas 画布
   */
  public abstract drawUp(canvas: CanvasRenderingContext2D): void

  /**
   * 从配置对画笔进行重新恢复
   *
   * @param configs 画笔配置
   */
  public fromConfig(configs: BrushConfigs): void {
    this.configs.alpha = configs.alpha
    this.configs.cap = configs.cap
    this.configs.color = configs.color
    this.configs.join = configs.join
    this.configs.blendMode = configs.blendMode
    this.configs.size = configs.size
  }

  /**
   * 导出配置
   */
  public toConfigs(): BrushConfigs {
    return { ...this.configs }
  }

  /**
   * 将画笔配置应用到画布
   *
   * @param canvas 画布
   */
  public applyCanvas(canvas: CanvasRenderingContext2D): void {
    canvas.globalCompositeOperation = this.blendMode
    canvas.lineJoin = this.configs.join
    canvas.lineCap = this.configs.cap
    canvas.lineWidth = this.configs.size
    canvas.strokeStyle = this.strokeStyle
  }
}

/**
 * 画笔的每一笔历史记录
 */
export class BrushHistory {
  /**
   *
   * 画笔配置
   */
  public readonly configs: BrushConfigs

  /**
   * 记录点
   */
  public readonly points: TimePoint[]

  /**
   * 构造历史记录
   *
   * @param configs 画笔配置
   * @param points  时间点集合，如果不存在则创建
   */
  public constructor(configs: BrushConfigs, points?: TimePoint[]) {
    this.configs = configs
    this.points = points ?? []
  }

  /**
   * 添加点
   *
   * @param point 时间点
   */
  public addPoint(point: TimePoint): void {
    this.points.push(point)
  }

  /**
   * 第一个点
   */
  public get first(): TimePoint {
    return this.points[0]
  }

  /**
   * 当前点
   */
  public get current(): TimePoint {
    return this.points[this.points.length - 1]
  }

  /**
   * 上一个点
   */
  public get prev(): TimePoint {
    return this.points[this.points.length - 2]
  }

  /**
   * 上上个点
   */
  public get early(): TimePoint {
    return this.points[this.points.length - 3]
  }

  /**
   * 点个数
   */
  public get count(): number {
    return this.points.length
  }

  /**
   * 是否有效
   */
  public get valid(): boolean {
    return this.points.length > 2
  }

  public clone(): BrushHistory {
    return new BrushHistory({
      alpha: this.configs.alpha,
      blendMode: this.configs.blendMode,
      cap: this.configs.cap,
      color: this.configs.color,
      join: this.configs.join,
      size: this.configs.size,
      type: this.configs.type
    }, [...this.points])
  }
}

/**
 * 画笔绘制接口
 */
export interface BrushPainter {
  /**
   * 根据历史点将点绘制到路径中
   *
   * @param canvas  画布
   * @param early   上上点
   * @param prev    上一点
   * @param current 当前点
   */
  draw(canvas: CanvasRenderingContext2D, early: TimePoint, prev: TimePoint, current: TimePoint): void

  /**
   * 检测是否需要绘制这个点，满足条件方可添加
   *
   * @param prev    上一个点
   * @param current 当前点
   */
  canDraw(prev: TimePoint, current: TimePoint): boolean

  /**
   * 清空历史记录
   */
  cleanHistory(): BrushHistory | undefined
}

/**
 * 路径画笔
 */
abstract class PathBrush extends Brush implements BrushPainter {
  /**
   * 最后一笔的历史记录
   */
  private _history: BrushHistory | undefined = undefined

  public abstract canDraw(prev: TimePoint, current: TimePoint): boolean

  public cleanHistory(): BrushHistory | undefined {
    const history = this._history
    this._history = undefined
    return history
  }

  public draw(
    canvas: CanvasRenderingContext2D,
    early: TimePoint,
    prev: TimePoint,
    current: TimePoint
  ): void {
    const p0 = TimePoint.middle(early, prev)
    const p1 = prev
    const p2 = TimePoint.middle(prev, current)

    canvas.save()
    try {
      // 绑定画笔配置
      this.applyCanvas(canvas)

      // 开始绘制
      canvas.beginPath()
      canvas.moveTo(p0.x, p0.y)
      canvas.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y)
      canvas.stroke()
    } finally {
      canvas.restore()
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public drawDown(point: TimePoint, _canvas: CanvasRenderingContext2D): void {
    this._history = new BrushHistory(this.toConfigs())
    this._history!.addPoint(point)
    console.log(this._history)
  }

  public drawMove(point: TimePoint, canvas: CanvasRenderingContext2D): void {
    const history = this._history!
    // 如果点太少就不经过筛查
    if (history.count > 1 && !this.canDraw(history.current, point)) return

    // 添加点
    history.addPoint(point)

    // 第三个点开始绘制
    if (!history.valid) return
    this.draw(canvas, history.early, history.prev, history.current)
  }

  public drawUp(canvas: CanvasRenderingContext2D): void {
    if (this._history?.valid !== true) return
    const history = this._history!
    history.addPoint(history.current)
    this.draw(canvas, history.early, history.prev, history.current)
  }
}

/**
 * 记号笔
 */
export class MarkingBrush extends PathBrush implements Brush {
  /**
   * 初始化记号笔
   *
   * @param size    画笔大小
   * @param configs 如不清楚，请勿传递
   */
  public constructor(size?: number, configs?: BrushConfigs) {
    if (configs && configs.type != BrushType.marking) {
      throw Error('Type must be a marking brush.')
    }
    super(configs ?? {
      type: BrushType.marking,
      alpha: 1,
      blendMode: 'source-over',
      cap: 'round',
      color: 0x0E9C4B,
      join: 'round',
      size: size ?? 8.0
    })
  }

  public override canDraw(prev: TimePoint, current: TimePoint): boolean {
    return current.distance(prev) >= Math.max(this.strokeSize / 4.0, 2.0)
  }
}

/**
 * 橡皮擦
 */
export class EraserBrush extends PathBrush implements Brush {
  /**
   * 初始化橡皮擦
   *
   * @param size    画笔大小
   * @param configs 如不清楚，请勿传递
   */
  public constructor(size?: number, configs?: BrushConfigs) {
    if (configs && configs.type != BrushType.eraser) {
      throw Error('Type must be a eraser brush.')
    }
    super(configs ?? {
      type: BrushType.eraser,
      alpha: 1,
      blendMode: 'destination-out',
      cap: 'round',
      color: 0xFFFFFF,
      join: 'round',
      size: size ?? 8.0
    })
  }

  public override canDraw(prev: TimePoint, current: TimePoint): boolean {
    return current.distance(prev) >= Math.max(this.strokeSize / 8.0, 2.0)
  }
}