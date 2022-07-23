import { _decorator, Component, Node, SystemEvent, EventTarget, EventTouch, misc, error ,Vec2, director} from 'cc';
import { TouchEventType } from '../framework/Constant';
import { GameManager } from '../framework/GameManager';
const { ccclass, property } = _decorator;
const eventTarget = new EventTarget();

@ccclass('UIMain')
export class UIMain extends Component {

    @property(GameManager)
    public gameManager: GameManager = null;

    @property(Node)
    public startPanel: Node = null;

    // @property(Node)
    // aimNode: Node = null;

    start() {
        // this.btnGameStart()
        this.startPanel.active = true;
    }

    btnGameStart() {
        this.startPanel.active = false;
        this.gameManager.gameStart();
    }

    onEnable() {
        // this.node.on(Node.EventType.TOUCH_START, this._touchStart, this);
        // this.node.on(Node.EventType.TOUCH_MOVE, this._touchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this._touchEnd, this);
    }

    onDisable() {
        // this.node.off(Node.EventType.TOUCH_START, this._touchStart, this);
        // this.node.off(Node.EventType.TOUCH_MOVE, this._touchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this._touchEnd, this);
    }

    // private _touchStart(touch: Touch, event: EventTouch){

    // }
    // private _touchMove(touch: Touch, event: EventTouch){

    // }
    private _touchEnd(e: EventTouch) {
        console.log("_touchEnd", e.getLocation(), e.getDelta(), e.getUIDelta())
        // if (!this.gameManager.isGameStart) return;getUIDelta
        let startPoint = e.getStartLocation()
        let endPonit = e.getLocation()
        // 起点与终点相减
        let v = endPonit.subtract(startPoint) 
        // let v = e.getUIDelta()
        // 转弧度
        let radians = Math.atan2(v.y, v.x)
        // 弧度转角度
        let degrees = misc.radiansToDegrees(radians)
        /** 将角度划分 8 块区域，方便处理，注意恰好 360 度 */
        let index = Math.floor(degrees / 45)
        this.emitEventByIndex(index)
        console.log("index", index)
    }

    emitEventByIndex(index: number) {
        // 8 方向判断
        if (index === 0 || index === -1) {
            // this.aimNode.emit(TouchEventType.RIGHT)
            director.emit(TouchEventType.RIGHT)
        } else if (index === 1 || index === 2) {
            // this.aimNode.emit(TouchEventType.UP)
            director.emit(TouchEventType.UP)
        } else if (index === -2 || index === -3) {
            // this.aimNode.emit(TouchEventType.DOWN)
            director.emit(TouchEventType.DOWN)
        } else if (index === -4 || index === 3 || index === 4) {
            // this.aimNode.emit(TouchEventType.LEFT)
            director.emit(TouchEventType.LEFT)
        } else {
            error(`无此方向${index}`)
        }
    }

    update(deltaTime: number) {

    }
}

