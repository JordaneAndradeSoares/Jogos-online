
function preparePolymorphSummonFromSelectedCard() {
    const index = state.selectedCardIndex;
    if (index === null || index === undefined) return;

    const modal = document.getElementById('play-modal');
    if (modal) modal.style.display = 'none';

    preparePolymorphSummon('p1', index);
}

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

    if (carta.type === 'efeito' &&
        typeof efeitoPrecisaDeAlvo === 'function' &&
        efeitoPrecisaDeAlvo(carta)) {
        const alvos = typeof obterAlvosValidosDoEfeito === 'function'
            ? obterAlvosValidosDoEfeito(carta, 'p1')
            : [];

        if (!alvos.length) {
            showToast(
                `${carta.name}: não é possível ativar este efeito agora, pois não há nenhuma carta válida no campo para receber o efeito.`,
                'warning'
            );
            return;
        }
    }

    if (carta.type === 'efeito' && jogador.energy < custo) {
        showToast(
            `Energia insuficiente para ${carta.name}. Você tem ${jogador.energy} de energia e precisa de ${custo}.`,
            'warning'
        );
        return;
    }

    if (carta.type === 'efeito') {
        // Efeitos são cartas de ação: não entram no campo.
        // Permanecem na mão durante a seleção de alvo para que
        // triggerEffect() reconheça corretamente o controlador.
        const finalizarUsoDoEfeito = () => {
            const indiceNaMao = jogador.hand.indexOf(carta);

            if (indiceNaMao >= 0) {
                jogador.hand.splice(indiceNaMao, 1);
            }

            jogador.energy -= custo;
            sendCardToGraveyard(carta, 'p1', false);

            showToast(
                `Você usou o efeito ${carta.name}!`,
                'success'
            );

            registerActionDone('p1');
            if (typeof renderUI === 'function') renderUI();
        };

        const resultado = triggerEffect(
            'efeito',
            carta,
            {
                owner: 'p1',
                card: carta,
                aoConcluir: finalizarUsoDoEfeito
            }
        );

        if (resultado === 'pending') {
            closeModal();
            return;
        }

        if (resultado) {
            finalizarUsoDoEfeito();
        }

        return;

    } else {
        jogador.hand.splice(indiceDaCarta, 1);

        if (faceDown) {
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

        const resultadoAtivo = carta.gatilho === 'ativo'
            ? triggerEffect('ativo', carta, {
                owner: 'p1',
                card: carta,
                aoConcluir: () => registerActionDone('p1')
            })
            : true;

        if (resultadoAtivo === false && carta.gatilho === 'ativo') {
            showToast(
                `${carta.name}: foi implantada, mas o efeito [Ativo] não pôde ser ativado agora porque não há alvo válido.`,
                'warning'
            );
        }

        if (resultadoAtivo === 'pending') {
            closeModal();
            return;
        }

        showToast(
            `${carta.name} foi implantada virada para cima.`,
            'success'
        );
    }
    }

    closeModal();
    registerActionDone('p1');
}

function closeModal() {
    document.getElementById('play-modal').style.display = 'none';
    state.selectedCardIndex = null;
}