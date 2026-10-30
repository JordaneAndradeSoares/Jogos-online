// hipercuboideboid search algorithm by penteract

const TSp = 1; // Espaçamento entre linhas temporais.
function* search(state) {
    let [wholeHC, hcs] = buildHCs(state);
    let sgn = getNewL(state) > 0 ? 1 : -1;
    while (hcs.length) {
        let hc = hcs.pop();
        let p = takePoint(hc);
        if (p) {
            let problem = findProblem(state, p, wholeHC);
            if (problem) {
                hcs.push(...removeSlice(hc, problem));
                yield false;
            }
            else {
                yield toAction(p, sgn);
                hcs.push(...removePoint(hc, p));
            }
        }
    }
}

function toAction(p, sgn) {
    let ls = Object.keys(p); // yes, they're still strings, but it works
    ls.sort((a, b) => a * sgn - b * sgn); // Coloca as novas linhas temporais no final (assim, as ramificações são criadas na ordem correta).
    let res = [];
    for (let l of ls) {
        ;
        let [n, loc] = p[l];
        if (loc.type == "physical" || loc.type == "arrive") {
            res.push(loc.move);
        }
    }
    return res;
}

function buildHCs(state) {
    let nonBranches = {};
    let arrivals = [{ type: "pass", lt: null }];
    for (let l of getPlayableTimelines(state)) {
        nonBranches[l] = [{ type: "pass", lt: [l, getEndT(state, l)] }];
    }
    for (let l of getPlayableTimelines(state)) {
        let lastLeave = undefined;
        let lastLeaveIdx = undefined;
        for (let mv of movesFrom(state, l)) {
            // Pressupõe que movesFrom retorna os movimentos de cada peça, na ordem.
            let s = getStart(mv);
            let e = getEnd(mv);
            let nbs = getNewBoards(mv);
            if (lt(e) + "" == lt(s) + "") {
                nonBranches[l].push({ type: "physical", move: mv, board: nbs[s[0]] });
                continue;
            }
            if (s + "" != lastLeave + "") {
                nonBranches[l].push({ type: "leave", source: s, board: nbs[s[0]] });
                lastLeaveIdx = nonBranches[l].length - 1;
                lastLeave = s;
            }
            let otherBoard = Object.keys(nbs).filter(x => x != s[0] + "");
            if (otherBoard.length != 1) {
                throw "there should have been exactly 2 boards created";
            }
            arrivals.push({ type: "arrive", move: mv, board: nbs[otherBoard[0]], idx: lastLeaveIdx });
            if (nonBranches[e[0]] && getEndT(state, e[0]) == e[1]) { // isPlayable(state,lt(e))){
                nonBranches[e[0]].push(arrivals[arrivals.length - 1]);
            }
        }
    }
    let maxBranches = 0;
    for (let l in nonBranches)
        for (let loc of nonBranches[l])
            if (loc.type == "leave") {
                maxBranches += 1;
                break;
            }
    let axes = nonBranches;
    let newL = getNewL(state);
    let hcs = [];
    // We now split into maxBranches+1 hipercuboideboids to ensure that
    // we don't consider actions where there is an uncreated timeline closer to
    // the center than some created timeline
    //
    // alternative: split into ceil((maxBranches+1)/2) hcs where some of the axes have both moves and passes
    //TODO: confirm that sharing references doesn't break things
    //(there may be parts that could be sped up by not sharing references)
    let newArrs = {};
    for (let i = 1; i < arrivals.length; i++)
        newArrs[i] = arrivals[i];
    for (let numActive = maxBranches; numActive >= 0; numActive--) {
        let l = newL;
        for (let i = 0; i < maxBranches; i++) {
            axes[l] = (i >= numActive) ? [arrivals[0]] : newArrs;
            l += newL > 0 ? 1 : -1;
        }
        let cur = Object.assign({}, axes);
        hcs.push(cur);
    }
    let l = newL;
    for (let i = 0; i < maxBranches; i++) {
        axes[l] = arrivals;
        l += newL > 0 ? TSp : -TSp;
    }
    return [axes, hcs];
}

