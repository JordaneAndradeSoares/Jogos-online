function confirmPlay(faceDown) {
    const indiceDaCarta = state.selectedCardIndex;

    if (indiceDaCarta === null) return;

    if (
        state.initiativeOwner !== 'p1' ||
        state.activeAttack
    ) {
        closeModal();
        showToast('Seu tempo de ação terminou.', 'warning');
        return;
    }

    const jogador = state.players.p1;
    const carta = jogador.hand[indiceDaCarta];

    if (!jogadorPodeJogarCarta('p1', carta, faceDown)) {
        showToast(
            faceDown
                ? 'Esta carta não pode ser implantada oculta agora.'
                : 'Esta carta não pode ser implantada agora.',
            'warning'
        );
        return;
    }

    const custo = obterCustoOriginalDaCarta(carta);

    jogador.hand.splice(indiceDaCarta, 1);

    if (carta.type === 'efeito') {
        jogador.energy -= custo;

        triggerEffect(
            'campo',
            carta,
            {
                owner: 'p1',
                card: carta
            }
        );

        sendCardToGraveyard(carta, 'p1', false);

        showToast(
            `Você usou a tecnologia ${carta.name}!`,
            'success'
        );
    } else if (faceDown) {
        prepararCartaFaceDown(carta, jogador);
        jogador.field.push(carta);

        showToast(
            `${carta.name} foi implantada oculta por 0 de energia.`,
            'info'
        );
    } else {
        prepararCartaFaceUp(carta, jogador);
        jogador.field.push(carta);

        gainEnergyFromCard(jogador, carta);

        triggerEffect(
            'campo',
            carta,
            {
                owner: 'p1',
                card: carta
            }
        );

        if (carta.gatilho === 'ativo') {
            triggerEffect(
                'ativo',
                carta,
                {
                    owner: 'p1',
                    card: carta
                }
            );
        }

        showToast(
            `${carta.name} foi implantada virada para cima.`,
            'success'
        );
    }

    closeModal();
    registerActionDone('p1');
}

function closeModal() {
    document.getElementById('play-modal').style.display = 'none';
    state.selectedCardIndex = null;
}