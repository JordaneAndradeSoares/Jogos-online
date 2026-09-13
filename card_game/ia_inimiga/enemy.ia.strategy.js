function inimigoPrecisaDescartar() {
    const jogadorInimigo = state.players.p2;
    return !!state.pendingDiscard.p2 || jogadorInimigo.hand.length > 8;
}

function descartarCartasDoInimigo() {
    const jogadorInimigo = state.players.p2;
    const quantidadeParaDescartar = Math.max(0, jogadorInimigo.hand.length - 8);

    if (quantidadeParaDescartar <= 0) {
        state.pendingDiscard.p2 = false;
        return;
    }

    // Preserva as cartas de maior valor e descarta primeiro as menos importantes.
    const cartasOrdenadas = jogadorInimigo.hand
        .map((carta, indice) => ({ carta, indice }))
        .sort((primeira, segunda) => {
            return (
                avaliarJogadaDaCartaInimiga(primeira.carta) -
                avaliarJogadaDaCartaInimiga(segunda.carta)
            );
        });

    const indicesParaDescartar = cartasOrdenadas
        .slice(0, quantidadeParaDescartar)
        .map(item => item.indice)
        .sort((primeiro, segundo) => segundo - primeiro);

    indicesParaDescartar.forEach(indice => {
        const carta = jogadorInimigo.hand.splice(indice, 1)[0];
        sendCardToGraveyard(carta, 'p2', false);
    });

    state.pendingDiscard.p2 = jogadorInimigo.hand.length > 8;

    if (typeof showToast === 'function') {
        showToast(
            `O inimigo descartou ${quantidadeParaDescartar} carta(s) e agora está com ${jogadorInimigo.hand.length}.`,
            'warning'
        );
    }

    if (typeof renderUI === 'function') {
        renderUI();
    }
}
