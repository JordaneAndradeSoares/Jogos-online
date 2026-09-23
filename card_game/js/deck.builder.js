let deckBuilderSelection = [];
let extraDeckBuilderSelection = [];

function getDeckCountMap() {
    const counts = {};
    deckBuilderSelection.forEach(name => counts[name] = (counts[name] || 0) + 1);
    return counts;
}

function getExtraDeckCountMap() {
    const counts = {};
    extraDeckBuilderSelection.forEach(name => counts[name] = (counts[name] || 0) + 1);
    return counts;
}

function renderDeckBuilder() {
    const container = document.getElementById('deck-builder-cards');
    const countEl = document.getElementById('deck-builder-count');
    const startBtn = document.getElementById('start-game-btn');

    if (!container || !countEl || !startBtn || typeof CARD_DATABASE === 'undefined') return;

    const counts = getDeckCountMap();
    const extraCounts = getExtraDeckCountMap();

    countEl.textContent = `${deckBuilderSelection.length} / ${tamanhoMaximoDeck}`;

    // Tamanho máximo do Deck Principal e do Extra Deck.
    startBtn.disabled = deckBuilderSelection.length !== tamanhoMaximoDeck || extraDeckBuilderSelection.length > tamanhoMaximoExtraDeck;

    const mainCards = CARD_DATABASE.filter(card => !isExtraDeckCard(card));
    const extraCards = CARD_DATABASE.filter(card => isExtraDeckCard(card));

    container.innerHTML = `
        <div style="grid-column:1/-1;width:100%;">
            <h3 style="margin:10px 0;">Deck Principal</h3>
            <p id="deck-builder-main-description" style="margin:0 0 10px;color:#cbd5e1;"></p>
            <div id="main-deck-builder-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(124px,1fr));gap:14px 10px;justify-items:center;"></div>
        </div>

        <div style="grid-column:1/-1;width:100%;margin-top:25px;">
            <h3 style="margin:10px 0;">Extra Deck</h3>
            <p id="deck-builder-extra-description" style="margin:0 0 10px;color:#cbd5e1;"></p>
            <div id="extra-deck-builder-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(124px,1fr));gap:14px 10px;justify-items:center;"></div>
        </div>
    `;

    const mainDescription = document.getElementById('deck-builder-main-description');
    const extraDescription = document.getElementById('deck-builder-extra-description');

    if (mainDescription) {
        mainDescription.textContent = `${tamanhoMaximoDeck} cartas e no máximo 3 cópias de cada carta.`;
    }

    if (extraDescription) {
        extraDescription.textContent = `Até ${tamanhoMaximoExtraDeck} cartas no máximo e no máximo 3 cópias de cada carta.`;
    }

    const randomBtn = document.getElementById('randomize-player-deck-btn');
    if (randomBtn) {
        randomBtn.textContent = `Escolher ${tamanhoMaximoDeck} aleatoriamente`;
    }

    const rulesText = document.getElementById('deck-builder-rules-text');
    if (rulesText) {
        rulesText.innerHTML = `Escolha exatamente <b>${tamanhoMaximoDeck} cartas</b> para o Deck Principal e até <b>${tamanhoMaximoExtraDeck} cartas</b> para o Extra Deck. Máximo de <b>3 cópias</b> de cada carta.`;
    }

    const mainContainer = document.getElementById('main-deck-builder-cards');
    const extraContainer = document.getElementById('extra-deck-builder-cards');

    mainContainer.innerHTML = mainCards.map(card => {
        const index = CARD_DATABASE.indexOf(card);
        const count = counts[card.name] || 0;

        return `
            <div class="deck-builder-card-wrap">
                <div class="deck-builder-card-preview">${getFullCardContent(card)}</div>

                <div class="deck-builder-controls">
                    <button
                        class="action-btn"
                        onclick="changeDeckCard(${index}, -1)"
                        ${count === 0 ? 'disabled' : ''}>
                        −
                    </button>

                    <span class="deck-builder-card-count">
                        ${count}/3
                    </span>

                    <button
                        class="action-btn"
                        onclick="changeDeckCard(${index}, 1)"
                        ${count >= 3 || deckBuilderSelection.length >= tamanhoMaximoDeck ? 'disabled' : ''}>
                        +
                    </button>
                </div>
            </div>
        `;
    }).join('');

    extraContainer.innerHTML = extraCards.map(card => {
        const index = CARD_DATABASE.indexOf(card);
        const count = extraCounts[card.name] || 0;

        return `
            <div class="deck-builder-card-wrap">
                <div class="deck-builder-card-preview">${getFullCardContent(card)}</div>

                <div class="deck-builder-controls">
                    <button
                        class="action-btn"
                        onclick="changeExtraDeckCard(${index}, -1)"
                        ${count === 0 ? 'disabled' : ''}>
                        −
                    </button>

                    <span class="deck-builder-card-count">
                        ${count}/3
                    </span>

                    <button
                        class="action-btn"
                        onclick="changeExtraDeckCard(${index}, 1)"
                        ${count >= 3 || extraDeckBuilderSelection.length >= tamanhoMaximoExtraDeck ? 'disabled' : ''}>
                        +
                    </button>
                </div>
            </div>
        `;
    }).join('');

    const extraCount = document.getElementById('extra-deck-builder-count');

    if (extraCount) {
        extraCount.textContent =
            `${extraDeckBuilderSelection.length} / ${tamanhoMaximoExtraDeck}`;
    }
}

