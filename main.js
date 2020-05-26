"use strict";
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
function flat(array) {
    return array.reduce((prev, cur) => [...prev, ...cur], []);
}
function createBoard(level) {
    const cells = level.map(row => row.map(piece => piece !== undefined ? { reference: piece, current: piece } : undefined));
    const knightSearch = flat(level.map((row, x) => row.map((piece, y) => ({ piece, coord: { x, y } })))).find(x => x.piece === "knight");
    if (knightSearch === undefined)
        throw new Error("board must have a knight");
    const width = cells.length;
    const height = Math.max(...cells.map(x => x.length));
    const cellSize = Math.min(1 / width, 1 / height);
    ;
    return {
        cells,
        effects: [],
        player: knightSearch.coord,
        prevPlayer: knightSearch.coord,
        moveTimeStamp: 0,
        completed: true,
        cellSize,
        width,
        height,
    };
}
function setCell(cells, coord, piece) {
    return cells.map((row, x) => row.map((cell, y) => cell !== undefined && x == coord.x && y == coord.y
        ? { reference: cell.reference, current: piece } : cell));
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
function isReference(cell) {
    if (cell === undefined)
        return true;
    return cell.reference === cell.current;
}
//クリアしたか？(全てのマスが初期配置に戻されているか)
function isCompleted(cells) {
    return cells.every(row => row.every(cell => isReference(cell)));
}
//移動後のBoardを返す
function move(board, to, timeStamp) {
    //移動先座標が範囲外だったら移動不可
    const toCell = getCell(board.cells, to);
    if (toCell === undefined)
        return null;
    const fromCell = getCell(board.cells, board.player);
    if (fromCell === undefined)
        return null;
    const cells = setCell(setCell(board.cells, board.player, toCell.current), to, fromCell.current);
    const additionalEffects = [
        ...(fromCell.reference !== "blank" && isReference({ current: toCell.current, reference: fromCell.reference })
            ? [{ coord: board.player, timeStamp }] : []),
        ...(toCell.reference !== "blank" && isReference({ current: fromCell.current, reference: toCell.reference })
            ? [{ coord: to, timeStamp }] : []),
    ];
    return {
        player: to,
        effects: [...board.effects, ...additionalEffects],
        cells: cells,
        completed: isCompleted(cells),
        prevPlayer: board.player,
        moveTimeStamp: timeStamp,
        width: board.width,
        height: board.height,
        cellSize: board.cellSize,
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
            return shuffle(board, board.width * board.height * 5 + Math.random() * 5);
        return board;
    }
    const possibleBoards = [].concat(...knightMove
        .map(direction => {
        const coord = getDestinationCoord(board.player, direction);
        const cell = getCell(board.cells, coord);
        //戻るような手は選ばない
        if (coord.x === prevBoard.player.x && coord.y === prevBoard.player.y)
            return [];
        const board2 = move(board, coord, -10000);
        // 移動不能マスは抜く
        if (board2 === null)
            return [];
        //既に揃っているマスには積極的に進める
        if (isReference(cell))
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
        referencePieces: {
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
function createGame(board) {
    return {
        type: "game",
        board: shuffle(board),
    };
}
function coordToPos(coord, board, params) {
    return {
        x: (coord.x - (board.width - 1) / 2) * board.cellSize * params.scale + params.pos.x,
        y: (coord.y - (board.height - 1) / 2) * board.cellSize * params.scale + params.pos.y,
    };
}
function posToCoord(pos, board, params) {
    return {
        x: Math.round((pos.x - params.pos.x) / board.cellSize / params.scale + (board.width - 1) / 2),
        y: Math.round((pos.y - params.pos.y) / board.cellSize / params.scale + (board.height - 1) / 2),
    };
}
function createMenu() {
    const levels = [
        [
            ["knight", "blank", "blank", "blank"],
            ["blank", "blank", "blank", "blank"],
            ["blank", "blank", "blank", "blank"],
            ["blank", "blank", "blank", "knight"],
        ],
        [
            ["knight", "blank", "blank", "pawn"],
            ["blank", "blank", "blank", "blank"],
            ["blank", "blank", "blank", "blank"],
            ["pawn", "blank", "blank", "knight"],
        ],
        [
            ["pawn", "blank", "blank", "pawn"],
            ["blank", "knight", "knight", "blank"],
            ["blank", "knight", "knight", "blank"],
            ["pawn", "blank", "blank", "pawn"],
        ],
        [
            [undefined, "rook", "blank", "rook", undefined],
            ["bishop", "blank", "blank", "blank", "bishop"],
            ["blank", "blank", "knight", "blank", "blank"],
            ["bishop", "blank", "blank", "blank", "bishop"],
            [undefined, "rook", "blank", "rook", undefined],
        ],
        [
            ["knight", "blank", "blank", "knight"],
            ["blank", "pawn", "pawn", "blank"],
            ["blank", "pawn", "pawn", "blank"],
            ["knight", "blank", "blank", "knight"],
        ],
        [
            ["blank", "blank", "blank", "blank", "blank"],
            ["blank", "blank", "knight", "blank", "blank"],
            ["blank", "blank", "blank", "blank", "blank"],
            ["pawn", "pawn", "pawn", "pawn", "pawn"],
            ["rook", "bishop", "bishop", "bishop", "rook"],
        ],
        [
            [undefined, "rook", "blank", "knight", undefined],
            ["pawn", "blank", "blank", "blank", "bishop"],
            ["blank", "blank", undefined, "blank", "blank"],
            ["bishop", "blank", "blank", "blank", "pawn"],
            [undefined, "knight", "blank", "rook", undefined],
        ],
        [
            ["knight", "knight", "knight", "knight",],
            ["knight", "blank", "blank", "knight",],
            ["knight", "blank", "blank", "knight",],
            ["knight", "knight", "knight", "knight",],
        ],
        [
            [undefined, "blank", "rook", "knight", "blank", undefined],
            ["blank", undefined, "blank", "blank", undefined, "blank"],
            ["pawn", "blank", undefined, undefined, "blank", "bishop"],
            ["bishop", "blank", undefined, undefined, "blank", "pawn"],
            ["blank", undefined, "blank", "blank", undefined, "blank"],
            [undefined, "blank", "knight", "rook", "blank", undefined],
        ],
        [
            ["pawn", "rook", "bishop", "pawn",],
            ["bishop", "knight", "blank", "rook",],
            ["rook", "blank", "blank", "bishop",],
            ["pawn", "bishop", "rook", "pawn",],
        ],
    ];
    const buttonSize = 100;
    const buttonMarginX = 120;
    const buttonMarginY = 150;
    const originX = 320;
    const originY = 180;
    return {
        type: "menu",
        buttons: levels.map((level, i) => {
            return {
                pos: {
                    x: originX + buttonMarginX * (i % 5 - 2),
                    y: originY + buttonMarginY * (Math.floor(i / 5)),
                },
                size: buttonSize,
                text: (i + 1).toString(),
                board: createBoard(level),
            };
        }),
    };
}
function createTitle() {
    return {
        type: "title",
        board: shuffle(createBoard([
            ["blank", "blank"],
            ["blank", "blank"],
            ["knight", "blank"]
        ])),
    };
}
function createManager(state) {
    return {
        state: state,
        nextState: null,
        transitionTimeStamp: 0,
        tick: 0,
    };
}
function makeTransition(manager, nextState) {
    return {
        state: manager.state,
        nextState: nextState,
        transitionTimeStamp: manager.tick,
        tick: manager.tick,
    };
}
function updateManager(manager) {
    if (manager.nextState !== null) {
        if (60 <= manager.tick - manager.transitionTimeStamp) {
            return {
                state: manager.nextState,
                nextState: null,
                transitionTimeStamp: manager.transitionTimeStamp,
                tick: manager.tick + 1,
            };
        }
        return {
            state: manager.state,
            nextState: manager.nextState,
            transitionTimeStamp: manager.transitionTimeStamp,
            tick: manager.tick + 1,
        };
    }
    if (manager.state.type === "title" && manager.state.board.completed && 45 < manager.tick - manager.state.board.moveTimeStamp)
        manager = makeTransition(manager, createMenu());
    return {
        state: manager.state,
        nextState: manager.nextState,
        transitionTimeStamp: manager.transitionTimeStamp,
        tick: manager.tick + 1,
    };
}
function clickTitle(pos, title, manager) {
    const title2 = {
        type: "title",
        board: clickBoard(pos, title.board, titleDrawParams, manager.tick),
    };
    return {
        state: title2,
        nextState: manager.nextState,
        transitionTimeStamp: manager.transitionTimeStamp,
        tick: manager.tick
    };
}
function clickMenu(pos, menu, manager) {
    const clicked = menu.buttons.find(button => button.pos.x - button.size / 2 < pos.x &&
        pos.x <= button.pos.x + button.size / 2 &&
        button.pos.y - button.size / 2 < pos.y &&
        pos.y <= button.pos.y - button.size / 2);
    if (clicked !== undefined)
        return makeTransition(manager, createGame(clicked.board));
    return manager;
}
function clickBoard(pos, board, params, timeStamp) {
    const coord = posToCoord(pos, board, params);
    if (!isReachableCoord(coord, board))
        return board;
    return move(board, coord, timeStamp) || board;
}
function clickGame(pos, game, manager) {
    if (game.board.completed) {
        return makeTransition(manager, createMenu());
    }
    const game2 = {
        type: "game",
        board: clickBoard(pos, game.board, gameDrawParams, manager.tick),
    };
    return {
        state: game2,
        nextState: manager.nextState,
        transitionTimeStamp: manager.transitionTimeStamp,
        tick: manager.tick,
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
function drawGlid(screen, board, params, resources) {
    //グリッドを描画
    for (let x = -1; x < board.width; x++) {
        for (let y = -1; y < board.height; y++) {
            const id = [[[[0, 1], [2, 3]], [[4, 5], [6, 7]]], [[[8, 9], [10, 11]], [[12, 13], [14, 15]]]][getCell(board.cells, { x: x + 0, y: y + 0 }) === undefined ? 0 : 1][getCell(board.cells, { x: x + 1, y: y + 0 }) === undefined ? 0 : 1][getCell(board.cells, { x: x + 0, y: y + 1 }) === undefined ? 0 : 1][getCell(board.cells, { x: x + 1, y: y + 1 }) === undefined ? 0 : 1];
            const pos = coordToPos({ x, y }, board, params);
            if (id !== 0) {
                screen.drawImage(resources.glids[id], pos.x, pos.y, board.cellSize * params.scale, board.cellSize * params.scale);
            }
        }
    }
}
function drawReferencePieces(screen, board, params, resources) {
    board.cells.forEach((row, x) => row.forEach((cell, y) => {
        if (cell !== undefined && cell.reference !== "blank") {
            const pos = coordToPos({ x, y }, board, params);
            screen.drawImage(resources.referencePieces[cell.reference], pos.x - board.cellSize / 2 * params.scale, pos.y - board.cellSize / 2 * params.scale, board.cellSize * params.scale, board.cellSize * params.scale);
        }
    }));
}
function drawPieces(screen, board, params, resources, tick) {
    board.cells.forEach((row, x) => row.forEach((cell, y) => {
        if (cell !== undefined) {
            const pos = coordToPos({ x, y }, board, params);
            screen.globalAlpha = Math.max(Math.min((tick - board.moveTimeStamp - 30) / 10, 1), 0);
            if (!board.completed && isReachableCoord({ x, y }, board)) {
                screen.drawImage(resources.reachable, pos.x - board.cellSize / 2 * params.scale, pos.y - board.cellSize / 2 * params.scale, board.cellSize * params.scale, board.cellSize * params.scale);
            }
            screen.globalAlpha = 1;
            if (cell.current !== "blank") {
                if (x == board.prevPlayer.x && y == board.prevPlayer.y) {
                    const animatedPos = animation(coordToPos(board.player, board, params), coordToPos(board.prevPlayer, board, params), tick - board.moveTimeStamp);
                    screen.drawImage(resources.pieces[cell.current], animatedPos.x - board.cellSize / 2 * params.scale, animatedPos.y - board.cellSize / 2 * params.scale, board.cellSize * params.scale, board.cellSize * params.scale);
                }
                else if (!(x == board.player.x && y == board.player.y)) {
                    screen.drawImage(resources.pieces[cell.current], pos.x - board.cellSize / 2 * params.scale, pos.y - board.cellSize / 2 * params.scale, board.cellSize * params.scale, board.cellSize * params.scale);
                }
            }
        }
    }));
    const animatedPos = animation(coordToPos(board.prevPlayer, board, params), coordToPos(board.player, board, params), tick - board.moveTimeStamp);
    screen.drawImage(resources.pieces.player, animatedPos.x - board.cellSize / 2 * params.scale, animatedPos.y - board.cellSize / 2 * params.scale, board.cellSize * params.scale, board.cellSize * params.scale);
    function animation(pos1, pos2, elapse) {
        const rate = Math.min(1, elapse / (animationLength + 10));
        const mix = rate * rate * (3 - 2 * rate);
        return {
            x: pos1.x + (pos2.x - pos1.x) * mix,
            y: pos1.y + (pos2.y - pos1.y) * mix,
        };
    }
}
function drawEffects(screen, board, params, resources, tick) {
    board.effects.forEach(effect => {
        const phase = (tick - effect.timeStamp - animationLength - 10) / 45;
        if (phase < 0 || 1 < phase)
            return;
        const pos = coordToPos(effect.coord, board, params);
        const circlePhase = Math.min(1, phase * 2);
        const circleRange = 0.5 * board.cellSize * (circlePhase) * (2 - circlePhase) * params.scale;
        const circleAlpha = Math.min(0.3, 1 - circlePhase);
        const particleRange = 0.8 * board.cellSize * (1 - (1 - phase) * (1 - phase) * (1 - phase)) * params.scale;
        const particleLength = 0.2 * board.cellSize * (phase) * (1 - phase) * params.scale;
        screen.fillStyle = "black";
        screen.globalAlpha = circleAlpha;
        screen.beginPath();
        screen.arc(pos.x, pos.y, circleRange, 0, Math.PI * 2, true);
        screen.fill();
        screen.globalAlpha = 1;
        screen.strokeStyle = "black";
        screen.lineCap = "round";
        screen.lineWidth = board.cellSize * 0.04 * params.scale;
        [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875].forEach(angle => {
            screen.beginPath();
            screen.moveTo(pos.x + particleRange * Math.cos(angle * Math.PI * 2), pos.y + particleRange * Math.sin(angle * Math.PI * 2));
            screen.lineTo(pos.x + (particleRange + particleLength) * Math.cos(angle * Math.PI * 2), pos.y + (particleRange + particleLength) * Math.sin(angle * Math.PI * 2));
            screen.stroke();
        });
    });
}
function drawBoard(screen, board, params, resources, tick) {
    drawGlid(screen, board, params, resources);
    drawReferencePieces(screen, board, params, resources);
    drawPieces(screen, board, params, resources, tick);
    drawEffects(screen, board, params, resources, tick);
}
function drawGame(screen, game, resources, tick) {
    drawBoard(screen, game.board, gameDrawParams, resources, tick);
    if (30 < tick - game.board.moveTimeStamp && game.board.completed) {
        fade(screen, Math.max(0, Math.min(0.5, (tick - game.board.moveTimeStamp - 30) / 30)));
        screen.drawImage(resources.completed, 80, 0, 480, 480);
    }
}
function drawMenu(screen, menu, resources) {
    screen.fillStyle = "black";
    menu.buttons.forEach(button => {
        screen.strokeRect(button.pos.x - button.size / 2, button.pos.y - button.size / 2, button.size, button.size);
        drawBoard(screen, button.board, { pos: button.pos, scale: button.size - 10 }, resources, 0);
    });
}
const titleDrawParams = {
    pos: { x: 320, y: 300 },
    scale: 300,
};
const gameDrawParams = {
    pos: { x: 320, y: 240 },
    scale: 440,
};
function drawTitle(screen, title, resources, tick) {
    drawBoard(screen, title.board, titleDrawParams, resources, tick);
    screen.drawImage(resources.title, 80, 0, 480, 480);
}
function drawState(screen, state, resources, tick) {
    switch (state.type) {
        case "menu":
            drawMenu(screen, state, resources);
            break;
        case "game":
            drawGame(screen, state, resources, tick);
            break;
        case "title":
            drawTitle(screen, state, resources, tick);
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
        if (manager.tick - manager.transitionTimeStamp < 30) {
            drawState(screen, manager.state, resources, manager.tick);
            fade(screen, (manager.tick - manager.transitionTimeStamp) / fadeoutLength);
        }
        if (30 <= manager.tick - manager.transitionTimeStamp) {
            drawState(screen, manager.nextState, resources, manager.tick);
            fade(screen, (fadeoutLength + fadeinLength - (manager.tick - manager.transitionTimeStamp)) / fadeinLength);
        }
    }
    else {
        drawState(screen, manager.state, resources, manager.tick);
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
    const rect = canvas.getBoundingClientRect();
    canvas.addEventListener("click", (event) => {
        manager = click({ x: event.clientX - rect.left, y: event.clientY - rect.top }, manager);
    });
    loop(screen);
    function loop(screen) {
        manager = updateManager(manager);
        draw(screen, manager, resources);
        requestAnimationFrame(() => loop(screen));
    }
};
