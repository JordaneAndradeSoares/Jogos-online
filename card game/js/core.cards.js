function generateRandomDeckNames() {
    const pool = [];
    if (typeof CARD_DATABASE === 'undefined' || !Array.isArray(CARD_DATABASE)) return [];
    CARD_DATABASE.forEach(card => {
        for (let i = 0; i < 3; i++) pool.push(card.name);
    });
    shuffleArray(pool);
    return pool.slice(0, 40);
}

function buildDeckFromNames(names) {
    return names.map(name => {
        const base = CARD_DATABASE.find(c => c.name === name);
        return base ? createCard(base) : null;
    }).filter(Boolean);
}

function generateLegalDeck() {
    return generateRandomDeckNames();
}

function initGame(playerDeckNames, enemyDeckNames) {
    // Sem decks escolhidos, não inicia uma partida automaticamente.
    // A tela de montagem de deck é responsável por chamar initGame com 40 cartas.
    if (!Array.isArray(playerDeckNames) || playerDeckNames.length !== 40) {
        return false;
    }
    if (!Array.isArray(enemyDeckNames) || enemyDeckNames.length !== 40) {
        enemyDeckNames = generateRandomDeckNames();
    }

    state.savedDecks = {
        p1: [...playerDeckNames],
        p2: [...enemyDeckNames]
    };

    state.turn = 1;
    state.initiativeOwner = 'p1';
    state.consecutivePasses = 0;
    state.effectStack = [];
    state.selectedCardIndex = null;
    state.activeAttack = null;
    state.pendingDiscard = { p1: false, p2: false };

    state.players.p1 = {
        life: 20, energy: 1, maxEnergy: 1,
        deck: buildDeckFromNames(playerDeckNames), hand: [], field: [], gy: []
    };

    state.players.p2 = {
        life: 20, energy: 1, maxEnergy: 1,
        deck: buildDeckFromNames(enemyDeckNames), hand: [], field: [], gy: []
    };

    shuffleArray(state.players.p1.deck);
    shuffleArray(state.players.p2.deck);

    // Mão inicial de 7 cartas para cada jogador.
    for (let i = 0; i < 7; i++) {
        if (state.players.p1.deck.length > 0) state.players.p1.hand.push(state.players.p1.deck.pop());
        if (state.players.p2.deck.length > 0) state.players.p2.hand.push(state.players.p2.deck.pop());
    }

    if (typeof renderUI === 'function') renderUI();
    return true;
}

function restartGameSameDeck() {
    if (!state.savedDecks || state.savedDecks.p1.length !== 40 || state.savedDecks.p2.length !== 40) return;
    closeAllGameModals?.();
    initGame([...state.savedDecks.p1], [...state.savedDecks.p2]);
    showToast?.('Partida reiniciada com os mesmos decks.', 'success');
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
