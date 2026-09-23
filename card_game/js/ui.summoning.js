/* =========================================================
 * INTERFACE DAS INVOCACOES
 * ---------------------------------------------------------
 * Este arquivo cuida somente dos modais e selecoes visuais.
 * As regras ficam em core.summoning.js.
 * ========================================================= */

function closeFusionMaterialModal(cancel = true) {
    const modal = document.getElementById('fusion-material-modal');
    if (modal) modal.style.display = 'none';
    if (cancel) state.pendingExtraDeckSummon = null;
}

function renderFusionMaterialModal() {
    const pending = state.pendingExtraDeckSummon;
    const modal = document.getElementById('fusion-material-modal');
    const title = document.getElementById('fusion-material-modal-title');
    const container = document.getElementById('fusion-material-options');
    const confirm = document.getElementById('confirm-fusion-btn');

    if (!pending || !modal || !container || !title || !confirm) return;

    const candidates = getFusionMaterialCandidates(pending.playerKey, pending.card);
    const required = getFusionRequiredMaterials(pending.card);
    const selected = pending.selectedMaterials || [];

    title.textContent = `Escolha as matérias para ${pending.card.name}`;
    container.innerHTML = '';

    candidates.forEach(candidate => {
        const selectedNow = selected.some(item => item.card === candidate.card);
        const option = document.createElement('div');
        option.className = 'effect-target-option';
        option.style.cursor = 'pointer';
        option.style.border = selectedNow ? '2px solid #00b894' : '2px solid transparent';
        option.style.position = 'relative';
        option.innerHTML = `
            <div style="position:absolute;top:4px;left:4px;z-index:2;background:${selectedNow ? '#00b894' : '#2d3436'};color:white;padding:3px 6px;border-radius:5px;font-size:10px;">
                ${candidate.zone === 'hand' ? 'Mão' : 'Campo'}${selectedNow ? ' ✓' : ''}
            </div>
            ${buildCardHTML(candidate.card, pending.playerKey, 'effect-target', candidate.index)}
        `;
        option.onclick = () => toggleFusionMaterial(candidate.zone, candidate.index);
        container.appendChild(option);
    });

    confirm.disabled = selected.length !== required;
    confirm.textContent = `Invocar Fusão (${selected.length}/${required})`;
    modal.style.display = 'flex';
}

function toggleFusionMaterial(zone, index) {
    const pending = state.pendingExtraDeckSummon;
    if (!pending) return;

    const player = state.players[pending.playerKey];
    const collection = zone === 'hand' ? player?.hand : player?.field;
    const card = collection?.[index];
    if (!card || card.type !== pending.card.materialType) return;

    const existing = pending.selectedMaterials.findIndex(item => item.card === card);

    if (existing >= 0) {
        pending.selectedMaterials.splice(existing, 1);
    } else {
        const required = getFusionRequiredMaterials(pending.card);
        if (pending.selectedMaterials.length >= required) {
            showToast(`Esta Fusão requer exatamente ${required} matérias.`, 'warning');
            return;
        }
        pending.selectedMaterials.push({ card, zone });
    }

    renderFusionMaterialModal();
}

function closePolymorphMaterialModal(cancel = true) {
    const modal = document.getElementById('polymorph-material-modal');
    if (modal) modal.style.display = 'none';
    if (cancel) state.pendingPolymorphSummon = null;
}

function renderPolymorphMaterialModal() {
    const pending = state.pendingPolymorphSummon;
    const modal = document.getElementById('polymorph-material-modal');
    const title = document.getElementById('polymorph-material-modal-title');
    const container = document.getElementById('polymorph-material-options');
    const confirm = document.getElementById('confirm-polymorph-btn');

    if (!pending || !modal || !title || !container || !confirm) return;

    const candidates = getPolymorphMaterialCandidates(pending.playerKey, pending.card);
    const cost = getPolymorphCost(pending.card);

    title.textContent = `Escolha 1 matéria para ${pending.card.name}`;
    container.innerHTML = '';

    candidates.forEach(candidate => {
        const selectedNow = pending.selectedMaterial?.card === candidate.card;
        const option = document.createElement('div');
        option.className = 'effect-target-option';
        option.style.cursor = 'pointer';
        option.style.border = selectedNow ? '2px solid #00b894' : '2px solid transparent';
        option.style.position = 'relative';
        option.innerHTML = `
            <div style="position:absolute;top:4px;left:4px;z-index:2;background:${selectedNow ? '#00b894' : '#2d3436'};color:white;padding:3px 6px;border-radius:5px;font-size:10px;">
                Matéria${selectedNow ? ' ✓' : ''}
            </div>
            ${buildCardHTML(candidate.card, pending.playerKey, 'effect-target', candidate.index)}
        `;
        option.onclick = () => selectPolymorphMaterial(candidate.index);
        container.appendChild(option);
    });

    confirm.disabled = !pending.selectedMaterial;
    confirm.textContent = `Invocar por Polimorfose (Custo ${cost})`;
    modal.style.display = 'flex';
}

function selectPolymorphMaterial(fieldIndex) {
    const pending = state.pendingPolymorphSummon;
    if (!pending) return;

    const player = state.players[pending.playerKey];
    const card = player?.field?.[fieldIndex];

    if (!card || card.type !== pending.card.materialType) return;

    pending.selectedMaterial = {
        card,
        index: fieldIndex
    };

    renderPolymorphMaterialModal();
}
