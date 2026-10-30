import { Color } from 'cc';

export const GameConfig = {
    GridWidth: 6,
    GridHeight: 8,
    CellSize: 80,
    CellSpacing: 4,

    ElementTypes: {
        Empty: 0,
        Fire: 1,
        Water: 2,
        Earth: 3,
        Light: 4,

        Bomb: 10,
        RocketHor: 11,
        RocketVert: 12
    },

    Colors: {
        Empty: new Color(255, 255, 255, 255),
        1: new Color(220, 50, 50, 255),
        2: new Color(50, 150, 220, 255),
        3: new Color(50, 200, 50, 255),
        4: new Color(220, 200, 50, 255)
    }
} as const;

export class DropInfo {
    public x: number = 0;
    public startY: number = 0;
    public endY: number = 0;
    public type: number = 0;
}
