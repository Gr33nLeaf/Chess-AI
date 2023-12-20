$(function(){
    init();
    console.log("Main Init Called");
    NewGame(START_FEN);
});

function InitFilesRanksBrd() {
    let file = FILES.FILE_A;
    let rank = RANKS.RANK_1;
    let sq = SQUARES.A1;

    for (let i = 0; i < BRD_SQ_NUM; ++i) {
        FilesBrd[i] = SQUARES.OFFBOARD;
        RanksBrd[i] = SQUARES.OFFBOARD;
    }

    for (rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank){
        for (file = FILES.FILE_A; file <= FILES.FILE_H; ++file){
            sq = FR2SQ(file, rank);
            FilesBrd[sq] = file;
            RanksBrd[sq] = rank;
        }
    }
}

function InitHashKeys() {
    for (let i = 0; i < 14 * 120; ++i) {
        PieceKeys[i] = RAND_32();
    }

    SideKey = RAND_32();

    for(let i = 0; i < 16; ++i) {
        CastleKeys[i] = RAND_32();
    }
}

function InitSq120To64() {
    let file = FILES.FILE_A;
    let rank = RANKS.RANK_1;
    let sq = SQUARES.A1;
    let sq64 = 0;

    for (let i = 0; i < BRD_SQ_NUM; ++i) {
        Sq120ToSq64[i] = 65;
    }

    for (let i = 0; i < 64; ++i) {
        Sq64ToSq120[i] = 120;
    }

    for (rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
        for (file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
            sq = FR2SQ(file, rank);
            Sq64ToSq120[sq64] = sq;
            Sq120ToSq64[sq] = sq64;
            sq64++;
        }
    }
}

function InitBoardVars() {
    
    for (let i = 0; i < MAXGAMEMOVES; i++) {
        GameBoard.history.push( {
            move : NOMOVE,
            castlePerm : 0,
            enPas : 0,
            fiftyMove : 0,
            postKey : 0
        });
    }

    for (let i = 0; i < PVENTRIES; i++) {
        GameBoard.PvTable.push({
            move : NOMOVE,
            posKey : 0
        });
    }
}

function InitBoardSquares() {
    let light = 1;
    let rankName;
    let fileName;
    let divString;
    let rankIter;
    let fileIter;
    let lightString;

    for (rankIter = RANKS.RANK_8; rankIter >= RANKS.RANK_1; rankIter--) {
        light ^= 1;
        rankName = "rank" + (rankIter + 1);
        for (fileIter = FILES.FILE_A; fileIter <= FILES.FILE_H; fileIter++) {
            fileName = "file" + (fileIter + 1);
            if (light == 0) lightString = "Light";
            else lightString = "Dark";
            light ^= 1;
            divString = "<div class=\"Square " + rankName + " " + fileName + " " + lightString + "\"/>";
            $("#Board").append(divString);
        }
    }

}

function init(){
    console.log("init() called");
    InitFilesRanksBrd();
    InitHashKeys();
    InitSq120To64();
    InitBoardVars();
    InitMvvLva();
    InitBoardSquares();
}