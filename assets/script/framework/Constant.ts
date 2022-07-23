import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Constant')
export class Constant {

}

/** 触摸事件-上下左右滑动 */
export enum TouchEventType {
    UP = 'touch-up',
    DOWN = 'touch-down',
    LEFT = 'touch-left',
    RIGHT = 'touch-right'
}

/** 不渲染与7个颜色 */
export enum ItemColor {
    NULL = 0,
    Color1,
    Color2,
    Color3,
    Color4,
    Color5,
    Color6,
    Color7,
}