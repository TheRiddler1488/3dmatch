import { _decorator, Component, Node, Vec3, Sprite, SpriteFrame, tween, easing, EventTouch, UITransform, Color } from 'cc';
import { GameConfig, DropInfo } from './GameConfig';
import { PoolManager } from './PoolManager';
import { Match3Model } from './Match3Model';
const { ccclass, property } = _decorator;

@ccclass('BoardView')
export class BoardView extends Component {
    @property([SpriteFrame])
    public gemSprites: SpriteFrame[] = [];

    private gemNodes: Node[] = [];
    private startX: number = 0;
    private startY: number = 0;
    private startTouchGridPos: { x: number; y: number } = null;

    public initBoard(model: Match3Model) {
        const totalW = GameConfig.GridWidth * (GameConfig.CellSize + GameConfig.CellSpacing);
        const totalH = GameConfig.GridHeight * (GameConfig.CellSize + GameConfig.CellSpacing);
        this.startX = -totalW / 2 + GameConfig.CellSize / 2;
        this.startY = totalH / 2 - GameConfig.CellSize / 2;

        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);

        for (let y = 0; y < GameConfig.GridHeight; y++) {
            for (let x = 0; x < GameConfig.GridWidth; x++) {
                const cell = PoolManager.Instance.getCell();
                cell.setPosition(this.getPos(x, y));
                cell.getComponent(Sprite).color = GameConfig.Colors.Empty;
                this.node.addChild(cell);
            }
        }

