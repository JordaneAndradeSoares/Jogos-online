let cardToDiscardIndex = null;
let selectedCardToAttackIndex = null;

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    if (type === 'error') toast.style.borderLeftColor = '#d63031';
    if (type === 'success') toast.style.borderLeftColor = '#00b894';
    if (type === 'warning') toast.style.borderLeftColor = '#e67e22';

    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function openGraveyardModal(playerKey) {
    const modal = document.getElementById('gy-modal');
    const container = document.getElementById('gy-modal-cards');
    const title = document.getElementById('gy-modal-title');

    const label = playerKey === 'p1' ? 'Seu Cemitério' : 'Cemitério do Inimigo';
    const gy = state.players[playerKey].gy;
    
    title.innerText = `${label} (${gy.length})`;
    container.innerHTML = '';

    if (gy.length === 0) {
        container.innerHTML = '<span style="color:white; margin: 20px;">Vazio</span>';
    } else {
        [...gy].reverse().forEach((card, index) => {
            container.innerHTML += buildCardHTML(card, playerKey, 'gy-view', index);
        });
    }
    modal.style.display = 'flex';
}

function closeGraveyardModal() {
    document.getElementById('gy-modal').style.display = 'none';
}

function openDiscardModal(index) {
    cardToDiscardIndex = index;
    const card = state.players.p1.hand[index];
    const modalTitle = document.getElementById('discard-modal-title');
    if (modalTitle) {
        modalTitle.innerText = `Deseja realmente descartar "${card.name}"?`;
    }
    const modal = document.getElementById('discard-modal');
    if (modal) modal.style.display = 'flex';
}

function closeDiscardModal() {
    const modal = document.getElementById('discard-modal');
    if (modal) modal.style.display = 'none';
    cardToDiscardIndex = null;
}

function confirmDiscard() {
    if (cardToDiscardIndex !== null) {
        let player = state.players.p1;
        let discardedCard = player.hand.splice(cardToDiscardIndex, 1)[0];
        sendCardToGraveyard(discardedCard, 'p1', false);
        showToast(`Você descartou ${discardedCard.name} para o cemitério.`, "info");

        if (player.hand.length <= 8) {
            state.pendingDiscard.p1 = false;
            showToast("Descarte concluído com sucesso!", "success");
        }
    }
    closeDiscardModal();
    if (typeof renderUI === 'function') renderUI();
}

function passBlock() {
    if (!state.activeAttack || state.activeAttack.attackerOwner !== 'p2') return;

    let attackerCard = state.activeAttack.attackerCard;
    damagePlayer('p1', attackerCard.atk);
    showToast(`Você deixou o ataque passar! Recebeu ${attackerCard.atk} de dano direto.`, "error");

    state.activeAttack = null;
    registerActionDone('p1');
}

function openAttackModal(index) {
    selectedCardToAttackIndex = index;
    
    const attackerEl = document.getElementById(`p1-field-card-${index}`);
    if (attackerEl) attackerEl.classList.add('card-attacking');

    if (typeof renderUI === 'function') renderUI();
    
    const card = state.players.p1.field[index];
    const modalTitle = document.getElementById('attack-modal-title');
    if (modalTitle) {
        modalTitle.innerText = `Deseja atacar com "${card.name}" (ATK: ${card.atk})?`;
    }
    const modal = document.getElementById('attack-modal');
    if (modal) modal.style.display = 'flex';
}

function closeAttackModal() {
    if (selectedCardToAttackIndex !== null) {
        const attackerEl = document.getElementById(`p1-field-card-${selectedCardToAttackIndex}`);
        if (attackerEl) attackerEl.classList.remove('card-attacking');
    }

    const modal = document.getElementById('attack-modal');
    if (modal) modal.style.display = 'none';
    selectedCardToAttackIndex = null;
    if (typeof renderUI === 'function') renderUI();
}

