$("#SetFen").click(function () {
    let fenStr = $("#fenIn").val();
    NewGame(fenStr);
    startSound.play();
    DeSelectAll();
});

$("#TakeButton").click(function() {
    if (GameBoard.hisPly > 0) {
        TakeMove();
        GameBoard.ply = 0;
        SetInitialBoardPieces();
        DeSelectAll();
    }
});

$("#NewGameButton").click(function() {
    NewGame(START_FEN);
    startSound.play();
    DeSelectAll();
});

function NewGame(fenStr) {
    ParseFen(fenStr);
    PrintBoard();
    SetInitialBoardPieces();
    CheckAndSet();
}

function ClearAllPieces() {
    $(".Piece").remove();
}

function SetInitialBoardPieces() {

    let sq;
    let sq120;
    let pce;

    ClearAllPieces();

    for (sq = 0; sq < 64; sq++) {
        sq120 = SQ120(sq);
        pce = GameBoard.pieces[sq120];
        if (pce >= PIECES.wP && pce <= PIECES.bK) {
            AddGUIPiece(sq120, pce);
        }
    }
}

function DeSelectSq(sq) {
    $('.Square').each(function(i) {
        if (PieceIsOnSq(sq, $(this).position().top, $(this).position().left) == BOOL.TRUE) {
            $(this).removeClass('DarkSqSelected');
            $(this).removeClass('LightSqSelected');
        }
    });
}

function SetSqSelected(sq) {
    $('.Square').each(function(i) {
        if (PieceIsOnSq(sq, $(this).position().top, $(this).position().left) == BOOL.TRUE) {
            if ((RanksBrd[sq] + FilesBrd[sq] + 2) % 2 == 0) {
                $(this).addClass('DarkSqSelected');
            } else {
                $(this).addClass('LightSqSelected');
            }
        }
    });
}

function DeSelectAll() {
    for (sq = 0; sq < 64; sq++) {
        sq120 = SQ120(sq);
        DeSelectSq(sq120);
    }
}

function ClickedSquare(pageX, pageY) {
    console.log('ClickedSquare() at ' + pageX + ',' + pageY);
    let position = $('#Board').position();

    let workedX = Math.floor(position.left);
    let workedY = Math.floor(position.top);

    pageX = Math.floor(pageX);
    pageY = Math.floor(pageY);

    let file = Math.floor((pageX - workedX) / 60);
    let rank = 7 - Math.floor((pageY - workedY) / 60);

    let sq = FR2SQ(file, rank);

    console.log('Clicked sq:' + PrSq(sq));

    SetSqSelected(sq);

    return sq;
;}

$(document).on('click', '.Piece', function (e) {
    console.log('Piece Click');

    if (UserMove.from == SQUARES.NO_SQ) {
        UserMove.from = ClickedSquare(e.pageX, e.pageY);
    } else {
        UserMove.to = ClickedSquare(e.pageX, e.pageY);
    }

    MakeUserMove();

});

$(document).on('click', '.Square', function (e) {
    console.log('Square Click');

    if (UserMove.from != SQUARES.NO_SQ) {
        UserMove.to = ClickedSquare(e.pageX, e.pageY);
        MakeUserMove();
    }
});

function MakeUserMove() {
    
    if (UserMove.from != SQUARES.NO_SQ && UserMove.to != SQUARES.NO_SQ) {
        
        console.log("User Move: " + PrSq(UserMove.from) + PrSq(UserMove.to));

        let parsed = ParseMove(UserMove.from, UserMove.to);

        DeSelectSq(UserMove.from);
        DeSelectSq(UserMove.to);

        if (parsed != NOMOVE) {
            MakeMove(parsed);
            PrintBoard();
            MoveGUIPiece(parsed);
            CheckAndSet();
            PreSearch();
            DeSelectAll();
            SetSqSelected(UserMove.from);
            SetSqSelected(UserMove.to);
        }


        UserMove.from = SQUARES.NO_SQ;
        UserMove.to = SQUARES.NO_SQ;
    }
}

function PieceIsOnSq(sq, top, left) {

    if ((RanksBrd[sq] == 7 - Math.round(top / 60)) && FilesBrd[sq] == Math.round(left / 60)) {
        return BOOL.TRUE;
    }

    return BOOL.FALSE;
}

function RemoveGUIPiece(sq) {

    $('.Piece').each(function(i) {
        if (PieceIsOnSq(sq, $(this).position().top, $(this).position().left) == BOOL.TRUE) {
            $(this).remove();
        }
    });

}

function AddGUIPiece(sq, pce) {

    let file = FilesBrd[sq];
    let rank = RanksBrd[sq];
    let rankName = "rank" + (rank + 1);
    let fileName = "file" + (file + 1);
    let pieceFileName = "Pieces/" + SideChar[PieceCol[pce]] + PceChar[pce].toUpperCase() + ".png";
    let imageString = "<image src=\"" + pieceFileName + "\" class=\"Piece " + rankName + " " + fileName + "\"/>";
    $("#Board").append(imageString);

}

