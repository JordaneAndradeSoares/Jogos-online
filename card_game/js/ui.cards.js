/*
 * Popup da descrição em camada global.
 * O popup é anexado ao <body> para não ser cortado por grids/modais
 * com overflow: auto/hidden durante as telas de seleção.
 */
(function instalarPopupGlobalDaDescricao() {
    function removerPopup() {
        const popup = document.getElementById('global-card-description-popup');
        if (popup) popup.remove();
    }

    function mostrarPopup(descricaoEl) {
        const texto = descricaoEl?.getAttribute('data-description') || '';

        // Se a descrição não existe mais no DOM, não mostra o popup.
        if (!texto.trim() || !descricaoEl.isConnected) {
            removerPopup();
            return;
        }

        // Remove qualquer popup anterior antes de criar um novo.
        removerPopup();

        const popup = document.createElement('div');
        popup.id = 'global-card-description-popup';

        popup.textContent = texto;

        popup.style.cssText = `
            position: fixed;
            width: 230px;
            max-height: 150px;
            overflow-y: auto;
            overflow-x: hidden;
            box-sizing: border-box;
            padding: 9px 10px;
            background: #07101e;
            color: #fff;
            border: 2px solid #00b894;
            border-radius: 6px;
            box-shadow: 0 5px 18px rgba(0,0,0,.7);
            font: normal 11px/1.35 Arial, sans-serif;
            white-space: normal;
            overflow-wrap: anywhere;
            z-index: 2147483647;
            pointer-events: none;
        `;

        document.body.appendChild(popup);

        const rect = descricaoEl.getBoundingClientRect();
        const margem = 8;

        // Garante que o tamanho do popup já foi calculado.
        const popupRect = popup.getBoundingClientRect();

        let left = rect.left;

        // Evita que o popup ultrapasse o lado direito da tela.
        if (left + popupRect.width > window.innerWidth - margem) {
            left = window.innerWidth - popupRect.width - margem;
        }

        // Evita que o popup ultrapasse o lado esquerdo.
        if (left < margem) {
            left = margem;
        }

        // Primeiro tenta colocar o popup acima da descrição.
        let top = rect.top - popupRect.height - margem;

        // Se não houver espaço acima, coloca abaixo.
        if (top < margem) {
            top = rect.bottom + margem;
        }

        // Evita que o popup ultrapasse a parte inferior da tela.
        if (top + popupRect.height > window.innerHeight - margem) {
            top = Math.max(
                margem,
                window.innerHeight - popupRect.height - margem
            );
        }

        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
    }

    function preparar() {
        if (document.getElementById('global-card-description-popup-style')) return;

        const style = document.createElement('style');
        style.id = 'global-card-description-popup-style';
        style.textContent = `
            .card-description:hover::before,
            .card-description:hover::after {
                content: none !important;
                display: none !important;
            }
        `;
        document.head.appendChild(style);

        document.addEventListener('mouseover', event => {
            const descricao = event.target.closest?.('.card-description');
            if (!descricao) return;
            if (descricao.contains(event.relatedTarget)) return;
            mostrarPopup(descricao);
        });

        document.addEventListener('mouseout', event => {
            const descricao = event.target.closest?.('.card-description');
            if (!descricao) return;
            if (descricao.contains(event.relatedTarget)) return;
            removerPopup();
        });

        window.addEventListener('scroll', removerPopup, true);
        window.addEventListener('resize', removerPopup);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', preparar, { once: true });
    } else {
        preparar();
    }
})();

function getForceHTML(force) {
    const forceClasses = {
        'Eletromagnetismo': 'force-electromagnetismo',
        'Gravidade': 'force-gravidade',
        'Força Forte': 'force-forte',
        'Força Fraca': 'force-fraca'
    };

    const safeForce = force || 'Eletromagnetismo';

    const forceClass =
        forceClasses[safeForce] ||
        'force-electromagnetismo';

    return `<span class="force-dot ${forceClass}" title="${safeForce}" aria-label="${safeForce}"></span>`;
}

