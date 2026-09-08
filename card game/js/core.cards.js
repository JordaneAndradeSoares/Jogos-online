function generateLegalDeck() {
    const pool = [];
    if (typeof CARD_DATABASE === 'undefined' || !Array.isArray(CARD_DATABASE)) {
        console.error('CARD_DATABASE não foi carregado!');
        return [];
    }

    CARD_DATABASE.forEach(baseCard => {
        for (let i = 0; i < 3; i++) pool.push(createCard(baseCard));
    });

    shuffleArray(pool);
    return pool.slice(0, Math.min(40, pool.length));
}

function initGame() {
    state.turn = 1;
    state.initiativeOwner = 'p1';
    state.consecutivePasses = 0;
    state.effectStack = [];
    state.selectedCardIndex = null;
    state.activeAttack = null;
    state.pendingDiscard = { p1: false, p2: false };

    state.players.p1 = {
        life: 20, energy: 1, maxEnergy: 1,
        deck: generateLegalDeck(), hand: [], field: [], gy: []
    };

    state.players.p2 = {
        life: 20, energy: 1, maxEnergy: 1,
        deck: generateLegalDeck(), hand: [], field: [], gy: []
    };

    // Mão inicial de 7 cartas para cada jogador.
    for (let i = 0; i < 7; i++) {
        if (state.players.p1.deck.length > 0) state.players.p1.hand.push(state.players.p1.deck.pop());
        if (state.players.p2.deck.length > 0) state.players.p2.hand.push(state.players.p2.deck.pop());
    }

    if (typeof renderUI === 'function') renderUI();
}

function sendCardToGraveyard(card, playerKey, isDestroyed = false) {
    if (!card || !state.players[playerKey]) return;
    card.isDestroyed = isDestroyed;
    if (card.baseAtk !== undefined) card.atk = card.baseAtk;
    if (card.baseDef !== undefined) {
        card.def = card.baseDef;
        card.currentDef = card.baseDef;
    }
    card.isFaceDown = false;
    card.isStunned = false;
    card.attackedThisTurn = false;
    card.attackedLastTurn = false;
    card.lastAttackTurn = null;
    card.isResting = false;
    state.players[playerKey].gy.push(card);
}

function healPlayer(playerKey, amount) {
    const player = state.players[playerKey];
    if (!player) return;
    player.life = Math.min(20, player.life + Math.max(0, amount));
}

function damagePlayer(playerKey, amount) {
    const player = state.players[playerKey];
    if (!player) return;
    player.life = Math.max(0, player.life - Math.max(0, amount));

    if (player.life <= 0) {
        const winner = playerKey === 'p1' ? 'Inimigo (P2)' : 'Você (P1)';
        alert(`Fim de jogo! ${winner} venceu!`);
        location.reload();
    }
}
