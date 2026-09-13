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
        state.activeAttack &&
        state.activeAttack.attackerOwner !== owner;

    const podeRevelarNormalmente =
        state.initiativeOwner === owner &&
        !state.activeAttack;

    if (!estaDefendendo && !podeRevelarNormalmente) {
        showToast(
            'Essa carta só pode ser revelada durante sua ação ou durante a defesa de um ataque.',
            'warning'
        );
        return false;
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

    const atkBonus =
        Number(card._faceDownAtkBonus) || 0;

    card.isFaceDown = false;
    card.cost = custoRevelar;

    const atkOriginal =
        card._faceDownOriginalAtk ??
        card.atk;

    card.atk =
        atkOriginal === null || atkOriginal === undefined
            ? null
            : Number(atkOriginal) + atkBonus;

    const defBonus =
        Number(card._faceDownDefBonus) || 0;

    const faceDownDamage =
        Number(card._faceDownDamage) || 0;

    card.def =
        (Number(
            card._faceDownOriginalDef ??
            card.def
        ) || 0) + defBonus;

    card.currentDef =
        (Number(
            card._faceDownOriginalCurrentDef ??
            card.def ??
            card.baseDef
        ) || 0) + defBonus - faceDownDamage;

    delete card._faceDownOriginalCost;
    delete card._faceDownOriginalAtk;
    delete card._faceDownOriginalDef;
    delete card._faceDownOriginalCurrentDef;
    delete card._faceDownDefBonus;
    delete card._faceDownDamage;
    delete card._faceDownAtkBonus;

    card._activeStatApplied = false;
    card._activeTickedTurn = null;
    card._activeTarget = null;
    card._activeTargetOwner = null;
    card.isResting = false;

    if (estaDefendendo) {
        /*
         * A carta foi revelada durante a defesa.
         * Ela pode bloquear imediatamente se não estiver atordoada.
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

    if (!cartaPodeBloquear(card)) {
        showToast('Esta carta não pode bloquear.', 'warning');
        return;
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

    card.currentDef =
        (Number(card.currentDef) || 0) - ataqueDoAtacante;

    attackerCard.currentDef =
        (Number(attackerCard.currentDef) || 0) - ataqueDoBloqueador;

    const cartasDestruidas = [];

    if (card.currentDef <= 0) {
        player.field =
            player.field.filter(
                cartaAtual =>
                    cartaAtual !== card
            );

        card.isDestroyed = true;
        card.isFaceDown = false;

        sendCardToGraveyard(
            card,
            'p1',
            true
        );

        cartasDestruidas.push(
            card.name
        );
    }

    if (attackerCard.currentDef <= 0) {
        jogadorInimigo.field =
            jogadorInimigo.field.filter(
                cartaAtual =>
                    cartaAtual !== attackerCard
            );

        attackerCard.isDestroyed = true;
        attackerCard.isFaceDown = false;

        sendCardToGraveyard(
            attackerCard,
            'p2',
            true
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
