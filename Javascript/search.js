let SearchController = {};

SearchController.nodes;
SearchController.fh;
SearchController.fhf;
SearchController.depth;
SearchController.time;
SearchController.start;
SearchController.stop;
SearchController.best;
SearchController.thinking;

function PickNextMove(MoveNum) {

    let bestScore = -1;
    let bestNum = MoveNum;

    for (let i = MoveNum; i < GameBoard.moveListStart[GameBoard.ply + 1]; i++) {
        if (GameBoard.moveScores[i] > bestScore) {
            bestScore = GameBoard.moveScores[i];
            bestNum = i;
        }
    }

    if (bestNum != MoveNum) {
        let temp = 0;
        temp = GameBoard.moveScores[MoveNum];
        GameBoard.moveScores[MoveNum] = GameBoard.moveScores[bestNum];
        GameBoard.moveScores[bestNum] = temp;

        temp = GameBoard.moveList[MoveNum];
        GameBoard.moveList[MoveNum] = GameBoard.moveList[bestNum];
        GameBoard.moveList[bestNum] = temp;
    }
}

function ClearPvTable() {

    for (let i = 0; i < PVENTRIES; i++) {
        GameBoard.PvTable[i].move = NOMOVE;
        GameBoard.PvTable[i].posKey = 0;
    }
}

function CheckUp() {
    if ((Date.now() - SearchController.start) > SearchController.time) {
        SearchController.stop = BOOL.TRUE;
    }
}

function IsRepetition() {

    for (let i = GameBoard.hisPly - GameBoard.fiftyMove; i < GameBoard.hisPly - 1; i++) {
        if (GameBoard.posKey == GameBoard.history[i].posKey) {
            return BOOL.TRUE;
        }
    }

    return BOOL.FALSE;
}

function Quiescence(alpha, beta) {

    if ((SearchController.nodes & 2047) == 0) {
        CheckUp();
    }

    SearchController.nodes++;

    if ((IsRepetition() || GameBoard.fiftyMove >= 100) && GameBoard.ply != 0) {
        return 0;
    }

    if (GameBoard.ply > MAXDEPTH - 1) {
        return EvalPosition();
    }

    let Score = EvalPosition();

    if (Score >= beta) {
        return beta;
    }

    if (Score > alpha) {
        alpha = Score;
    }

    GenerateCaptures();

    let MoveNum = 0;
    let Legal = 0;
    let OldAlpha = alpha;
    let BestMove = NOMOVE;
    let Move = NOMOVE;

    for (MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; MoveNum++) {

        PickNextMove(MoveNum);

        Move = GameBoard.moveList[MoveNum];

        if (MakeMove(Move) == BOOL.FALSE) {
            continue;
        }

        Legal++;
        Score = -Quiescence(-beta, -alpha); 

        TakeMove();

        if (SearchController.stop == BOOL.TRUE) {
            return 0;
        }

        if (Score > alpha) {
            if (Score >= beta) {
                if (Legal == 1) {
                    SearchController.fhf++;
                }
                SearchController.fh++;
                return beta;
            }
            alpha = Score;
            BestMove = Move;
        }
    }

    if (alpha != OldAlpha) {
        StorePvMove(BestMove);
    }

    return alpha;
}

