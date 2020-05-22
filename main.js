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
function createBoard(initial, player) {
    return {
        cells: initial.map(row => row.map(x => x === undefined ? undefined : { correct: x, current: x })),
        player: player,
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
function draw(context, game) {
    game.board.cells.forEach((row, x) => row.forEach((cell, y) => {
        if (cell !== undefined)
            context.fillText(cell.correct, x - game.level.width / 2, y - game.level.height / 2);
    }));
}
window.onload = () => {
};
