import { _decorator, Component, tween, Vec3, easing } from 'cc';
import { AudioManager } from './AudioManager';
const { ccclass } = _decorator;

@ccclass('CtaScreen')
export class CtaScreen extends Component {
    private static readonly ZERO_SCALE = new Vec3(0, 0, 0);
    private static readonly FULL_SCALE = new Vec3(1, 1, 1);

    protected onLoad() {
        this.node.active = false;
    }

    public show() {
        this.node.active = true;
        this.node.setScale(CtaScreen.ZERO_SCALE);

        AudioManager.instance?.playCtaSound();

        tween(this.node).to(0.4, { scale: CtaScreen.FULL_SCALE }, { easing: easing.backOut }).start();
    }
}
