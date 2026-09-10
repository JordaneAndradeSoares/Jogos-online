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
const RULES_TEXT = `QUANTUM FRONTIER — REGRAS DO JOGO

1. OBJETIVO DO JOGO

O objetivo é reduzir a vida do jogador inimigo a 0.

- Cada jogador começa a partida com 20 pontos de vida.
- Um jogador também perde imediatamente se precisar comprar uma carta e seu deck estiver vazio.
- Outros efeitos de cartas podem definir condições adicionais de vitória ou derrota.

2. TIPOS DE CARTA

O jogo possui três tipos principais de carta:

CRIATURAS
- Possuem custo, ataque (ATK) e defesa (DEF).
- Podem atacar o jogador inimigo.
- Podem atacar e bloquear outras criaturas.
- Podem possuir efeitos descritos na própria carta.

TECNOLOGIAS
- Possuem custo e efeitos.
- Não possuem ataque nem defesa.
- São jogadas para resolver seus efeitos e não permanecem no campo como criaturas.

TERRENOS
- Possuem custo e defesa (DEF).
- Seu ataque é NULO, representado pelo símbolo: —.
- Não podem atacar.
- Não são tratados como criaturas.
- Podem bloquear ataques, funcionando como barreiras defensivas.
- Podem possuir efeitos, inclusive efeitos ativados ao entrar em campo.

3. DECK E MÃO INICIAL

Cada jogador utiliza um deck de cartas.

No início da partida:
- Os jogadores começam com 20 pontos de vida.
- Os decks são embaralhados.
- Cada jogador compra 7 cartas para formar sua mão inicial.

Sempre que um jogador precisar comprar uma carta e seu deck estiver vazio, esse jogador perde a partida.

LIMITE DA MÃO
- O limite normal da mão é 8 cartas.
- Se um jogador ficar com mais de 8 cartas, ele entra em estado de descarte obrigatório.
- Enquanto estiver acima de 8 cartas, esse jogador não pode realizar outras ações do jogo.
- O jogador deve descartar cartas até ficar com exatamente 8 cartas.
- A mesma regra vale para a IA inimiga.

4. ENERGIA

As cartas possuem um custo de energia.

Para jogar uma carta normalmente:
- O jogador deve possuir energia suficiente.
- A quantidade de energia igual ao custo da carta é gasta.
- A carta é colocada em campo ou seu efeito é aplicado, dependendo do tipo da carta.

A energia máxima aumenta durante a partida conforme o sistema de turnos do jogo.

5. JOGANDO CARTAS

CRIATURAS

Criaturas e terrenos podem ser jogados ativamente ou para baixo.

Uma criatura implantada ativamente:
- Paga seu custo normal.
- Entra em campo com seus atributos e efeitos normais.

Uma criatura ou terreno jogado para baixo:
- Fica virada para baixo.
- Sua identidade fica escondida do adversário.
- Pode ser revelada posteriormente, inclusive quando for usada para bloquear um ataque.

TECNOLOGIAS

- São jogadas para utilizar seus efeitos.
- Não permanecem no campo como criaturas.
- Não possuem ATK ou DEF.

TERRENOS

- São jogados em campo pagando seu custo normal.
- Possuem ATK nulo (—).
- Possuem DEF.
- Não podem atacar.
- Podem bloquear ataques.
- Podem possuir efeitos especiais.

6. CARTAS VIRADAS PARA BAIXO

Uma carta virada para baixo esconde sua identidade do adversário.

Para o jogador proprietário:
- Ao passar o mouse sobre sua própria carta oculta, o visual verdadeiro da carta é mostrado temporariamente na própria carta.
- Quando o mouse sai da carta, ela volta ao visual virado para baixo.

Para o adversário:
- A carta permanece desconhecida.
- O adversário não pode ver o nome, imagem ou efeito da carta oculta enquanto ela permanecer virada para baixo.

Uma criatura ou terreno virado para baixo pode ser utilizado como bloqueador quando estiver apta a bloquear. Ao bloquear, ela é revelada e seu ATK/DEF real passa a ser utilizado no combate.

7. ATAQUE

Apenas criaturas podem atacar.

Para atacar:
- A carta deve ser uma criatura.
- Deve estar em campo.
- Não pode estar virada para baixo.
- Não pode estar descansando.
- Não pode estar atordoada ou impedida por outro efeito.
- Deve estar apta para realizar a ação conforme seu estado no jogo.

Terrenos não podem atacar porque possuem ataque nulo (—).

Tecnologias não podem atacar.

8. DESCANSO

Uma criatura pode ficar descansando após determinadas ações.

Uma criatura descansando:
- Não pode atacar.
- Não pode defender ou bloquear ataques.
- Não pode ser selecionada para uma ação que exija uma criatura pronta.

Quando uma criatura está descansando, o jogo deve impedir sua seleção como atacante ou bloqueadora.

9. DEFESA E BLOQUEIO

Quando ocorre um ataque, o jogador defensor pode utilizar cartas válidas para bloquear.

PODEM BLOQUEAR:
- Criaturas prontas e aptas a defender.
- Criaturas e terrenos virados para baixo que estejam aptos a bloquear.
- Terrenos, desde que estejam em campo e disponíveis para bloquear.

NÃO PODEM BLOQUEAR:
- Tecnologias.
- Criaturas destruídas.
- Criaturas descansando.
- Criaturas atordoadas ou impedidas por efeitos.
- Cartas que estejam indisponíveis por alguma regra do jogo.

Ao utilizar uma criatura ou terreno virado para baixo como bloqueador, ela é revelada no momento do bloqueio.

Um terreno pode bloquear, mas seu ATK continua sendo nulo (—). Portanto, um terreno pode receber dano do atacante, mas não causa dano de combate de volta por meio de ataque.

10. COMBATE

Quando uma criatura ataca diretamente o jogador:
- O ATK atual da criatura é causado como dano à vida do jogador defensor.

Quando uma criatura é bloqueada por uma criatura:
- O atacante causa dano igual ao seu ATK atual à DEF atual do bloqueador.
- O bloqueador causa dano igual ao seu ATK atual à DEF atual do atacante.
- Se a DEF de uma das cartas chegar a 0 ou menos, essa carta é destruída.

Quando uma criatura é bloqueada por um terreno:
- O atacante causa dano igual ao seu ATK atual à DEF atual do terreno.
- O terreno possui ATK nulo (—) e, por isso, não causa dano de combate ao atacante.
- Se a DEF do terreno chegar a 0 ou menos, o terreno é destruído.
- O atacante permanece em campo caso sua DEF não seja reduzida por outro efeito.

Cartas destruídas deixam o campo e são enviadas ao arquivo/cemitério de seu proprietário.

11. VIDA

Cada jogador começa com 20 pontos de vida.

- Um jogador perde quando sua vida chega a 0 ou menos.
- Dano direto reduz a vida do jogador atingido.
- Efeitos de reparo ou cura podem restaurar vida quando permitido pela carta.

12. EFEITOS DAS CARTAS

As cartas podem possuir efeitos especiais descritos em seu texto.

Exemplos de efeitos incluem:
- Aumentar ATK.
- Reduzir ATK.
- Aumentar DEF.
- Reduzir DEF.
- Causar dano a uma criatura.
- Causar dano direto ao jogador inimigo.
- Restaurar vida.
- Restaurar DEF.
- Destruir cartas.
- Aplicar modificadores temporários ou permanentes.

Os efeitos devem ser resolvidos conforme o texto e os gatilhos da carta.

13. EFEITOS "AO ENTRAR"

Algumas cartas possuem efeitos com o gatilho:

[Ao Entrar]

Esse efeito é ativado quando a carta entra em campo de forma válida.

Exemplo:
[Ao Entrar] +1 ATK

Nesse caso, a criatura recebe o bônus indicado ao entrar em campo.

14. ATAQUE E DEFESA DOS TERRENOS

Os terrenos utilizam o símbolo:

— / DEFESA

Exemplo:

— / 5

O símbolo "—" significa que a carta não possui atributo de ataque.

Portanto:
- ATK nulo não significa ATK 0.
- O terreno não pode atacar.
- O terreno continua possuindo DEF.
- O terreno pode bloquear ataques.
- O terreno não causa dano de combate ao atacante porque seu ATK é nulo.
- O terreno pode possuir efeitos especiais.

15. FORÇAS FUNDAMENTAIS

As cartas pertencem a uma das forças fundamentais:

- Eletromagnetismo
- Gravidade
- Força Forte
- Força Fraca

A força é uma característica visual e temática das cartas e pode ser utilizada por efeitos específicos do jogo.

16. DESTRUIÇÃO E ARQUIVO

Quando uma carta é destruída:
- Ela deixa o campo.
- É enviada para o arquivo/cemitério de seu proprietário.
- Seus estados de campo deixam de ser utilizados.

O jogador pode visualizar as cartas presentes em seu arquivo através da área correspondente.

17. TURNOS

Os jogadores se alternam durante a partida.

Durante seu turno, o jogador pode:
- Jogar cartas, caso possua energia suficiente.
- Atacar com criaturas aptas.
- Bloquear ataques quando for o jogador defensor.
- Utilizar ações permitidas pelo estado atual do jogo.
- Encerrar o turno.

Se o jogador estiver acima do limite de 8 cartas na mão, ele deve primeiro descartar até ficar com 8. Nenhuma outra ação pode ser realizada enquanto o descarte obrigatório estiver pendente.

Ao encerrar o ciclo de turno:
- A vez passa para o outro jogador.
- A energia é atualizada conforme as regras do sistema.
- A DEF de todas as cartas que permanecem em campo é restaurada ao seu valor base/original de DEF.
- Modificadores temporários de DEF que tenham terminado deixam de ser aplicados.
- Os estados de descanso e prontidão são atualizados conforme as regras do jogo.

18. MODIFICADORES DE ATK E DEF

Os valores das cartas podem ser modificados por efeitos.

- Quando um ATK ou DEF estiver acima de seu valor original devido a um modificador, o valor aumentado é exibido em VERDE.
- Quando um ATK ou DEF estiver abaixo de seu valor original devido a um modificador ou dano, o valor reduzido é exibido em VERMELHO.
- Valores sem alteração permanecem na aparência normal.

A DEF atual pode ser reduzida durante o combate ou por efeitos, mas é restaurada ao valor base/original no fim do ciclo de turno, desde que a carta permaneça em campo.

19. INTELIGÊNCIA ARTIFICIAL

O jogador inimigo é controlado pela inteligência artificial.

A IA avalia, entre outras possibilidades:
- Cartas que pode jogar.
- Custo das cartas.
- Força das criaturas.
- Defesa das unidades.
- Possíveis ataques.
- Possíveis bloqueios.

A IA deve seguir as mesmas regras do jogador:
- Não pode agir enquanto estiver com mais de 8 cartas na mão e com descarte obrigatório pendente.
- Não deve utilizar cartas descansando para atacar ou defender.
- Pode utilizar criaturas e terrenos virados para baixo como bloqueadores quando estiverem aptos.
- Pode utilizar terrenos como bloqueadores.
- Terrenos controlados pela IA não podem atacar.

20. FIM DA PARTIDA

A partida termina quando ocorre uma das seguintes situações:

- A vida de um jogador chega a 0 ou menos.
- Um jogador precisa comprar uma carta, mas seu deck está vazio.
- Outra condição de vitória ou derrota definida por um efeito do jogo acontece.

O jogador que permanecer em uma condição válida vence a partida.

21. RESUMO RÁPIDO

1. Comece com 20 de vida.
2. Cada jogador recebe 7 cartas na mão inicial.
3. O limite da mão é 8 cartas.
4. Se ficar acima de 8 cartas, descarte obrigatoriamente até 8 antes de realizar outras ações.
5. Use energia para jogar cartas.
6. Apenas criaturas podem atacar.
7. Criaturas descansando não podem atacar nem bloquear.
8. Criaturas e terrenos podem bloquear quando estiverem aptos.
9. Criaturas e terrenos podem ser jogados para baixo. Cartas viradas para baixo custam 0, possuem 0/1 e podem bloquear; ao bloquear, são reveladas.
10. Terrenos possuem ATK nulo (—), não atacam e não causam dano de combate.
11. A DEF atual das cartas é restaurada ao valor original no fim do ciclo de turno.
12. ATK/DEF aumentados aparecem em verde; ATK/DEF reduzidos aparecem em vermelho.
13. Reduza a vida inimiga a 0 para vencer.
14. Se precisar comprar uma carta com o deck vazio, você perde.
`;
function openTutorial(){const m=document.getElementById('tutorial-modal'),c=document.getElementById('tutorial-content');if(!m||!c)return;m.style.display='flex';c.textContent=RULES_TEXT;}
function closeTutorial(){const m=document.getElementById('tutorial-modal');if(m)m.style.display='none';}
