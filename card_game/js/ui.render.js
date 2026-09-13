function renderUI() {
    document.getElementById('turn-display').innerText = state.turn;

    const elementoTempoAcao = document.getElementById('action-timer');
    if (elementoTempoAcao) {
        elementoTempoAcao.innerText = `${Math.max(0, state.tempoRestanteAcao ?? 60)}s`;
        elementoTempoAcao.classList.toggle(
            'action-timer-warning',
            (state.tempoRestanteAcao ?? 60) <= 10
        );
    }
    
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
            const canBlock = cartaPodeBloquear(card);
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

// REGRAS DO JOGO
const RULES_TEXT = `
- O objetivo é reduzir a vida do jogador inimigo a 0.
- Cada jogador começa a partida com 20 pontos de vida.
- Um jogador também perde imediatamente se precisar comprar uma carta e seu deck estiver vazio.

As cartas pertencem a uma das forças fundamentais:
- Eletromagnetismo
- Gravidade
- Força Forte
- Força Fraca

Resumo RÁPIDO das regras:
1. Comece com 20 de vida e 0 de energia (pode ter até 20 de energia).
2. Cada jogador recebe 7 cartas na mão inicial.
3. O limite da mão é 8 cartas.
4. Se ficar acima de 8 cartas, descarte obrigatoriamente até 8 antes de realizar outras ações.
5. Use energia para jogar cartas.
6. Apenas criaturas podem atacar.
7. Criaturas atordoadas não podem atacar nem bloquear. Uma criatura que ataca fica atordoada durante o turno seguinte; uma criatura que entra virada para cima fica atordoada até o próximo ciclo.
8. Criaturas e terrenos podem bloquear quando estiverem aptos.
9. Criaturas e terrenos podem ser jogados para baixo. Cartas viradas para baixo custam 0, possuem —/1 e podem bloquear; ao bloquear, são reveladas se você quiser e pagar seu custo.
10. Cartas que possuem ATK nulo (—), não atacam e não causam dano de combate.
11. A DEF atual das cartas é restaurada ao valor original no início de cada novo ciclo de turno. Bônus e reduções permanentes de atributos permanecem na carta. Buffs permanecem na carta.
12. ATK/DEF aumentados aparecem em verde; ATK/DEF reduzidos aparecem em vermelho.
13. Reduza a vida inimiga a 0 para vencer.
14. Se precisar comprar uma carta com o deck vazio, você perde.
`;
function openTutorial(){
    const modal = document.getElementById('tutorial-modal');
    const conteudo = document.getElementById('tutorial-content');
    const temporizador = document.getElementById('tutorial-action-timer');

    if (!modal || !conteudo) return;

    modal.style.display = 'flex';
    conteudo.textContent = RULES_TEXT;

    if (temporizador) {
        temporizador.textContent =
            `${Math.max(0, state.tempoRestanteAcao ?? 60)}s`;
    }
}
function closeTutorial(){const m=document.getElementById('tutorial-modal');if(m)m.style.display='none';}
