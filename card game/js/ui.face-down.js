function revealFaceDownCard(index, owner = 'p1') {
    const player = state.players[owner];

    if (!player || !Array.isArray(player.field)) {
        return false;
    }

    const card = player.field[index];

    if (!card || !card.isFaceDown) {
        return false;
    }

    const estaDefendendo =
        owner === 'p1' &&
        state.activeAttack &&
        state.activeAttack.attackerOwner === 'p2';

    if (owner === 'p1') {
        const podeRevelarNormalmente =
            state.initiativeOwner === 'p1' &&
            !state.activeAttack;

        if (!estaDefendendo && !podeRevelarNormalmente) {
            showToast(
                'Essa carta só pode ser revelada durante sua ação ou durante a defesa de um ataque inimigo.',
                'warning'
            );
            return false;
        }
    }

    const custoRevelar = Number(
        card._faceDownOriginalCost ??
        card.baseCost ??
        card.cost
    ) || 0;

    if (player.energy < custoRevelar) {
        showToast(
            `Energia insuficiente para revelar ${card.name}! Custo: ${custoRevelar}.`,
            'error'
        );
        return false;
    }

    player.energy -= custoRevelar;

    card.isFaceDown = false;
    card.cost = custoRevelar;

    card.atk =
        card._faceDownOriginalAtk ??
        card.atk;

    card.def =
        card._faceDownOriginalDef ??
        card.def;

    card.currentDef =
        card._faceDownOriginalCurrentDef ??
        card.def ??
        card.baseDef ??
        1;

    delete card._faceDownOriginalCost;
    delete card._faceDownOriginalAtk;
    delete card._faceDownOriginalDef;
    delete card._faceDownOriginalCurrentDef;

    card._activeStatApplied = false;
    card._activeTickedTurn = null;
    card.isStunned = false;
    card.stunReason = null;
    card.isResting = false;

    if (estaDefendendo) {
        /*
         * A carta foi revelada durante a defesa.
         * Ela pode bloquear imediatamente.
         */
        card.summonedTurn = state.turn;
        card.casusBelli = 0;
        card.attackedThisTurn = false;
    } else {
        /*
         * A carta já estava em campo antes da revelação.
         */
        card.summonedTurn = state.turn - 1;
        card.casusBelli = 1;
        card.attackedThisTurn = false;
    }

    if (typeof gainEnergyFromCard === 'function') {
        gainEnergyFromCard(player, card);
    }

    if (typeof triggerEffect === 'function') {
        triggerEffect(
            'revelar',
            card,
            {
                owner,
                card
            }
        );

        triggerEffect(
            'campo',
            card,
            {
                owner,
                card
            }
        );

        if (card.gatilho === 'ativo') {
            triggerEffect(
                'ativo',
                card,
                {
                    owner,
                    card
                }
            );
        }
    }

    if (typeof renderUI === 'function') {
        renderUI();
    }

    showToast(
        `${card.name} foi virada para cima pagando ${custoRevelar} de energia.`,
        'success'
    );

    return true;
}

function resolveFaceDownReveal() {
    const index = state.pendingFaceDownBlockIndex;

    if (
        index === null ||
        index === undefined
    ) {
        closeFaceDownActionModal();
        return;
    }

    /*
     * Durante a defesa, a iniciativa pertence ao inimigo.
     * Portanto não verificamos initiativeOwner === 'p1'.
     */
    if (
        !state.activeAttack ||
        state.activeAttack.attackerOwner !== 'p2'
    ) {
        closeFaceDownActionModal();

        showToast(
            'O ataque inimigo já terminou.',
            'warning'
        );

        return;
    }

    const card =
        state.players.p1.field[index];

    if (!card || !card.isFaceDown) {
        closeFaceDownActionModal();
        return;
    }

    /*
     * Não fechamos o modal antes desta chamada.
     * Se faltar energia, o jogador pode escolher outra opção.
     */
    if (!revealFaceDownCard(index, 'p1')) {
        return;
    }

    /*
     * A carta acabou de ser revelada e o ataque
     * ainda está ativo. Ela bloqueia imediatamente.
     */
    resolveFaceDownBlock(index, false);
}

function resolveFaceDownBlock(
    index = state.pendingFaceDownBlockIndex,
    revealFirst = false
) {
    closeFaceDownActionModal();

    if (
        index === null ||
        index === undefined ||
        !state.activeAttack
    ) {
        return;
    }

    if (
        state.activeAttack.attackerOwner !== 'p2'
    ) {
        return;
    }

    const player = state.players.p1;
    const card = player.field[index];

    if (!card) {
        state.pendingFaceDownBlockIndex = null;
        return;
    }

    if (
        revealFirst &&
        card.isFaceDown
    ) {
        if (!revealFaceDownCard(index, 'p1')) {
            return;
        }
    }

    const attackerCard =
        state.activeAttack.attackerCard;

    const jogadorInimigo =
        state.players.p2;

    /*
     * Uma carta escondida bloqueia com ataque 0.
     * Uma carta revelada usa seu ataque real.
     */
    const ataqueDoBloqueador =
        card.isFaceDown
            ? 0
            : (
                card.type === 'terreno'
                    ? 0
                    : Number(card.atk) || 0
            );

    const ataqueDoAtacante =
        Number(attackerCard.atk) || 0;

    drawCombatLine(
        'p2',
        state.activeAttack.attackerIndex,
        'p1',
        index
    );

    showToast(
        `Você bloqueou o ataque de ${attackerCard.name} com ${card.name}!`,
        'info'
    );

    card.currentDef -= ataqueDoAtacante;
    attackerCard.currentDef -= ataqueDoBloqueador;

    const cartasDestruidas = [];

    if (card.currentDef <= 0) {
        sendCardToGraveyard(
            card,
            'p1',
            true
        );

        player.field =
            player.field.filter(
                cartaAtual =>
                    cartaAtual !== card
            );

        cartasDestruidas.push(
            card.name
        );
    }

    if (attackerCard.currentDef <= 0) {
        sendCardToGraveyard(
            attackerCard,
            'p2',
            true
        );

        jogadorInimigo.field =
            jogadorInimigo.field.filter(
                cartaAtual =>
                    cartaAtual !== attackerCard
            );

        cartasDestruidas.push(
            attackerCard.name
        );
    }

    if (cartasDestruidas.length > 0) {
        showToast(
            `Combate: ${cartasDestruidas.join(' e ')} foi(ram) destruído(s)!`,
            'error'
        );
    } else {
        showToast(
            'Combate resolvido! Nenhuma carta foi destruída.',
            'info'
        );
    }

    state.activeAttack = null;
    state.pendingFaceDownBlockIndex = null;

    registerActionDone('p1');
}

function closeFaceDownActionModal() {
    const modal =
        document.getElementById(
            'face-down-action-modal'
        );

    if (modal) {
        modal.style.display = 'none';
    }
}
