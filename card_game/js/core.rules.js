
function obterCustoOriginalDaCarta(carta) {
    if (!carta) return 0;

    return Number(
        carta._faceDownOriginalCost ??
        carta.baseCost ??
        carta.custoBase ??
        carta.cost
    ) || 0;
}

function cartaPodeAtacar(carta) {
    if (!carta || carta.type !== 'criatura') return false;
    if (carta.isFaceDown) return false;
    if (carta.isStunned) return false;
    if (carta.isResting) return false;
    if (carta.attackedThisTurn) return false;
    if (carta.lastAttackTurn === state.turn - 1) return false;
    if (Number(carta.casusBelli) <= 0) return false;
    if (carta.atk === null || carta.atk === undefined) return false;

    return true;
}

function cartaPodeBloquear(carta) {
    if (!carta) return false;

    if (carta.isFaceDown) {
        return true;
    }

    if (carta.type === 'terreno') {
        return !carta.isResting;
    }

    if (carta.type !== 'criatura') {
        return false;
    }

    if (carta.isStunned) return false;
    if (carta.isResting) return false;
    if (Number(carta.casusBelli) <= 0) return false;

    return true;
}

function jogadorPodeJogarCarta(playerKey, carta, faceDown = false) {
    const jogador = state.players[playerKey];

    if (!jogador || !carta) return false;
    if (state.initiativeOwner !== playerKey) return false;
    if (state.activeAttack) return false;
    if (state.pendingDiscard[playerKey]) return false;

    if (faceDown) {
        if (carta.type !== 'criatura' && carta.type !== 'terreno') {
            return false;
        }
    } else if (jogador.energy < obterCustoOriginalDaCarta(carta)) {
        return false;
    }

    if (
        carta.type !== 'efeito' &&
        jogador.field.length >= 5
    ) {
        return false;
    }

    return true;
}

function prepararCartaFaceDown(carta, jogador) {
    if (!carta || !jogador) return false;

    if (typeof removerEfeitosAtivosDaCarta === 'function') {
        removerEfeitosAtivosDaCarta(carta);
    }

    carta._faceDownOriginalCost =
        carta.baseCost ??
        carta.custoBase ??
        carta.cost;

    carta._faceDownOriginalAtk = carta.atk;
    carta._faceDownOriginalDef = carta.def;
    carta._faceDownOriginalCurrentDef =
        carta.currentDef ?? carta.def;
    carta._faceDownAtkBonus = 0;

    // Enquanto estiver virada para baixo, a carta usa uma defesa própria de 1.
    // Buffs aplicados enquanto oculta são acumulados separadamente para
    // continuarem válidos quando a carta for revelada.
    carta._faceDownDefBonus = 0;
    carta._faceDownDamage = 0;

    carta.cost = 0;
    carta.atk = null;
    carta.def = 1;
    carta.currentDef = 1;
    carta.isFaceDown = true;

    carta.isStunned = false;
    carta.stunReason = null;
    carta.stunPhase = null;
    carta.isResting = false;
    carta.attackedThisTurn = false;
    carta.attackedLastTurn = false;
    carta.lastAttackTurn = null;
    carta.casusBelli = 0;
    carta.summonedTurn = state.turn;

    return true;
}

function prepararCartaFaceUp(carta, jogador) {
    if (!carta || !jogador) return false;

    const custo = obterCustoOriginalDaCarta(carta);

    if (jogador.energy < custo) return false;

    jogador.energy -= custo;

    carta.cost = custo;
    carta._activeStatApplied = false;
    carta._activeTickedTurn = null;
    carta.isFaceDown = false;
    carta.isResting = false;
    carta.summonedTurn = state.turn;

    if (carta.type === 'criatura') {
        carta.isStunned = true;
        carta.stunReason = 'summon';
        carta.stunPhase = 'red';
        carta.casusBelli = 0;
    } else {
        carta.isStunned = false;
        carta.stunReason = null;
        carta.stunPhase = null;
    }

    return true;
}

function marcarAtaqueDaCarta(carta) {
    if (!cartaPodeAtacar(carta)) return false;

    carta.attackedThisTurn = true;
    carta.attackedLastTurn = false;
    carta.lastAttackTurn = state.turn;
    carta.isStunned = true;
    carta.stunReason = 'attack';
    carta.stunPhase = 'orange';
    carta.casusBelli = 0;

    return true;
}
