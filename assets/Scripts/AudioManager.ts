import { _decorator, Component, AudioSource, AudioClip, Node, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    private static _instance: AudioManager | null = null;
    public static get instance() {
        return this._instance;
    }

    @property(AudioSource)
    bgmSource: AudioSource = null;

    @property(AudioSource)
    sfxSource: AudioSource = null;

    @property(AudioClip)
    bgmMusic: AudioClip = null;

    @property(AudioClip)
    ctaClip: AudioClip = null;

    @property(AudioClip)
    putClip: AudioClip = null;

    @property(AudioClip)
    popClip: AudioClip = null;

    private isBgmStarted: boolean = false;
    private canvasNode: Node = null;

    protected onLoad() {
        if (!AudioManager._instance) {
            AudioManager._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        if (this.bgmSource && this.bgmMusic) {
            this.bgmSource.clip = this.bgmMusic;
            this.bgmSource.loop = true;
            this.bgmSource.volume = 0.05;
            this.bgmSource.playOnAwake = false;
        }

        this.canvasNode = director.getScene()?.getChildByName('Canvas');
        if (this.canvasNode) {
            this.canvasNode.on(Node.EventType.TOUCH_START, this.onFirstTouch, this, true);
        }
    }

    protected onDestroy() {
        if (this.canvasNode && this.canvasNode.isValid) {
            this.canvasNode.off(Node.EventType.TOUCH_START, this.onFirstTouch, this, true);
        }
    }

    private onFirstTouch() {
        if (this.isBgmStarted) return;
        this.isBgmStarted = true;
        this.playBGM();

        if (this.canvasNode && this.canvasNode.isValid) {
            this.canvasNode.off(Node.EventType.TOUCH_START, this.onFirstTouch, this, true);
        }
    }

    public playBGM() {
        if (!this.bgmSource || this.bgmSource.playing) return;
        this.bgmSource.play();
    }

    public stopBGM() {
        if (this.bgmSource) this.bgmSource.stop();
    }

    private playSFX(clip: AudioClip, volume: number = 1.0) {
        if (clip && this.sfxSource) {
            this.sfxSource.playOneShot(clip, volume);
        }
    }

    public playPutSound() {
        this.playSFX(this.putClip, 1.0);
    }

    public playPopSound() {
        this.playSFX(this.popClip, 0.8);
    }

    public playCtaSound() {
        if (this.bgmSource && this.bgmSource.playing) {
            this.bgmSource.volume = 0.01;
        }

        this.playSFX(this.ctaClip, 1.0);
    }
}
