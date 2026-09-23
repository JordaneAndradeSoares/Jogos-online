const MAX_FIELD_SIZE = 5;

function isFusionCard(card) {
    return !!card && card.summonType === 'fusao';
}

function isPolymorphCard(card) {
    return !!card && card.summonType === 'polimorfose';
}

function isSpecialtyCard(card) {
    return !!card && card.summonType === 'especialidade';
}

function isSummonFromExtraDeck(card) {
    return isFusionCard(card) || isSpecialtyCard(card);
}

function getPolymorphCost(card) {
    return Math.max(0, obterCustoOriginalDaCarta(card) - 1);
}

function getFusionRequiredMaterials(card) {
    return Math.max(2, Number(card?.minMaterials) || 0);
}

function getFusionMaterialCandidates(playerKey, fusionCard) {
    const player = state.players[playerKey];
    if (!player || !isFusionCard(fusionCard)) return [];

    const requiredType = fusionCard.materialType;
    const candidates = [];

    (player.hand || []).forEach((card, index) => {
        if (card && card.type === requiredType) {
            candidates.push({ zone: 'hand', index, card });
        }
    });

    (player.field || []).forEach((card, index) => {
        if (card && card.type === requiredType) {
            candidates.push({ zone: 'field', index, card });
        }
    });

    return candidates;
}

function getPolymorphMaterialCandidates(playerKey, polymorphCard) {
    const player = state.players[playerKey];
    if (!player || !isPolymorphCard(polymorphCard)) return [];

    return (player.field || [])
        .map((card, index) => ({ card, index, zone: 'field' }))
        .filter(({ card }) => card && card.type === polymorphCard.materialType);
}

function canUseSpecialty(playerKey, card) {
    const player = state.players[playerKey];
    if (!player || !isSpecialtyCard(card)) return false;

    if (card.specialCondition === 'no_cards_controlled') {
        return player.field.length === 0;
    }

    if (card.specialCondition === 'controls_other_card') {
        return player.field.length > 0;
    }

    return false;
}

function resetSummonCardState(card) {
    if (!card) return;

    card.isFaceDown = false;
    card.isStunned = false;
    card.stunReason = null;
    card.stunPhase = null;
    card.isResting = false;
    card.attackedThisTurn = false;
    card.attackedLastTurn = false;
    card.lastAttackTurn = null;
    card.casusBelli = 0;
    card.isDestroyed = false;
    card._activeStatApplied = false;
    card._activeTickedTurn = null;
    card.currentDef = card.baseDef ?? card.def ?? 0;
    card.atk = card.baseAtk ?? card.atk;
    card.def = card.baseDef ?? card.def;
}

function finalizeSummonedCard(playerKey, card, cost, message) {
    const player = state.players[playerKey];
    if (!player || !card) return false;

    resetSummonCardState(card);
    card.summonedTurn = state.turn;

    if (card.type === 'criatura') {
        card.isStunned = true;
        card.stunReason = 'summon';
        card.stunPhase = 'red';
    }

    player.energy -= cost;
    player.field.push(card);

    gainEnergyFromCard(player, card);

    triggerEffect('campo', card, { owner: playerKey, card });

    const resultadoAtivo = card.gatilho === 'ativo'
        ? triggerEffect('ativo', card, {
            owner: playerKey,
            card,
            aoConcluir: () => registerActionDone(playerKey)
        })
        : true;

    showToast(message, 'success');

    if (resultadoAtivo !== 'pending') {
        registerActionDone(playerKey);
    }

    if (typeof renderUI === 'function') renderUI();
    return true;
}



