function PrSq(sq) {
    
    return (FileChar[FilesBrd[sq]] + RankChar[RanksBrd[sq]]);
}

function PrMove(move) {
    let MvStr;

    let ff = FilesBrd[FROMSQ(move)];
    let rf = RanksBrd[FROMSQ(move)];
    let ft = FilesBrd[TOSQ(move)];
    let rt = RanksBrd[TOSQ(move)];

    MvStr = FileChar[ff] + RankChar[rf] + FileChar[ft] + RankChar[rt];

    let promoted = PROMOTED(move);

    if (promoted != PIECES.EMPTY) {
        let pchar = 'q';
        if (PieceKnight[promoted] == BOOL.TRUE) {
            pchar = 'n';
        } else if (PieceRookQueen[promoted] == BOOL.TRUE && PieceBishopQueen[promoted] == BOOL.FALSE) {
            pchar = 'r';
        } else if (PieceRookQueen[promoted] == BOOL.FALSE && PieceBishopQueen[promoted] == BOOL.TRUE) {
            pchar = 'b';
        }
        MvStr += pchar;
    }
    return MvStr;
}

function PrintMoveList() {

    let move;
    console.log('MoveList: ');

    for (let i = GameBoard.moveListStart[GameBoard.ply]; i < GameBoard.moveListStart[GameBoard.ply + 1]; i++) {
        move = GameBoard.moveList[i];
        console.log(PrMove(move));
    }
}

function ParseMove(from, to) {

    GenerateMoves();
    
    let Move = NOMOVE;
    let PromPce = PIECES.EMPTY;
    let found = BOOL.FALSE;

    for (let i = GameBoard.moveListStart[GameBoard.ply]; i < GameBoard.moveListStart[GameBoard.ply + 1]; i++) {
        Move = GameBoard.moveList[i];
        if (FROMSQ(Move) == from && TOSQ(Move) == to) {
            PromPce = PROMOTED(Move);
            if (PromPce != PIECES.EMPTY) {
                if ((PromPce == PIECES.wQ && GameBoard.side == COLOURS.WHITE) || (PromPce == PIECES.bQ && GameBoard.side == COLOURS.BLACK)) {
                    found = BOOL.TRUE;
                    break;
                }
                continue;
            }
            found = BOOL.TRUE;
            break;
        }
    }

    if (found != BOOL.FALSE) {
        if (MakeMove(Move) == BOOL.FALSE) {
            return NOMOVE;
        }
        TakeMove();
        return Move;
    }

    return NOMOVE;
}

/*
function ParseMove(from, to) {
    GenerateMoves();

    for (let i = GameBoard.moveListStart[GameBoard.ply]; i < GameBoard.moveListStart[GameBoard.ply + 1]; i++) {
        const move = GameBoard.moveList[i];

        if (FROMSQ(move) == from && TOSQ(move) == to) {
            const promotedPiece = PROMOTED(move);

            if (promotedPiece != PIECES.EMPTY) {
                if ((promotedPiece == PIECES.wQ && GameBoard.side == COLOURS.WHITE) || (promotedPiece == PIECES.bQ && GameBoard.side == COLOURS.BLACK)) {
                    if (MakeMove(move) != BOOL.FALSE) {
                        TakeMove();
                        return move;
                    }
                }
                continue;
            }

            if (MakeMove(move) != BOOL.FALSE) {
                TakeMove();
                return move;
            }
        }
    }

    return NOMOVE;
}
 */