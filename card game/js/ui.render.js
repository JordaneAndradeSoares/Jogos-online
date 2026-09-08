function renderUI() {
    document.getElementById('turn-display').innerText = state.turn;
    
    document.getElementById('p1-life').innerText = state.players.p1.life;
    document.getElementById('p2-life').innerText = state.players.p2.life;
    
    document.getElementById('p1-energy').innerText = state.players.p1.energy;
    document.getElementById('p1-max').innerText = state.players.p1.maxEnergy;
    document.getElementById('p2-energy').innerText = state.players.p2.energy;
    document.getElementById('p2-max').innerText = state.players.p2.maxEnergy;
    
    document.getElementById('p1-deck-count').innerText = state.players.p1.deck.length;
    document.getElementById('p2-deck-count').innerText = state.players.p2.deck.length;
    
    document.getElementById('p1-hand-count').innerText = state.players.p1.hand.length;
    document.getElementById('p2-hand-count').innerText = state.players.p2.hand.length;

    const passBtn = document.getElementById('pass-block-btn');
    const endTurnBtn = document.getElementById('end-turn-btn');
    
    let isEnemyAttacking = state.activeAttack && state.activeAttack.attackerOwner === 'p2';

    if (passBtn) {
        passBtn.style.display = isEnemyAttacking ? 'inline-block' : 'none';
    }
    
    if (endTurnBtn) {
        endTurnBtn.style.display = isEnemyAttacking ? 'none' : 'inline-block';
    }

    const badge = document.getElementById('initiative-display');
    if (state.pendingDiscard.p1) {
        badge.innerText = "Você deve descartar (Máx 8)";
        badge.style.background = "#d63031";
    } else if (state.pendingDiscard.p2) {
        badge.innerText = "Inimigo deve descartar (Máx 8)";
        badge.style.background = "#d63031";
    } else if (state.activeAttack && state.activeAttack.attackerOwner === 'p2') {
        badge.innerText = "Escolha um Bloqueio!";
        badge.style.background = "#e67e22";
    } else if (state.initiativeOwner === 'p1') {
        badge.innerText = "Sua Iniciativa";
        badge.style.background = "#00b894";
    } else {
        badge.innerText = "Iniciativa do Inimigo...";
        badge.style.background = "#d63031";
    }

    const p2Field = document.getElementById('p2-field');
    p2Field.innerHTML = '';
    state.players.p2.field.forEach((card, index) => {
        p2Field.innerHTML += buildCardHTML(card, 'p2', 'field', index);
    });

    if (isEnemyAttacking) {
        const attackingCardEl = document.getElementById(`p2-field-card-${state.activeAttack.attackerIndex}`);
        if (attackingCardEl) {
            attackingCardEl.classList.add('card-attacking');
            attackingCardEl.insertAdjacentHTML('beforeend', '<div class="combat-label combat-attacker-label">ATACANDO</div>');
        }
        state.players.p1.field.forEach((card, index) => {
            const canBlock = card && (card.isFaceDown || card.type === 'terreno' || (card.type === 'criatura' && !card.isStunned && !card.isResting && card.casusBelli > 0));
            if (canBlock) {
                const el = document.getElementById(`p1-field-card-${index}`);
                if (el) el.classList.add('possible-blocker');
            }
        });
    }

    const p1Gy = document.getElementById('p1-gy');
    if (state.players.p1.gy.length > 0) {
        const topCardP1 = state.players.p1.gy[state.players.p1.gy.length - 1];
        p1Gy.innerHTML = buildCardHTML(topCardP1, 'p1', 'gy', 0);
    } else {
        p1Gy.innerHTML = '<span style="font-size:10px; color:#636e72;">Vazio</span>';
    }

    const p2Gy = document.getElementById('p2-gy');
    if (state.players.p2.gy.length > 0) {
        const topCardP2 = state.players.p2.gy[state.players.p2.gy.length - 1];
        p2Gy.innerHTML = buildCardHTML(topCardP2, 'p2', 'gy', 0);
    } else {
        p2Gy.innerHTML = '<span style="font-size:10px; color:#636e72;">Vazio</span>';
    }

    const p1Field = document.getElementById('p1-field');
    p1Field.innerHTML = '';
    state.players.p1.field.forEach((card, index) => {
        p1Field.innerHTML += buildCardHTML(card, 'p1', 'field', index);
    });

    if (selectedCardToAttackIndex !== null) {
        const selectedEl = document.getElementById(`p1-field-card-${selectedCardToAttackIndex}`);
        if (selectedEl) selectedEl.classList.add('card-attacking');
    }

    const p1Hand = document.getElementById('p1-hand');
    p1Hand.innerHTML = '';
    state.players.p1.hand.forEach((card, index) => {
        p1Hand.innerHTML += buildCardHTML(card, 'p1', 'hand', index);
    });
}
function openTutorial(){const m=document.getElementById('tutorial-modal'),c=document.getElementById('tutorial-content');if(!m||!c)return;c.textContent='Carregando regras...';m.style.display='flex';fetch('regras.txt').then(r=>{if(!r.ok)throw Error();return r.text()}).then(x=>c.textContent=x).catch(()=>c.textContent='Não foi possível carregar regras.txt.');}
function closeTutorial(){const m=document.getElementById('tutorial-modal');if(m)m.style.display='none';}
