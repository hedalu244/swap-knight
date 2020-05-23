type Piece = "blank" | "knight" | "pawn" | "rook" | "bishop";

type Cell = {
    readonly correct: Piece;
    readonly current: Piece;
} | undefined;

interface Coord {
    readonly x: number;
    readonly y: number;
}
interface Direction {
    readonly x: number;
    readonly y: number;
}

interface Board {
    readonly cells: Cell[][];
    readonly player: Coord;
}

//ナイトが動ける方向(時計回り)
const knightMove = [
    { x: 1, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: -1 },
    { x: 1, y: -2 },
    { x: -1, y: -2 },
    { x: -2, y: -1 },
    { x: -2, y: 1 },
    { x: -1, y: 2 },
];

function flat<T>(array: T[][]): T[] {
    return array.reduce((prev, cur) => [...prev, ...cur], ([] as T[]));
}

function createBoard(initial: readonly (Piece | undefined)[][]): Board {
    const cells: Cell[][] = initial.map(row => row.map(piece => piece !== undefined ? { correct: piece, current: piece } : undefined));
    const knightSearch = flat(initial.map((row, x) => row.map((piece, y) => ({ piece, coord: { x, y } })))).find(x => x.piece === "knight");
    if (knightSearch === undefined) throw new Error("board must have a knight");
    return {
        cells,
        player: knightSearch.coord,
    };
}

function setCell(cells: Cell[][], coord: Coord, piece: Piece): Cell[][] {
    return cells.map((row, x) =>
        row.map((cell, y) =>
            cell !== undefined && x == coord.x && y == coord.y
                ? { correct: cell.correct, current: piece } : cell));
}

//範囲外ならundefined
function getCell(cells: Cell[][], coord: Coord): Cell {
    const row = cells[coord.x];
    if (row === undefined) return undefined;
    return row[coord.y];
}

//移動先のセルを求める
function getDestinationCoord(coord: Coord, direction: Direction): Coord {
    return {
        x: coord.x + direction.x,
        y: coord.y + direction.y,
    };
}

//特定のマスが初期配置に戻されているか
function isCorrect(cell: Cell): boolean {
    if (cell === undefined) return true;
    return cell.correct === cell.current;
}
//クリアしたか？(全てのマスが初期配置に戻されているか)
function isCompleted(cells: Cell[][]): boolean {
    return cells.every(row => row.every(cell => isCorrect(cell)));
}

//移動後のBoardを返す
function move(board: Board, to: Coord): Board | null {
    //移動先座標が範囲外だったら移動不可
    const toCell = getCell(board.cells, to);
    if (toCell === undefined) return null;

    return {
        player: to,
        cells: setCell(setCell(board.cells, board.player, toCell.current), to, "knight"),
    };
}

//一歩で移動できるところにあるか
function isReachableCoord(coord: Coord, board: Board): boolean {
    return getCell(board.cells, coord) !== undefined &&
        knightMove.some(dir => coord.x - board.player.x == dir.x && coord.y - board.player.y == dir.y);
}

//盤面をシャッフル
function shuffle(board: Board, count: number = 0, prevBoard: Board = board): Board {
    if (count <= 0) {
        if (isCompleted(board.cells))
            return shuffle(board, board.cells.length * 5 + Math.random() * 5);
        return board;
    }

    const possibleBoards = ([] as Board[]).concat(...knightMove
        .map(direction => {
            const coord = getDestinationCoord(board.player, direction);
            const cell = getCell(board.cells, coord);
            //戻るような手は選ばない
            if (coord.x === prevBoard.player.x && coord.y === prevBoard.player.y)
                return [];

            const board2 = move(board, coord);
            // 移動不能マスは抜く
            if (board2 === null) return [];
            //既に揃っているマスには積極的に進める
            if (isCorrect(cell))
                return [board2, board2, board2];
            return [board2];
        }));

    if (0 < possibleBoards.length) {
        //適当な手を選んで進める
        return shuffle(possibleBoards[Math.floor(Math.random() * possibleBoards.length)], count - 1, board);
    }
    else {
        //行く先がなかった場合、仕方なく一歩戻る
        return shuffle(prevBoard, count - 1, board);
    }
}

function loadResources() {
    const progress = {
        registeredCount: 0,
        finishedCount: 0,
        errorCount: 0,
        isFinished: function (): boolean {
            return this.registeredCount === this.finishedCount + this.errorCount;
        },
        rate: function (): number {
            return (this.finishedCount + this.errorCount) / this.registeredCount;
        }
    };

    return {
        _progress: progress,
        player: loadImage("resources/images/player.svg"),
        pawn: loadImage("resources/images/pawn.svg"),
        knight: loadImage("resources/images/knight.svg"),
        rook: loadImage("resources/images/rook.svg"),
        bishop: loadImage("resources/images/bishop.svg"),
        reachable: loadImage("resources/images/reachable.svg"),
        glids: {
            1: loadImage("resources/images/glid1.svg"),
            2: loadImage("resources/images/glid2.svg"),
            3: loadImage("resources/images/glid3.svg"),
            4: loadImage("resources/images/glid4.svg"),
            5: loadImage("resources/images/glid5.svg"),
            6: loadImage("resources/images/glid6.svg"),
            7: loadImage("resources/images/glid7.svg"),
            8: loadImage("resources/images/glid8.svg"),
            9: loadImage("resources/images/glid9.svg"),
            10: loadImage("resources/images/glid10.svg"),
            11: loadImage("resources/images/glid11.svg"),
            12: loadImage("resources/images/glid12.svg"),
            13: loadImage("resources/images/glid13.svg"),
            14: loadImage("resources/images/glid14.svg"),
            15: loadImage("resources/images/glid15.svg"),
        }
    } as const;

    function loadImage(source: string, onload: () => void = () => { }): HTMLImageElement {
        const image = new Image();
        progress.registeredCount++;
        image.addEventListener('load', () => {
            progress.finishedCount++;
            onload();
        }, false);
        image.addEventListener("error", () => {
            progress.errorCount++;
        });
        image.src = source;
        return image;
    }
    function loadAudio(source: string, onload: () => void = () => { }): HTMLAudioElement {
        const audio = new Audio();
        audio.addEventListener('canplaythrough', () => {
            progress.finishedCount++;
            onload();
        }, false);
        audio.addEventListener("error", () => {
            progress.errorCount++;
        });
        audio.src = source;
        return audio;
    }
}

