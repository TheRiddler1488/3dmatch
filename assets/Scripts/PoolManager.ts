import { _decorator, Component, Node, Prefab, instantiate, NodePool } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PoolManager')
export class PoolManager extends Component {
    public static Instance: PoolManager = null;

    @property(Prefab) cellPrefab: Prefab = null;
    @property(Prefab) gemPrefab: Prefab = null;
    @property(Prefab) effectPrefab: Prefab = null;

    private cellPool: NodePool = new NodePool();
    private gemPool: NodePool = new NodePool();
    private effectPool: NodePool = new NodePool();

    protected onLoad() {
        PoolManager.Instance = this;
        for (let i = 0; i < 20; i++) {
            this.effectPool.put(instantiate(this.effectPrefab));
        }
        for (let i = 0; i < 50; i++) {
            this.cellPool.put(instantiate(this.cellPrefab));
            this.gemPool.put(instantiate(this.gemPrefab));
        }
    }
    public getEffect(): Node {
        return this.effectPool.size() > 0 ? this.effectPool.get() : instantiate(this.effectPrefab);
    }

    public getCell(): Node {
        return this.cellPool.size() > 0 ? this.cellPool.get() : instantiate(this.cellPrefab);
    }

    public getGem(): Node {
        return this.gemPool.size() > 0 ? this.gemPool.get() : instantiate(this.gemPrefab);
    }

    public returnGem(node: Node) {
        node.removeFromParent();
        this.gemPool.put(node);
    }

    public returnEffect(node: Node) {
        node.removeFromParent();
        this.effectPool.put(node);
    }
}