function getCardStatsHTML(card) {
    if (card.type === 'efeito') return '';

    const atkVal = card.isFaceDown
        ? null
        : card.atk;

    const defVal = card.isFaceDown
        ? (card.currentDef ?? 1)
        : (
            card.currentDef ??
            card.def ??
            0
        );

    const atkBase =
        card.baseAtk ??
        atkVal;

    const defBase = card.isFaceDown
        ? 1
        : (card.baseDef ?? defVal);

    const atkClass =
        atkVal > atkBase
            ? 'stat-up'
            : atkVal < atkBase
                ? 'stat-down'
                : '';

    const defClass =
        defVal > defBase
            ? 'stat-up'
            : defVal < defBase
                ? 'stat-down'
                : '';

    const attack =
        atkVal === null ||
        atkVal === undefined
            ? '—'
            : `<span class="${atkClass}">${atkVal}</span>`;

    const defense =
        `<span class="${defClass}">${defVal}</span>`;

    return `
        <div class="card-stats-box">
            ${attack} / ${defense}
        </div>
    `;
}

function getFullCardContent(card) {
    const displayCost = card.isFaceDown
        ? 0
        : (
            card.custoAtual ??
            card.cost
        );

    const displayBaseCost =
        card.custoBase ??
        card.baseCost ??
        displayCost;

    const costClass =
        displayCost < displayBaseCost
            ? 'stat-up'
            : displayCost > displayBaseCost
                ? 'stat-down'
                : '';

    return `
        <div class="card-top-section">

            ${card.name}

            <div class="card-energy-values">

                <div
                    class="card-cost-circle ${costClass}"
                    title="Custo"
                >
                    ${displayCost}
                </div>

                ${
                    card.type !== 'efeito'
                        ? `
                            <div
                                class="card-generation-circle"
                                title="Geração"
                            >
                                ${card.generation ?? 0}
                            </div>
                        `
                        : ''
                }

            </div>

        </div>

        <div class="card-img-box">
            <img
                src="${card.art || ''}"
                alt="${card.name}"
            >
        </div>

        <div class="card-bottom-section">

            ${(() => {
                const descricao = typeof obterDescricaoVisivelDaCarta === 'function'
                    ? obterDescricaoVisivelDaCarta(card)
                    : (card.desc || '');

                const descricaoSegura = String(descricao)
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');

                return `
                    <div class="card-description" data-description="${descricaoSegura}">
                        <div class="card-description-text">${descricao ? 'Passe o mouse aqui' : ''}</div>
                    </div>
                `;
            })()}

            ${getForceHTML(card.force)}

            ${getCardStatsHTML(card)}

        </div>
    `;
}

