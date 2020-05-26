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
    readonly prevPlayer: Coord,
    readonly completed: boolean;
    moveElapse: number,
    readonly params: {
        readonly cellSize: number,
        readonly originX: number,
        readonly originY: number,
        readonly width: number;
        readonly height: number;
    };
}

const animationLength = 15;

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

function createBoard(level: Level, centerPosX = 320, centerPosY = 240, maxBoardWidth = 600, maxBoardHeight = 440): Board {
    const cells: Cell[][] = level.map(row => row.map(piece => piece !== undefined ? { correct: piece, current: piece } : undefined));
    const knightSearch = flat(level.map((row, x) => row.map((piece, y) => ({ piece, coord: { x, y } })))).find(x => x.piece === "knight");
    if (knightSearch === undefined) throw new Error("board must have a knight");

    const width = cells.length;
    const height = Math.max(...cells.map(x => x.length));
    const cellSize = Math.min(maxBoardWidth / width, maxBoardHeight / height);
    const originX = centerPosX - cellSize * (width - 1) / 2;
    const originY = centerPosY - cellSize * (height - 1) / 2;

    return shuffle({
        cells,
        player: knightSearch.coord,
        prevPlayer: knightSearch.coord,
        moveElapse: 0,
        completed: true,
        params: {
            cellSize,
            originX,
            originY,
            width,
            height,
        }
    });
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

    const cells = setCell(setCell(board.cells, board.player, toCell.current), to, "knight");

    return {
        player: to,
        cells: cells,
        completed: isCompleted(cells),
        prevPlayer: board.player,
        moveElapse: 0,
        params: board.params,
    };
}

//クリックできるところにあるか
function isReachableCoord(coord: Coord, board: Board): boolean {
    return getCell(board.cells, coord) !== undefined &&
        knightMove.some(dir => coord.x - board.player.x == dir.x && coord.y - board.player.y == dir.y);
}

