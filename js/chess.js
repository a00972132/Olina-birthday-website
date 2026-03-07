(function () {
    const pieceIcons = buildPieceIcons();

    const initialBoard = [
        ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
        ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
        ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"]
    ];

    function initChessGameStandalone() {
        const boardElement = document.getElementById("chess-board");
        const turnElement = document.getElementById("chess-turn");
        const selectionElement = document.getElementById("chess-selection");
        const statusElement = document.getElementById("chess-status");
        const resetButton = document.getElementById("chess-reset");

        if (!boardElement || !turnElement || !selectionElement || !statusElement || !resetButton) {
            return;
        }

        if (boardElement.dataset.ready === "true") {
            return;
        }

        const state = {
            board: cloneBoard(initialBoard),
            turn: "w",
            selected: null,
            legalMoves: []
        };

        resetButton.addEventListener("click", () => {
            state.board = cloneBoard(initialBoard);
            state.turn = "w";
            state.selected = null;
            state.legalMoves = [];
            turnElement.textContent = "White to move";
            selectionElement.textContent = "Nothing selected.";
            statusElement.textContent = "Fresh board. Cause problems.";
            renderBoard();
        });

        boardElement.dataset.ready = "true";
        renderBoard();

        function renderBoard() {
            boardElement.innerHTML = "";

            for (let row = 0; row < 8; row += 1) {
                for (let col = 0; col < 8; col += 1) {
                    const square = document.createElement("button");
                    const isLight = (row + col) % 2 === 0;
                    const piece = state.board[row][col];
                    const legalMove = state.legalMoves.find((move) => move.row === row && move.col === col);

                    square.type = "button";
                    square.className = `chess-square ${isLight ? "light" : "dark"}${piece ? "" : " empty"}${
                        state.selected && state.selected.row === row && state.selected.col === col ? " selected" : ""
                    }${legalMove ? ` ${legalMove.capture ? "capture" : "legal"}` : ""}`;
                    square.addEventListener("click", () => handleSquareClick(row, col));

                    if (piece) {
                        const pieceNode = document.createElement("img");
                        pieceNode.className = `chess-piece ${piece[0] === "w" ? "white" : "red"}`;
                        pieceNode.src = pieceIcons[piece];
                        pieceNode.alt = pieceName(piece);
                        square.appendChild(pieceNode);
                    }

                    boardElement.appendChild(square);
                }
            }
        }

        function handleSquareClick(row, col) {
            const piece = state.board[row][col];
            const legalMove = state.legalMoves.find((move) => move.row === row && move.col === col);

            if (state.selected && legalMove) {
                movePiece(state.selected.row, state.selected.col, row, col, legalMove.capture);
                return;
            }

            if (!piece) {
                state.selected = null;
                state.legalMoves = [];
                selectionElement.textContent = "Nothing selected.";
                renderBoard();
                return;
            }

            if (piece[0] !== state.turn) {
                statusElement.textContent = `${piece[0] === "w" ? "White" : "Red"} can't move right now.`;
                return;
            }

            state.selected = { row, col };
            state.legalMoves = getLegalMoves(row, col, piece);
            selectionElement.textContent = `${pieceName(piece)} on ${toSquare(row, col)} selected.`;
            statusElement.textContent = state.legalMoves.length ? "Pick a highlighted square." : "That piece is boxed in.";
            renderBoard();
        }

        function movePiece(fromRow, fromCol, toRow, toCol, wasCapture) {
            const piece = state.board[fromRow][fromCol];
            state.board[toRow][toCol] = piece;
            state.board[fromRow][fromCol] = "";

            if (piece[1] === "p" && (toRow === 0 || toRow === 7)) {
                state.board[toRow][toCol] = `${piece[0]}q`;
                statusElement.textContent = `${piece[0] === "w" ? "White" : "Red"} pawn promoted to a queen.`;
            } else {
                statusElement.textContent = wasCapture
                    ? `${pieceName(piece)} captured on ${toSquare(toRow, toCol)}.`
                    : `${pieceName(piece)} moved to ${toSquare(toRow, toCol)}.`;
            }

            state.turn = state.turn === "w" ? "b" : "w";
            turnElement.textContent = state.turn === "w" ? "White to move" : "Red to move";
            selectionElement.textContent = "Nothing selected.";
            state.selected = null;
            state.legalMoves = [];
            renderBoard();
        }

        function getLegalMoves(row, col, piece) {
            const color = piece[0];
            const type = piece[1];

            if (type === "p") return getPawnMoves(row, col, color);
            if (type === "r") return getSlidingMoves(row, col, color, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
            if (type === "b") return getSlidingMoves(row, col, color, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
            if (type === "q") return getSlidingMoves(row, col, color, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
            if (type === "n") return getStepMoves(row, col, color, [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]);
            if (type === "k") return getStepMoves(row, col, color, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
            return [];
        }

        function getPawnMoves(row, col, color) {
            const moves = [];
            const direction = color === "w" ? -1 : 1;
            const startRow = color === "w" ? 6 : 1;
            const oneStep = row + direction;

            if (isInside(oneStep, col) && !state.board[oneStep][col]) {
                moves.push({ row: oneStep, col, capture: false });
                const twoStep = row + direction * 2;
                if (row === startRow && !state.board[twoStep][col]) {
                    moves.push({ row: twoStep, col, capture: false });
                }
            }

            [-1, 1].forEach((offset) => {
                const nextRow = row + direction;
                const nextCol = col + offset;
                if (!isInside(nextRow, nextCol)) return;
                const targetPiece = state.board[nextRow][nextCol];
                if (targetPiece && targetPiece[0] !== color) {
                    moves.push({ row: nextRow, col: nextCol, capture: true });
                }
            });

            return moves;
        }

        function getSlidingMoves(row, col, color, directions) {
            const moves = [];

            directions.forEach(([rowDelta, colDelta]) => {
                let nextRow = row + rowDelta;
                let nextCol = col + colDelta;

                while (isInside(nextRow, nextCol)) {
                    const targetPiece = state.board[nextRow][nextCol];
                    if (!targetPiece) {
                        moves.push({ row: nextRow, col: nextCol, capture: false });
                    } else {
                        if (targetPiece[0] !== color) {
                            moves.push({ row: nextRow, col: nextCol, capture: true });
                        }
                        break;
                    }
                    nextRow += rowDelta;
                    nextCol += colDelta;
                }
            });

            return moves;
        }

        function getStepMoves(row, col, color, steps) {
            return steps
                .map(([rowDelta, colDelta]) => ({ row: row + rowDelta, col: col + colDelta }))
                .filter(({ row: nextRow, col: nextCol }) => isInside(nextRow, nextCol))
                .filter(({ row: nextRow, col: nextCol }) => {
                    const targetPiece = state.board[nextRow][nextCol];
                    return !targetPiece || targetPiece[0] !== color;
                })
                .map(({ row: nextRow, col: nextCol }) => ({
                    row: nextRow,
                    col: nextCol,
                    capture: Boolean(state.board[nextRow][nextCol])
                }));
        }

        function isInside(row, col) {
            return row >= 0 && row < 8 && col >= 0 && col < 8;
        }

        function pieceName(piece) {
            const names = { p: "Pawn", r: "Rook", n: "Knight", b: "Bishop", q: "Queen", k: "King" };
            return `${piece[0] === "w" ? "White" : "Red"} ${names[piece[1]]}`;
        }

        function toSquare(row, col) {
            return `${String.fromCharCode(97 + col)}${8 - row}`;
        }

        function cloneBoard(board) {
            return board.map((currentRow) => [...currentRow]);
        }
    }

    function buildPieceIcons() {
        const whitePalette = {
            fillTop: "#ffffff",
            fillMid: "#f3f0ea",
            fillBottom: "#d7d1c8",
            stroke: "#8f8578",
            shadow: "#ffffff"
        };
        const blackPalette = {
            fillTop: "#ff6b6b",
            fillMid: "#ff3b4f",
            fillBottom: "#d31145",
            stroke: "#a30034",
            shadow: "#ffc2c8"
        };

        return {
            wp: pieceDataUri(drawPawn(whitePalette)),
            wr: pieceDataUri(drawRook(whitePalette)),
            wn: pieceDataUri(drawKnight(whitePalette)),
            wb: pieceDataUri(drawBishop(whitePalette)),
            wq: pieceDataUri(drawQueen(whitePalette)),
            wk: pieceDataUri(drawKing(whitePalette)),
            bp: pieceDataUri(drawPawn(blackPalette)),
            br: pieceDataUri(drawRook(blackPalette)),
            bn: pieceDataUri(drawKnight(blackPalette)),
            bb: pieceDataUri(drawBishop(blackPalette)),
            bq: pieceDataUri(drawQueen(blackPalette)),
            bk: pieceDataUri(drawKing(blackPalette))
        };
    }

    function pieceDataUri(content) {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="pieceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${content.palette.fillTop}" />
                        <stop offset="55%" stop-color="${content.palette.fillMid}" />
                        <stop offset="100%" stop-color="${content.palette.fillBottom}" />
                    </linearGradient>
                    <filter id="pieceShadow" x="-20%" y="-20%" width="140%" height="160%">
                        <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="rgba(30,20,40,.28)" />
                    </filter>
                </defs>
                <g filter="url(#pieceShadow)" fill="url(#pieceGrad)" stroke="${content.palette.stroke}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
                    ${content.body}
                </g>
                ${content.detail || ""}
            </svg>
        `.trim();

        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    function drawPawn(palette) {
        return {
            palette,
            body: `
                <circle cx="50" cy="26" r="11" />
                <path d="M39 41c0-6 5-10 11-10s11 4 11 10c0 5-2 8-5 12l8 6H36l8-6c-3-4-5-7-5-12Z" />
                <path d="M33 60h34l5 10H28l5-10Z" />
                <path d="M24 74h52v7H24z" />
                <path d="M20 83h60v7H20z" />
            `
        };
    }

    function drawRook(palette) {
        return {
            palette,
            body: `
                <path d="M29 20h8v10h6V20h14v10h6V20h8v18l-6 6 3 18H32l3-18-6-6V20Z" />
                <path d="M32 62h36l5 10H27l5-10Z" />
                <path d="M24 76h52v7H24z" />
                <path d="M20 85h60v7H20z" />
            `
        };
    }

    function drawKnight(palette) {
        return {
            palette,
            body: `
                <path d="M64 22c-14 0-23 9-27 20l10 5-8 14h26c9 0 16-6 16-15 0-8-4-14-11-18 1-3 1-5-6-6Z" />
                <path d="M34 61h34l5 10H27l7-10Z" />
                <path d="M25 75h50v7H25z" />
                <path d="M20 84h60v7H20z" />
            `,
            detail: `<circle cx="59" cy="33" r="2.2" fill="${palette.shadow}" />`
        };
    }

    function drawBishop(palette) {
        return {
            palette,
            body: `
                <path d="M50 15c6 0 10 4 10 10 0 5-4 9-7 12 6 4 10 11 10 18 0 6-4 9-8 13H45c-4-4-8-7-8-13 0-7 4-14 10-18-3-3-7-7-7-12 0-6 4-10 10-10Z" />
                <path d="M43 24l14 18" />
                <path d="M35 68h30l6 10H29l6-10Z" />
                <path d="M24 82h52v7H24z" />
            `
        };
    }

    function drawQueen(palette) {
        return {
            palette,
            body: `
                <circle cx="28" cy="24" r="5" />
                <circle cx="42" cy="18" r="5" />
                <circle cx="58" cy="18" r="5" />
                <circle cx="72" cy="24" r="5" />
                <path d="M28 30l10 28h24l10-28-12 10-10-18-10 18-12-10Z" />
                <path d="M34 58h32l5 11H29l5-11Z" />
                <path d="M24 73h52v7H24z" />
                <path d="M20 82h60v8H20z" />
            `
        };
    }

    function drawKing(palette) {
        return {
            palette,
            body: `
                <path d="M50 12v12" />
                <path d="M44 18h12" />
                <path d="M41 26h18l5 8-4 7H40l-4-7 5-8Z" />
                <path d="M36 41h28l5 15H31l5-15Z" />
                <path d="M34 56h32l6 11H28l6-11Z" />
                <path d="M24 71h52v7H24z" />
                <path d="M20 80h60v8H20z" />
            `
        };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initChessGameStandalone);
    } else {
        initChessGameStandalone();
    }

    window.addEventListener("load", initChessGameStandalone);
    window.setTimeout(initChessGameStandalone, 120);
})();
