import { _decorator, Component, Node, Sprite, Color, tween, Vec3, easing, Label, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EnemyController')
export class EnemyController extends Component {
    @property(Sprite) enemySprite: Sprite = null;
    @property(Node) slashEffect: Node = null;

    @property(Label) healthLabel: Label = null;
    @property(Node) damageTextTemplate: Node = null;

    private originalColor = new Color(255, 255, 255, 255);
    private hitColor = new Color(255, 50, 50, 255);

    public maxHealth: number = 2000;
    private currentHealth: number = 0;

    protected start() {
        this.slashEffect.active = false;
        this.currentHealth = this.maxHealth;
        this.updateHealthUI();
        if (this.damageTextTemplate) this.damageTextTemplate.active = false;
    }

    public takeDamage(damage: number): boolean {
        this.currentHealth -= damage;
        if (this.currentHealth < 0) this.currentHealth = 0;

        this.updateHealthUI();
        this.showFloatingDamage(damage);

        this.slashEffect.active = true;
        this.slashEffect.setScale(new Vec3(0, 0, 0));

        tween(this.slashEffect)
            .to(0.1, { scale: new Vec3(1.5, 1.5, 1) }, { easing: easing.backOut })
            .to(0.1, { scale: new Vec3(1.8, 1.8, 1) })
            .call(() => (this.slashEffect.active = false))
            .start();

        const startPos = this.enemySprite.node.position.clone();

        tween(this.enemySprite.node)
            .by(0.05, { position: new Vec3(15, 0, 0) })
            .by(0.05, { position: new Vec3(-30, 0, 0) })
            .by(0.05, { position: new Vec3(15, 0, 0) })
            .to(0.05, { position: startPos })
            .start();

        this.enemySprite.color = this.hitColor;
        tween(this.enemySprite).to(0.2, { color: this.originalColor }).start();

        return this.currentHealth <= 0;
    }

    private updateHealthUI() {
        if (this.healthLabel) {
            this.healthLabel.string = `${this.currentHealth}`;
        }
    }

    private showFloatingDamage(damage: number) {
        if (!this.damageTextTemplate) return;

        const dmgNode = instantiate(this.damageTextTemplate);
        dmgNode.active = true;
        this.node.addChild(dmgNode);
        dmgNode.setPosition(0, 20, 0);

        const label = dmgNode.getComponent(Label);
        if (label) label.string = `-${damage}`;

        const randomX = Math.random() * 60 - 30;
        tween(dmgNode)
            .by(0.6, { position: new Vec3(randomX, 100, 0) }, { easing: easing.quadOut })
            .to(0.2, { scale: new Vec3(0, 0, 0) })
            .call(() => dmgNode.destroy())
            .start();
    }
}