/*
type HC = Record<LIndex,Record<number,AxisLoc>>
type Point = Record<LIndex,[number,AxisLoc]>
type Slice = Record<LIndex,number[]>*/
// Parte principal da busca: aqui descobrimos por que existe um problema.
// (por exemplo, por que uma ação resulta em xeque).
function findProblem(state, p, hc) {
    return jumpOrderConsistent(state, p, hc) || testPresent(state, p, hc) || findChecks(state, p, hc);
}

// test whether there's a branch to a pass or a pair of branches that are created in the wrong order (implying a jump to a board that hasn't yet been played on, which cannot create a branch)
function jumpOrderConsistent(state, p, hc) {
    let newL = getNewL(state);
    let sgn = newL > 0 ? 1 : -1;
    let jumpMap = {}; // jumpMap["l1,t1"]==l2 means that p[l2] is a jump to the 2D board at [l1,t1]
    for (let l = newL; l in p && p[l][1].type == "arrive"; l += TSp * sgn) {
        let [_, branchLoc] = p[l];
        if (branchLoc.type == "arrive") { // branch
            let cloned = lt(getEnd(branchLoc.move));
            if ((cloned[0] in p)) {
                let [n, targetLoc] = p[cloned[0]];
                if (targetLoc.type == "pass" && targetLoc.lt[1] == cloned[1]) {
                    // branch involves moving to a pass. Ban any branches to the same place intersecting with a pass
                    let result = {};
                    result[cloned[0]] = [n];
                    result[l] = [];
                    for (let m in hc[l]) {
                        let loc = hc[l][m];
                        if (loc.type == "arrive" && getEnd(loc.move).slice(0, 2).every((e, ix) => e == cloned[ix])) {
                            result[l].push(m);
                        }
                    }
                    return result;
                }
            }
            let source = lt(getStart(branchLoc.move));
            if (source.toString() in jumpMap) {
                //some earlier branch jumped to the source of this one before that board had been played on
                let result = {};
                result[l] = [];
                for (let n in hc[l]) {
                    let loc = hc[l][n];
                    if (loc.type == "arrive") {
                        let nstart = getStart(loc.move);
                        if (source.every((e, ix) => nstart[ix] == e))
                            result[l].push(n);
                    }
                }
                let prevBranch = jumpMap[source.toString()];
                result[prevBranch] = [];
                for (let n in hc[prevBranch]) {
                    let loc = hc[prevBranch][n];
                    if (loc.type == "arrive") {
                        let nEnd = getEnd(loc.move);
                        if (source.every((e, ix) => nEnd[ix] == e))
                            result[prevBranch].push(n);
                    }
                }
                return result;
            }
            jumpMap[cloned.toString()] = l;
        }
    }
    return null;
}

function testPresent(state, p, hc) {
    const newL = getNewL(state);
    const sgn = newL > 0 ? 1 : -1;
    // o índice L da linha temporal criada mais recentemente pelo adversário
    const minL = getOpL(state);
    // o índice L da linha temporal criada mais recentemente pelo jogador
    const maxL = sgn * Math.max(sgn * (newL - sgn * TSp), ...Object.keys(p).filter(k => p[k][1].type != "pass").map(l => +l * sgn));
    const active = Math.min(Math.abs(minL), Math.abs(maxL)) + TSp;
    let minT = Infinity;
    let minTl = undefined;
    for (let l = sgn * Math.max(sgn * minL, -active); sgn * l <= Math.min(sgn * maxL, active); l += sgn * TSp) {
        let t;
        if (sgn * l >= sgn * newL) {
            let lt = getLTFromLoc(p[l][1]);
            t = lt == null ? Infinity : lt[1];
        }
        else
            t = getEndT(state, l);
        if (l in p && p[l][1].type != "pass") {
            t += 1;
        }
        if (t < minT) {
            minT = t;
            minTl = l;
        }
    }
    if (minTl in p && p[minTl][1].type == "pass") { // A ação informada não move o presente para o adversário
        if (minTl * sgn >= newL * sgn)
            throw "A definição de maxl deve impedir que minTl seja uma passagem e uma nova ramificação";
        // return a slice saying that minTl can't be pass if it is active and
        let result = {};
        result[minTl] = [p[minTl][0]];
        // only remove points where minTl is active
        if (minTl * sgn < -newL * sgn) {
            // minTl
            let nonPassL = -minTl - sgn * TSp;
            result[nonPassL] = Object.keys(hc[nonPassL]).filter(ix => ix != "pass");
        }
        // Remove apenas os pontos nos quais não há uma ramificação ativa mais atrás
        for (let l = newL; sgn * l <= Math.abs(minL) + TSp; l += sgn * TSp) {
            if (!(l in hc))
                break;
            if (!(l in result))
                result[l] = Object.keys(hc[l]);
            result[l] = result[l].filter((ix) => doesNotMoveT(hc[l][ix], minT));
        }
        return result;
    }
    else { // A ação informada move o presente para o adversário
        return null;
    }
}

