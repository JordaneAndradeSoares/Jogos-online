function handleCardClick(owner, zone, index) {
    if (state.pendingDiscard.p1) {
        if (owner === 'p1' && zone === 'hand') {
            openDiscardModal(index);
        } else {
            showToast(
                "Você precisa descartar o excesso de cartas da mão primeiro!",
                "warning"
            );
        }
        return;
    }

    if (
        state.activeAttack &&
        state.activeAttack.attackerOwner === 'p2'
    ) {
        if (owner === 'p1' && zone === 'field') {
            const jogador = state.players.p1;
            const carta = jogador.field[index];

            if (!carta) return;

            if (!cartaPodeBloquear(carta)) {
                showToast(
                    "Esta carta não pode bloquear.",
                    "error"
                );
                return;
            }

            if (carta.isFaceDown) {
                state.pendingFaceDownBlockIndex = index;

                const botaoRevelar = document.getElementById(
                    'reveal-face-down-block-btn'
                );

                const custoRevelar =
                    obterCustoOriginalDaCarta(carta);

                if (botaoRevelar) {
                    botaoRevelar.disabled =
                        jogador.energy < custoRevelar;

                    botaoRevelar.textContent =
                        jogador.energy >= custoRevelar
                            ? `Virar para cima e bloquear (Pagar ${custoRevelar} Energia)`
                            : `Sem energia para revelar (Custo ${custoRevelar})`;
                }

                document.getElementById(
                    'face-down-action-modal'
                ).style.display = 'flex';

                return;
            }

            resolveFaceDownBlock(index);
            return;
        }

        showToast(
            "Clique em uma carta do seu campo para bloquear o ataque!",
            "warning"
        );

        return;
    }

    if (state.initiativeOwner !== 'p1') {
        showToast(
            "Aguarde a iniciativa do inimigo!",
            "warning"
        );
        return;
    }

    const jogador = state.players.p1;

    if (owner !== 'p1') {
        return;
    }

    if (zone === 'hand') {
        const carta = jogador.hand[index];

        if (!carta) return;

        if (
            carta.type !== 'efeito' &&
            jogador.field.length >= 6
        ) {
            return showToast(
                "Campo cheio (Máx 6)!",
                "error"
            );
        }

        state.selectedCardIndex = index;

        if (carta.type === 'efeito') {
            confirmPlay(false);
        } else {
            document.getElementById(
                'play-modal'
            ).style.display = 'flex';
        }

        return;
    }

    if (zone !== 'field') {
        return;
    }

    const carta = jogador.field[index];

    if (!carta) return;

    if (carta.isFaceDown) {
        if (!revealFaceDownCard(index, 'p1')) {
            return;
        }

        showToast(
            `${carta.name} foi revelada e pode atacar neste turno.`,
            "success"
        );

        registerActionDone('p1');
        return;
    }

    if (!cartaPodeAtacar(carta)) {
        showToast(
            "Esta criatura não pode atacar agora.",
            "warning"
        );
        return;
    }

    openAttackModal(index);
}
