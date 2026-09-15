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

function atualizarBotoesDeAcaoDaCarta(carta) {
    const botaoAtivar = document.getElementById('activate-effect-btn');
    const botaoAtacar = document.getElementById('confirm-attack-btn');

    if (!carta) return;

    const podeAtivar =
        typeof efeitoCustoPodeSerAtivado === 'function' &&
        efeitoCustoPodeSerAtivado(carta, 'p1');

    const custo =
        typeof obterCustoDeAtivacao === 'function'
            ? obterCustoDeAtivacao(carta)
            : 0;

    if (botaoAtivar) {
        const temGatilhoCusto =
            typeof obterGatilhoDaCarta === 'function' &&
            obterGatilhoDaCarta(carta) === 'custo';

        botaoAtivar.disabled = !podeAtivar;
        botaoAtivar.textContent = temGatilhoCusto
            ? `Ativar efeito (Custo ${custo})`
            : 'Ativar efeito';
        botaoAtivar.title = !temGatilhoCusto
            ? 'Esta carta não possui um efeito Custo X ativável.'
            : !podeAtivar
                ? (
                    carta._activeCostUsedTurn === state.turn
                        ? 'Efeito já ativado neste turno.'
                        : 'Efeito indisponível: confira posição, iniciativa, energia e alvo.'
                )
                : `Ativar pagando ${custo} de energia.`;
    }

    if (botaoAtacar) {
        const podeAtacar =
            typeof cartaPodeAtacar === 'function' &&
            cartaPodeAtacar(carta);

        botaoAtacar.disabled = !podeAtacar;
        botaoAtacar.title = podeAtacar
            ? 'Atacar com esta criatura.'
            : 'Esta carta não pode atacar agora.';
    }
}

function abrirMenuDeAcaoDaCarta(index) {
    if (state.initiativeOwner !== 'p1' || state.activeAttack) {
        showToast('Aguarde sua iniciativa para realizar esta ação.', 'warning');
        return;
    }

    const carta = state.players.p1.field[index];
    if (!carta || carta.isFaceDown) return;

    selectedCardToAttackIndex = index;

    const attackerEl = document.getElementById(`p1-field-card-${index}`);
    if (attackerEl) attackerEl.classList.add('card-attacking');

    const modalTitle = document.getElementById('attack-modal-title');
    if (modalTitle) {
        modalTitle.innerText = `Escolha uma ação para "${carta.name}"`;
    }

    atualizarBotoesDeAcaoDaCarta(carta);

    const modal = document.getElementById('attack-modal');
    if (modal) modal.style.display = 'flex';
}