//盤面をシャッフル
function shuffle(board: Board, count: number = 0, prevBoard: Board = board): Board {
    if (count <= 0) {
        if (board.completed)
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
        title: loadImage("resources/images/title.svg"),
        reachable: loadImage("resources/images/reachable.svg"),
        completed: loadImage("resources/images/completed.svg"),
        pieces: {
            player: loadImage("resources/images/player.svg"),
            pawn: loadImage("resources/images/pawn.svg"),
            knight: loadImage("resources/images/knight.svg"),
            rook: loadImage("resources/images/rook.svg"),
            bishop: loadImage("resources/images/bishop.svg"),
        },
        correctPieces: {
            pawn: loadImage("resources/images/pawn_ref.svg"),
            knight: loadImage("resources/images/knight_ref.svg"),
            rook: loadImage("resources/images/rook_ref.svg"),
            bishop: loadImage("resources/images/bishop_ref.svg"),
        },
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

type Level = readonly (Piece | undefined)[][];

interface Pos {
    readonly x: number;
    readonly y: number;
}

interface Game {
    readonly type: "game",
    readonly board: Board,
}


function createGame(level: Level): Game {
    return {
        type: "game",
        board: {
            ...createBoard(level),
            moveElapse: 10000,
        },
    };
}

function coordToPos(coord: Coord, board: Board): Pos {
    return {
        x: coord.x * board.params.cellSize + board.params.originX,
        y: coord.y * board.params.cellSize + board.params.originY,
    };
}

function posToCoord(pos: Pos, board: Board): Coord {
    return {
        x: Math.round((pos.x - board.params.originX) / board.params.cellSize),
        y: Math.round((pos.y - board.params.originY) / board.params.cellSize),
    };
}

interface Menu {
    readonly type: "menu";
    readonly levels: readonly Level[];
}

function createMenu(): Menu {
    return {
        type: "menu",
        levels: [
            [
                ["knight", "blank", "blank", "blank"],
                ["blank", "blank", "blank", "blank"],
                ["blank", "blank", "blank", "blank"],
                ["blank", "blank", "blank", "knight"],
            ]
        ],
    };
}

interface Title {
    readonly type: "title";
    readonly board: Board;
}

function createTitle(): Title {
    return {
        type: "title",
        board: {
            ...createBoard([
                ["blank", "blank"],
                ["blank", "blank"],
                ["blank", "blank"],
                ["knight", "blank"],
                ["blank", "blank"]], 320, 300, 500),
            moveElapse: 10000,
        },
    };
}

type State = Game | Menu | Title;

interface Manager {
    readonly state: State;
    readonly nextState: State | null;
    readonly fadeCount: number;
}

function createManager(state: State): Manager {
    return {
        state: state,
        nextState: null,
        fadeCount: 0,
    };
}

function makeTransition(manager: Manager, nextState: State): Manager {
    return {
        state: manager.state,
        nextState: nextState,
        fadeCount: 0,
    };
}

function updateManager(manager: Manager): Manager {
    if (manager.nextState !== null) {
        if (60 <= manager.fadeCount) {
            return {
                state: manager.nextState,
                nextState: null,
                fadeCount: 0,
            };
        }
        return {
            state: manager.state,
            nextState: manager.nextState,
            fadeCount: manager.fadeCount + 1,
        };
    }
    if (manager.state.type === "title" && manager.state.board.completed && animationLength < manager.state.board.moveElapse)
        return makeTransition(manager, createMenu());
    return manager;
}

function clickTitle(pos: Pos, title: Title, manager: Manager): Manager {
    const title2 = {
        type: "title" as const,
        board: clickBoard(pos, title.board),
    };
    return {
        state: title2,
        nextState: manager.nextState,
        fadeCount: manager.fadeCount,
    };
}

function clickMenu(pos: Pos, menu: Menu, manager: Manager): Manager {
    return makeTransition(manager, createGame(menu.levels[0]));
}

function clickBoard(pos: Pos, board: Board): Board {
    const coord = posToCoord(pos, board);
    if (!isReachableCoord(coord, board)) return board;

    return move(board, coord) || board;
}

function clickGame(pos: Pos, game: Game, manager: Manager): Manager {
    if (game.board.completed) {
        return makeTransition(manager, createMenu());
    }

    const game2 = {
        type: "game" as const,
        board: clickBoard(pos, game.board),
    };

    return {
        state: game2,
        nextState: manager.nextState,
        fadeCount: manager.fadeCount,
    };
}

function click(pos: Pos, manager: Manager): Manager {
    if (manager.nextState !== null) return manager;
    switch (manager.state.type) {
        case "menu": return clickMenu(pos, manager.state, manager);
        case "game": return clickGame(pos, manager.state, manager);
        case "title": return clickTitle(pos, manager.state, manager);
        default: return manager;
    }
}

function drawGlid(screen: Screen2D, board: Board, resources: Resources) {
    //グリッドを描画
    for (let x = -1; x < board.params.width; x++) {
        for (let y = -1; y < board.params.height; y++) {
            const id =
                ([[[[0, 1], [2, 3]], [[4, 5], [6, 7]]], [[[8, 9], [10, 11]], [[12, 13], [14, 15]]]] as const)
                [getCell(board.cells, { x: x + 0, y: y + 0 }) === undefined ? 0 : 1]
                [getCell(board.cells, { x: x + 1, y: y + 0 }) === undefined ? 0 : 1]
                [getCell(board.cells, { x: x + 0, y: y + 1 }) === undefined ? 0 : 1]
                [getCell(board.cells, { x: x + 1, y: y + 1 }) === undefined ? 0 : 1];
            const pos = coordToPos({ x, y }, board);

            if (id !== 0) {
                screen.drawImage(resources.glids[id], pos.x, pos.y, board.params.cellSize, board.params.cellSize);
            }
        }
    }
}


function drawCorrectPieces(screen: Screen2D, board: Board, resources: Resources) {
    board.cells.forEach((row, x) => row.forEach((cell, y) => {
        if (cell !== undefined && cell.correct !== "blank") {
            const pos = coordToPos({ x, y }, board);
            screen.drawImage(resources.correctPieces[cell.correct],
                pos.x - board.params.cellSize / 2,
                pos.y - board.params.cellSize / 2,
                board.params.cellSize,
                board.params.cellSize);
        }
    }));
}

function drawPieces(screen: Screen2D, board: Board, resources: Resources) {
    board.cells.forEach((row, x) => row.forEach((cell, y) => {
        if (cell !== undefined) {
            const pos = coordToPos({ x, y }, board);

            screen.globalAlpha = Math.max(Math.min((board.moveElapse - 30) / 10, 1), 0);
            if (!board.completed && isReachableCoord({ x, y }, board)) {
                screen.drawImage(resources.reachable,
                    pos.x - board.params.cellSize / 2,
                    pos.y - board.params.cellSize / 2,
                    board.params.cellSize,
                    board.params.cellSize);
            }
            screen.globalAlpha = 1;

            if (cell.current !== "blank") {
                if (x == board.prevPlayer.x && y == board.prevPlayer.y) {
                    const animatedPos = animation(coordToPos(board.player, board), coordToPos(board.prevPlayer, board), board.moveElapse);
                    screen.drawImage(resources.pieces[cell.current],
                        animatedPos.x - board.params.cellSize / 2,
                        animatedPos.y - board.params.cellSize / 2,
                        board.params.cellSize,
                        board.params.cellSize);
                }
                else if (!(x == board.player.x && y == board.player.y)) {
                    screen.drawImage(resources.pieces[cell.current],
                        pos.x - board.params.cellSize / 2,
                        pos.y - board.params.cellSize / 2,
                        board.params.cellSize,
                        board.params.cellSize);
                }
            }
        }
    }));

    const animatedPos = animation(coordToPos(board.prevPlayer, board), coordToPos(board.player, board), board.moveElapse);
    screen.drawImage(resources.pieces.player,
        animatedPos.x - board.params.cellSize / 2,
        animatedPos.y - board.params.cellSize / 2,
        board.params.cellSize,
        board.params.cellSize);

    function animation(pos1: Pos, pos2: Pos, elapse: number) {
        const rate = Math.min(1, elapse / (animationLength + 10));
        const mix = rate * rate * (3 - 2 * rate);
        return {
            x: pos1.x + (pos2.x - pos1.x) * mix,
            y: pos1.y + (pos2.y - pos1.y) * mix,
        };
    }
}

function drawBoard(screen: Screen2D, board: Board, resources: Resources) {
    board.moveElapse++;

    drawGlid(screen, board, resources);
    drawCorrectPieces(screen, board, resources);
    drawPieces(screen, board, resources);
}

function drawGame(screen: Screen2D, game: Game, resources: Resources) {
    drawBoard(screen, game.board, resources);

    if (30 < game.board.moveElapse && game.board.completed) {
        fade(screen, Math.max(0, Math.min(0.5, (game.board.moveElapse - 30) / 30)));
        screen.drawImage(resources.completed, 80, 0, 480, 480);
    }
}

function drawMenu(screen: Screen2D, menu: Menu, resources: Resources) {
    screen.fillStyle = "black";
    screen.fillText("menu", 100, 100);
}

function drawTitle(screen: Screen2D, title: Title, resources: Resources) {
    drawBoard(screen, title.board, resources);
    screen.drawImage(resources.title, 80, 0, 480, 480);
}

function drawState(screen: Screen2D, state: State, resources: Resources) {
    switch (state.type) {
        case "menu": drawMenu(screen, state, resources); break;
        case "game": drawGame(screen, state, resources); break;
        case "title": drawTitle(screen, state, resources); break;
    }
}

function fade(screen: Screen2D, fade: number) {
    fade = Math.min(1, Math.max(0, fade));
    if (fade === 0) return;
    screen.fillStyle = "white";
    screen.globalAlpha = fade;
    screen.fillRect(0, 0, screen.canvas.width, screen.canvas.height);
    screen.globalAlpha = 1;
}
function draw(screen: Screen2D, manager: Manager, resources: Resources) {
    const fadeinLength = 30;
    const fadeoutLength = 30;

    screen.clearRect(0, 0, screen.canvas.width, screen.canvas.height);

    if (manager.nextState !== null) {
        if (manager.fadeCount < 30) {
            drawState(screen, manager.state, resources);
            fade(screen, manager.fadeCount / fadeoutLength);
        }
        if (30 <= manager.fadeCount) {
            drawState(screen, manager.nextState, resources);
            fade(screen, (fadeoutLength + fadeinLength - manager.fadeCount) / fadeinLength);
        }
    }
    else {
        drawState(screen, manager.state, resources);
    }
}

type Screen2D = CanvasRenderingContext2D;

function createScreen(width: number, height: number, canvas = document.createElement("canvas")): Screen2D {
    canvas.width = width;
    canvas.height = height;
    const screen = canvas.getContext("2d");
    if (screen === null)
        throw new Error("screen2d not found");
    return screen;
}

window.onload = () => {
    const canvas = document.getElementById("canvas");
    if (canvas === null || !(canvas instanceof HTMLCanvasElement))
        throw new Error("canvas not found");
    const screen = createScreen(640, 480, canvas);
    const title = createTitle();
    const resources = loadResources();

    let manager: Manager = createManager(title);

    canvas.addEventListener("click", (event) => {
        manager = click({ x: event.offsetX, y: event.offsetY }, manager);
    });
    loop(screen);

    function loop(screen: Screen2D) {
        manager = updateManager(manager);
        draw(screen, manager, resources);
        requestAnimationFrame(() => loop(screen));
    }
};