function inimigoPrecisaDescartar() {
    const jogadorInimigo = state.players.p2;

    return (
        !!state.pendingDiscard.p2 ||
        jogadorInimigo.hand.length > 8
    );
}

// O descarte por excesso de mão é controlado pelo mesmo temporizador
// usado pelo jogador. A IA não descarta cartas imediatamente.
function descartarCartasDoInimigo() {
    return false;
}
