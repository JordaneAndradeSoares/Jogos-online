"use strict";

// Quando este projeto ainda estava em desenvolvimento ativo, a ideia era executar esta verificação apenas nos clientes, pois ela pode ser bastante custosa.
// Ela seria executada em uma tarefa de segundo plano (Worker) para não deixar a interface lenta.
// If the client were to tamper with this file and disable it, at best it could cause the client to not report a checkmate, but since there are no legal moves the only option would be for said client to time out.
// Não sei se essa ideia é sólida o suficiente para uso real. It can always be ran on the server too just in case, probably best to do this with a timelimit.

self.importScripts("./01-pieces.js" + self.location.search
                  ,"./03-game.js" + self.location.search
                  ,"./05-hcuboid.js" + self.location.search
                  ,"./04-hcuboid-interface.js" + self.location.search )

function c2v(c){
	return new Vec4(c[2],c[3],c[0],c[1]);
}

function mkMoves (ms){
	let result = []
	for (let m of ms) result.push({from:c2v(m.start), to:c2v(m.end)})
	return result
}

class WorkerPlayer extends Player {
	startClock(skipGraceAmount, skipAmount) { }
	stopClock() { }
}

class WorkerGame extends Game {
	instantiatePlayer(side) {
		return new WorkerPlayer(this, side);
	}
	startMateSearch() {
		this.findChecks();
		const gen = this.searchMate();
		const loop = _ => {
			const stopTime = performance.now() + 100;
			do {
				const r = gen.next();
				if (r.done || r.value)
					return postMessage(r.value);
			} while (performance.now() < stopTime);
			this.searchTimeout = setTimeout(loop, 0);
		};
		loop();
	}
	stopMateSearch() {
		clearTimeout(this.searchTimeout);
	}
	*searchMate() {
		for(let c of search(this)){
			if(!c) yield c
			else{
				yield mkMoves(c)
			}
		}
	};
}

onmessage = function(options) {
	const game = new WorkerGame(options.data, [true, true]);
	game.startMateSearch();

	onmessage = function(move) {
		game.stopMateSearch();
		if (move.data != "stop") {
			game.executeMove("submeter", move.data);
			game.startMateSearch();
		}
	}
}