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
    return cartaPodeAtacar(carta);
}

function obterValorDaCriaturaInimiga(carta) {
    if (!carta) return -Infinity;

    return (
        obterAtaqueDaCartaInimiga(carta) * 2 +
        obterDefesaDaCartaInimiga(carta)
    );
}