function buildCardHTML(card, owner, zone, index) {
    const podeInvocarAgora =
        typeof canInvokeCardNow === 'function' &&
        (zone === 'hand' || zone === 'extra-deck-view') &&
        canInvokeCardNow(
            owner,
            card,
            zone === 'extra-deck-view' ? 'extra-deck' : zone,
            index
        );

    if (zone === 'gy') {
        const gyStatusHTML = `
            <div class="gy-status" style="font-size: 11px; padding: 4px 8px;">
                ${card.isDestroyed ? 'Destruída' : 'Intacta'}
            </div>
        `;

        return `
            <div
                class="card"
                style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    margin: 0;
                "
            >
                ${getFullCardContent(card)}
                ${gyStatusHTML}
            </div>
        `;
    }

    const cardId =
        zone === 'field'
            ? `id="${owner}-field-card-${index}"`
            : '';

    // Somente as cartas controladas pelo jogador humano (P1)
    // recebem handlers de ação. Cartas do P2 são apenas visuais,
    // exceto quando uma tela específica de seleção de alvo
    // define explicitamente seu próprio clique.
    const clickEvent =
        zone === 'gy-view' || zone === 'effect-target'
            ? ''
            : owner !== 'p1'
                ? ''
                : zone === 'extra-deck-view'
                    ? `onclick="handleExtraDeckCardClick('${owner}', ${index})"`
                    : `onclick="handleCardClick('${owner}', '${zone}', ${index})"`;

    if (
        card.isFaceDown &&
        (zone === 'field' || zone === 'effect-target')
    ) {
        const isOwnCard = owner === 'p1';

        const trueGeneration =
            card._faceDownOriginalGeneration ??
            card.generation ??
            0;

        const trueCost =
            card._faceDownOriginalCost ??
            card.baseCost ??
            card.custoBase ??
            card.cost ??
            0;

        const originalAtk =
            Number(
                card._faceDownOriginalAtk ??
                card.baseAtk ??
                card.atk ??
                0
            ) || 0;

        const atkBonus =
            Number(card._faceDownAtkBonus) || 0;

        const trueAtk =
            originalAtk + atkBonus;

        const originalDef =
            Number(
                card._faceDownOriginalDef ??
                card.baseDef ??
                card.def ??
                1
            ) || 1;

        const defBonus =
            Number(card._faceDownDefBonus) || 0;

        const damageTaken =
            Number(card._faceDownDamage) || 0;

        const trueDef =
            originalDef +
            defBonus -
            damageTaken;

        let atkMod =
            atkBonus > 0
                ? ` (+${atkBonus})`
                : atkBonus < 0
                    ? ` (${atkBonus})`
                    : '';

        let defMod =
            defBonus > 0
                ? ` (+${defBonus})`
                : defBonus < 0
                    ? ` (${defBonus})`
                    : '';

        let dmgMod =
            damageTaken > 0
                ? ` (-${damageTaken} Dano)`
                : '';

        const tooltip =
            `Geração: ${trueGeneration} | ` +
            `Custo: ${trueCost} | ` +
            `Ataque: ${originalAtk}${atkMod} = ${trueAtk} | ` +
            `Defesa: ${originalDef}${defMod}${dmgMod} = ${trueDef}`;

        const hiddenContent = `
            <div class="card-hidden-content">
                <div class="face-down-title">CARTA OCULTA</div>
                <div class="face-down-symbol">?</div>
                <div class="face-down-cost">Custo 0</div>
                <div class="face-down-stats">
                    ${getCardStatsHTML(card)}
                </div>
                <div class="face-down-hint">
                    ${isOwnCard
                        ? 'Passe o mouse para ver'
                        : 'Carta desconhecida'}
                </div>
            </div>
        `;

        // Criamos uma cópia "revelada" da carta para renderizar o hover.
        // Com isFaceDown = false, o getCardStatsHTML vai exibir os status reais
        // e aplicar corretamente as classes stat-up e stat-down.
        const revealedCard = {
            ...card,
            isFaceDown: false,
            atk: trueAtk,
            baseAtk: originalAtk,
            currentDef: trueDef,
            baseDef: originalDef,
            custoAtual: trueCost,
            custoBase:
                card._faceDownOriginalCost ??
                card.custoBase ??
                card.baseCost ??
                card.cost ??
                0,
            generation: trueGeneration
        };

        const realContent = isOwnCard
            ? `
                <div class="card-real-content">
                    ${getFullCardContent(revealedCard)}
                </div>
            `
            : '';

        return `
            <div
                class="card face-down ${isOwnCard ? 'own-face-down' : ''}"
                ${cardId}
                ${clickEvent}
                title="${tooltip}"
                aria-label="Carta oculta — ${tooltip}"
            >

                ${hiddenContent}
                ${realContent}

            </div>
        `;
    }

    const isStunned =
        (zone === 'field' || zone === 'extra-deck-view') &&
        card.type === 'criatura' &&
        !card.isFaceDown &&
        card.isStunned;

    const stunnedHTML = (() => {
        if (!isStunned) return '';

        let stunnedClass = 'stunned-effect';

        if (card.stunReason === 'summon') {
            stunnedClass = 'stunned-summon';

        } else if (
            card.stunReason === 'attack' &&
            card.lastAttackTurn === state.turn
        ) {
            stunnedClass = 'stunned-after-attack';

        } else if (
            card.stunReason === 'attack' &&
            card.stunPhase === 'yellow'
        ) {
            stunnedClass = 'stunned-last-turn';
        }

        return `
            <div class="stunned-label ${stunnedClass}">
                ATORDOADO
            </div>
        `;
    })();

    const cardStateClass =
        isStunned
            ? ' stunned'
            : '';

    const gyStatusHTML =
        zone === 'gy-view'
            ? `
                <div class="gy-status">
                    ${card.isDestroyed ? 'Destruída' : 'Intacta'}
                </div>
            `
            : '';

    return `
        <div
            class="card${cardStateClass}${podeInvocarAgora ? ' summon-available' : ''}"
            ${cardId}
            ${clickEvent}
            style="${zone === 'gy-view' ? 'cursor:default;' : ''}"
        >

            ${getFullCardContent(card)}

            ${stunnedHTML}

            ${gyStatusHTML}

        </div>
    `;
}