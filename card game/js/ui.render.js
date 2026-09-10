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
const RULES_TEXT = `REGRAS

1. OBJETIVO
- Cada jogador começa com 20 de vida.
- Reduza a vida do inimigo a 0 para vencer.
- Se precisar comprar uma carta com o deck vazio, você perde.

2. CARTAS
- Criaturas: possuem custo, ATK e DEF. Podem atacar e bloquear.
- Tecnologias: possuem custo e efeito. Não possuem ATK/DEF e não ficam no campo.
- Terrenos: possuem custo e DEF, ATK —. Não atacam, mas podem bloquear.

3. MÃO
- A mão inicial tem 7 cartas.
- O limite da mão é 8.
- Se ficar com mais de 8 cartas, é obrigatório descartar até 8.
- Enquanto o descarte estiver pendente, nenhuma outra ação pode ser feita.
- Essa regra vale para o jogador e para a IA.

4. ENERGIA
- Para jogar uma carta normalmente, é necessário ter energia igual ao seu custo.
- A energia máxima e a energia disponível são atualizadas durante os turnos.

5. CARTAS VIRADAS PARA BAIXO
- Somente Criaturas e Terrenos podem ser jogados virados para baixo.
- Tecnologias não podem ser jogadas viradas para baixo.
- Ao serem colocadas viradas para baixo, custam 0 e ficam com 0 ATK / 1 DEF.
- O adversário não vê a identidade da carta.
- O dono pode passar o mouse sobre a carta para visualizar seus dados reais.
- Para revelar a carta, é necessário pagar seu custo original.
- Se não houver energia suficiente, a carta continua virada para baixo.
- Ao revelar, a carta recupera seu custo, ATK e DEF originais.
- Uma carta virada para baixo pode ser usada para bloquear e é revelada nesse momento, com o custo original sendo pago.

6. ATAQUE
- Apenas Criaturas podem atacar.
- A criatura atacante deve estar revelada e apta a atacar.
- Terrenos e Tecnologias não podem atacar.

7. BLOQUEIO
- Criaturas aptas e Terrenos podem bloquear.
- Criaturas ou Terrenos virados para baixo também podem bloquear.
- Ao bloquear com uma carta virada para baixo, ela é revelada antes do combate.
- Tecnologias não podem bloquear.

8. COMBATE
- Ataque direto causa dano igual ao ATK atual à vida do defensor.
- Criatura contra Criatura: ambas causam dano de acordo com seu ATK atual.
- Terrenos possuem ATK — e não causam dano de combate ao atacante.
- Cartas cuja DEF chega a 0 ou menos são destruídas e enviadas ao cemitério.

9. DEFESA
- A DEF pode ser reduzida por combate ou efeitos.
- Ao fim do ciclo de turno, a DEF das cartas que continuam no campo é restaurada ao valor original.

10. EFEITOS
- Os efeitos são resolvidos conforme o texto e os gatilhos de cada carta.
- Podem modificar ATK/DEF, causar dano, restaurar vida ou DEF, destruir cartas e aplicar outros modificadores.

11. CORES DOS ATRIBUTOS
- ATK/DEF aumentados aparecem em verde.
- ATK/DEF reduzidos aparecem em vermelho.
- O custo reduzido aparece em verde.
- O custo aumentado aparece em vermelho.

12. TURNOS
- Os jogadores se alternam.
- No seu turno, você pode jogar cartas, atacar com criaturas aptas e realizar as ações permitidas.
- O turno pode ser encerrado pelo jogador.
- O jogador deve resolver o descarte obrigatório antes de continuar jogando.

13. IA
- O inimigo é controlado pela IA.
- A IA segue as mesmas regras de energia, mão, descarte, ataque, bloqueio e cartas viradas para baixo.

14. FIM DA PARTIDA
- A partida termina quando a vida de um jogador chega a 0 ou menos.
- Também termina quando um jogador precisa comprar com o deck vazio.
`;
function openTutorial(){const m=document.getElementById('tutorial-modal'),c=document.getElementById('tutorial-content');if(!m||!c)return;m.style.display='flex';c.textContent=RULES_TEXT;}
function closeTutorial(){const m=document.getElementById('tutorial-modal');if(m)m.style.display='none';}
