function getEnemyPlayableCards() {
    const enemy = state.players.p2;
    return enemy.hand
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => enemy.energy >= card.cost && (card.type === 'tecnologia' || enemy.field.length < 6));
}

function scoreEnemyPlay(card) {
    if (card.type === 'tecnologia') {
        if (card.name === 'Nanorreparo') return state.players.p2.life <= 16 ? 8 : 1;
        if (card.name === 'Campo Defletor') return state.players.p2.field.some(c => c.type === 'criatura') ? 7 : 0;
        return 6 + (card.cost || 0);
    }
    const stats = (card.atk === null ? "—" : card.atk) * 2 + (card.def === null ? "—" : card.def) + (card.cost || 0);
    const effectBonus = card.effects && card.effects.aoEntrar ? 4 : 0;
    const terrainBonus = card.type === 'terreno' ? Math.max(2, card.def === null ? "—" : card.def) : 0;
    return stats + effectBonus + terrainBonus;
}

function chooseEnemyPlay() {
    const plays = getEnemyPlayableCards();
    if (!plays.length) return null;
    plays.sort((a, b) => scoreEnemyPlay(b.card) - scoreEnemyPlay(a.card));
    return plays[0];
}

function enemyDecidesBlock(attackerCard) {
    const enemy = state.players.p2;

    // Criaturas prontas, cartas viradas para baixo e terrenos podem bloquear.
    const blockers = enemy.field.filter(c => {
        if (!c || (c.type !== 'criatura' && c.type !== 'terreno' && !c.isFaceDown)) return false;
        if (!c.isFaceDown && c.type === 'criatura' && (c.isStunned || c.isResting || c.casusBelli === 0)) return false;
        return (Number(c.currentDef ?? c.def ?? c.baseDef) || 0) > 0;
    });
    if (!blockers.length) return null;

    const attackerAtk = Number(attackerCard.atk) || 0;
    const attackerDef = Number(attackerCard.currentDef ?? attackerCard.def) || 0;

    const info = blockers.map(c => {
        const atk = c.type === 'terreno' ? 0 : (Number(c.atk) || 0);
        const def = Number(c.currentDef ?? c.def ?? c.baseDef) || 0;
        return { c, atk, def, hidden: !!c.isFaceDown };
    });

    // Prioriza bloquear com uma carta que mata o atacante e sobrevive.
    let pick = info
        .filter(x => x.atk >= attackerDef && x.def > attackerAtk)
        .sort((a, b) => (a.c.cost || 0) - (b.c.cost || 0))[0];
    if (pick) return enemy.field.indexOf(pick.c);

    // Depois, qualquer troca favorável.
    pick = info
        .filter(x => x.atk >= attackerDef)
        .sort((a, b) => (a.c.cost || 0) - (b.c.cost || 0))[0];
    if (pick) return enemy.field.indexOf(pick.c);

    // Terrenos e cartas ocultas são úteis como bloqueadores de absorção de dano.
    // Evita sacrificar uma criatura por ataques pequenos quando há muita vida.
    if (enemy.life > 8 && attackerAtk <= 2) {
        const safe = info.filter(x => x.def > attackerAtk && x.atk > 0);
        if (!safe.length) return null;
        pick = safe.sort((a, b) => a.def - b.def)[0];
        return enemy.field.indexOf(pick.c);
    }

    pick = info.sort((a, b) => {
        const aScore = a.atk * 2 + a.def + (a.hidden ? 1 : 0);
        const bScore = b.atk * 2 + b.def + (b.hidden ? 1 : 0);
        return aScore - bScore;
    })[0];
    return pick ? enemy.field.indexOf(pick.c) : null;
}

function getEnemyAttackers() {
    return state.players.p2.field.filter(c =>
        c.type === 'criatura' &&
        !c.isFaceDown &&
        !c.isStunned &&
        !c.isResting &&
        !c.attackedThisTurn &&
        c.casusBelli > 0 &&
        c.summonedTurn < state.turn &&
        c.lastAttackTurn !== state.turn - 1
    );
}

function chooseEnemyAttacker() {
    const attackers = getEnemyAttackers();
    if (!attackers.length) return null;
    attackers.sort((a, b) => {
        const aScore = (a.atk || 0) * 3 + (a.currentDef || 0);
        const bScore = (b.atk || 0) * 3 + (b.currentDef || 0);
        return bScore - aScore;
    });
    return attackers[0];
}

function executeEnemyTurn() {
    if (state.initiativeOwner !== 'p2' || state.activeAttack) return;

    const enemy = state.players.p2;

    // Regra de limite de mão: o inimigo não pode jogar, atacar ou passar
    // enquanto tiver mais de 8 cartas. Ele é obrigado a descartar primeiro.
    if (state.pendingDiscard.p2 || enemy.hand.length > 8) {
        state.pendingDiscard.p2 = true;
        const excessCount = Math.max(0, enemy.hand.length - 8);
        if (excessCount > 0) {
            // Descarta as cartas menos interessantes primeiro, preservando as melhores.
            const ordered = enemy.hand.map((card, index) => ({ card, index }))
                .sort((a, b) => scoreEnemyPlay(a.card) - scoreEnemyPlay(b.card));
            const discardIndexes = ordered.slice(0, excessCount).map(x => x.index).sort((a,b) => b-a);
            discardIndexes.forEach(index => sendCardToGraveyard(enemy.hand.splice(index, 1)[0], 'p2', false));
        }
        state.pendingDiscard.p2 = enemy.hand.length > 8;
        if (typeof showToast === 'function') showToast(`O inimigo descartou ${excessCount} carta(s) e agora está com ${enemy.hand.length}.`, 'warning');
        if (typeof renderUI === 'function') renderUI();
        // O descarte obrigatório termina antes de qualquer outra ação.
        if (state.pendingDiscard.p2) return;
    }
    const play = chooseEnemyPlay();

    if (play) {
        const card = enemy.hand.splice(play.index, 1)[0];
        enemy.energy -= card.cost;

        if (card.type === 'tecnologia') {
            sendCardToGraveyard(card, 'p2', false);
            triggerEffect('tecnologia', card, { owner: 'p2', card });
        } else {
            card.summonedTurn = state.turn;
            card.isFaceDown = false;
            card.isResting = card.type === 'criatura';
            card.casusBelli = 0;
            enemy.field.push(card);
            triggerEffect('aoEntrar', card, { owner: 'p2', card });
        }

        if (typeof showToast === 'function') showToast(`Inimigo jogou ${card.name}.`, 'info');
        registerActionDone('p2');
        return;
    }

    const attackerCard = chooseEnemyAttacker();
    if (attackerCard) {
        attackerCard.attackedThisTurn = true;
        attackerCard.isResting = true;
        attackerCard.attackedLastTurn = false;
        attackerCard.lastAttackTurn = state.turn;
        attackerCard.casusBelli = 0;
        state.activeAttack = {
            attackerOwner: 'p2',
            attackerCard,
            attackerIndex: enemy.field.indexOf(attackerCard)
        };
        if (typeof showToast === 'function') showToast(`Inimigo atacou com ${attackerCard.name}! Escolha um bloqueio ou passe.`, 'warning');
        if (typeof renderUI === 'function') renderUI();
        return;
    }

    passAction('p2');
}
