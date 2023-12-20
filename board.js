
let GameBoard = {};

GameBoard.pieces = new Array(BRD_SQ_NUM);
GameBoard.side = COLOURS.WHITE;
GameBoard.fiftyMove = 0;
GameBoard.hisPly = 0;
GameBoard.history = [];
GameBoard.ply = 0;
GameBoard.enPas = 0;
GameBoard.castlePerm = 0;
GameBoard.material = new Array(2); // WHITE, BLACK material of pieces
GameBoard.pceNum = new Array(13); // indexed by piece
GameBoard.pList = new Array(14 * 10);
GameBoard.posKey = 0;

GameBoard.moveList = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveScores = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveListStart = new Array(MAXDEPTH);

GameBoard.PvTable = [];
GameBoard.PvArray = new Array(MAXDEPTH);
GameBoard.searchHistory = new Array(14 * BRD_SQ_NUM);
GameBoard.searchKillers = new Array(3 * MAXDEPTH);

function CheckBoard() {   
 
	let t_pceNum = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	let t_material = [0, 0];
	let sq64, t_piece, t_pce_num, sq120, colour, pcount;
	
	for(t_piece = PIECES.wP; t_piece <= PIECES.bK; t_piece++) {
		for(t_pce_num = 0; t_pce_num < GameBoard.pceNum[t_piece]; t_pce_num++) {
			sq120 = GameBoard.pList[PCEINDEX(t_piece,t_pce_num)];
			if(GameBoard.pieces[sq120] != t_piece) {
				console.log('Error Pce Lists');
				return BOOL.FALSE;
			}
		}	
	}
	
	for(sq64 = 0; sq64 < 64; sq64++) {
		sq120 = SQ120(sq64);
		t_piece = GameBoard.pieces[sq120];
		t_pceNum[t_piece]++;
		t_material[PieceCol[t_piece]] += PieceVal[t_piece];
	}
	
	for(t_piece = PIECES.wP; t_piece <= PIECES.bK; t_piece++) {
		if(t_pceNum[t_piece] != GameBoard.pceNum[t_piece]) {
				console.log('Error t_pceNum');
				return BOOL.FALSE;
			}	
	}
	
	if(t_material[COLOURS.WHITE] != GameBoard.material[COLOURS.WHITE] ||
			 t_material[COLOURS.BLACK] != GameBoard.material[COLOURS.BLACK]) {
				console.log('Error t_material');
				return BOOL.FALSE;
	}	
	
	if(GameBoard.side != COLOURS.WHITE && GameBoard.side != COLOURS.BLACK) {
				console.log('Error GameBoard.side');
				return BOOL.FALSE;
	}
	
	if(GeneratePosKey() != GameBoard.posKey) {
				console.log('Error GameBoard.posKey');
				return BOOL.FALSE;
	}	
	return BOOL.TRUE;
}


function PrintBoard() {
    let sq, file, rank, piece;

    console.log("\Game Board:\n");
    for (rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
        let line = (RankChar[rank] + "  ");
        for (file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
            sq = FR2SQ(file, rank);
            piece = GameBoard.pieces[sq];
            line += (" " + PceChar[piece] + " ");
        }
        console.log(line);
    }
    console.log("");
    let line = "  ";
    for (file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
        line += (' ' + FileChar[file] + ' ');
    }
    console.log(line);
    console.log("side:" + SideChar[GameBoard.side]);
    console.log("enPas:" + GameBoard.enPas);
    line = "";

    if (GameBoard.castlePerm & CASTLEBIT.WKCA) line += 'K';
    if (GameBoard.castlePerm & CASTLEBIT.WQCA) line += 'Q';
    if (GameBoard.castlePerm & CASTLEBIT.BKCA) line += 'k';
    if (GameBoard.castlePerm & CASTLEBIT.BQCA) line += 'q';
    console.log("castle:" + line);
    console.log("key:" + GameBoard.posKey.toString(16));
}


function GeneratePosKey() {

    let sq = 0;
    let finalKey = 0;
    let piece = PIECES.EMPTY;

    for (sq = 0; sq < BRD_SQ_NUM; ++sq) {
        piece = GameBoard.pieces[sq];
        if (piece != PIECES.EMPTY && piece != SQUARES.OFFBOARD) {
            finalKey ^= PieceKeys[(piece * 120) + sq];
        }
    }
    
    if (GameBoard.side == COLOURS.WHITE) {
        finalKey ^= SideKey;
    }

    if (GameBoard.enPas != SQUARES.NO_SQ) {
        finalKey ^= PieceKeys[GameBoard.enPas];
    }

    finalKey ^= CastleKeys[GameBoard.castlePerm];

    return finalKey;
}

