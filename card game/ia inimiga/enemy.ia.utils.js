function obterAtaqueDaCartaInimiga(carta) {
    if (!carta) return 0;
    return Number(carta.atk) || 0;
}

function obterDefesaDaCartaInimiga(carta) {
    if (!carta) return 0;
    return Number(carta.currentDef ?? carta.def ?? carta.baseDef) || 0;
}

function obterCustoDaCartaInimiga(carta) {
    if (!carta) return 0;
    return Number(carta.cost) || 0;
}

function cartaInimigaPodeAtacar(carta) {
    if (!carta) return false;
    if (carta.type !== 'criatura') return false;
    if (carta.isFaceDown) return false;
    if (carta.isStunned) return false;
    if (carta.isResting) return false;
    if (carta.attackedThisTurn) return false;
    if (Number(carta.casusBelli) <= 0) return false;
    if (carta.lastAttackTurn === state.turn - 1) return false;

    return true;
}

function obterValorDaCriaturaInimiga(carta) {
    if (!carta) return -Infinity;

    return (
        obterAtaqueDaCartaInimiga(carta) * 2 +
        obterDefesaDaCartaInimiga(carta)
    );
}