function AlphaBeta(alpha, beta, depth) {

    if (depth <= 0) {
        return Quiescence(alpha, beta);
    }
    
    if ((SearchController.nodes & 2047) == 0) {
        CheckUp();
    }

    SearchController.nodes++;

    if ((IsRepetition() || GameBoard.fiftyMove >= 100) && GameBoard.ply != 0) {
        return 0;
    }

    if (GameBoard.ply > MAXDEPTH - 1) {
        return EvalPosition();
    }

    let InCheck = SqAttacked(GameBoard.pList[PCEINDEX(Kings[GameBoard.side], 0)], GameBoard.side ^ 1);
    if (InCheck == BOOL.TRUE) {
        depth++;
    }


    let Score = -INFINITE;

    GenerateMoves();

    let MoveNum = 0;
    let Legal = 0;
    let OldAlpha = alpha;
    let BestMove = NOMOVE;
    let Move = NOMOVE;

    let PvMove = ProbePvTable();

    if (PvMove != NOMOVE) {
        for (MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; MoveNum++) {
            if (GameBoard.moveList[MoveNum] == PvMove) {
                GameBoard.moveScores[MoveNum] = 2000000;
                break;
            }
        }
    }

    for (MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; MoveNum++) {

        PickNextMove(MoveNum);

        Move = GameBoard.moveList[MoveNum];

        if (MakeMove(Move) == BOOL.FALSE) {
            continue;
        }

        Legal++;
        Score = -AlphaBeta(-beta, -alpha, depth - 1); 

        TakeMove();

        if (SearchController.stop == BOOL.TRUE) {
            return 0;
        }

        if (Score > alpha) {
            if (Score >= beta) {
                if (Legal == 1) {
                    SearchController.fhf++;
                }
                SearchController.fh++;

                if ((Move & MFLAGCAP) == 0) {
                    GameBoard.searchKillers[MAXDEPTH + GameBoard.ply] = GameBoard.searchKillers[GameBoard.ply];
                    GameBoard.searchKillers[GameBoard.ply] = Move;
                }

                return beta;
            }

            if ((Move & MFLAGCAP) == 0) {
                GameBoard.searchHistory[GameBoard.pieces[FROMSQ(Move)] * BRD_SQ_NUM + TOSQ(Move)] += depth * depth;
            }

            alpha = Score;
            BestMove = Move;
        }
    }

    if (Legal == 0) {
        if (InCheck == BOOL.TRUE) {
            return -MATE + GameBoard.ply;
        } else {
            return 0;
        }
    }

    if (alpha != OldAlpha) {
        StorePvMove(BestMove);
    }

    return alpha;
}

function ClearForSearch() {

    for (let i = 0; i < 14 * BRD_SQ_NUM; i++) {
        GameBoard.searchHistory[i] = 0;
    }

    for (let i = 0; i < 3 * MAXDEPTH; i++) {
        GameBoard.searchKillers[i] = 0;
    }

    ClearPvTable();
    GameBoard.ply = 0;
    SearchController.nodes = 0;
    SearchController.fh = 0;
    SearchController.fhf = 0;
    SearchController.start = Date.now();
    SearchController.stop = BOOL.FALSE;
}

function SearchPosition() {

    let bestMove = NOMOVE;
    let bestScore = -INFINITE;
    let Score = -INFINITE;
    let currentDepth = 0;
    let line;
    let PvNum;

    ClearForSearch();

    for (currentDepth = 1; currentDepth <= SearchController.depth; currentDepth++) {

        Score = AlphaBeta(-INFINITE, INFINITE, currentDepth)

        if (SearchController.stop == BOOL.TRUE) {
            break;
        }

        bestScore = Score;
        bestMove = ProbePvTable();
        line = 'D:' + currentDepth + ' Best:' + PrMove(bestMove) + ' Score:' + bestScore + ' nodes:' + SearchController.nodes;

        PvNum = GetPvLine(currentDepth);
        line += ' Pv:';
        for (let i = 0; i < PvNum; i++) {
            line += ' ' + PrMove(GameBoard.PvArray[i]);
        }
        
        if (currentDepth != 1) {
            line += (" Ordering:" + ((SearchController.fhf / SearchController.fh)*100).toFixed(2) + "%");
        }

        console.log(line);

    }

    SearchController.best = bestMove;
    SearchController.thinking = BOOL.FALSE;
    UpdateDOMStats(bestScore, currentDepth);
}

function UpdateDOMStats(dom_score, dom_depth) {

    let scoreText = "Score: " + (dom_score / -100).toFixed(2); /* <---- changed 100 to -100 */
    
    if (Math.abs(dom_score) > MATE - MAXDEPTH) {
        scoreText = "Score: Mate In " + (MATE - (Math.abs(dom_score)) - 1) + " moves";
    }

    $("#OrderingOut").text("Ordering: " + ((SearchController.fhf / SearchController.fh)*100).toFixed(2) + "%");
    $("#DepthOut").text("Depth: " + (dom_depth - 1));
    $("#ScoreOut").text(scoreText);
    $("#NodesOut").text("Nodes: " + SearchController.nodes);
    $("#TimeOut").text("Time: " + ((Date.now() - SearchController.start) / 1000).toFixed(1) + "s");
    $("#BestOut").text("Best Move: " + PrMove(SearchController.best));
}