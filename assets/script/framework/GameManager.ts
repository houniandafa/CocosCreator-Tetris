import { _decorator, Component, Node, EventTarget, director, Vec2, warn, Prefab, instantiate, UITransform, SpriteFrame, Sprite, v2, find } from 'cc';
import { AudioManager } from '../AudioManager';
import { config } from './config';
import { ItemColor, TouchEventType } from './Constant';
const { ccclass, property } = _decorator;
const eventTarget = new EventTarget();

interface CurrentShapeData {
    /** 指向当前形状中心 */
    center: Vec2,
    /** 当前形状翻转下标，0-3，可以翻转 4 种形态 */
    index: number,
    /** 什么颜色的方块 */
    color: ItemColor
}

@ccclass('GameManager')
export class GameManager extends Component {

    @property(Prefab)
    item: Prefab = undefined//小方块

    @property([SpriteFrame])
    itemSpriteFrames: SpriteFrame[] = [];

    @property(Node)
    startPanel: Node = undefined

    @property(Node)
    shapeBoot:Node = null;//方块的父级

    // audio
    @property(AudioManager)
    public audioEffect: AudioManager = null;

    /** 二维数组 */
    dataArray: ItemColor[][] = []

    /** 游戏层上应该铺满节点，然后根据数据渲染 */
    itemArray: Node[][] = [];

    /** 当前形状 */
    currentShape: CurrentShapeData = {
        center: v2(0, 0),
        index: 0,
        color: ItemColor.NULL
    }

    public isGameStart: boolean = false;

    /** 计时变量 */
    time: number = 0

    onEnable() {
        director.on(TouchEventType.RIGHT, this.touchRight, this)
        director.on(TouchEventType.LEFT, this.touchLeft, this)
        director.on(TouchEventType.UP, this.touchUp, this)
        director.on(TouchEventType.DOWN, this.touchDown, this)
    }

    onDisable() {
        director.off(TouchEventType.RIGHT, this.touchRight, this)
        director.off(TouchEventType.LEFT, this.touchLeft, this)
        director.off(TouchEventType.UP, this.touchUp, this)
        director.off(TouchEventType.DOWN, this.touchDown, this)
    }

    private touchRight() {
        console.log("右")
        this.changeCurrentShapePos(v2(0, 1))
    }
    private touchLeft() {
        console.log("左")
        this.changeCurrentShapePos(v2(0, -1))
    }
    private touchUp() {
        console.log("上")
        this.changeCurrentShapeIndex()
    }
    private touchDown() {
        console.log("下")
        this.changeCurrentShapePos(v2(1, 0))
    }

    public playAudioEffect(name: string){
        this.audioEffect.play(name);
    }

    /** 操作变形逻辑 */
    changeCurrentShapeIndex () {
        this.clearCurrentData(this.currentShape)
        this.currentShape.index += this.currentShape.index === 3 ? -3 : 1
        if (this.isCurrentDataOK(this.currentShape)) {
            this.setCurrentData(this.currentShape)
            // find(NodeUrl.Music).emit(MusicEvent.ACTION)
            this.playAudioEffect("action")
        } else {
            warn('操作不合理')
            this.currentShape.index += this.currentShape.index === 0 ? 3 : -1
        }
    }

    /** 操作逻辑 */
    changeCurrentShapePos(v: Vec2) {
        this.clearCurrentData(this.currentShape)
        this.currentShape.center.x += v.x
        this.currentShape.center.y += v.y
        if (this.isCurrentDataOK(this.currentShape)) {
            this.setCurrentData(this.currentShape)
        } else {
            warn('操作不合理')
            this.currentShape.center.x -= v.x
            this.currentShape.center.y -= v.y
        }
    }

    start() {
        this.init();
    }

    init() {
        const height = config.row * config.blockHeight
        const width = config.col * config.blockWidth
        // 初始化所有节点
        for (let i = 0; i < config.row; i++) {
            this.itemArray[i] = []
            for (let j = 0; j < config.col; j++) {
                const x = -width / 2 + config.blockWidth / 2 + j * config.blockWidth
                const y = height / 2 - config.blockHeight / 2 - i * config.blockHeight
                const item = this.createItem(x, y)
                this.itemArray[i][j] = item
            }
        }
        // this.gameStart()
    }

    /** 点击开始游戏按钮后触发 */
    gameStart() {
        // this.startPanel.active = false
        this.initData()//图片颜色 初始化数据为0 也就是没有图片
        this.render()//开始游戏时，所有小方块的纹理都置空
        this.randomOneShape()
        this.isGameStart = true;
    }

