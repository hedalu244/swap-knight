"use strict";
const animationLength = 30;
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
function flat(array) {
    return array.reduce((prev, cur) => [...prev, ...cur], []);
}
function createBoard(level) {
    const maxBoardWidth = 300;
    const maxBoardHeight = 300;
    const centerPosX = 200;
    const centerPosY = 200;
    const cells = level.map(row => row.map(piece => piece !== undefined ? { correct: piece, current: piece } : undefined));
    const knightSearch = flat(level.map((row, x) => row.map((piece, y) => ({ piece, coord: { x, y } })))).find(x => x.piece === "knight");
    if (knightSearch === undefined)
        throw new Error("board must have a knight");
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
function setCell(cells, coord, piece) {
    return cells.map((row, x) => row.map((cell, y) => cell !== undefined && x == coord.x && y == coord.y
        ? { correct: cell.correct, current: piece } : cell));
}
//範囲外ならundefined
function getCell(cells, coord) {
    const row = cells[coord.x];
    if (row === undefined)
        return undefined;
    return row[coord.y];
}
//移動先のセルを求める
function getDestinationCoord(coord, direction) {
    return {
        x: coord.x + direction.x,
        y: coord.y + direction.y,
    };
}
//特定のマスが初期配置に戻されているか
function isCorrect(cell) {
    if (cell === undefined)
        return true;
    return cell.correct === cell.current;
}
//クリアしたか？(全てのマスが初期配置に戻されているか)
function isCompleted(cells) {
    return cells.every(row => row.every(cell => isCorrect(cell)));
}
//移動後のBoardを返す
function move(board, to) {
    //移動先座標が範囲外だったら移動不可
    const toCell = getCell(board.cells, to);
    if (toCell === undefined)
        return null;
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
function isReachableCoord(coord, board) {
    return getCell(board.cells, coord) !== undefined &&
        knightMove.some(dir => coord.x - board.player.x == dir.x && coord.y - board.player.y == dir.y);
}
//盤面をシャッフル
function shuffle(board, count = 0, prevBoard = board) {
    if (count <= 0) {
        if (board.completed)
            return shuffle(board, board.cells.length * 5 + Math.random() * 5);
        return board;
    }
    const possibleBoards = [].concat(...knightMove
        .map(direction => {
        const coord = getDestinationCoord(board.player, direction);
        const cell = getCell(board.cells, coord);
        //戻るような手は選ばない
        if (coord.x === prevBoard.player.x && coord.y === prevBoard.player.y)
            return [];
        const board2 = move(board, coord);
        // 移動不能マスは抜く
        if (board2 === null)
            return [];
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
        isFinished: function () {
            return this.registeredCount === this.finishedCount + this.errorCount;
        },
        rate: function () {
            return (this.finishedCount + this.errorCount) / this.registeredCount;
        }
    };
    return {
        _progress: progress,
        reachable: loadImage("resources/images/reachable.svg"),
        pieces: {
            player: loadImage("resources/images/player.svg"),
            pawn: loadImage("resources/images/pawn.svg"),
            knight: loadImage("resources/images/knight.svg"),
            rook: loadImage("resources/images/rook.svg"),
            bishop: loadImage("resources/images/bishop.svg"),
        },
        correctPieces: {
            player: loadImage("resources/images/player.svg"),
            pawn: loadImage("resources/images/pawn.svg"),
            knight: loadImage("resources/images/knight.svg"),
            rook: loadImage("resources/images/rook.svg"),
            bishop: loadImage("resources/images/bishop.svg"),
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
    };
    function loadImage(source, onload = () => { }) {
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
    function loadAudio(source, onload = () => { }) {
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
function setMoveElapse(board, moveElapse) {
    return Object.assign(Object.assign({}, board), { moveElapse: moveElapse });
}
function createGame(level) {
    return {
        type: "game",
        board: setMoveElapse(createBoard(level), animationLength),
    };
}
function coordToPos(coord, board) {
    return {
        x: coord.x * board.params.cellSize + board.params.originX,
        y: coord.y * board.params.cellSize + board.params.originY,
    };
}
function posToCoord(pos, board) {
    return {
        x: Math.round((pos.x - board.params.originX) / board.params.cellSize),
        y: Math.round((pos.y - board.params.originY) / board.params.cellSize),
    };
}
function createMenu() {
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
function createTitle() {
    return {
        type: "title",
        board: setMoveElapse(createBoard([
            ["blank", "blank"],
            ["blank", "blank"],
            ["blank", "blank"],
            ["knight", "blank"],
            ["blank", "blank"],
        ]), animationLength),
    };
}
function createManager(state) {
    return {
        state: state,
        nextState: null,
        fadeCount: 0,
    };
}
function makeTransition(manager, nextState) {
    return {
        state: manager.state,
        nextState: nextState,
        fadeCount: 0,
    };
}
function updateManager(manager) {
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
function clickTitle(pos, title, manager) {
    const title2 = {
        type: "title",
        board: clickBoard(pos, title.board),
    };
    return {
        state: title2,
        nextState: manager.nextState,
        fadeCount: manager.fadeCount,
    };
}
function clickMenu(pos, menu, manager) {
    return makeTransition(manager, createGame(menu.levels[0]));
}
function clickBoard(pos, board) {
    const coord = posToCoord(pos, board);
    if (!isReachableCoord(coord, board))
        return board;
    return move(board, coord) || board;
}
function clickGame(pos, game, manager) {
    if (game.board.completed) {
        return makeTransition(manager, createMenu());
    }
    const game2 = {
        type: "game",
        board: clickBoard(pos, game.board),
    };
    return {
        state: game2,
        nextState: manager.nextState,
        fadeCount: manager.fadeCount,
    };
}
function click(pos, manager) {
    if (manager.nextState !== null)
        return manager;
    switch (manager.state.type) {
        case "menu": return clickMenu(pos, manager.state, manager);
        case "game": return clickGame(pos, manager.state, manager);
        case "title": return clickTitle(pos, manager.state, manager);
        default: return manager;
    }
}
function drawGlid(screen, board, resources) {
    //グリッドを描画
    for (let x = -1; x < board.params.width; x++) {
        for (let y = -1; y < board.params.height; y++) {
            const id = [[[[0, 1], [2, 3]], [[4, 5], [6, 7]]], [[[8, 9], [10, 11]], [[12, 13], [14, 15]]]][getCell(board.cells, { x: x + 0, y: y + 0 }) === undefined ? 0 : 1][getCell(board.cells, { x: x + 1, y: y + 0 }) === undefined ? 0 : 1][getCell(board.cells, { x: x + 0, y: y + 1 }) === undefined ? 0 : 1][getCell(board.cells, { x: x + 1, y: y + 1 }) === undefined ? 0 : 1];
            const pos = coordToPos({ x, y }, board);
            if (id !== 0) {
                screen.drawImage(resources.glids[id], pos.x, pos.y, board.params.cellSize, board.params.cellSize);
            }
        }
    }
}
function drawCorrectPieces(screen, board, resources) {
    board.cells.forEach((row, x) => row.forEach((cell, y) => {
        if (cell !== undefined && cell.correct !== "blank") {
            const pos = coordToPos({ x, y }, board);
            screen.drawImage(resources.correctPieces[cell.correct], pos.x - board.params.cellSize / 2, pos.y - board.params.cellSize / 2, board.params.cellSize, board.params.cellSize);
        }
    }));
}
function drawPieces(screen, board, resources) {
    board.cells.forEach((row, x) => row.forEach((cell, y) => {
        if (cell !== undefined) {
            const pos = coordToPos({ x, y }, board);
            if (!board.completed && isReachableCoord({ x, y }, board)) {
                screen.drawImage(resources.reachable, pos.x - board.params.cellSize / 2, pos.y - board.params.cellSize / 2, board.params.cellSize, board.params.cellSize);
            }
            if (!(x == board.player.x && y == board.player.y) && cell.current !== "blank") {
                screen.drawImage(resources.pieces[cell.current], pos.x - board.params.cellSize / 2, pos.y - board.params.cellSize / 2, board.params.cellSize, board.params.cellSize);
            }
        }
    }));
    const animatedPos = animation(coordToPos(board.prevPlayer, board), coordToPos(board.player, board), board.moveElapse);
    screen.drawImage(resources.pieces.player, animatedPos.x - board.params.cellSize / 2, animatedPos.y - board.params.cellSize / 2, board.params.cellSize, board.params.cellSize);
    function animation(pos1, pos2, elapse) {
        const rate = Math.min(1, elapse / animationLength);
        const mix = rate * rate * (3 - 2 * rate);
        return {
            x: pos1.x + (pos2.x - pos1.x) * mix,
            y: pos1.y + (pos2.y - pos1.y) * mix,
        };
    }
}
function drawBoard(screen, board, resources) {
    board.moveElapse++;
    drawGlid(screen, board, resources);
    drawPieces(screen, board, resources);
}
function drawGame(screen, game, resources) {
    drawBoard(screen, game.board, resources);
    screen.fillStyle = "black";
    if (30 < game.board.moveElapse && game.board.completed)
        screen.fillText("completed", 100, 100);
}
function drawMenu(screen, menu, resources) {
    screen.fillStyle = "black";
    screen.fillText("menu", 100, 100);
}
function drawTitle(screen, title, resources) {
    screen.fillStyle = "black";
    drawBoard(screen, title.board, resources);
    screen.fillText("title", 100, 100);
}
function drawState(screen, state, resources) {
    switch (state.type) {
        case "menu":
            drawMenu(screen, state, resources);
            break;
        case "game":
            drawGame(screen, state, resources);
            break;
        case "title":
            drawTitle(screen, state, resources);
            break;
    }
}
function fade(screen, fade) {
    fade = Math.min(1, Math.max(0, fade));
    if (fade === 0)
        return;
    screen.fillStyle = "white";
    screen.globalAlpha = fade;
    screen.fillRect(0, 0, screen.canvas.width, screen.canvas.height);
    screen.globalAlpha = 1;
}
function draw(screen, manager, resources) {
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
function createScreen(width, height, canvas = document.createElement("canvas")) {
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
    let manager = createManager(title);
    canvas.addEventListener("click", (event) => {
        manager = click({ x: event.offsetX, y: event.offsetY }, manager);
    });
    loop(screen);
    function loop(screen) {
        manager = updateManager(manager);
        draw(screen, manager, resources);
        requestAnimationFrame(() => loop(screen));
    }
};
