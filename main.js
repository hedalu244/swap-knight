"use strict";
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
function createBoard(initial) {
    const cells = initial.map(row => row.map(piece => piece !== undefined ? { correct: piece, current: piece } : undefined));
    const knightSearch = flat(initial.map((row, x) => row.map((piece, y) => ({ piece, coord: { x, y } })))).find(x => x.piece === "knight");
    if (knightSearch === undefined)
        throw new Error("board must have a knight");
    return {
        cells,
        player: knightSearch.coord,
        completed: true,
    };
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
    };
}
//クリックできるところにあるか
function isReachableCoord(coord, board) {
    return !board.completed && getCell(board.cells, coord) !== undefined &&
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
function coordToPos(coord, game) {
    return {
        x: coord.x * game.cellSize + game.originX,
        y: coord.y * game.cellSize + game.originY,
    };
}
function posToCoord(pos, game) {
    return {
        x: Math.round((pos.x - game.originX) / game.cellSize),
        y: Math.round((pos.y - game.originY) / game.cellSize),
    };
}
function createGame(level) {
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
        prevPlayer: board.player,
        elapse: 0,
        originX,
        originY,
    };
}
function drawGlid(screen, game, resources) {
    //グリッドを描画
    for (let x = -1; x < game.level.width; x++) {
        for (let y = -1; y < game.level.height; y++) {
            const id = [[[[0, 1], [2, 3]], [[4, 5], [6, 7]]], [[[8, 9], [10, 11]], [[12, 13], [14, 15]]]][getCell(game.board.cells, { x: x + 0, y: y + 0 }) === undefined ? 0 : 1][getCell(game.board.cells, { x: x + 1, y: y + 0 }) === undefined ? 0 : 1][getCell(game.board.cells, { x: x + 0, y: y + 1 }) === undefined ? 0 : 1][getCell(game.board.cells, { x: x + 1, y: y + 1 }) === undefined ? 0 : 1];
            const pos = coordToPos({ x, y }, game);
            if (id !== 0) {
                screen.drawImage(resources.glids[id], pos.x, pos.y, game.cellSize, game.cellSize);
            }
        }
    }
}
function drawCorrectPieces(screen, game, resources) {
    game.board.cells.forEach((row, x) => row.forEach((cell, y) => {
        if (cell !== undefined && cell.correct !== "blank") {
            const pos = coordToPos({ x, y }, game);
            screen.drawImage(resources[cell.correct], pos.x - game.cellSize / 2, pos.y - game.cellSize / 2, game.cellSize, game.cellSize);
        }
    }));
}
function drawPieces(screen, game, resources) {
    game.board.cells.forEach((row, x) => row.forEach((cell, y) => {
        if (cell !== undefined) {
            const pos = coordToPos({ x, y }, game);
            if (isReachableCoord({ x, y }, game.board)) {
                screen.drawImage(resources.reachable, pos.x - game.cellSize / 2, pos.y - game.cellSize / 2, game.cellSize, game.cellSize);
            }
            if (x == game.board.player.x && y == game.board.player.y) {
                const prevPos = coordToPos(game.prevPlayer, game);
                const animatedPos = animation(prevPos, pos, game.elapse);
                screen.drawImage(resources.player, animatedPos.x - game.cellSize / 2, animatedPos.y - game.cellSize / 2, game.cellSize, game.cellSize);
            }
            else if (cell.current !== "blank") {
                screen.drawImage(resources[cell.current], pos.x - game.cellSize / 2, pos.y - game.cellSize / 2, game.cellSize, game.cellSize);
            }
        }
    }));
    function animation(pos1, pos2, elapse) {
        const rate = Math.min(1, elapse / 15);
        const mix = rate * rate * (3 - 2 * rate);
        return {
            x: pos1.x + (pos2.x - pos1.x) * mix,
            y: pos1.y + (pos2.y - pos1.y) * mix,
        };
    }
}
function draw(context, game, resources) {
    game.elapse++;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    drawGlid(context, game, resources);
    drawPieces(context, game, resources);
    context.fillStyle = "black";
    if (30 < game.elapse && game.board.completed)
        context.fillText("completed", 0, 0);
    requestAnimationFrame(() => draw(context, game, resources));
}
function click(pos, game) {
    const coord = posToCoord(pos, game);
    if (isReachableCoord(coord, game.board)) {
        const board2 = move(game.board, coord);
        if (board2 !== null) {
            game.prevPlayer = game.board.player;
            game.board = board2;
            game.elapse = 0;
        }
    }
}
function createScreen(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const screen = canvas.getContext("2d");
    if (screen === null)
        throw new Error("context2d not found");
    return screen;
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
    const level = {
        initial: [
            ["knight", "blank", "blank"],
            ["pawn", "blank", "blank"],
            ["blank", "blank", "blank"],
        ],
        width: 3,
        height: 3,
    };
    const game = createGame(level);
    const resources = loadResources();
    draw(context, game, resources);
};
