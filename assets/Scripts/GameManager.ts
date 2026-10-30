import { _decorator, Component, Node, Label, Vec3 } from 'cc';
import { Match3Model } from './Match3Model';
import { BoardView } from './BoardView';
import { GameConfig } from './GameConfig';
import { EnemyController } from './EnemyController';
import { CtaScreen } from './CtaScreen';
import { AudioManager } from './AudioManager';
import { TutorialHand } from './TutorialHand';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    public static Instance: GameManager = null;

    @property(Node) boardNode: Node = null;
    @property(Node) enemyNode: Node = null;
    @property(CtaScreen) ctaScreen: CtaScreen = null;
    @property(Label) movesLabel: Label = null;
    @property(TutorialHand) tutorialHand: TutorialHand = null;

    private board: BoardView = null;
    private enemy: EnemyController = null;

    private model: Match3Model = new Match3Model();
    private activatedBoosters = new Map<number, number>();
    private matchedBuffer = new Set<number>();
    private boosterSpawnBuffer = new Map<number, number>();

    private readonly currentTutorialMove = { x1: 0, y1: 0, x2: 0, y2: 0, isTap: false };
    private hasActiveTutorial: boolean = false;
    private readonly tempWorldStart = new Vec3();
    private readonly tempWorldEnd = new Vec3();

    public canInput: boolean = true;
    private comboCount: number = 0;

    public maxMoves: number = 15;
    private currentMoves: number = 0;
    private isGameOver: boolean = false;

    protected onLoad() {
        GameManager.Instance = this;
        if (this.boardNode) this.board = this.boardNode.getComponent(BoardView);
        if (this.enemyNode) this.enemy = this.enemyNode.getComponent(EnemyController);

        if (this.board) {
            this.board.node.on('board-try-swap', this.onUserSwipe, this);
            this.board.node.on('board-try-tap', this.onUserTap, this);
        }
    }

    protected start() {
        this.currentMoves = this.maxMoves;
        this.updateMovesUI();
        this.model.fillRandomly();
        this.board.initBoard(this.model);
        this.initTutorial();
    }

    private initTutorial() {
        if (!this.tutorialHand || !this.board) return;

        if (this.model.findValidMove(this.currentTutorialMove)) {
            this.hasActiveTutorial = true;

            this.board.getCellWorldPos(this.currentTutorialMove.x1, this.currentTutorialMove.y1, this.tempWorldStart);
            this.board.getCellWorldPos(this.currentTutorialMove.x2, this.currentTutorialMove.y2, this.tempWorldEnd);

            this.tutorialHand.showTutorialAtWorldPos(this.tempWorldStart, this.tempWorldEnd, this.currentTutorialMove.isTap);
        }
    }

    private updateMovesUI() {
        if (this.movesLabel) {
            this.movesLabel.string = `${this.currentMoves}`;
        }
    }

    private onUserTap(x: number, y: number) {
        if (!this.canInput || this.isGameOver) return;

        if (this.hasActiveTutorial) {
            if (!this.currentTutorialMove.isTap || this.currentTutorialMove.x1 !== x || this.currentTutorialMove.y1 !== y) {
                return;
            }

            this.finishTutorial();
        }

        if (this.model.activateBooster(x, y, this.matchedBuffer, this.activatedBoosters)) {
            this.canInput = false;
            this.comboCount = 1;

            AudioManager.instance?.playPutSound();
            this.currentMoves--;
            this.updateMovesUI();

            this.board.playBoosterEffects(this.activatedBoosters);
            this.processMatches();
        }
    }

    private onUserSwipe(x1: number, y1: number, x2: number, y2: number) {
        if (!this.canInput || this.isGameOver) return;

        if (this.hasActiveTutorial) {
            const matchTarget = (this.currentTutorialMove.x1 === x1 && this.currentTutorialMove.y1 === y1 && this.currentTutorialMove.x2 === x2 && this.currentTutorialMove.y2 === y2) || (this.currentTutorialMove.x1 === x2 && this.currentTutorialMove.y1 === y2 && this.currentTutorialMove.x2 === x1 && this.currentTutorialMove.y2 === y1);

            if (!matchTarget) {
                return;
            }

            this.finishTutorial();
        }

        this.canInput = false;
        AudioManager.instance?.playPutSound();
        this.model.swap(x1, y1, x2, y2);

        this.board.swapVisuals(x1, y1, x2, y2, () => {
            const activeIdx = y2 * GameConfig.GridWidth + x2;

            if (this.model.findMatches(this.matchedBuffer, this.boosterSpawnBuffer, activeIdx)) {
                this.comboCount = 1;
                this.currentMoves--;
                this.updateMovesUI();
                this.processMatches();
            } else {
                AudioManager.instance?.playPutSound();
                this.model.swap(x1, y1, x2, y2);
                this.board.swapVisuals(x1, y1, x2, y2, () => (this.canInput = true));
            }
        });
    }

    private finishTutorial() {
        this.hasActiveTutorial = false;
        if (this.tutorialHand) {
            this.tutorialHand.hide();
        }
    }

    private processMatches() {
        AudioManager.instance?.playPopSound();
        const damage = this.matchedBuffer.size * 10 * this.comboCount;
        const isEnemyDead = this.enemy.takeDamage(damage);

        if (isEnemyDead && !this.isGameOver) {
            this.endGame();
        }

        this.board.blowUpGems(this.matchedBuffer, () => {
            this.board.spawnBoosters(this.boosterSpawnBuffer);
            const dropCount = this.model.applyGravity();

            this.board.animateDrops(this.model.dropBuffer, dropCount, () => {
                if (this.isGameOver) return;

                if (this.model.findMatches(this.matchedBuffer, this.boosterSpawnBuffer)) {
                    this.comboCount++;
                    this.processMatches();
                } else {
                    if (this.currentMoves <= 0) {
                        this.endGame();
                    } else {
                        this.canInput = true;
                    }
                }
            });
        });
    }

    private endGame() {
        this.isGameOver = true;
        this.canInput = false;
        this.finishTutorial();

        if (this.ctaScreen) {
            this.ctaScreen.show();
        }
    }
}