function PrintPieceLists() {

    let piece, pceNum;
    
    for (piece = PIECES.wP; piece <= PIECES.bK; piece++) {
        for (pceNum = 0; pceNum < GameBoard.pceNum[piece]; pceNum++){
            console.log('Piece ' + PceChar[piece] + ' on ' + PrSq(GameBoard.pList[PCEINDEX(piece, pceNum)]))
        }
    }
}

function UpdateListsMaterial() {

    let piece, sq, colour;

    for (let i = 0; i < 14 * 120; ++i) {
        GameBoard.pList[i] = PIECES.EMPTY;
    }
    for (let i = 0; i < 2; ++i) {
        GameBoard.material[i] = 0;
    }
    for (let i = 0; i < 13; ++i) {
        GameBoard.pceNum[i] = 0;
    }

     for (let i = 0; i < 64; i++) {
        sq = SQ120(i);
        piece = GameBoard.pieces[sq];
        if (piece != PIECES.EMPTY) {

            colour = PieceCol[piece];

            GameBoard.material[colour] += PieceVal[piece];

            GameBoard.pList[PCEINDEX(piece, GameBoard.pceNum[piece])] = sq;
            GameBoard.pceNum[piece]++;
        }
    }
}

function ResetBoard() {

    for (let i = 0; i < BRD_SQ_NUM; ++i) {
        GameBoard.pieces[i] = SQUARES.OFFBOARD;
    }
    for (let i = 0; i < 64; ++i) {
        GameBoard.pieces[SQ120(i)] = PIECES.EMPTY;
    }
    
    GameBoard.side = COLOURS.BOTH;
    GameBoard.fiftyMove = 0;
    GameBoard.hisPly = 0;
    GameBoard.ply = 0;
    GameBoard.enPas = SQUARES.NO_SQ;
    GameBoard.castlePerm = 0;
    GameBoard.posKey = 0;
    GameBoard.moveListStart[GameBoard.ply] = 0;
}

function ParseFen(fen) {
    ResetBoard();
  
    const pieceMap = {
        'p': PIECES.bP, 'r': PIECES.bR, 'n': PIECES.bN, 'b': PIECES.bB, 'k': PIECES.bK, 'q': PIECES.bQ,
        'P': PIECES.wP, 'R': PIECES.wR, 'N': PIECES.wN, 'B': PIECES.wB, 'K': PIECES.wK, 'Q': PIECES.wQ
    };

    let rank = RANKS.RANK_8;
    let file = FILES.FILE_A;
    let fenCnt = 0;
    let sq120 = 0;

    while (rank >= RANKS.RANK_1 && fenCnt < fen.length) {
        let piece = PIECES.EMPTY;
        let char = fen[fenCnt];
  
        if (char in pieceMap) {
            piece = pieceMap[char];
            sq120 = FR2SQ(file, rank);
            GameBoard.pieces[sq120] = piece;
            file++;
        } else if (char >= '1' && char <= '8') {
            let count = parseInt(char, 10);
            for (let i = 0; i < count; i++) {
                sq120 = FR2SQ(file, rank);
                GameBoard.pieces[sq120] = piece;
                file++;
            }
        } else if (char === '/') {
            rank--;
            file = FILES.FILE_A;
        } else if (char === ' ') {
            fenCnt++;
            break;
        } else {
            console.log("FEN error");
            return;
        }
  
        fenCnt++;
    } // while loop end

    GameBoard.side = (fen[fenCnt] == 'w') ? COLOURS.WHITE : COLOURS.BLACK;
    fenCnt += 2;

    for (let i = 0; i < 4; i++) {
        if (fen[fenCnt] == ' ') {
            break;
        }
        switch(fen[fenCnt]) {
            case 'K': GameBoard.castlePerm |= CASTLEBIT.WKCA; break;
            case 'Q': GameBoard.castlePerm |= CASTLEBIT.WQCA; break;
            case 'k': GameBoard.castlePerm |= CASTLEBIT.BKCA; break;
            case 'q': GameBoard.castlePerm |= CASTLEBIT.BQCA; break;
            default: break;
        }
        fenCnt++;
    }
    fenCnt++;

    if (fen[fenCnt] != '-') {
        file = fen[fenCnt].charCodeAt() - 'a'.charCodeAt();
        rank = fen[fenCnt + 1].charCodeAt() - '1'.charCodeAt();
        console.log("fen[fenCnt]:" + fen[fenCnt] + " File:" + file + " Rank:" + rank);
        GameBoard.enPas = FR2SQ(file, rank);
    }

    GameBoard.posKey = GeneratePosKey();
    UpdateListsMaterial();
}