function openAttackModal(index) {
    abrirMenuDeAcaoDaCarta(index);
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

// efeitos ativaveis (no campo)
function ativarEfeitoCustoDaCarta() {
    const index = selectedCardToAttackIndex;

    if (index === null) return;

    const jogador = state.players.p1;
    const carta = jogador?.field?.[index];

    if (
        !carta ||
        typeof efeitoCustoPodeSerAtivado !== 'function' ||
        !efeitoCustoPodeSerAtivado(carta, 'p1')
    ) {
        showToast(
            'O efeito desta carta não pode ser ativado agora.',
            'warning'
        );

        atualizarBotoesDeAcaoDaCarta(carta);
        return;
    }

    const custo = obterCustoDeAtivacao(carta);

    /*
     * Fecha o menu de ação.
     *
     * A iniciativa continua com o jogador até o efeito
     * realmente resolver.
     */
    const modal = document.getElementById('attack-modal');

    if (modal) {
        modal.style.display = 'none';
    }

    /*
     * Efeitos que precisam de alvo.
     *
     * A ação fica pendente até o jogador escolher o alvo.
     */
    if (
        typeof efeitoPrecisaDeAlvo === 'function' &&
        efeitoPrecisaDeAlvo(carta)
    ) {
        state.pendingCostActivation = {
            carta,
            owner: 'p1',
            index
        };

        const elemento =
            document.getElementById(
                `p1-field-card-${index}`
            );

        if (elemento) {
            elemento.classList.remove('card-attacking');
        }

        selectedCardToAttackIndex = null;

        const contexto = {
            owner: 'p1',
            card: carta,

            /*
             * Só chama a conclusão quando o alvo
             * tiver sido escolhido e o efeito resolvido.
             */
            aoConcluir: sucesso =>
                concluirAtivacaoDeEfeitoCusto(
                    carta,
                    custo,
                    sucesso
                )
        };

        const resultado =
            triggerEffect(
                'custo',
                carta,
                contexto
            );

        /*
         * O efeito abriu a seleção de alvo.
         * A ação ainda não terminou.
         */
        if (resultado === 'pending') {
            return;
        }

        /*
         * Efeito resolveu imediatamente.
         */
        if (resultado !== false) {
            concluirAtivacaoDeEfeitoCusto(
                carta,
                custo,
                true
            );
        } else {
            state.pendingCostActivation = null;

            showToast(
                `${carta.name}: o efeito não pôde ser ativado.`,
                'warning'
            );

            if (typeof renderUI === 'function') {
                renderUI();
            }
        }

        return;
    }

    /*
     * Efeito que não precisa de alvo.
     */
    const resultado =
        triggerEffect(
            'custo',
            carta,
            {
                owner: 'p1',
                card: carta
            }
        );

    if (resultado === false) {
        showToast(
            `${carta.name}: o efeito não pôde ser ativado.`,
            'warning'
        );

        if (typeof renderUI === 'function') {
            renderUI();
        }

        return;
    }

    /*
     * O efeito resolveu.
     *
     * Aqui a ação termina e a iniciativa passa
     * imediatamente para o oponente.
     */
    concluirAtivacaoDeEfeitoCusto(
        carta,
        custo,
        true
    );
}

function concluirAtivacaoDeEfeitoCusto(
    carta,
    custo,
    sucesso
) {
    /*
     * Efeito cancelado ou que não resolveu.
     *
     * Não passa a vez.
     */
    if (!carta || !sucesso) {
        state.pendingCostActivation = null;

        if (typeof renderUI === 'function') {
            renderUI();
        }

        return;
    }

    const jogador = state.players.p1;

    /*
     * Segurança:
     *
     * A carta precisa continuar no campo;
     * o efeito não pode ter sido usado neste turno;
     * e o jogador precisa conseguir pagar.
     */
    if (
        !jogador ||
        !jogador.field.includes(carta) ||
        carta._activeCostUsedTurn === state.turn ||
        jogador.energy < custo
    ) {
        state.pendingCostActivation = null;

        showToast(
            'Não foi possível concluir a ativação do efeito.',
            'warning'
        );

        if (typeof renderUI === 'function') {
            renderUI();
        }

        return;
    }

    /*
     * Paga o custo somente agora, depois que o efeito
     * realmente foi validado e resolvido.
     */
    jogador.energy -= custo;

    /*
     * Marca como utilizado neste turno.
     */
    carta._activeCostUsedTurn = state.turn;

    state.pendingCostActivation = null;

    showToast(
        `${carta.name}: efeito ativado por ${custo} de energia.`,
        'success'
    );

    /*
     * Remove qualquer seleção visual.
     */
    if (selectedCardToAttackIndex !== null) {
        const elemento =
            document.getElementById(
                `p1-field-card-${selectedCardToAttackIndex}`
            );

        if (elemento) {
            elemento.classList.remove(
                'card-attacking'
            );
        }
    }

    selectedCardToAttackIndex = null;

    const modal =
        document.getElementById(
            'attack-modal'
        );

    if (modal) {
        modal.style.display = 'none';
    }

    /*
     * A ATIVAÇÃO DO EFEITO CONSUME A AÇÃO.
     *
     * registerActionDone() troca a iniciativa:
     *
     * p1 -> p2
     *
     * Portanto o jogador não poderá:
     * - atacar depois de ativar;
     * - ativar outro efeito;
     * - realizar outra ação.
     */

    registerActionDone('p1');
}

let efeitoPendente = null;

function abrirSelecaoDeAlvoDoEfeito(carta, gatilho, owner, contexto) {
    const alvos = obterAlvosValidosDoEfeito(carta, owner);
    if (!alvos.length) return false;

    efeitoPendente = {
        carta,
        gatilho,
        owner,
        contexto: { ...contexto }
    };

    const titulo = document.getElementById('effect-target-modal-title');
    const container = document.getElementById('effect-target-modal-cards');
    const modal = document.getElementById('effect-target-modal');

    if (!titulo || !container || !modal) return false;

    titulo.innerText = `Escolha o alvo para: ${carta.name}`;

    const indicadorEnergia = document.getElementById('effect-target-energy');
    const jogador = state.players[owner];
    if (indicadorEnergia && jogador) {
        const custo = typeof obterCustoOriginalDaCarta === 'function'
            ? obterCustoOriginalDaCarta(carta)
            : Number(carta.cost) || 0;
        indicadorEnergia.innerText = `Energia disponível: ${jogador.energy}/${jogador.maxEnergy} • Custo: ${custo}`;
    }

    container.innerHTML = '';

    alvos.forEach(alvo => {
        const elemento = document.createElement('div');
        elemento.className = 'effect-target-option';
        elemento.innerHTML = buildCardHTML(alvo.carta, alvo.owner, 'effect-target', alvo.index);
        elemento.onclick = () => selecionarAlvoDoEfeito(alvo.owner, alvo.index);
        container.appendChild(elemento);
    });

    modal.style.display = 'flex';
    return true;
}

function fecharSelecaoDeAlvoDoEfeito(cancelar = false) {
    const modal = document.getElementById('effect-target-modal');
    if (modal) modal.style.display = 'none';

    if (cancelar && efeitoPendente) {
        const pendencia = efeitoPendente;
        efeitoPendente = null;

        if (pendencia.carta.type === 'efeito') {
            const jogador = state.players[pendencia.owner];
            const indice = jogador?.field?.indexOf(pendencia.carta);
            if (indice >= 0) jogador.field.splice(indice, 1);
            sendCardToGraveyard(pendencia.carta, pendencia.owner, false);
            registerActionDone(pendencia.owner);
        } else if (pendencia.gatilho === 'custo') {
            state.pendingCostActivation = null;
            if (typeof renderUI === 'function') renderUI();
        }
    }
}

function selecionarAlvoDoEfeito(ownerAlvo, indiceAlvo) {
    if (!efeitoPendente) return;

    const pendencia = efeitoPendente;
    const jogadorAlvo = state.players[ownerAlvo];
    const alvo = jogadorAlvo?.field?.[indiceAlvo];

    if (!alvo) return;

    const contexto = {
        ...pendencia.contexto,
        owner: pendencia.owner,
        card: pendencia.carta,
        targetCard: alvo,
        targetOwner: ownerAlvo
    };

    if (pendencia.gatilho === 'ativo') {
        pendencia.carta._activeTarget = alvo;
        pendencia.carta._activeTargetOwner = ownerAlvo;
    }

    const carta = pendencia.carta;
    const gatilho = pendencia.gatilho;
    efeitoPendente = null;

    const modal = document.getElementById('effect-target-modal');
    if (modal) modal.style.display = 'none';

    const resultado = triggerEffect(gatilho, carta, contexto);

    if (resultado === 'pending') {
        showToast('Não foi possível resolver o alvo escolhido.', 'warning');
        return;
    }

    if (typeof pendencia.contexto.aoConcluir === 'function') {
        pendencia.contexto.aoConcluir(true);
    } else if (carta.type === 'efeito') {
        const jogador = state.players[pendencia.owner];
        const indice = jogador?.field?.indexOf(carta);
        if (indice >= 0) jogador.field.splice(indice, 1);
        sendCardToGraveyard(carta, pendencia.owner, false);
        registerActionDone(pendencia.owner);
    }
}

function escolherAlvoDoInimigo(alvos) {
    if (!Array.isArray(alvos) || !alvos.length) return null;

    return [...alvos].sort((primeiro, segundo) => {
        const defesaPrimeiro = Number(primeiro.carta.currentDef ?? primeiro.carta.def) || 0;
        const defesaSegundo = Number(segundo.carta.currentDef ?? segundo.carta.def) || 0;
        return defesaPrimeiro - defesaSegundo;
    })[0];
}
