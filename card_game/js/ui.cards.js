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
            <div class="card" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; margin: 0;">
                ${getFullCardContent(card)}
                ${gyStatusHTML}
            </div>
        `;
    }

    const cardId = zone === 'field' ? `id="${owner}-field-card-${index}"` : '';
    const clickEvent = zone === 'gy-view' || zone === 'effect-target'
        ? ''
        : `onclick="handleCardClick('${owner}', '${zone}', ${index})"`;

    if (card.isFaceDown && (zone === 'field' || zone === 'effect-target')) {
        const isOwnCard = owner === 'p1';

        const trueGeneration = card._faceDownOriginalGeneration ?? card.generation ?? 0;
        const trueCost = card._faceDownOriginalCost ?? card.baseCost ?? card.custoBase ?? card.cost ?? 0;
        
        const originalAtk = Number(card._faceDownOriginalAtk ?? card.baseAtk ?? card.atk ?? 0) || 0;
        const atkBonus = Number(card._faceDownAtkBonus) || 0;
        const trueAtk = originalAtk + atkBonus;
        
        const originalDef = Number(card._faceDownOriginalDef ?? card.baseDef ?? card.def ?? 1) || 1;
        const defBonus = Number(card._faceDownDefBonus) || 0;
        const damageTaken = Number(card._faceDownDamage) || 0;
        const trueDef = originalDef + defBonus - damageTaken;

        // Tooltip melhorado: exibe a matemática de bônus e dano caso o usuário passe o mouse devagar
        let atkMod = atkBonus > 0 ? ` (+${atkBonus})` : atkBonus < 0 ? ` (${atkBonus})` : '';
        let defMod = defBonus > 0 ? ` (+${defBonus})` : defBonus < 0 ? ` (${defBonus})` : '';
        let dmgMod = damageTaken > 0 ? ` (-${damageTaken} Dano)` : '';

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
                    ${isOwnCard ? 'Passe o mouse para ver' : 'Carta desconhecida'}
                </div>
            </div>
        `;

        // CRIAMOS UMA CÓPIA "REVELADA" DA CARTA PARA RENDERIZAR O HOVER
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
            custoBase: card._faceDownOriginalCost ?? card.custoBase ?? card.baseCost ?? card.cost ?? 0,
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
            <div class="card face-down ${isOwnCard ? 'own-face-down' : ''}"
                ${cardId}
                ${clickEvent}
                title="${tooltip}"
                aria-label="Carta oculta — ${tooltip}">
                
                ${hiddenContent}
                ${realContent}
                
            </div>
        `;
    }

    const isStunned = zone === 'field' && card.type === 'criatura' && !card.isFaceDown && card.isStunned;
    const isResting = zone === 'field' && card.type === 'criatura' && !isStunned && (card.isResting || card.casusBelli === 0);

    const stunnedHTML = (() => {
        if (!isStunned) return '';
        let stunnedClass = 'stunned-effect';

        if (card.stunReason === 'summon') {
            stunnedClass = 'stunned-summon';
        } else if (card.stunReason === 'attack' && card.lastAttackTurn === state.turn) {
            stunnedClass = 'stunned-after-attack';
        } else if (card.stunReason === 'attack' && card.stunPhase === 'yellow') {
            stunnedClass = 'stunned-last-turn';
        }

        return `<div class="stunned-label ${stunnedClass}">ATORDOADO</div>`;
    })();

    const cardStateClass = isStunned ? ' stunned' : '';
    const gyStatusHTML = zone === 'gy-view'
        ? `<div class="gy-status">${card.isDestroyed ? 'Destruída' : 'Intacta'}</div>`
        : '';

    return `
        <div class="card${cardStateClass}"
            ${cardId}
            ${clickEvent}
            style="${zone === 'gy-view' ? 'cursor:default;' : ''}">
            
            ${getFullCardContent(card)}
            ${stunnedHTML}
            ${gyStatusHTML}
            
        </div>
    `;
}