function changeDeckCard(index, delta) {
    const base = CARD_DATABASE[index];

    if (!base || isExtraDeckCard(base)) return;

    const count = deckBuilderSelection.filter(
        name => name === base.name
    ).length;

    if (
        delta > 0 &&
        deckBuilderSelection.length < tamanhoMaximoDeck &&
        count < 3
    ) {
        deckBuilderSelection.push(base.name);
    }

    if (delta < 0) {
        const pos = deckBuilderSelection.lastIndexOf(base.name);

        if (pos >= 0) {
            deckBuilderSelection.splice(pos, 1);
        }
    }

    renderDeckBuilder();
}

function changeExtraDeckCard(index, delta) {
    const base = CARD_DATABASE[index];

    if (!base || !isExtraDeckCard(base)) return;

    const count = extraDeckBuilderSelection.filter(
        name => name === base.name
    ).length;

    if (
        delta > 0 &&
        extraDeckBuilderSelection.length < tamanhoMaximoExtraDeck &&
        count < 3
    ) {
        extraDeckBuilderSelection.push(base.name);
    }

    if (delta < 0) {
        const pos = extraDeckBuilderSelection.lastIndexOf(base.name);

        if (pos >= 0) {
            extraDeckBuilderSelection.splice(pos, 1);
        }
    }

    renderDeckBuilder();
}

function randomizePlayerDeck() {
    deckBuilderSelection = generateRandomDeckNames();
    extraDeckBuilderSelection = generateRandomExtraDeckNames();

    if (extraDeckBuilderSelection.length > tamanhoMaximoExtraDeck) {
        extraDeckBuilderSelection = extraDeckBuilderSelection.slice(0, tamanhoMaximoExtraDeck);
    }

    renderDeckBuilder();
}

function startGameFromBuilder() {
    if (deckBuilderSelection.length !== tamanhoMaximoDeck) {
        alert(
            `Seu Deck Principal precisa ter exatamente ${tamanhoMaximoDeck} cartas.`
        );
        return;
    }

    if (extraDeckBuilderSelection.length > tamanhoMaximoExtraDeck) {
        alert(
            `Seu Extra Deck pode ter no máximo ${tamanhoMaximoExtraDeck} cartas.`
        );
        return;
    }

    const enemyDeck = [...deckBuilderSelection];
    const enemyExtraDeck = [...extraDeckBuilderSelection];

    const started = initGame(
        [...deckBuilderSelection],
        [...enemyDeck],
        [...extraDeckBuilderSelection],
        [...enemyExtraDeck]
    );

    if (!started) {
        alert('Não foi possível iniciar a partida.');
        return;
    }

    const builder = document.getElementById('deck-builder');

    if (builder) {
        builder.style.display = 'none';
    }

    renderUI();
}

function openDeckModal() {
    const modal = document.getElementById('deck-modal');
    const container = document.getElementById('deck-modal-cards');

    if (!modal || !container || !state.savedDecks?.p1) return;

    const counts = {};

    state.savedDecks.p1.forEach(
        name => counts[name] = (counts[name] || 0) + 1
    );

    container.innerHTML = Object.entries(counts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(
            ([name, count]) =>
                `<div style="padding:7px;border-bottom:1px solid #334155;color:white;">
                    ${count}× ${name}
                </div>`
        )
        .join('');

    modal.style.display = 'flex';
}

function closeDeckModal() {
    const modal = document.getElementById('deck-modal');

    if (modal) {
        modal.style.display = 'none';
    }
}

function closeAllGameModals() {
    [
        'deck-modal',
        'play-modal',
        'discard-modal',
        'gy-modal',
        'extra-deck-modal',
        'fusion-material-modal',
        'polymorph-material-modal',
        'attack-modal',
        'tutorial-modal'
    ].forEach(id => {
        const modal = document.getElementById(id);

        if (modal) {
            modal.style.display = 'none';
        }
    });
}

window.addEventListener('load', function () {
    const builder = document.getElementById('deck-builder');

    if (builder) {
        builder.style.display = 'block';
    }

    renderDeckBuilder();
});