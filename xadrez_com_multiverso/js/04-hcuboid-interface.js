function getStart(mv) {
		return mv.start;
}

function getEnd(mv) {
		return mv.end;
}

function getNewBoards(mv) {
		return mv.newBoards;
}

function v2c(v){
	return [v.l,v.t,v.x,v.y]
}

// Retorna o índice L no qual uma nova linha temporal seria criada
function getNewL(gs) {
	return gs.turn?gs.timelines[1].length:-gs.timelines[0].length-1;
}

// Retorna o índice L da linha temporal criada mais recentemente pelo adversário
function getOpL(gs) {
	return gs.turn?-gs.timelines[0].length:gs.timelines[1].length-1;
}

// Retorna o índice T do último tabuleiro de uma linha temporal
function getEndT(gs, l) {
	let t = gs.getTimeline(l)
	return t.end;
}

//Retorna uma lista dos movimentos originados em uma linha temporal,
// agrupados pela peça que se move
function movesFrom(gs, l) {
	let res = [];
	let tl = gs.getTimeline(l)
	for (let piece of getMovablePieces(tl.boards[tl.boards.length-1])) {
		for (let dest of piece.enumerateMoves()) { // não se preocupe com promoções
			res.push(mkMove(gs, piece, dest));
		}
	}
	return res;
}

function* getMovablePieces(board){
	for (let row of board.pieces){
		for (let p of row) {
			if (p && p.side==board.turn){
				yield p
			}
		}
	}
}

function mkMove(gs,piece,dest){
	mv = gs.instantiateMove(piece,dest)
	mv.desfazer()
	newBoards = {}
	for (let b of mv.createdBoards){
		newBoards[b.l] = boardToArray(b)
	}
	return {
		start: v2c(mv.from),
		end: v2c(mv.to),
		newBoards:newBoards
	}
}

function boardToArray(board){
	let rows = []
	for(let row of board.pieces){
		let r = []
		for(let p of row){
			r.push(pieceToString(p))
		}
		rows.push(r)
	}
	return rows
}

function pieceToString(p){
	return p?p.type+"_"+p.side:" "
}

// retorna uma lista das linhas temporais nas quais é a vez do jogador atual
function getPlayableTimelines(gs) {
	result = []
	for(let l = -gs.timelineCount[0]; l<= gs.timelineCount[1];l++){
		if ((gs.getTimeline(l).end+1)%2==gs.turn){
			result.push(l)
		}
	}
	return result
}

// aplica fn a gs com ms
function withMoves(gs,ms,fn){
	mvs = []
	for (let m of ms){
		mvs.push(gs.instantiateMove(getP(gs,m.start), new Vec4(m.end[2],m.end[3],m.end[0],m.end[1]) ))
	}
	let result = fn(gs)
	while(mvs.length){
		mvs.pop().desfazer()
	}
	return result
}
// Retorna uma lista das posições envolvidas em um xeque
function getCheckPath(gs) {
	for (let timelineDirection of gs.timelines){
		for (let timeline of timelineDirection) {
			const board = timeline.boards[timeline.boards.length - 1];
			if (board.turn != gs.turn){
				for(let p of getMovablePieces(board)){
					let dir = undefined
					let ppos = new Vec4(p.x, p.y, p.board.l, p.board.t)
					let prevDest, path;
					for(let dest of p.enumerateMoves()){
						if(!dir || !dest.sub(prevDest).equals(dir)){
							// Pressupõe que as direções são verificadas em uma ordem razoável
							dir = dest.sub(ppos)
							path = [[v2c(ppos),pieceToString(p)]]
						}
						let dpiece = gs.getPiece(dest)
						path.push([v2c(dest),pieceToString(dpiece)])
						if(dpiece&& dpiece.type=="King"){
							return path
						}
						prevDest = dest
					}
				}
			}
		}
	}
	return null
}

// retorna true se as coordenadas L e T de pos indicarem um tabuleiro existente no estado
function posExists(state, pos) {
	let [l,t,x,y] = pos
	if (l < -state.timelineCount[0] || l > state.timelineCount[1]){
		return false
	}
	let tl = state.getTimeline(l)
	if (t<tl.start || t>tl.end) return false;
	if (x<0 || y<0 || x>7 || y>7) return false;
	return true;
}

function getP(state, pos){
	return state.getTimeline(pos[0]).getBoard(pos[1]).pieces[pos[2]][pos[3]]
}

// retorna a peça em uma posição específica ou null se a posição não existir
// também pode falhar em uma posição ilegal (desde que você não use a implementação de posExists acima)
function getFromState(state, pos) {
		return pieceToString(getP(state, pos));
}

// retorna a peça na posição indicada de um tabuleiro
function getFrom2D(board, pos) {
		return board[pos[0]][pos[1]];
}