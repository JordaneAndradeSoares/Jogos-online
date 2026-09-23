const tamanhoMaximoDeck = 40;
const tamanhoMaximoExtraDeck = 15;

function isExtraDeckCard(card) {
    return !!card && (card.summonType === 'fusao' || card.summonType === 'especialidade');
}

function generateRandomDeckNames() {
    const pool = [];
    if (typeof CARD_DATABASE === 'undefined' || !Array.isArray(CARD_DATABASE)) return [];
    CARD_DATABASE
        .filter(card => !isExtraDeckCard(card))
        .forEach(card => {
            for (let i = 0; i < 3; i++) pool.push(card.name);
        });
    shuffleArray(pool);
    return pool.slice(0, 40);
}

function generateRandomExtraDeckNames() {
    const pool = [];
    if (typeof CARD_DATABASE === 'undefined' || !Array.isArray(CARD_DATABASE)) return [];
    CARD_DATABASE
        .filter(card => isExtraDeckCard(card))
        .forEach(card => {
            for (let i = 0; i < 3; i++) pool.push(card.name);
        });
    shuffleArray(pool);
    return pool.slice(0, tamanhoMaximoExtraDeck);
}

function buildExtraDeckFromNames(names) {
    return (names || []).map(name => {
        const base = CARD_DATABASE.find(c => c.name === name);
        return base ? createCard(base) : null;
    }).filter(Boolean);
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

function initGame(playerDeckNames, enemyDeckNames, playerExtraDeckNames = [], enemyExtraDeckNames = []) {
    // Sem decks escolhidos, não inicia uma partida automaticamente.
    // A tela de montagem de deck é responsável por chamar initGame com 40 cartas.
    if (!Array.isArray(playerDeckNames) || playerDeckNames.length !== tamanhoMaximoDeck) {
        return false;
    }
    if (!Array.isArray(enemyDeckNames) || enemyDeckNames.length !== tamanhoMaximoDeck) {
        enemyDeckNames = generateRandomDeckNames();
    }
    if (!Array.isArray(playerExtraDeckNames) || playerExtraDeckNames.length > tamanhoMaximoExtraDeck) {
        return false;
    }
    if (!Array.isArray(enemyExtraDeckNames) || enemyExtraDeckNames.length > tamanhoMaximoExtraDeck) {
        enemyExtraDeckNames = generateRandomExtraDeckNames();
    }

    state.savedDecks = {
        p1: [...playerDeckNames],
        p2: [...enemyDeckNames]
    };
    state.savedExtraDecks = {
        p1: [...playerExtraDeckNames],
        p2: [...enemyExtraDeckNames]
    };

    state.turn = 1;
    state.initiativeOwner = 'p1';
    state.consecutivePasses = 0;
    state.effectStack = [];
    state.selectedCardIndex = null;
    state.activeAttack = null;
    state.pendingCostActivation = null;
    state.pendingExtraDeckSummon = null;
    state.pendingPolymorphSummon = null;
    state.pendingDiscard = { p1: false, p2: false };

    state.players.p1 = {
        life: 20, energy: 0, maxEnergy: 20,
        deck: buildDeckFromNames(playerDeckNames), hand: [], field: [], gy: [], extraDeck: buildExtraDeckFromNames(playerExtraDeckNames)
    };

    state.players.p2 = {
        life: 20, energy: 0, maxEnergy: 20,
        deck: buildDeckFromNames(enemyDeckNames), hand: [], field: [], gy: [], extraDeck: buildExtraDeckFromNames(enemyExtraDeckNames)
    };

    // As cartas do Extra Deck do inimigo começam ocultas.
    // Quando uma Fusão/Especialidade retornar ao Extra Deck,
    // returnExtraDeckCardToExtraDeck() chama resetSummonCardState(),
    // que deixa a carta novamente virada para cima.
    state.players.p2.extraDeck.forEach(card => {
        card.isFaceDown = true;
    });

    shuffleArray(state.players.p1.deck);
    shuffleArray(state.players.p2.deck);

    // Mão inicial de 7 cartas para cada jogador.
    for (let i = 0; i < 7; i++) {
        if (state.players.p1.deck.length > 0) state.players.p1.hand.push(state.players.p1.deck.pop());
        if (state.players.p2.deck.length > 0) state.players.p2.hand.push(state.players.p2.deck.pop());
    }

    iniciarTemporizadorAcao();

    if (typeof renderUI === 'function') renderUI();
    return true;
}

function restartGameSameDeck() {
    if (!state.savedDecks || state.savedDecks.p1.length !== tamanhoMaximoDeck || state.savedDecks.p2.length !== tamanhoMaximoDeck) return;
    closeAllGameModals?.();
    initGame(
        [...state.savedDecks.p1],
        [...state.savedDecks.p2],
        [...(state.savedExtraDecks?.p1 || [])],
        [...(state.savedExtraDecks?.p2 || [])]
    );
    showToast?.('Partida reiniciada com os mesmos decks.', 'success');
}

function sendCardToGraveyard(card, playerKey, isDestroyed = false, options = {}) {
    if (!card || !state.players[playerKey]) return;

    // Fusão e Especialidade retornam ao Extra Deck.
    // As matérias anexadas a elas vão intactas para o Arquivo.
    if (!options.forceGraveyard && typeof returnExtraDeckCardToExtraDeck === 'function' && isSummonFromExtraDeck(card)) {
        returnExtraDeckCardToExtraDeck(card, playerKey);
        return;
    }

    // Polimorfose permanece no Deck Principal, mas sua matéria não:
    // quando a carta deixa o campo, a matéria anexada vai para o Arquivo.
    if (typeof isPolymorphCard === 'function' && isPolymorphCard(card) && Array.isArray(card.materials) && card.materials.length) {
        const materials = [...card.materials];
        card.materials = [];
        materials.forEach(material => sendCardToGraveyard(material, playerKey, false, { forceGraveyard: true }));
    }

    if (typeof removerEfeitosAtivosDaCarta === 'function') {
        removerEfeitosAtivosDaCarta(card);
    }
    if (isDestroyed && typeof triggerEffect === 'function') { triggerEffect('destruido', card, { owner: playerKey, card }); if (typeof resolveEffectStack === 'function') resolveEffectStack(); }
    card.isDestroyed = isDestroyed;
    if (card.baseAtk !== undefined) card.atk = card.baseAtk;
    if (card.baseDef !== undefined) {
        card.def = card.baseDef;
        card.currentDef = card.baseDef;
    }
    card.isFaceDown = false;
    delete card._faceDownOriginalCost;
    delete card._faceDownOriginalAtk;
    delete card._faceDownOriginalDef;
    delete card._faceDownOriginalCurrentDef;
    delete card._faceDownDefBonus;
    delete card._faceDownDamage;
    delete card._faceDownAtkBonus;
    card.isStunned = false;
    card.stunnedUntilTurn = null;
    card.attackedThisTurn = false;
    card.attackedLastTurn = false;
    card.lastAttackTurn = null;
    card.isResting = false;
    card._activeCostUsedTurn = null;
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
