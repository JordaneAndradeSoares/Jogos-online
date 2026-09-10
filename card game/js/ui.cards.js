function getForceHTML(force) {
    const forceClasses = {
        'Eletromagnetismo': 'force-electromagnetismo',
        'Gravidade': 'force-gravidade',
        'Força Forte': 'force-forte',
        'Força Fraca': 'force-fraca'
    };

    const safeForce = force || 'Eletromagnetismo';
    const forceClass = forceClasses[safeForce] || 'force-electromagnetismo';

    return `<span class="force-dot ${forceClass}" title="${safeForce}" aria-label="${safeForce}"></span>`;
}

function getCardStatsHTML(card) {
    if (card.type === 'tecnologia') return '';

    // Terrenos possuem ataque nulo.
    const atkVal = card.atk;
    const defVal = card.currentDef ?? card.def ?? 0;
    const atkBase = card.baseAtk ?? atkVal;
    const defBase = card.baseDef ?? card.def ?? defVal;
    const atkClass = atkVal > atkBase ? 'stat-up' : atkVal < atkBase ? 'stat-down' : '';
    const defClass = defVal > defBase ? 'stat-up' : defVal < defBase ? 'stat-down' : '';
    const attack = atkVal === null || atkVal === undefined ? '—' : `<span class="${atkClass}">${atkVal}</span>`;
    const defense = `<span class="${defClass}">${defVal}</span>`;
    return `<div class="card-stats-box">${attack} / ${defense}</div>`;
}

function getFullCardContent(card) {
    return `
        <div class="card-top-section">
            ${card.name}
            <div class="card-cost-circle ${((card.custoAtual ?? card.cost) < (card.custoBase ?? card.cost)) ? 'stat-up' : ((card.custoAtual ?? card.cost) > (card.custoBase ?? card.cost)) ? 'stat-down' : ''}">${card.custoAtual ?? card.cost}</div>
        </div>

        <div class="card-img-box">
            <img src="${card.art || ''}" alt="${card.name}">
        </div>

        <div class="card-bottom-section">
            ${card.desc}
            ${getForceHTML(card.force)}
            ${getCardStatsHTML(card)}
        </div>
    `;
}

function buildCardHTML(card, owner, zone, index) {
    if (zone === 'gy') {
        const gyStatusHTML = `
            <div class="gy-status" style="font-size: 11px; padding: 4px 8px;">
                ${card.isDestroyed ? 'Destruída' : 'Intacta'}
            </div>
        `;

        return `
            <div class="card"
                 style="position: absolute; top: 50%; left: 50%;
                 transform: translate(-50%, -50%);
                 pointer-events: none; margin: 0;">

                ${getFullCardContent(card)}
                ${gyStatusHTML}

            </div>
        `;
    }

    const cardId = zone === 'field'
        ? `id="${owner}-field-card-${index}"`
        : '';

    const clickEvent = zone === 'gy-view'
        ? ''
        : `onclick="handleCardClick('${owner}', '${zone}', ${index})"`;

    /*
     * CARTA VIRADA PARA BAIXO
     *
     * A carta continua oculta normalmente.
     * Quando for do jogador P1 e o mouse passar sobre ela,
     * o próprio elemento troca o visual pelo conteúdo verdadeiro.
     */
    if (card.isFaceDown && zone === 'field') {

        const isOwnCard = owner === 'p1';

        const hiddenContent = `
            <div class="card-hidden-content">
                <div class="face-down-title">CARTA OCULTA</div>

                <div class="face-down-symbol">?</div>

                <div class="face-down-stats">
                    ${card.type === 'terreno' ? '— / 1' : '0 / 1'}
                </div>

                <div class="face-down-hint">
                    ${isOwnCard
                        ? 'Passe o mouse para ver'
                        : 'Carta desconhecida'}
                </div>
            </div>
        `;

        const realContent = isOwnCard
            ? `
                <div class="card-real-content">
                    ${getFullCardContent(card)}
                </div>
            `
            : '';

        return `
            <div
                class="card face-down ${isOwnCard ? 'own-face-down' : ''}"
                ${cardId}
                ${clickEvent}
            >

                ${hiddenContent}

                ${realContent}

            </div>
        `;
    }

    const isStunned =
        zone === 'field' &&
        card.type === 'criatura' &&
        card.isStunned;

    const isResting =
        zone === 'field' &&
        card.type === 'criatura' &&
        !isStunned &&
        (card.isResting || card.casusBelli === 0);

    const cbHTML =
        zone === 'field' &&
        card.type === 'criatura' &&
        !isStunned
            ? `
                <div class="cb-marker">
                    ${
                        isResting
                            ? 'DESCANSANDO (CB: 0)'
                            : `PRONTA (CB: ${card.casusBelli})`
                    }
                </div>
            `
            : '';

    const cardStateClass = isStunned
        ? ' stunned'
        : '';

    const gyStatusHTML = zone === 'gy-view'
        ? `
            <div class="gy-status">
                ${card.isDestroyed ? 'Destruída' : 'Intacta'}
            </div>
        `
        : '';

    return `
        <div
            class="card${cardStateClass}"
            ${cardId}
            ${clickEvent}
            style="${zone === 'gy-view' ? 'cursor:default;' : ''}"
        >

            ${getFullCardContent(card)}

            ${cbHTML}

            ${gyStatusHTML}

        </div>
    `;
}