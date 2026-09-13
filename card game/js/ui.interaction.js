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
            if (!card.isFaceDown && card.type === 'criatura' && (card.isResting || card.casusBelli === 0)) {
                showToast("Esta criatura está descansando ou indisponível e não pode bloquear.", "error");
                return;
            }

            if (card.isFaceDown) {
                // Durante um ataque, primeiro pergunte se o jogador quer apenas revelar
                // a carta ou se quer revelá-la e usá-la imediatamente como bloqueador.
                state.pendingFaceDownBlockIndex = index;

                const botaoRevelar = document.getElementById('reveal-face-down-block-btn');
                const custoRevelar = Number(
                    card._faceDownOriginalCost ??
                    card.baseCost ??
                    card.cost
                ) || 0;

                if (botaoRevelar) {
                    botaoRevelar.disabled = player.energy < custoRevelar;
                    botaoRevelar.textContent =
                        player.energy >= custoRevelar
                            ? `Virar para cima e bloquear (Pagar ${custoRevelar} Energia)`
                            : `Sem energia para revelar (Custo ${custoRevelar})`;
                }

                document.getElementById('face-down-action-modal').style.display = 'flex';
                return;
            }

            resolveFaceDownBlock(index);
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
            if (player.field.length >= 6 && card.type !== 'efeito') {
                return showToast("Campo cheio (Máx 6)!", "error");
            }
            
            state.selectedCardIndex = index;

            if (card.type === 'efeito') {
                confirmPlay(false);
            } else {
                document.getElementById('play-modal').style.display = 'flex';
            }
        } 
        else if (zone === 'field') {
            const card = player.field[index];
            
            if (card.isFaceDown) {
                const revealCost = Number(card._faceDownOriginalCost ?? card.baseCost ?? card.cost) || 0;
                if (player.energy < revealCost) {
                    showToast(`Energia insuficiente para revelar ${card.name}! Custo: ${revealCost}.`, "error");
                    return;
                }
                player.energy -= revealCost;
                card.isFaceDown = false;
                card.cost = revealCost;
                card.atk = card._faceDownOriginalAtk ?? card.atk;
                card.def = card._faceDownOriginalDef ?? card.def;
                card._activeStatApplied = false;
                card._activeTickedTurn = null;
                card.currentDef = card._faceDownOriginalCurrentDef ?? card.def;
                delete card._faceDownOriginalCost;
                delete card._faceDownOriginalAtk;
                delete card._faceDownOriginalDef;
                delete card._faceDownOriginalCurrentDef;

                // Após ser virada para cima, a criatura recupera seus atributos
                // e pode atacar imediatamente.
                card.summonedTurn = state.turn - 1;
                card.isStunned = false;
                card.stunReason = null;
                card.isResting = false;
                card.casusBelli = 1;
                card.attackedThisTurn = false;

                // Ao revelar uma carta, ela passa a gerar energia imediatamente.
                // Cartas viradas para baixo nunca geram energia.
                if (typeof gainEnergyFromCard === 'function') {
                    gainEnergyFromCard(player, card);
                }

                    triggerEffect('campo', card, { owner: 'p1', card: card });
                    if (card.gatilho === 'ativo') triggerEffect('ativo', card, { owner: 'p1', card: card });
                    showToast(`${card.name} foi revelada e pode atacar neste turno.`, "success");
                    registerActionDone('p1');
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

