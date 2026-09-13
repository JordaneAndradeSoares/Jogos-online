function executeEnemyTurn() {
    if (state.initiativeOwner !== 'p2' || state.activeAttack) {
        return;
    }

    const jogadorInimigo = state.players.p2;

    // O limite de mão precisa ser resolvido antes das outras ações.
    if (inimigoPrecisaDescartar()) {
        descartarCartasDoInimigo();

        if (inimigoPrecisaDescartar()) {
            return;
        }
    }

    // Primeiro tenta jogar a melhor carta disponível.
    const escolhaDeCarta = escolherMelhorCartaDoInimigo();

    if (escolhaDeCarta) {
        if (jogarCartaDoInimigo(escolhaDeCarta.indice)) {
            return;
        }
    }

    // Se não puder jogar carta, tenta atacar.
    const cartaAtacante = escolherMelhorAtacanteDoInimigo();

    if (cartaAtacante) {
        iniciarAtaqueDoInimigo(cartaAtacante);
        return;
    }

    // Se não houver ação possível, passa a vez.
    passAction('p2');
}