function PrintSqAttacked() {
	
	let sq,file,rank,piece;

	console.log("\nAttacked:\n");
	
	for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
		let line =((rank+1) + "  ");
		for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
			sq = FR2SQ(file,rank);
			if(SqAttacked(sq, GameBoard.side) == BOOL.TRUE) piece = "X";
			else piece = "-";
			line += (" " + piece + " ");
		}
		console.log(line);
	}
	
	console.log("");
	
}

function SqAttacked(sq, side) {
    let pce;
    let t_sq;

    if (side == COLOURS.WHITE) {
        if (GameBoard.pieces[sq - 11] == PIECES.wP || GameBoard.pieces[sq - 9] == PIECES.wP) {
            return BOOL.TRUE;
        }
    } else {
        if (GameBoard.pieces[sq + 11] == PIECES.bP || GameBoard.pieces[sq + 9] == PIECES.bP) {
            return BOOL.TRUE;
        }
    }
    for (let i = 0; i < 8; i++) {
        pce = GameBoard.pieces[sq + KnDir[i]];
        if (pce != SQUARES.OFFBOARD && PieceCol[pce] == side && PieceKnight[pce] == BOOL.TRUE) {
            return BOOL.TRUE;
        }
    }
    for (let i = 0; i < 4; i++) {
        dir = RkDir[i];
        t_sq = sq + dir;
        pce = GameBoard.pieces[t_sq];
        while (pce != SQUARES.OFFBOARD) {
            if (pce != PIECES.EMPTY) {
                if (PieceRookQueen[pce] == BOOL.TRUE && PieceCol[pce] == side) {
                    return BOOL.TRUE;
                }
                break;
            }
            t_sq += dir;
            pce = GameBoard.pieces[t_sq];
        }
    }
    for (let i = 0; i < 4; i++) {
        dir = BiDir[i];
        t_sq = sq + dir;
        pce = GameBoard.pieces[t_sq];
        while (pce != SQUARES.OFFBOARD) {
            if (pce != PIECES.EMPTY) {
                if (PieceBishopQueen[pce] == BOOL.TRUE && PieceCol[pce] == side) {
                    return BOOL.TRUE;
                }
                break;
            }
            t_sq += dir;
            pce = GameBoard.pieces[t_sq];
        }
    }
    for (let i = 0; i < 8; i++) {
        pce = GameBoard.pieces[sq + KiDir[i]];
        if (pce != SQUARES.OFFBOARD && PieceCol[pce] == side && PieceKing[pce] == BOOL.TRUE) {
            return BOOL.TRUE;
        }
    }

    return BOOL.FALSE;
}


// function ParseFen(fen) {
    
//     ResetBoard();

//     let rank = RANKS.RANK_8;
//     let file = FILES.FILE_A;
//     let piece = 0;
//     let count = 0;
//     let sq120 = 0;
//     let fenCnt = 0;

//     while ((rank >= RANKS.RANK_1) && fenCnt < fen.length) {
//         count = 1;
//         switch (fen[fenCnt]) {
//             case 'p' : piece = PIECES.bP; break;
//             case 'r' : piece = PIECES.bP; break;
//             case 'n' : piece = PIECES.bP; break;
//             case 'b' : piece = PIECES.bP; break;
//             case 'k' : piece = PIECES.bP; break;
//             case 'q' : piece = PIECES.bP; break;
//             case 'P' : piece = PIECES.bP; break;
//             case 'R' : piece = PIECES.bP; break;
//             case 'N' : piece = PIECES.bP; break;
//             case 'B' : piece = PIECES.bP; break;
//             case 'K' : piece = PIECES.bP; break;
//             case 'Q' : piece = PIECES.bP; break;

//             case '1':
//             case '2':
//             case '3':
//             case '4':
//             case '5':
//             case '6':
//             case '7':
//             case '8':
//                 piece = PIECES.EMPTY;
//                 count = fen[fenCnt].charCodeAt() - '0'.charCodeAt();
//                 break;
//             case '/':
//             case ' ':
//                 rank--;
//                 file = FILES.FILE_A;
//                 fenCnt++;
//                 continue;
//             default:
//                 console.log("FEN error");
//                 return;
//         }
        
//         for (i = 0; i < count; i++) {
//             sq120 = FR2SQ(file, rank);
//             Gameboard.pieces[sq120] = piece;
//             file++;
//         }
//         fenCnt++;
//     }
// }