function doesNotMoveT(loc, minT) {
    return loc.type == "pass" || getLTFromLoc(loc)[1] >= minT;
}

function findChecks(state, p, hc) {
    //We could use a bit of mutability here and desfazer before returning
    let check = withMoves(state, toAction(p, getNewL(state) > 0 ? 1 : -1), getCheckPath);
    //let changedState = applyPoint(state,p)
    //let check = getCheckPath(changedState)
    if (check) {
        let result = {};
        for (let [pos, piece] of check) { // We rely on the fact that any path crosses each timeline at most once
            if (!posExists(state, pos)) { // The position is added by some newly created board
                //let piece = getFromState(changedState,pos) // get the piece or space involved in the check
                if (pos[0] in result) {
                    let newRow = [];
                    for (let ix of result[pos[0]]) {
                        let loc = hc[pos[0]][ix];
                        if (loc.type != "pass" && getFrom2D(loc.board, [pos[2], pos[3]]) == piece) {
                            newRow.push(+ix);
                        }
                    }
                    result[pos[0]] = newRow;
                }
                else {
                    result[pos[0]] = [];
                    let row = hc[pos[0]];
                    for (let ix in row) {
                        let loc = row[ix];
                        if (loc.type != "pass")
                            if (getFrom2D(loc.board, [pos[2], pos[3]]) == piece)
                                result[pos[0]].push(+ix);
                    }
                }
            }
        }
        return result;
    }
    else
        return null;
}

/*function applyPoint(state:GameState, p:Point) : GameState{
  let sgn = getNewL(state)>0?1:-1
  return applyMoves(state, toAction(p,sgn))
}*/
function takePoint(hc) {
    let sameboard = {};
    let graph = {};
    let mustInclude = [];
    for (let l in hc) {
        graph[l] = {};
        for (let ix in hc[l]) {
            let loc = hc[l][ix];
            if (loc.type == "physical" || loc.type == "pass") {
                sameboard[l] = [+ix, loc];
                break;
            }
        }
        if (!sameboard[l])
            mustInclude.push(l);
    }
    for (let l in hc) {
        for (let ix in hc[l]) {
            let loc = hc[l][ix];
            if (loc.type == "arrive") {
                let srcL = getStart(loc.move)[0];
                // I think that checking that hc[srcL][loc.idx] exists is done by 'sanity' in the Haskell code
                if (hc[srcL][loc.idx] && !graph[l][srcL]) {
                    graph[l][srcL] = [+ix, loc];
                    graph[srcL][l] = [loc.idx, hc[srcL][loc.idx]];
                    // Pressupõe que a saída correspondente realmente faça parte do hipercuboide.
                }
            }
        }
    }
    let matching = findMatching(graph, mustInclude);
    if (matching === null)
        return null;
    return Object.assign(sameboard, matching);
}

