let deckBuilderSelection = [];

function getDeckCountMap() {
    const counts = {};
    deckBuilderSelection.forEach(name => counts[name] = (counts[name] || 0) + 1);
    return counts;
}

function renderDeckBuilder() {
    const container = document.getElementById('deck-builder-cards');
    const countEl = document.getElementById('deck-builder-count');
    const startBtn = document.getElementById('start-game-btn');
    if (!container || !countEl || !startBtn || typeof CARD_DATABASE === 'undefined') return;

    const counts = getDeckCountMap();
    countEl.textContent = `${deckBuilderSelection.length} / 40`;
    startBtn.disabled = deckBuilderSelection.length !== 40;

    /*
     * A montagem do deck usa exatamente o mesmo HTML de carta usado
     * durante a partida. Assim, custo, geração, arte, descrição,
     * força e ATK/DEF ficam visualmente consistentes entre as telas.
     */
    container.innerHTML = CARD_DATABASE.map((card, index) => {
        const count = counts[card.name] || 0;

        const cardHTML = `
            <div class="deck-builder-card-wrap">
                <div class="deck-builder-card-preview">
                    ${getFullCardContent(card)}
                </div>

                <div class="deck-builder-controls">
                    <button
                        class="action-btn"
                        onclick="changeDeckCard(${index}, -1)"
                        ${count === 0 ? 'disabled' : ''}
                    >−</button>

                    <span class="deck-builder-card-count">${count}/3</span>

                    <button
                        class="action-btn"
                        onclick="changeDeckCard(${index}, 1)"
                        ${count >= 3 || deckBuilderSelection.length >= 40 ? 'disabled' : ''}
                    >+</button>
                </div>
            </div>
        `;

        return cardHTML;
    }).join('');
}

function changeDeckCard(index, delta) {
    const base = CARD_DATABASE[index];
    if (!base) return;
    const count = deckBuilderSelection.filter(name => name === base.name).length;
    if (delta > 0 && deckBuilderSelection.length < 40 && count < 3) deckBuilderSelection.push(base.name);
    if (delta < 0) {
        const pos = deckBuilderSelection.lastIndexOf(base.name);
        if (pos >= 0) deckBuilderSelection.splice(pos, 1);
    }
    renderDeckBuilder();
}

function randomizePlayerDeck() {
    deckBuilderSelection = generateRandomDeckNames();
    renderDeckBuilder();
}

function startGameFromBuilder() {
    if (deckBuilderSelection.length !== 40) {
        alert('Seu deck precisa ter exatamente 40 cartas.');
        return;
    }
    /*
     * O inimigo usa exatamente a mesma composição de deck
     * escolhida pelo jogador.
     *
     * A cópia é independente, então cada deck pode ser
     * embaralhado separadamente durante a partida.
     */
    const enemyDeck = [...deckBuilderSelection];

    const started = initGame(
        [...deckBuilderSelection],
        [...enemyDeck]
    );
    if (!started) {
        alert('Não foi possível iniciar a partida.');
        return;
    }
    const builder = document.getElementById('deck-builder');
    if (builder) builder.style.display = 'none';
    renderUI();
}

function openDeckModal() {
    const modal = document.getElementById('deck-modal');
    const container = document.getElementById('deck-modal-cards');
    if (!modal || !container || !state.savedDecks?.p1) return;
    const counts = {};
    state.savedDecks.p1.forEach(name => counts[name] = (counts[name] || 0) + 1);
    container.innerHTML = Object.entries(counts).sort((a,b) => a[0].localeCompare(b[0])).map(([name,count]) => `<div style="padding:7px;border-bottom:1px solid #334155;color:white;">${count}× ${name}</div>`).join('');
    modal.style.display = 'flex';
}

function closeDeckModal() {
    const modal = document.getElementById('deck-modal');
    if (modal) modal.style.display = 'none';
}

function closeAllGameModals() {
    ['deck-modal','play-modal','discard-modal','gy-modal','attack-modal','tutorial-modal'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    });
}

window.addEventListener('load', function () {
    const builder = document.getElementById('deck-builder');
    if (builder) builder.style.display = 'block';
    renderDeckBuilder();
});
