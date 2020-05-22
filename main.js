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
    return {
        player: to,
        cells: setCell(setCell(board.cells, board.player, toCell.current), to, "knight"),
    };
}
//一歩で移動できるところにあるか
function isReachableCoord(coord, board) {
    return getCell(board.cells, coord) !== undefined &&
        knightMove.some(dir => coord.x - board.player.x == dir.x && coord.y - board.player.y == dir.y);
}
//盤面をシャッフル
function shuffle(board, count = 0, prevBoard = board) {
    if (count < 0) {
        if (isCompleted(board.cells))
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
    const centerPosX = 150;
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
function draw(context, game) {
    game.board.cells.forEach((row, x) => row.forEach((cell, y) => {
        if (cell !== undefined) {
            if (isReachableCoord({ x, y }, game.board))
                context.fillStyle = "red";
            else if ((x + y) % 2 == 0)
                context.fillStyle = "lightgray";
            else
                context.fillStyle = "darkgray";
            const pos = coordToPos({ x, y }, game);
            context.fillRect(pos.x - game.cellSize / 2, pos.y - game.cellSize / 2, game.cellSize, game.cellSize);
            context.fillStyle = "black";
            context.fillText(cell.current, pos.x, pos.y);
        }
    }));
    requestAnimationFrame(() => draw(context, game));
}
function click(pos, game) {
    const coord = posToCoord(pos, game);
    if (isReachableCoord(coord, game.board)) {
        const board2 = move(game.board, coord);
        if (board2 !== null)
            game.board = board2;
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
    const level = {
        initial: [
            ["knight", "blank", "blank"],
            ["pawn", "blank", "blank"],
            ["pawn", "blank", "blank"],
        ],
        width: 3,
        height: 3,
    };
    const game = createGame(level);
    draw(context, game);
};