// Retorna se a carta pode ser invocada/jogada neste momento pelo jogador.
// Usado apenas para destaque visual; as funções de invocação continuam
// fazendo suas próprias validações completas antes de alterar o estado.
function canInvokeCardNow(playerKey, card, zone, index) {
    const player = state.players[playerKey];
    if (!player || !card || playerKey !== 'p1') return false;
    if (state.initiativeOwner !== playerKey || state.activeAttack) return false;

    if (zone === 'hand') {
        if (!player.hand.includes(card)) return false;

        if (isPolymorphCard(card)) {
            return getPolymorphMaterialCandidates(playerKey, card).length > 0 &&
                player.energy >= getPolymorphCost(card);
        }

        const cost = obterCustoOriginalDaCarta(card);
        if (player.energy < cost) return false;
        if (card.type !== 'efeito' && player.field.length >= MAX_FIELD_SIZE) return false;
        return true;
    }

    if (zone === 'extra-deck') {
        if (!player.extraDeck.includes(card)) return false;
        if (!isSummonFromExtraDeck(card)) return false;
        const cost = obterCustoOriginalDaCarta(card);
        if (player.energy < cost) return false;

        if (isSpecialtyCard(card)) {
            if (player.field.length >= MAX_FIELD_SIZE) return false;
            return canUseSpecialty(playerKey, card);
        }

        if (isFusionCard(card)) {
            const candidates = getFusionMaterialCandidates(playerKey, card);
            const required = getFusionRequiredMaterials(card);

            if (candidates.length < required) return false;

            // Uma Fusão ocupa uma única vaga, mas suas matérias que já
            // estão no campo deixam vagas livres ao serem substituídas.
            // Portanto, um campo cheio não impede a Fusão se for possível
            // escolher matérias suficientes do campo para abrir espaço.
            const fieldMaterialCount = candidates.filter(
                candidate => candidate.zone === 'field'
            ).length;
            const vagasNecessarias = Math.max(0, player.field.length + 1 - MAX_FIELD_SIZE);

            return fieldMaterialCount >= vagasNecessarias;
        }
    }

    return false;
}

function prepareExtraDeckSummon(playerKey, extraIndex) {
    const player = state.players[playerKey];
    const card = player?.extraDeck?.[extraIndex];

    if (!player || !isSummonFromExtraDeck(card)) return false;

    if (state.initiativeOwner !== playerKey || state.activeAttack) {
        if (playerKey === 'p1') showToast('Você precisa ter a iniciativa para invocar esta carta.', 'warning');
        return false;
    }

    const cost = obterCustoOriginalDaCarta(card);
    if (player.energy < cost) {
        if (playerKey === 'p1') showToast(`Energia insuficiente. ${card.name} custa ${cost} de energia.`, 'warning');
        return false;
    }

    if (isSpecialtyCard(card)) {
        if (player.field.length >= MAX_FIELD_SIZE) {
            if (playerKey === 'p1') showToast('Campo cheio (Máx 5)!', 'error');
            return false;
        }
        return summonSpecialtyFromExtraDeck(playerKey, extraIndex);
    }

    const candidates = getFusionMaterialCandidates(playerKey, card);
    const required = getFusionRequiredMaterials(card);

    if (candidates.length < required) {
        if (playerKey === 'p1') {
            showToast(`${card.name} precisa de exatamente ${required} ${card.materialType}(s) como matéria.`, 'warning');
        }
        return false;
    }

    const fieldMaterialCount = candidates.filter(
        candidate => candidate.zone === 'field'
    ).length;
    const vagasNecessarias = Math.max(0, player.field.length + 1 - MAX_FIELD_SIZE);

    if (fieldMaterialCount < vagasNecessarias) {
        if (playerKey === 'p1') {
            if (vagasNecessarias > 0) {
                showToast(
                    `Campo cheio (Máx ${MAX_FIELD_SIZE})! Para invocar ${card.name} por Fusão, selecione pelo menos ${vagasNecessarias} matéria(s) do seu campo.`,
                    'warning'
                );
            } else {
                showToast(
                    `Não há matérias suficientes no campo para abrir espaço para ${card.name}.`,
                    'warning'
                );
            }
        }
        return false;
    }

    state.pendingExtraDeckSummon = {
        playerKey,
        extraIndex,
        card,
        selectedMaterials: []
    };

    if (typeof renderFusionMaterialModal === 'function') {
        renderFusionMaterialModal();
    }

    return true;
}

