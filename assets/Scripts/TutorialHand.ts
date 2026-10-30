import { _decorator, Component, Vec3, tween, easing, Tween, Node, director, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TutorialHand')
export class TutorialHand extends Component {
    private readonly scaleIdle: Vec3 = new Vec3(1, 1, 1);
    private readonly scalePressed: Vec3 = new Vec3(0.85, 0.85, 1);
    private readonly scaleHidden: Vec3 = new Vec3(0, 0, 1);

    private handTween: Tween<Node> = null;
    private isHidden: boolean = false;
    private canvasNode: Node = null;

    protected onLoad() {
        this.canvasNode = director.getScene()?.getChildByName('Canvas');
        if (this.canvasNode) {
            this.canvasNode.on(Node.EventType.TOUCH_START, this.hide, this, true);
        }
    }

    protected onDestroy() {
        if (this.canvasNode && this.canvasNode.isValid) {
            this.canvasNode.off(Node.EventType.TOUCH_START, this.hide, this, true);
        }
    }

    public showTutorialAtWorldPos(worldStart: Vec3, worldEnd: Vec3, isTap: boolean) {
        if (this.isHidden) return;

        const startPos = new Vec3();
        const endPos = new Vec3();

        const parentTransform = this.node.parent?.getComponent(UITransform);
        if (parentTransform) {
            parentTransform.convertToNodeSpaceAR(worldStart, startPos);
            parentTransform.convertToNodeSpaceAR(worldEnd, endPos);
        } else {
            startPos.set(worldStart);
            endPos.set(worldEnd);
        }

        if (this.handTween) this.handTween.stop();
        this.node.setPosition(startPos);
        this.node.setScale(this.scaleIdle);

        if (isTap) {
            this.handTween = tween(this.node)
                .repeatForever(tween().set({ position: startPos, scale: this.scaleIdle }).to(0.25, { scale: this.scalePressed }, { easing: easing.quadOut }).to(0.25, { scale: this.scaleIdle }, { easing: easing.quadIn }).delay(0.3))
                .start();
        } else {
            this.handTween = tween(this.node)
                .repeatForever(tween().set({ position: startPos, scale: this.scaleIdle }).to(0.2, { scale: this.scalePressed }, { easing: easing.quadOut }).to(0.6, { position: endPos }, { easing: easing.sineInOut }).to(0.15, { scale: this.scaleIdle }, { easing: easing.quadIn }).to(0.15, { scale: this.scaleHidden }).delay(0.3))
                .start();
        }
    }

    public hide() {
        if (this.isHidden) return;
        this.isHidden = true;

        if (this.canvasNode && this.canvasNode.isValid) {
            this.canvasNode.off(Node.EventType.TOUCH_START, this.hide, this, true);
        }

        if (this.handTween) {
            this.handTween.stop();
            this.handTween = null;
        }
        this.node.active = false;
    }
}