    initData() {
        for (let i = 0; i < config.row; i++) {
            this.dataArray[i] = []
            for (let j = 0; j < config.col; j++) {
                this.dataArray[i][j] = ItemColor.NULL
            }
        }
    }
    /** 随机生成 */
    randomOneShape() {
        this.currentShape.center.set(config.startPos)
        // 随机类型
        this.currentShape.color = Math.floor(1 + 7 * Math.random())
        // 随机开始的下标
        this.currentShape.index = Math.floor(4 * Math.random())
        // this.setCurrentData(this.currentShape)
        // 检测游戏结束
        if (this.isCurrentDataOK(this.currentShape)) {
            this.setCurrentData(this.currentShape)
        } else {
            warn('游戏结束')
            this.isGameStart = false
            this.setCurrentData(this.currentShape)
            // find(NodeUrl.Music).emit(MusicEvent.GAME_OVER)
            this.playAudioEffect("gameover")
            this.scheduleOnce(() => {
                // 显示游戏开始菜单
                this.startPanel.active = true
            }, 2)
        }
    }

    /** 根据当前中心点和形状类型加入数据 */
    setCurrentData(currentShape: CurrentShapeData) {
        const { center, color, index } = currentShape
        const shape = `shape${color}`
        const shapeData: Vec2[][] = config[shape]
        shapeData[index].forEach(ele => {
            const row = center.x + ele.x
            const col = center.y + ele.y
            this.dataArray[row][col] = color
        })
        // 刷新视图
        this.render()
    }

    /** 判断传入中心点和形状类型是否合理 */
    isCurrentDataOK (currentShape: CurrentShapeData): boolean {
        const { center, color, index } = currentShape
        const shape = `shape${color}`
        const shapeData: Vec2[][] = config[shape]
        const shapeIndexDate: Vec2[] = shapeData[index]
        for (let i = 0; i < shapeIndexDate.length; i++) {
            const row = center.x + shapeIndexDate[i].x
            if (row < 0 || row >= config.row) {
                return false
            }
            const col = center.y + shapeIndexDate[i].y
            if (col < 0 || col >= config.col) {
                return false
            }
            if (this.dataArray[row][col] !== ItemColor.NULL) {
                return false
            }
        }
        return true
    }

    /** 根据当前中心点和形状类型清除数据 */
    clearCurrentData (currentShape: CurrentShapeData) {
        const { center, color, index } = currentShape
        const shape = `shape${color}`
        const shapeData: Vec2[][] = config[shape]
        shapeData[index].forEach(ele => {
            const row = center.x + ele.x
            const col = center.y + ele.y
            this.dataArray[row][col] = ItemColor.NULL
        })
    }

    /** 检测消除行 */
    checkLines () {
        // 从下往上，写一个 while 检测所有满的行
        let row: number = config.row - 1
        // 有消除
        let isEliminated: boolean = false
        while (row !== 0) {
            let isFull: boolean = true
            for (let j = 0; j < config.col; j++) {
                if (this.dataArray[row][j] === ItemColor.NULL) {
                    isFull = false
                }
            }
            // 如果该行满了，消除本行，所有数据下移，再检测一次
            if (isFull) {
                isEliminated = true
                for (let p = row; p > 0; p--) {
                    for (let q = 0; q < config.col; q++) {
                        this.dataArray[p][q] = this.dataArray[p - 1][q]
                    }
                }
            } else {
                row--
            }
        }
        if (isEliminated) {
            // find(NodeUrl.Music).emit(MusicEvent.ELIMINATE)
            this.playAudioEffect("eliminate")
        }
    }

    /** 自动下落逻辑 */
    autoDown () {
        this.clearCurrentData(this.currentShape)
        this.currentShape.center.x += 1
        if (this.isCurrentDataOK(this.currentShape)) {
            this.setCurrentData(this.currentShape)
        } else {
            warn('无法下移动，下一个')
            this.currentShape.center.x -= 1
            this.setCurrentData(this.currentShape)
            // 消除逻辑
            this.checkLines()
            // 下一个形状
            this.randomOneShape()
        }
    }

    update (dt: number) {
        if (!this.isGameStart) {
            return
        }
        this.time += dt
        if (this.time > 1) {
            this.time = 0
            // 下落逻辑
            this.autoDown()
        }
    }

    /** 根据传入二维数组进行渲染 */ /** 刷新视图 */
    render() {
        const dataArray: ItemColor[][] = this.dataArray;
        for (let i = 0; i < config.row; i++) {
            for (let j = 0; j < config.col; j++) {
                const color = dataArray[i][j]
                // 拖入图片 0-6，颜色枚举 1-7
                this.itemArray[i][j].getComponent(Sprite).spriteFrame = this.itemSpriteFrames[color - 1]
            }
        }
    }

    createItem(x: number, y: number): Node {
        let item = instantiate(this.item)
        this.shapeBoot.addChild(item)
        item.setPosition(x, y)
        // const u = this.getComponent(UITransform)
        // item.setContentSize(config.itemWidth, config.itemHeight)
        item.getComponent(UITransform).setContentSize(config.itemWidth, config.itemHeight)
        return item
    }
}