function confirmFusionSummon() {
    const pending = state.pendingExtraDeckSummon;
    if (!pending) return false;

    const player = state.players[pending.playerKey];
    const fusionCard = player?.extraDeck?.find(card => card === pending.card);

    if (!player || !isFusionCard(fusionCard)) {
        closeFusionMaterialModal?.();
        return false;
    }

    const required = getFusionRequiredMaterials(fusionCard);
    const selected = pending.selectedMaterials || [];

    if (selected.length !== required) {
        showToast(`Selecione exatamente ${required} matérias.`, 'warning');
        return false;
    }

    const materials = [];
    const seen = new Set();

    for (const item of selected) {
        const collection = item.zone === 'hand' ? player.hand : player.field;
        const currentIndex = collection.indexOf(item.card);

        if (
            currentIndex < 0 ||
            item.card.type !== fusionCard.materialType ||
            seen.has(item.card)
        ) {
            showToast('Uma das matérias selecionadas não está mais disponível.', 'warning');
            renderFusionMaterialModal?.();
            return false;
        }

        seen.add(item.card);
        materials.push(item.card);
    }

    const cost = obterCustoOriginalDaCarta(fusionCard);
    if (player.energy < cost) {
        showToast(`Energia insuficiente. ${fusionCard.name} custa ${cost}.`, 'warning');
        return false;
    }

    const fieldMaterials = materials.filter(card => player.field.includes(card)).length;
    if (player.field.length - fieldMaterials + 1 > MAX_FIELD_SIZE) {
        showToast('Não há espaço suficiente no campo para a Fusão.', 'warning');
        return false;
    }

    // Retira as materias exatamente das zonas em que estavam.
    materials.forEach(material => {
        const handIndex = player.hand.indexOf(material);
        if (handIndex >= 0) {
            player.hand.splice(handIndex, 1);
            return;
        }

        const fieldIndex = player.field.indexOf(material);
        if (fieldIndex >= 0) player.field.splice(fieldIndex, 1);
    });

    const extraIndex = player.extraDeck.indexOf(fusionCard);
    if (extraIndex < 0) {
        materials.forEach(material => player.hand.push(material));
        showToast('A carta de Fusão não está mais no Extra Deck.', 'warning');
        closeFusionMaterialModal?.();
        return false;
    }

    player.extraDeck.splice(extraIndex, 1);
    fusionCard.materials = materials;
    state.pendingExtraDeckSummon = null;

    resetSummonCardState(fusionCard);
    fusionCard.summonedTurn = state.turn;
    if (fusionCard.type === 'criatura') {
        fusionCard.isStunned = true;
        fusionCard.stunReason = 'summon';
        fusionCard.stunPhase = 'red';
    }

    player.energy -= cost;
    player.field.push(fusionCard);
    gainEnergyFromCard(player, fusionCard);

    triggerEffect('campo', fusionCard, { owner: pending.playerKey, card: fusionCard });

    const resultadoAtivo = fusionCard.gatilho === 'ativo'
        ? triggerEffect('ativo', fusionCard, {
            owner: pending.playerKey,
            card: fusionCard,
            aoConcluir: () => registerActionDone(pending.playerKey)
        })
        : true;

    closeFusionMaterialModal?.(false);

    showToast(`${fusionCard.name} foi invocada por Fusão usando ${materials.length} matéria(s)!`, 'success');
    if (resultadoAtivo !== 'pending') registerActionDone(pending.playerKey);
    if (typeof renderUI === 'function') renderUI();
    return true;
}

function preparePolymorphSummon(playerKey, handIndex) {
    const player = state.players[playerKey];
    const card = player?.hand?.[handIndex];

    if (!player || !isPolymorphCard(card)) return false;

    if (state.initiativeOwner !== playerKey || state.activeAttack) {
        if (playerKey === 'p1') showToast('Você precisa ter a iniciativa para invocar por Polimorfose.', 'warning');
        return false;
    }

    const candidates = getPolymorphMaterialCandidates(playerKey, card);
    if (!candidates.length) {
        if (playerKey === 'p1') {
            showToast(`${card.name} precisa de uma ${card.materialType} no seu campo como matéria.`, 'warning');
        }
        return false;
    }

    const cost = getPolymorphCost(card);
    if (player.energy < cost) {
        if (playerKey === 'p1') {
            showToast(`Energia insuficiente. ${card.name} custa ${cost} por Polimorfose.`, 'warning');
        }
        return false;
    }

    state.pendingPolymorphSummon = {
        playerKey,
        handIndex,
        card,
        selectedMaterial: null
    };

    if (typeof renderPolymorphMaterialModal === 'function') {
        renderPolymorphMaterialModal();
    }

    return true;
}

