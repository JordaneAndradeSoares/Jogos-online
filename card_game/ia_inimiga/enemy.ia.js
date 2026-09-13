function executeEnemyTurn() {
    if (
        state.initiativeOwner !== 'p2' ||
        state.activeAttack
    ) {
        return;
    }

    const jogadorInimigo = state.players.p2;

    // O inimigo segue exatamente a mesma regra de limite de mão.
    // O descarte é feito pelo temporizador, uma carta por vez.
    if (inimigoPrecisaDescartar()) {
        return;
    }

    // Primeiro pode revelar uma carta própria que esteja oculta.
    const revelouCartaOculta =
        revelarMelhorCartaOcultaDoInimigo();

    if (revelouCartaOculta) {
        return;
    }

    // Depois tenta jogar a melhor carta legal.
    const escolhaDeCarta =
        escolherMelhorCartaDoInimigo();

    if (escolhaDeCarta) {
        if (jogarCartaDoInimigo(escolhaDeCarta.indice)) {
            return;
        }
    }

    // Se não puder jogar carta, tenta atacar.
    const cartaAtacante =
        escolherMelhorAtacanteDoInimigo();

    if (cartaAtacante) {
        iniciarAtaqueDoInimigo(cartaAtacante);
        return;
    }

    // Sem ação legal, passa.
    passAction('p2');
}