function MoveGUIPiece(move) {

    let from = FROMSQ(move);
    let to = TOSQ(move);

    let InCheck = SqAttacked(GameBoard.pList[PCEINDEX(Kings[GameBoard.side], 0)], GameBoard.side^1);

    if (move & MFLAGEP) {
        let epRemove;

        if (GameBoard.side == COLOURS.BLACK) {
            epRemove = to - 10;
        } else {
            epRemove = to + 10;
        }

        RemoveGUIPiece(epRemove);

        if (!InCheck) {
            captureSound.play();
        }
    } else if (CAPTURED(move)) {
        RemoveGUIPiece(to);

        if (!InCheck) {
            captureSound.play();
        }
    }

    let file = FilesBrd[to];
    let rank = RanksBrd[to];
    let rankName = "rank" + (rank + 1);
    let fileName = "file" + (file + 1);

    $('.Piece').each(function(i) {
        if (PieceIsOnSq(from, $(this).position().top, $(this).position().left) == BOOL.TRUE) {
            $(this).removeClass();
            $(this).addClass("Piece " + rankName + " " + fileName);
        }
    });

    if (move & MFLAGCA) {
        switch(to) {
            case SQUARES.G1: RemoveGUIPiece(SQUARES.H1); AddGUIPiece(SQUARES.F1, PIECES.wR); break;
            case SQUARES.C1: RemoveGUIPiece(SQUARES.A1); AddGUIPiece(SQUARES.D1, PIECES.wR); break;
            case SQUARES.G8: RemoveGUIPiece(SQUARES.H8); AddGUIPiece(SQUARES.F8, PIECES.bR); break;
            case SQUARES.C8: RemoveGUIPiece(SQUARES.A8); AddGUIPiece(SQUARES.D8, PIECES.bR); break;
        }

        if (!InCheck) {
            castleSound.play();
        }
    } else if (PROMOTED(move)) {
        RemoveGUIPiece(to);
        AddGUIPiece(to, PROMOTED(move));
    }

    if (!InCheck){
        if (GameBoard.side == COLOURS.WHITE && !(move & MFLAGCA) && !(move & MFLAGEP) && !(CAPTURED(move))) {
            move2Sound.play();
        } else if (GameBoard.side == COLOURS.BLACK && !(move & MFLAGCA) && !(move & MFLAGEP) && !(CAPTURED(move))){
            move1Sound.play();
        }
    } else {
        checkSound.play();
    }

    DeSelectAll();
    SetSqSelected(from);
    SetSqSelected(to);
}

function DrawMaterial() {
    
    if (GameBoard.pceNum[PIECES.wP] != 0 || GameBoard.pceNum[PIECES.bP] != 0) return BOOL.FALSE;
    if (GameBoard.pceNum[PIECES.wQ] != 0 || GameBoard.pceNum[PIECES.bQ] != 0 || 
        GameBoard.pceNum[PIECES.wR] != 0 || GameBoard.pceNum[PIECES.bR] != 0) return BOOL.FALSE;
    if (GameBoard.pceNum[PIECES.wB] > 1 || GameBoard.pceNum[PIECES.bB] > 1) return BOOL.FALSE;
    if (GameBoard.pceNum[PIECES.wN] > 1 || GameBoard.pceNum[PIECES.bN] > 1) return BOOL.FALSE;

    if (GameBoard.pceNum[PIECES.wN] != 0 && GameBoard.pceNum[PIECES.wB] != 0) return BOOL.FALSE;
    if (GameBoard.pceNum[PIECES.bN] != 0 && GameBoard.pceNum[PIECES.bB] != 0) return BOOL.FALSE;

    return BOOL.TRUE;
}

function ThreeFoldRep() {

    let r = 0;

    for (let i = 0; i < GameBoard.hisPly; i++) {
        if (GameBoard.history[i].posKey == GameBoard.posKey) {
            r++;
        }
    }

    return r;
}

function CheckResult() {
    if (GameBoard.fiftyMove >= 100) {
        $("#GameStatus").text("GAME DRAWN {fifty move rule}");
        gameoverSound.play();
        return BOOL.TRUE;
    }

    if (ThreeFoldRep() >= 2) {
        $("#GameStatus").text("GAME DRAWN {3-fold repetition}");
        gameoverSound.play();
        return BOOL.TRUE;
    }

    if (DrawMaterial() == BOOL.TRUE) {
        $("#GameStatus").text("GAME DRAWN {insufficient material to mate}");
        gameoverSound.play();
        return BOOL.TRUE;
    }

    GenerateMoves();

    let MoveNum = 0;
    let found = 0;

    for (MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; MoveNum++) {

        if (MakeMove(GameBoard.moveList[MoveNum]) == BOOL.FALSE) {
            continue;
        }
        found++;
        TakeMove();
        break;
    }

    if (found != 0) return BOOL.FALSE;

    let InCheck = SqAttacked(GameBoard.pList[PCEINDEX(Kings[GameBoard.side], 0)], GameBoard.side^1);

    if (InCheck == BOOL.TRUE) {
        if (GameBoard.side == COLOURS.WHITE) {
            $("#GameStatus").text("GAME OVER {black mates}");
            checkmateSound.play();
            return BOOL.TRUE;
        } else {
            $("#GameStatus").text("GAME OVER {white mates}");
            checkmateSound.play();
            return BOOL.TRUE;
        }
    } else {
        $("#GameStatus").text("GAME DRAWN {stalemate}");
        stalemateSound.play();
        return BOOL.TRUE;
    }

    return BOOL.FALSE;
}

function CheckAndSet() {
    if (CheckResult() == BOOL.TRUE) {
        GameController.GameOver == BOOL.TRUE;
    } else {
        GameController.GameOver == BOOL.FALSE;
        $("#GameStatus").text('');
    }
}

function PreSearch() {
    if (GameController.GameOver == BOOL.FALSE) {
        SearchController.thinking = BOOL.TRUE;
        setTimeout(function() {StartSearch();}, 200);
    }
}

$('#SearchButton').click(function() {
    GameController.PlayerSide = GameController.side ^ 1;
    PreSearch();
});

function StartSearch() {

	SearchController.depth = MAXDEPTH;
	let t = Date.now();
	let tt = $('#ThinkTimeChoice').val();
	
	SearchController.time = parseInt(tt) * 1000;
	SearchPosition();
	
	MakeMove(SearchController.best);
	MoveGUIPiece(SearchController.best);
	CheckAndSet();
}