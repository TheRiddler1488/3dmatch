import { GameConfig, DropInfo } from './GameConfig';

export class Match3Model {
    private width = GameConfig.GridWidth;
    private height = GameConfig.GridHeight;
    private grid: Int8Array = new Int8Array(this.width * this.height);
    public readonly dropBuffer: DropInfo[] = [];

    constructor() {
        for (let i = 0; i < this.width * this.height; i++) {
            this.dropBuffer.push(new DropInfo());
        }
    }

    public getIndex(x: number, y: number): number {
        return y * this.width + x;
    }
    public getType(x: number, y: number): number {
        return this.grid[this.getIndex(x, y)];
    }
    public setType(x: number, y: number, type: number): void {
        this.grid[this.getIndex(x, y)] = type;
    }

    public findValidMove(outMove: { x1: number; y1: number; x2: number; y2: number; isTap: boolean }): boolean {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.getType(x, y) >= 10) {
                    outMove.x1 = x;
                    outMove.y1 = y;
                    outMove.x2 = x;
                    outMove.y2 = y;
                    outMove.isTap = true;
                    return true;
                }
            }
        }

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (x < this.width - 1 && this.checkVirtualSwap(x, y, x + 1, y)) {
                    outMove.x1 = x;
                    outMove.y1 = y;
                    outMove.x2 = x + 1;
                    outMove.y2 = y;
                    outMove.isTap = false;
                    return true;
                }
                if (y < this.height - 1 && this.checkVirtualSwap(x, y, x, y + 1)) {
                    outMove.x1 = x;
                    outMove.y1 = y;
                    outMove.x2 = x;
                    outMove.y2 = y + 1;
                    outMove.isTap = false;
                    return true;
                }
            }
        }
        return false;
    }

    private checkVirtualSwap(x1: number, y1: number, x2: number, y2: number): boolean {
        const t1 = this.getType(x1, y1);
        const t2 = this.getType(x2, y2);
        if (t1 === 0 || t2 === 0 || t1 === t2) return false;

        this.swap(x1, y1, x2, y2);
        const hasMatch = this.hasLineMatchAt(x1, y1) || this.hasLineMatchAt(x2, y2);
        this.swap(x1, y1, x2, y2);
        return hasMatch;
    }

    private hasLineMatchAt(cx: number, cy: number): boolean {
        const type = this.getType(cx, cy);
        if (type === 0 || type >= 10) return false;

        let hCount = 1;
        for (let x = cx - 1; x >= 0 && this.getType(x, cy) === type; x--) hCount++;
        for (let x = cx + 1; x < this.width && this.getType(x, cy) === type; x++) hCount++;
        if (hCount >= 3) return true;

        let vCount = 1;
        for (let y = cy - 1; y >= 0 && this.getType(cx, y) === type; y--) vCount++;
        for (let y = cy + 1; y < this.height && this.getType(cx, y) === type; y++) vCount++;
        return vCount >= 3;
    }

    public fillRandomly(): void {
        for (let i = 0; i < this.grid.length; i++) {
            let type;
            do {
                type = Math.floor(Math.random() * 4) + 1;
                this.grid[i] = type;
            } while (this.causesMatchOnSpawn(i, type));
        }
    }

    private causesMatchOnSpawn(index: number, type: number): boolean {
        const x = index % this.width;
        const y = Math.floor(index / this.width);
        if (x >= 2 && this.grid[this.getIndex(x - 1, y)] === type && this.grid[this.getIndex(x - 2, y)] === type) return true;
        if (y >= 2 && this.grid[this.getIndex(x, y - 1)] === type && this.grid[this.getIndex(x, y - 2)] === type) return true;
        return false;
    }

    public swap(x1: number, y1: number, x2: number, y2: number): void {
        const idx1 = this.getIndex(x1, y1);
        const idx2 = this.getIndex(x2, y2);
        const temp = this.grid[idx1];
        this.grid[idx1] = this.grid[idx2];
        this.grid[idx2] = temp;
    }

    public findMatches(outMatchedIndices: Set<number>, outBoosters: Map<number, number>, activeIdx: number = -1): boolean {
        outMatchedIndices.clear();
        outBoosters.clear();

        const hMatch = new Set<number>();
        const vMatch = new Set<number>();
        const sqMatch = new Set<number>();

        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                const t = this.grid[this.getIndex(x, y)];
                if (t === 0 || t >= 10) continue;
                if (t === this.grid[this.getIndex(x + 1, y)] && t === this.grid[this.getIndex(x, y + 1)] && t === this.grid[this.getIndex(x + 1, y + 1)]) {
                    sqMatch
                        .add(this.getIndex(x, y))
                        .add(this.getIndex(x + 1, y))
                        .add(this.getIndex(x, y + 1))
                        .add(this.getIndex(x + 1, y + 1));
                }
            }
        }

        for (let y = 0; y < this.height; y++) {
            let len = 1;
            for (let x = 0; x < this.width; x++) {
                const t1 = this.grid[this.getIndex(x, y)];
                const t2 = x < this.width - 1 ? this.grid[this.getIndex(x + 1, y)] : -1;
                if (t1 !== 0 && t1 < 10 && t1 === t2) {
                    len++;
                } else {
                    if (len >= 3) {
                        const startX = x - len + 1;
                        const matchIds = [];
                        for (let i = 0; i < len; i++) {
                            hMatch.add(this.getIndex(startX + i, y));
                            matchIds.push(this.getIndex(startX + i, y));
                        }

                        if (len >= 5) {
                            const spawn = matchIds.includes(activeIdx) ? activeIdx : matchIds[2];
                            outBoosters.set(spawn, GameConfig.ElementTypes.RocketHor);
                        }
                    }
                    len = 1;
                }
            }
        }

        for (let x = 0; x < this.width; x++) {
            let len = 1;
            for (let y = 0; y < this.height; y++) {
                const t1 = this.grid[this.getIndex(x, y)];
                const t2 = y < this.height - 1 ? this.grid[this.getIndex(x, y + 1)] : -1;
                if (t1 !== 0 && t1 < 10 && t1 === t2) {
                    len++;
                } else {
                    if (len >= 3) {
                        const startY = y - len + 1;
                        const matchIds = [];
                        for (let i = 0; i < len; i++) {
                            vMatch.add(this.getIndex(x, startY + i));
                            matchIds.push(this.getIndex(x, startY + i));
                        }

                        if (len >= 5) {
                            const spawn = matchIds.includes(activeIdx) ? activeIdx : matchIds[2];
                            if (!outBoosters.has(spawn)) outBoosters.set(spawn, GameConfig.ElementTypes.RocketVert);
                        }
                    }
                    len = 1;
                }
            }
        }

        if (sqMatch.size > 0) {
            let spawnIdx = -1;
            sqMatch.forEach((idx) => {
                if (spawnIdx === -1) spawnIdx = idx;
                if (idx === activeIdx) spawnIdx = activeIdx;
            });
            if (!outBoosters.has(spawnIdx)) outBoosters.set(spawnIdx, GameConfig.ElementTypes.Bomb);
        }

        hMatch.forEach((i) => outMatchedIndices.add(i));
        vMatch.forEach((i) => outMatchedIndices.add(i));
        sqMatch.forEach((i) => outMatchedIndices.add(i));

        if (outMatchedIndices.size > 0) {
            outMatchedIndices.forEach((idx) => (this.grid[idx] = 0));

            outBoosters.forEach((type, idx) => {
                this.grid[idx] = type;
            });
            return true;
        }
        return false;
    }

    public activateBooster(x: number, y: number, outMatchedIndices: Set<number>, outActivatedBoosters: Map<number, number>): boolean {
        outMatchedIndices.clear();
        outActivatedBoosters.clear();

        const startIdx = this.getIndex(x, y);
        if (this.grid[startIdx] < 10) return false;

        const queue = [startIdx];
        outMatchedIndices.add(startIdx);

        outActivatedBoosters.set(startIdx, this.grid[startIdx]);

        while (queue.length > 0) {
            const curr = queue.shift();
            const cx = curr % this.width;
            const cy = Math.floor(curr / this.width);
            const type = this.grid[curr];
            this.grid[curr] = 0;

            const pushToExplosion = (nx: number, ny: number) => {
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    const nIdx = this.getIndex(nx, ny);
                    if (!outMatchedIndices.has(nIdx) && this.grid[nIdx] !== 0) {
                        outMatchedIndices.add(nIdx);
                        if (this.grid[nIdx] >= 10) {
                            queue.push(nIdx);

                            outActivatedBoosters.set(nIdx, this.grid[nIdx]);
                        } else {
                            this.grid[nIdx] = 0;
                        }
                    }
                }
            };

            if (type === GameConfig.ElementTypes.Bomb) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        pushToExplosion(cx + dx, cy + dy);
                    }
                }
            } else if (type === GameConfig.ElementTypes.RocketHor) {
                for (let nx = 0; nx < this.width; nx++) {
                    pushToExplosion(nx, cy);
                }
            } else if (type === GameConfig.ElementTypes.RocketVert) {
                for (let ny = 0; ny < this.height; ny++) {
                    pushToExplosion(cx, ny);
                }
            }
        }
        return outMatchedIndices.size > 0;
    }

    public applyGravity(): number {
        let dropCount = 0;
        for (let x = 0; x < this.width; x++) {
            let emptyY = this.height - 1;
            for (let y = this.height - 1; y >= 0; y--) {
                const type = this.getType(x, y);
                if (type !== 0) {
                    if (y !== emptyY) {
                        this.setType(x, emptyY, type);
                        this.setType(x, y, 0);
                        const info = this.dropBuffer[dropCount++];
                        info.x = x;
                        info.startY = y;
                        info.endY = emptyY;
                        info.type = type;
                    }
                    emptyY--;
                }
            }
            for (let y = emptyY; y >= 0; y--) {
                const newType = Math.floor(Math.random() * 4) + 1;
                this.setType(x, y, newType);
                const info = this.dropBuffer[dropCount++];
                info.x = x;
                info.startY = y - this.height;
                info.endY = y;
                info.type = newType;
            }
        }
        return dropCount;
    }
}
