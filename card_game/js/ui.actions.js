function confirmPlay(faceDown) {
    const index = state.selectedCardIndex;
    if (index === null) return;

    if (state.initiativeOwner !== 'p1' || state.activeAttack) {
        closeModal();
        showToast('Seu tempo de ação terminou.', 'warning');
        return;
    }

    const player = state.players.p1;
    const card = player.hand[index];

    if (faceDown && card.type !== 'criatura' && card.type !== 'terreno') { showToast('Apenas criaturas e terrenos podem ser jogados para baixo.', 'warning'); return; }

    if (!faceDown && player.energy < card.cost) {
        showToast("Energia insuficiente!", "error");
        closeModal();
        return;
    }

    player.hand.splice(index, 1);

    if (card.type === 'efeito') {
        player.energy -= card.cost;
        gainEnergyFromCard(player, card);
        triggerEffect('campo', card, { owner: 'p1', card: card });
        sendCardToGraveyard(card, 'p1', false);
        showToast(`Você usou a Mágica ${card.name}!`, "success");
    } else {
        if (faceDown) {
            // Carta oculta sempre é implantada por 0 de energia e fica 0/1 enquanto oculta.
            card._faceDownOriginalCost = card.cost;
            card._faceDownOriginalAtk = card.atk;
            card._faceDownOriginalDef = card.def;
            card._faceDownOriginalCurrentDef = card.currentDef;
            card.cost = 0;
            card.atk = null; // ataque nulo enquanto estiver virada para baixo
            card.def = 1;
            card.currentDef = 1;
            card.isFaceDown = true;
            // Carta oculta não entra atordoada: ela não ataca porque possui ataque nulo, mas pode defender.
            card.isStunned = false;
            card.isResting = false;
            card.summonedTurn = state.turn;
            player.field.push(card);
        } else {
            player.energy -= card.cost;
            // A carta gera energia imediatamente ao entrar em campo.
            gainEnergyFromCard(player, card);
            card.summonedTurn = state.turn;
            card._activeStatApplied = false;
            card._activeTickedTurn = null;
           
            // Criaturas jogadas viradas para cima entram ATORDOADAS.
            // O texto ATORDOADO aparecerá em roxo.
            card.isResting = false;

            if (card.type === 'criatura') {
                card.isStunned = true;
                card.stunReason = 'summon';
                card.casusBelli = 0;
            }

            player.field.push(card);

            triggerEffect('campo', card, { owner: 'p1', card: card });
            if (card.gatilho === 'ativo') triggerEffect('ativo', card, { owner: 'p1', card: card });
        }
    }

    closeModal();
    registerActionDone('p1');
}

function closeModal() {
    document.getElementById('play-modal').style.display = 'none';
    state.selectedCardIndex = null;
}