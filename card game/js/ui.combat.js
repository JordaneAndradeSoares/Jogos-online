function confirmAttack() {
    if (selectedCardToAttackIndex === null) return;

    const player = state.players.p1;
    const attackerCard = player.field[selectedCardToAttackIndex];
    
    const attackerEl = document.getElementById(`p1-field-card-${selectedCardToAttackIndex}`);
    if (attackerEl) attackerEl.classList.add('card-attacking');

    closeAttackModal();

    if (
        attackerCard.type !== 'criatura' ||
        attackerCard.isFaceDown ||
        attackerCard.isStunned ||
        attackerCard.attackedThisTurn ||
        attackerCard.summonedTurn >= state.turn ||
        attackerCard.lastAttackTurn === state.turn - 1 ||
        attackerCard.casusBelli === 0 ||
        attackerCard.isResting
    ) {
        showToast("Esta criatura não pode atacar agora.", "warning");
        return;
    }

    attackerCard.attackedThisTurn = true;
    attackerCard.attackedLastTurn = false;
    attackerCard.lastAttackTurn = state.turn;
    attackerCard.casusBelli = 0;

    let blockerIndex = typeof enemyDecidesBlock === 'function' ? enemyDecidesBlock(attackerCard) : null;
    let p2 = state.players.p2;

    if (blockerIndex !== null && blockerIndex >= 0 && blockerIndex < p2.field.length) {
        const blockerEl = document.getElementById(`p2-field-card-${blockerIndex}`);
        if (blockerEl) blockerEl.classList.add('card-attacked');

        drawCombatLine('p1', selectedCardToAttackIndex, 'p2', blockerIndex);

        let blockerCard = p2.field[blockerIndex];
        showToast(`${attackerCard.name} atacou, mas foi bloqueado por ${blockerCard.name}!`, "warning");

        const blockerAtk = blockerCard.type === 'terreno' ? 0 : (Number(blockerCard.atk) || 0);
        const attackerAtk = Number(attackerCard.atk) || 0;
        blockerCard.currentDef -= attackerAtk;
        attackerCard.currentDef -= blockerAtk;

        let destroyed = [];
        if (blockerCard.currentDef <= 0) {
            sendCardToGraveyard(blockerCard, 'p2', true);
            p2.field = p2.field.filter(c => c !== blockerCard);
            destroyed.push(blockerCard.name);
        }
        if (attackerCard.currentDef <= 0) {
            sendCardToGraveyard(attackerCard, 'p1', true);
            player.field = player.field.filter(c => c !== attackerCard);
            destroyed.push(attackerCard.name);
        }

        setTimeout(() => {
            if (attackerEl) attackerEl.classList.remove('card-attacking');
            if (blockerEl) blockerEl.classList.remove('card-attacked');
        }, 1000);

        if (destroyed.length > 0) {
            showToast(`Combate: ${destroyed.join(' e ')} foi(ram) destruído(s)!`, "error");
        } else {
            showToast(`Combate resolvido! Nenhuma criatura foi destruída.`, "info");
        }
    } else {
        drawCombatLine('p1', selectedCardToAttackIndex, null, null);

        damagePlayer('p2', attackerCard.atk);
        showToast(`${attackerCard.name} atacou diretamente o oponente causando ${attackerCard.atk} de dano!`, "success");

        setTimeout(() => {
            if (attackerEl) attackerEl.classList.remove('card-attacking');
        }, 1000);
    }

    registerActionDone('p1');
}

function drawCombatLine(attackerOwner, attackerIndex, defenderOwner, defenderIndex) {
    const svg = document.getElementById('combat-svg');
    if (!svg) return;
    svg.innerHTML = '';

    const attackerEl = document.getElementById(`${attackerOwner}-field-card-${attackerIndex}`);
    const defenderEl = document.getElementById(`${defenderOwner}-field-card-${defenderIndex}`);

    if (attackerEl) {
        const rectA = attackerEl.getBoundingClientRect();
        let x1 = rectA.left + rectA.width / 2;
        let y1 = rectA.top + rectA.height / 2;
        let x2, y2;

        if (defenderEl) {
            const rectD = defenderEl.getBoundingClientRect();
            x2 = rectD.left + rectD.width / 2;
            y2 = rectD.top + rectD.height / 2;
        } else {
            x2 = window.innerWidth / 2;
            y2 = 60;
        }

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        svg.appendChild(line);

        setTimeout(() => {
            svg.innerHTML = '';
        }, 1000);
    }
}