type Resources = ReturnType<typeof loadResources>;

interface Level {
    readonly initial: readonly (Piece | undefined)[][];
    readonly width: number,
    readonly height: number,
}

interface Pos {
    readonly x: number;
    readonly y: number;
}

function coordToPos(coord: Coord, game: Game): Pos {
    return {
        x: coord.x * game.cellSize + game.originX,
        y: coord.y * game.cellSize + game.originY,
    };
}

function posToCoord(pos: Pos, game: Game): Coord {
    return {
        x: Math.round((pos.x - game.originX) / game.cellSize),
        y: Math.round((pos.y - game.originY) / game.cellSize),
    };
}

function createGame(level: Level): Game {
    const maxBoardWidth = 300;
    const maxBoardHeight = 300;
    const centerPosX = 200;
    const centerPosY = 200;

    const board = shuffle(createBoard(level.initial));

    const cellSize = Math.min(maxBoardWidth / level.width, maxBoardHeight / level.height);
    const originX = centerPosX - cellSize * (level.width - 1) / 2;
    const originY = centerPosY - cellSize * (level.height - 1) / 2;

    return {
        board,
        level,
        cellSize,
        originX,
        originY,
    };
}

interface Game {
    board: Board,
    level: Level,
    cellSize: number,
    originX: number,
    originY: number,
}

function drawGlid(context: CanvasRenderingContext2D, game: Game, resources: Resources) {
    //グリッドを描画
    for (let x = -1; x < game.level.width; x++) {
        for (let y = -1; y < game.level.height; y++) {
            const id =
                ([[[[0, 1], [2, 3]], [[4, 5], [6, 7]]], [[[8, 9], [10, 11]], [[12, 13], [14, 15]]]] as const)
                [getCell(game.board.cells, { x: x + 0, y: y + 0 }) === undefined ? 0 : 1]
                [getCell(game.board.cells, { x: x + 1, y: y + 0 }) === undefined ? 0 : 1]
                [getCell(game.board.cells, { x: x + 0, y: y + 1 }) === undefined ? 0 : 1]
                [getCell(game.board.cells, { x: x + 1, y: y + 1 }) === undefined ? 0 : 1];
            const pos = coordToPos({ x, y }, game);

            if (id !== 0) {
                context.drawImage(resources.glids[id], pos.x, pos.y, game.cellSize, game.cellSize);
            }
        }
    }
}


function drawCorrectPieces(context: CanvasRenderingContext2D, game: Game, resources: Resources) {
    game.board.cells.forEach((row, x) => row.forEach((cell, y) => {
        if (cell !== undefined && cell.correct !== "blank") {
            const pos = coordToPos({ x, y }, game);
            context.drawImage(resources[cell.correct],
                pos.x - game.cellSize / 2,
                pos.y - game.cellSize / 2,
                game.cellSize,
                game.cellSize);
        }
    }));
}

function drawPieces(context: CanvasRenderingContext2D, game: Game, resources: Resources) {
    game.board.cells.forEach((row, x) => row.forEach((cell, y) => {
        if (cell !== undefined) {
            const pos = coordToPos({ x, y }, game);

            if (isReachableCoord({ x, y }, game.board)) {
                context.drawImage(resources.reachable,
                    pos.x - game.cellSize / 2,
                    pos.y - game.cellSize / 2,
                    game.cellSize,
                    game.cellSize);
            }

            if (x == game.board.player.x && y == game.board.player.y)
                context.drawImage(resources.player,
                    pos.x - game.cellSize / 2,
                    pos.y - game.cellSize / 2,
                    game.cellSize,
                    game.cellSize);
            else if (cell.current !== "blank") {
                context.drawImage(resources[cell.current],
                    pos.x - game.cellSize / 2,
                    pos.y - game.cellSize / 2,
                    game.cellSize,
                    game.cellSize);
            }
        }
    }));
}

function draw(context: CanvasRenderingContext2D, game: Game, resources: Resources) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    drawGlid(context, game, resources);
    drawPieces(context, game, resources);

    requestAnimationFrame(() => draw(context, game, resources));
}

function click(pos: Pos, game: Game) {
    const coord = posToCoord(pos, game);
    if (isReachableCoord(coord, game.board)) {
        const board2 = move(game.board, coord);
        if (board2 !== null) game.board = board2;
    }
}

window.onload = () => {
    const canvas = document.getElementById("canvas");
    if (canvas === null || !(canvas instanceof HTMLCanvasElement))
        throw new Error("canvas not found");

    const context = canvas.getContext("2d");
    if (context === null)
        throw new Error("context2d not found");

    canvas.addEventListener("click", (event) => {
        click({ x: event.offsetX, y: event.offsetY }, game);
    });
    const level: Level = {
        initial: [
            ["knight", "blank", "blank"],
            ["pawn", "blank", "blank"],
            ["pawn", "blank", "blank"],
        ],
        width: 3,
        height: 3,
    };
    const game = createGame(level);
    const resources = loadResources();
    draw(context, game, resources);
};