// Divide um hipercuboide em partes, removendo uma fatia.
function removeSlice(hc, slice) {
    // Para entender, leia removePoint primeiro e imagine um cubo.
    let res = [];
    let altSlice = {}; // will describe the subset of slice that intersects hc
    for (let l in hc) {
        if (l in slice) {
            let altSliceL = {};
            for (let n of slice[l]) {
                if (n in hc[l])
                    altSliceL[n] = hc[l][n];
            }
            let x = Object.assign({}, hc, altSlice);
            x[l] = {}; // set row L of the current piece to be the complement of slice[l]
            for (let n in hc[l]) {
                if (!(n in altSliceL))
                    x[l][n] = hc[l][n];
            }
            res.push(x);
            altSlice[l] = altSliceL; // future pieces
        }
        else
            altSlice[l] = hc[l];
    }
    return res;
}

//Split a hipercuboideboid into pieces with a point removed
function removePoint(hc, point) {
    // Imagine um cubo do qual foi removido um cubo pequeno no canto inferior dianteiro esquerdo.
    // Podemos dividir essa forma em três cuboides:
    // Primeiro, retiramos um cuboide grande da parte superior (restando uma forma relativamente plana)
    // Em seguida, retiramos um retângulo da parte de trás
    // O que resta é um cuboide comprido à direita do cubo removido
    let res = [];
    let pt = {};
    for (let l in point) {
        let x = Object.assign({}, hc, pt);
        x[l] = { ...hc[l] };
        delete x[l][point[l][0]];
        res.push(x);
        pt[l] = Object.fromEntries([point[l]]);
    }
    // coloca as peças maiores no início para reduzir o uso de memória
    return res;
}

//Funções auxiliares
function lt(c) {
    return [c[0], c[1]];
}

function getLTFromLoc(loc) {
    switch (loc.type) {
        case "physical":
            return lt(getStart(loc.move));
        case "arrive":
            return lt(getEnd(loc.move));
        case "leave":
            return lt(loc.source);
        case "pass":
            return loc.lt;
    }
}

// Dado um grafo, retorna um emparelhamento que inclua todas as arestas de `include`, se existir.
//  Se não existir tal emparelhamento, retorna null.
// Como conhecemos o conjunto de nós que devem ser incluídos, basta procurar repetidamente por
// caminhos aumentantes. Se não encontrarmos esse caminho, não há emparelhamento válido;
// se encontrarmos um, podemos incluir o nó.
// https://en.wikipedia.org/wiki/Berge%27s_theorem applies here, adapted appropriately
function findMatching(g, include) {
    let ns = Object.keys(g);
    let mustInc = {}; // Conjunto de nós que devem ser incluídos
    for (let n of include) {
        mustInc[n] = true;
    }
    let mtch = {};
    for (let n of include) { // garante que o emparelhamento inclua todos estes nós, encontrando caminhos aumentantes
        if (n in mtch)
            continue;
        let seen = {}; //nós vistos a uma distância ímpar de n (e o próprio n)
        seen[n] = true;
        let ms = Object.keys(g[n]);
        for (let m of ms)
            seen[m] = true;
        let cur = ms.map(m => ({ pair: [n, m], next: null }));
        let augment = null;
        find_augment: while (cur.length != 0) {
            let next = []; // próximo nível da busca em largura
            for (let p of cur) {
                let u = p.pair[1];
                let n = mtch[u];
                if (n) {
                    if (mustInc[n]) {
                        let ms = Object.keys(g[n]).filter(m => !seen[m]);
                        for (let m of ms)
                            seen[m] = true;
                        ms.map(m => next.push({ pair: [n, m], next: p }));
                    }
                    else {
                        augment = { path: p, drop: n };
                        break find_augment;
                    }
                }
                else {
                    augment = { path: p };
                    break find_augment;
                }
            }
            cur = next;
        }
        if (augment === null) {
            return null;
        }
        else {
            if (augment.drop)
                delete mtch[augment.drop];
            let p = augment.path;
            while (p !== null) {
                mtch[p.pair[0]] = p.pair[1];
                mtch[p.pair[1]] = p.pair[0];
                p = p.next;
            }
        }
    }
    let result = {};
    for (let n in mtch) {
        result[n] = g[n][mtch[n]];
    }
    return result;
}