function confirmPolymorphSummon() {
    const pending = state.pendingPolymorphSummon;
    if (!pending) return false;

    const player = state.players[pending.playerKey];
    const polymorphCard = player?.hand?.find(card => card === pending.card);
    const material = pending.selectedMaterial?.card;

    if (!player || !isPolymorphCard(polymorphCard) || !material) {
        closePolymorphMaterialModal?.();
        return false;
    }

    const materialIndex = player.field.indexOf(material);
    const handIndex = player.hand.indexOf(polymorphCard);

    if (
        materialIndex < 0 ||
        handIndex < 0 ||
        material.type !== polymorphCard.materialType
    ) {
        showToast('A matéria selecionada não está mais disponível.', 'warning');
        renderPolymorphMaterialModal?.();
        return false;
    }

    const cost = getPolymorphCost(polymorphCard);
    if (player.energy < cost) {
        showToast(`Energia insuficiente. ${polymorphCard.name} custa ${cost} por Polimorfose.`, 'warning');
        return false;
    }

    // A Polimorfose substitui a matéria no campo: portanto não exige
    // uma vaga adicional no campo, mesmo quando o campo está cheio.
    player.field.splice(materialIndex, 1);
    player.hand.splice(handIndex, 1);

    polymorphCard.materials = [material];
    state.pendingPolymorphSummon = null;

    resetSummonCardState(polymorphCard);
    polymorphCard.summonedTurn = state.turn;
    if (polymorphCard.type === 'criatura') {
        polymorphCard.isStunned = true;
        polymorphCard.stunReason = 'summon';
        polymorphCard.stunPhase = 'red';
    }

    player.energy -= cost;
    player.field.push(polymorphCard);
    gainEnergyFromCard(player, polymorphCard);

    triggerEffect('campo', polymorphCard, { owner: pending.playerKey, card: polymorphCard });

    const resultadoAtivo = polymorphCard.gatilho === 'ativo'
        ? triggerEffect('ativo', polymorphCard, {
            owner: pending.playerKey,
            card: polymorphCard,
            aoConcluir: () => registerActionDone(pending.playerKey)
        })
        : true;

    closePolymorphMaterialModal?.(false);

    showToast(`${polymorphCard.name} foi invocada por Polimorfose usando ${material.name} como matéria!`, 'success');
    if (resultadoAtivo !== 'pending') registerActionDone(pending.playerKey);
    if (typeof renderUI === 'function') renderUI();
    return true;
}

function summonSpecialtyFromExtraDeck(playerKey, extraIndex) {
    const player = state.players[playerKey];
    const card = player?.extraDeck?.[extraIndex];

    if (!player || !isSpecialtyCard(card)) return false;
    if (state.initiativeOwner !== playerKey || state.activeAttack) return false;
    if (player.field.length >= MAX_FIELD_SIZE) return false;
    if (!canUseSpecialty(playerKey, card)) return false;

    const cost = obterCustoOriginalDaCarta(card);
    if (player.energy < cost) return false;

    player.extraDeck.splice(extraIndex, 1);
    return finalizeSummonedCard(
        playerKey,
        card,
        cost,
        `${card.name} foi invocada por Especialidade!`
    );
}

function returnExtraDeckCardToExtraDeck(card, playerKey) {
    const player = state.players[playerKey];
    if (!player || !card || !isSummonFromExtraDeck(card)) return false;

    if (Array.isArray(card.materials) && card.materials.length) {
        const materials = [...card.materials];
        card.materials = [];
        materials.forEach(material => sendCardToGraveyard(material, playerKey, false, { forceGraveyard: true }));
    }

    resetSummonCardState(card);
    player.extraDeck.push(card);
    return true;
}