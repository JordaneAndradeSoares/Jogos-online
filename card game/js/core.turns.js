
function pushEffect(effectFn) {
    if (typeof effectFn === 'function') state.effectStack.push(effectFn);
}

function resolveEffectStack() {
    while (state.effectStack.length > 0) {
        const effectFn = state.effectStack.pop();
        try {
            effectFn();
        } catch (error) {
            console.error("Erro ao resolver efeito:", error);
            if (typeof showToast === 'function') {
                showToast("Um efeito falhou. Veja o console para detalhes.", "error");
            }
        }
    }
}

function triggerEffect(triggerType, card, context = {}) {
    if (!card || !card.effects || typeof card.effects[triggerType] !== 'function') return;

    const effectContext = {
        ...context,
        owner: context.owner || (state.players.p1.field.includes(card) ? 'p1' : 'p2'),
        card
    };

    pushEffect(() => card.effects[triggerType](effectContext));
}

function passAction(playerKey) {
    if (state.activeAttack) return;
    if (state.pendingDiscard[playerKey]) {
        if (typeof showToast === 'function') showToast(playerKey === 'p1' ? 'Você precisa descartar até ficar com 8 cartas.' : 'O inimigo precisa descartar até ficar com 8 cartas.', 'warning');
        return;
    }
    if (state.initiativeOwner !== playerKey) return;

    state.consecutivePasses++;

    if (state.consecutivePasses >= 2) {
        endTurnCycle();
    } else {
        state.initiativeOwner = playerKey === 'p1' ? 'p2' : 'p1';

        if (state.initiativeOwner === 'p2' && typeof executeEnemyTurn === 'function') {
            setTimeout(executeEnemyTurn, 700);
        }
    }

    if (typeof renderUI === 'function') renderUI();
}

function endMyTurn() {
    passAction('p1');
}

function registerActionDone(actorKey) {
    state.consecutivePasses = 0;
    state.initiativeOwner = actorKey === 'p1' ? 'p2' : 'p1';

    // Efeitos da ação resolvem antes da iniciativa mudar novamente.
    resolveEffectStack();

    if (state.initiativeOwner === 'p2' && typeof executeEnemyTurn === 'function') {
        setTimeout(executeEnemyTurn, 700);
    }

    if (typeof renderUI === 'function') renderUI();
}

function endTurnCycle() {
    state.turn++;
    state.consecutivePasses = 0;
    state.activeAttack = null;

    ['p1', 'p2'].forEach(playerKey => {
        const player = state.players[playerKey];
        player.maxEnergy = Math.min(20, state.turn);
        player.energy = player.maxEnergy;

        player.field.forEach(card => {
            card.currentDef = card.def ?? card.baseDef ?? card.currentDef;

            if (card.type === 'criatura') {
                card.isResting = false;
                card.attackedLastTurn = card.attackedThisTurn;
                card.attackedThisTurn = false;

                // Casus Belli é apenas um indicador visual de prontidão.
                // Uma criatura que atacou no turno anterior fica sem CB neste turno.
                if (card.attackedLastTurn) {
                    card.casusBelli = 0;
                } else if (!card.isStunned && !card.isFaceDown) {
                    card.casusBelli = 1;
                }

                // Atordoamento dura um ciclo completo e impede bloqueio/ataque.
                if (card.isStunned) {
                    card.isStunned = false;
                    if (!card.isFaceDown) card.casusBelli = 1;
                }
            }
        });

        if (player.deck.length > 0) {
            player.hand.push(player.deck.pop());
        } else {
            const winner = playerKey === 'p1' ? 'Inimigo (P2)' : 'Você (P1)';
            alert(`O deck de ${playerKey} acabou! ${winner} venceu por esgotamento!`);
            location.reload();
            return;
        }

        if (playerKey === 'p1' && player.hand.length > 8) {
            state.pendingDiscard.p1 = true;
            if (typeof showToast === 'function') {
                showToast("Você tem mais de 8 cartas na mão. Descarte até ficar com 8.", "warning");
            }
        } else if (playerKey === 'p2' && player.hand.length > 8) {
            // O inimigo também fica impedido de agir enquanto estiver acima do limite.
            // O descarte será feito obrigatoriamente quando chegar a iniciativa dele.
            state.pendingDiscard.p2 = true;
            if (typeof showToast === 'function') {
                showToast('O inimigo está acima do limite de 8 cartas e deverá descartar antes de agir.', 'warning');
            }
        }
    });

    if (state.players.p1.hand.length <= 8) state.pendingDiscard.p1 = false;
    if (state.players.p2.hand.length <= 8) state.pendingDiscard.p2 = false;

    state.initiativeOwner = 'p1';
    if (typeof renderUI === 'function') renderUI();
}

window.onload = function () {
    if (typeof initGame === 'function') initGame();
};

function testAllCardEffects(){const missing=[]; if(typeof CardTriggers==='undefined') return {ok:false,missing:['CardTriggers não carregado']}; Object.keys(CardTriggers).forEach(name=>{if(!CARD_DATABASE.find(c=>c.name===name))missing.push(name+': ausente no banco');Object.entries(CardTriggers[name]).forEach(([k,v])=>{if(typeof v!=='function')missing.push(name+': '+k+' inválido')})}); const r={ok:!missing.length,missing,tested:Object.keys(CardTriggers).length};console.info('Teste de efeitos:',r);return r;}
