function handleCardClick(owner, zone, index) {
    if (state.pendingDiscard.p1) {
        if (owner === 'p1' && zone === 'hand') {
            openDiscardModal(index);
        } else {
            showToast("Você precisa descartar o excesso de cartas da mão primeiro!", "warning");
        }
        return;
    }

    if (state.activeAttack && state.activeAttack.attackerOwner === 'p2') {
        if (owner === 'p1' && zone === 'field') {
            const player = state.players.p1;
            const card = player.field[index];
            if (!card) return;

            // Criaturas prontas, cartas viradas para baixo e terrenos podem bloquear.
            // Uma carta oculta é revelada no momento em que bloqueia.
            if (card.type !== 'criatura' && card.type !== 'terreno' && !card.isFaceDown) {
                showToast("Esta carta não pode bloquear.", "error");
                return;
            }
            if (!card.isFaceDown && card.type === 'criatura' && (card.isStunned || card.isResting || card.casusBelli === 0)) {
                showToast("Esta criatura está descansando ou indisponível e não pode bloquear.", "error");
                return;
            }

            if (card.isFaceDown) {
                card.isFaceDown = false;
                card.currentDef = card.def ?? card.baseDef ?? 1;
                card.summonedTurn = card.summonedTurn || state.turn;
                showToast(`${card.name} foi revelada para bloquear!`, "info");
            }

            const attackerCard = state.activeAttack.attackerCard;
            const p2 = state.players.p2;
            const blockerAtk = card.type === 'terreno' ? 0 : Number(card.atk) || 0;
            const attackerAtk = Number(attackerCard.atk) || 0;

            drawCombatLine('p2', state.activeAttack.attackerIndex, 'p1', index);
            showToast(`Você bloqueou o ataque de ${attackerCard.name} com ${card.name}!`, "info");

            card.currentDef -= attackerAtk;
            attackerCard.currentDef -= blockerAtk;

            const destroyed = [];
            if (card.currentDef <= 0) {
                sendCardToGraveyard(card, 'p1', true);
                player.field = player.field.filter(c => c !== card);
                destroyed.push(card.name);
            }
            if (attackerCard.currentDef <= 0) {
                sendCardToGraveyard(attackerCard, 'p2', true);
                p2.field = p2.field.filter(c => c !== attackerCard);
                destroyed.push(attackerCard.name);
            }

            if (destroyed.length > 0) {
                showToast(`Combate: ${destroyed.join(' e ')} foi(ram) destruído(s)!`, "error");
            } else {
                showToast("Combate resolvido! Nenhuma carta foi destruída.", "info");
            }

            state.activeAttack = null;
            registerActionDone('p1');
            return;
        } else {
            showToast("Clique em uma criatura no seu campo para bloquear o ataque!", "warning");
            return;
        }
    }

    if (state.initiativeOwner !== 'p1') {
        showToast("Aguarde a iniciativa do inimigo!", "warning");
        return;
    }

    const player = state.players.p1;

    if (owner === 'p1') {
        if (zone === 'hand') {
            const card = player.hand[index];
            if (player.field.length >= 6 && card.type !== 'tecnologia') {
                return showToast("Campo cheio (Máx 6)!", "error");
            }
            
            state.selectedCardIndex = index;

            if (card.type === 'tecnologia') {
                confirmPlay(false);
            } else {
                document.getElementById('play-modal').style.display = 'flex';
            }
        } 
        else if (zone === 'field') {
            const card = player.field[index];
            
            if (card.isFaceDown) {
                if (player.energy >= card.cost) {
                    player.energy -= card.cost;
                    card.isFaceDown = false;
                    card._activeStatApplied = false;
                    card._activeTickedTurn = null;
                    card.currentDef = card.def;
                    card.summonedTurn = card.summonedTurn || state.turn;
                    card.casusBelli = 0;
                    triggerEffect('campo', card, { owner: 'p1', card: card });
                    if (card.gatilho === 'ativo') triggerEffect('ativo', card, { owner: 'p1', card: card });
                    showToast(`${card.name} foi revelada. Ela não pode atacar neste turno.`, "info");
                    registerActionDone('p1');
                } else {
                    showToast("Energia insuficiente para revelar a carta!", "error");
                }
            } else {
                if (card.type !== 'criatura') return;
                if (card.isStunned) {
                    showToast("Esta criatura está atordoada e não pode atacar.", "warning");
                    return;
                }
                if (card.summonedTurn >= state.turn) {
                    showToast("Uma criatura recém-chegada não pode atacar neste turno.", "warning");
                    return;
                }
                if (card.attackedThisTurn) {
                    showToast("Esta criatura já atacou neste turno.", "warning");
                    return;
                }
                if (card.lastAttackTurn === state.turn - 1 || card.casusBelli === 0) {
                    showToast("Esta criatura atacou no turno anterior e precisa descansar um turno.", "warning");
                    return;
                }

                openAttackModal(index);
            }
        }
    }
}

function confirmPlay(faceDown) {
    const index = state.selectedCardIndex;
    if (index === null) return;

    const player = state.players.p1;
    const card = player.hand[index];

    if (faceDown && card.type !== 'criatura') { showToast('Apenas criaturas podem ser implantadas ocultas.', 'warning'); faceDown = false; }

    if (!faceDown && player.energy < card.cost) {
        showToast("Energia insuficiente!", "error");
        closeModal();
        return;
    }

    player.hand.splice(index, 1);

    if (card.type === 'tecnologia') {
        player.energy -= card.cost;
        triggerEffect('campo', card, { owner: 'p1', card: card });
        sendCardToGraveyard(card, 'p1', false);
        showToast(`Você usou a Mágica ${card.name}!`, "success");
    } else {
        if (faceDown) {
            card.isFaceDown = true;
            card.currentDef = 1;
            card.isResting = true;
            card.summonedTurn = state.turn;
            player.field.push(card);
        } else {
            player.energy -= card.cost;
            card.summonedTurn = state.turn;
            card._activeStatApplied = false;
            card._activeTickedTurn = null;
            card.isResting = card.type === 'criatura';
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