        for (let y = 0; y < GameConfig.GridHeight; y++) {
            for (let x = 0; x < GameConfig.GridWidth; x++) {
                const gem = PoolManager.Instance.getGem();
                gem.setPosition(this.getPos(x, y));
                this.setGemVisual(gem, model.getType(x, y));
                this.node.addChild(gem);
                this.gemNodes.push(gem);
            }
        }
    }

    public getCellWorldPos(x: number, y: number, outWorldPos: Vec3): Vec3 {
        const localPos = this.getPos(x, y);
        return this.node.getComponent(UITransform).convertToWorldSpaceAR(localPos, outWorldPos);
    }

    private setGemVisual(gemNode: Node, type: number) {
        const sprite = gemNode.getComponent(Sprite);
        sprite.spriteFrame = this.gemSprites[type];
        sprite.color = Color.WHITE;
    }

    private getPos(x: number, y: number): Vec3 {
        return new Vec3(this.startX + x * (GameConfig.CellSize + GameConfig.CellSpacing), this.startY - y * (GameConfig.CellSize + GameConfig.CellSpacing), 0);
    }

    public getGemNode(x: number, y: number): Node {
        return this.gemNodes[y * GameConfig.GridWidth + x];
    }
    public setGemNode(x: number, y: number, node: Node) {
        this.gemNodes[y * GameConfig.GridWidth + x] = node;
    }

    private onTouchStart(e: EventTouch) {
        const pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(e.getUILocation().x, e.getUILocation().y, 0));
        const gridX = Math.round((pos.x - this.startX) / (GameConfig.CellSize + GameConfig.CellSpacing));
        const gridY = Math.round((this.startY - pos.y) / (GameConfig.CellSize + GameConfig.CellSpacing));

        if (gridX >= 0 && gridX < GameConfig.GridWidth && gridY >= 0 && gridY < GameConfig.GridHeight) {
            this.startTouchGridPos = { x: gridX, y: gridY };
        }
    }

    private onTouchEnd(e: EventTouch) {
        if (!this.startTouchGridPos) return;

        const pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(e.getUILocation().x, e.getUILocation().y, 0));
        const gridX = Math.round((pos.x - this.startX) / (GameConfig.CellSize + GameConfig.CellSpacing));
        const gridY = Math.round((this.startY - pos.y) / (GameConfig.CellSize + GameConfig.CellSpacing));

        const dx = Math.abs(gridX - this.startTouchGridPos.x);
        const dy = Math.abs(gridY - this.startTouchGridPos.y);

        if (dx === 0 && dy === 0) {
            this.node.emit('board-try-tap', gridX, gridY);
        } else if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            this.node.emit('board-try-swap', this.startTouchGridPos.x, this.startTouchGridPos.y, gridX, gridY);
        }
        this.startTouchGridPos = null;
    }

    public spawnBoosters(boosters: Map<number, number>) {
        boosters.forEach((type, idx) => {
            const x = idx % GameConfig.GridWidth;
            const y = Math.floor(idx / GameConfig.GridWidth);

            const gem = PoolManager.Instance.getGem();
            gem.setPosition(this.getPos(x, y));
            this.setGemVisual(gem, type);

            gem.setScale(new Vec3(0, 0, 0));
            this.node.addChild(gem);
            this.gemNodes[idx] = gem;

            tween(gem)
                .to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: easing.backOut })
                .start();
        });
    }

    public playBoosterEffects(boosters: Map<number, number>) {
        if (boosters.size === 0) return;

        tween(this.node)
            .stop()
            .to(0.03, { position: new Vec3(6, 6, 0) })
            .to(0.03, { position: new Vec3(-6, -6, 0) })
            .to(0.03, { position: new Vec3(0, 0, 0) })
            .start();

        boosters.forEach((type, idx) => {
            const x = idx % GameConfig.GridWidth;
            const y = Math.floor(idx / GameConfig.GridWidth);
            const pos = this.getPos(x, y);

            const fx = PoolManager.Instance.getEffect();
            fx.setPosition(pos);
            const sprite = fx.getComponent(Sprite);

            if (type === GameConfig.ElementTypes.RocketHor || type === GameConfig.ElementTypes.RocketVert) {
                sprite.color = new Color(255, 230, 100, 255);
            } else {
                sprite.color = new Color(255, 100, 50, 255);
            }

            this.node.addChild(fx);

            if (type === GameConfig.ElementTypes.Bomb) {
                fx.setScale(new Vec3(0, 0, 1));
                tween(fx)
                    .to(0.1, { scale: new Vec3(2.5, 2.5, 1) }, { easing: easing.quadOut })
                    .to(0.15, { scale: new Vec3(0, 0, 1) }, { easing: easing.quadIn })
                    .call(() => PoolManager.Instance.returnEffect(fx))
                    .start();
            } else if (type === GameConfig.ElementTypes.RocketHor) {
                fx.setScale(new Vec3(0, 0.5, 1));
                tween(fx)
                    .to(0.1, { scale: new Vec3(20, 0.8, 1) }, { easing: easing.expoOut })

                    .to(0.15, { scale: new Vec3(20, 0, 1) })
                    .call(() => PoolManager.Instance.returnEffect(fx))
                    .start();
            } else if (type === GameConfig.ElementTypes.RocketVert) {
                fx.setScale(new Vec3(0.5, 0, 1));
                tween(fx)
                    .to(0.1, { scale: new Vec3(0.8, 20, 1) }, { easing: easing.expoOut })
                    .to(0.15, { scale: new Vec3(0, 20, 1) })
                    .call(() => PoolManager.Instance.returnEffect(fx))
                    .start();
            }
        });
    }

    public swapVisuals(x1: number, y1: number, x2: number, y2: number, onComplete: Function) {
        const node1 = this.getGemNode(x1, y1);
        const node2 = this.getGemNode(x2, y2);

        this.setGemNode(x1, y1, node2);
        this.setGemNode(x2, y2, node1);

        node1.setScale(new Vec3(1.1, 1.1, 1));
        node2.setScale(new Vec3(1.1, 1.1, 1));

        tween(node1)
            .to(0.25, { position: this.getPos(x2, y2), scale: new Vec3(1, 1, 1) }, { easing: easing.backOut })
            .start();

        tween(node2)
            .to(0.25, { position: this.getPos(x1, y1), scale: new Vec3(1, 1, 1) }, { easing: easing.backOut })
            .call(() => onComplete())
            .start();
    }

    public animateDrops(dropInfos: DropInfo[], count: number, onComplete: Function) {
        let completed = 0;
        const newNodes: Node[] = [];

        for (let i = 0; i < count; i++) {
            const drop = dropInfos[i];
            let node: Node;

            if (drop.startY < 0) {
                node = PoolManager.Instance.getGem();
                node.setPosition(this.getPos(drop.x, drop.startY));
                this.setGemVisual(node, drop.type);
                node.setScale(new Vec3(1, 1, 1));
                this.node.addChild(node);
            } else {
                node = this.getGemNode(drop.x, drop.startY);
            }

            newNodes[drop.endY * GameConfig.GridWidth + drop.x] = node;

            const dist = Math.abs(drop.endY - drop.startY);
            tween(node)
                .to(0.15 + dist * 0.04, { position: this.getPos(drop.x, drop.endY) }, { easing: easing.bounceOut })
                .call(() => {
                    completed++;
                    if (completed === count) {
                        for (let k = 0; k < newNodes.length; k++) {
                            if (newNodes[k]) this.gemNodes[k] = newNodes[k];
                        }
                        onComplete();
                    }
                })
                .start();
        }
    }

    public blowUpGems(indices: Set<number>, onComplete: Function) {
        let count = 0;
        indices.forEach((idx) => {
            const node = this.gemNodes[idx];

            tween(node)
                .to(0.05, { scale: new Vec3(1.2, 1.2, 1) })
                .to(0.15, { scale: new Vec3(0, 0, 0) }, { easing: easing.backIn })
                .call(() => {
                    PoolManager.Instance.returnGem(node);
                    this.gemNodes[idx] = null;
                    count++;
                    if (count === indices.size) onComplete();
                })
                .start();
        });
    }
}
