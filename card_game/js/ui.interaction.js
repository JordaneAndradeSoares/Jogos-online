
function handleExtraDeckCardClick(owner, index) {
    if (owner !== 'p1') return;
    if (state.initiativeOwner !== 'p1' || state.activeAttack) return;
    closeExtraDeckModal();
    if (typeof prepareExtraDeckSummon === 'function') {
        prepareExtraDeckSummon(owner, index);
    }
}

function handleCardClick(owner, zone, index) {
    // Cartas do oponente nunca iniciam ações pelo clique do jogador.
    if (owner !== 'p1') return;

    if (state.pendingDiscard.p1) {
        if (owner === 'p1' && zone === 'hand') {
            openDiscardModal(index);
        } else {
            showToast(
                "Você precisa descartar o excesso de cartas da mão primeiro!",
                "warning"
            );
        }
        return;
    }

    if (
        state.activeAttack &&
        state.activeAttack.attackerOwner === 'p2'
    ) {
        if (owner === 'p1' && zone === 'field') {
            const jogador = state.players.p1;
            const carta = jogador.field[index];

            if (!carta) return;

            if (!cartaPodeBloquear(carta)) {
                showToast(
                    "Esta carta não pode bloquear.",
                    "error"
                );
                return;
            }

            if (carta.isFaceDown) {
                state.pendingFaceDownBlockIndex = index;

                const botaoRevelar = document.getElementById(
                    'reveal-face-down-block-btn'
                );

                const custoRevelar =
                    obterCustoOriginalDaCarta(carta);

                if (botaoRevelar) {
                    botaoRevelar.disabled =
                        jogador.energy < custoRevelar;

                    botaoRevelar.textContent =
                        jogador.energy >= custoRevelar
                            ? `Virar para cima e bloquear (Pagar ${custoRevelar} Energia)`
                            : `Sem energia para revelar (Custo ${custoRevelar})`;
                }

                document.getElementById(
                    'face-down-action-modal'
                ).style.display = 'flex';

                return;
            }

            resolveFaceDownBlock(index);
            return;
        }

        showToast(
            "Clique em uma carta do seu campo para bloquear o ataque!",
            "warning"
        );

        return;
    }

    if (state.initiativeOwner !== 'p1') {
        showToast(
            "Aguarde a iniciativa do inimigo!",
            "warning"
        );
        return;
    }

    const jogador = state.players.p1;

    if (owner !== 'p1') {
        return;
    }

    if (zone === 'hand') {
        const carta = jogador.hand[index];

        if (!carta) return;

        if (
            carta.type !== 'efeito' &&
            jogador.field.length >= 5
        ) {
            return showToast(
                "Campo cheio (Máx 5)!",
                "error"
            );
        }

        state.selectedCardIndex = index;

        if (carta.type === 'efeito') {
            confirmPlay(false);
        } else {
            const modal = document.getElementById('play-modal');
            const titulo = modal?.querySelector('h3');
            const conteudo = modal?.querySelector('.modal-content');

            if (modal && conteudo) {
                let indicadorEnergia = document.getElementById(
                    'play-modal-energy'
                );

                if (!indicadorEnergia) {
                    indicadorEnergia = document.createElement('div');
                    indicadorEnergia.id = 'play-modal-energy';

                    indicadorEnergia.style.cssText =
                        'margin:10px 0 15px;padding:10px;border:1px solid rgba(0,255,255,.35);border-radius:8px;background:rgba(0,0,0,.25);text-align:center;font-weight:bold;color:#00ffff;';

                    conteudo.insertBefore(
                        indicadorEnergia,
                        conteudo.firstChild
                    );
                }

                const custo = obterCustoOriginalDaCarta(carta);

                indicadorEnergia.innerText =
                    `Energia atual: ${jogador.energy}/${jogador.maxEnergy} • Custo: ${custo}`;

                const botoesImplantacao = conteudo.querySelectorAll('button');
                let botaoImplantacaoAtiva = null;

                botoesImplantacao.forEach((botao) => {
                    if (botao.textContent.includes('Implantar Ativa')) {
                        botaoImplantacaoAtiva = botao;
                    }
                });

                if (botaoImplantacaoAtiva) {
                    const podePagarCusto = jogador.energy >= custo;
                    botaoImplantacaoAtiva.disabled = !podePagarCusto;
                    botaoImplantacaoAtiva.style.opacity = podePagarCusto ? '1' : '0.5';
                    botaoImplantacaoAtiva.style.cursor = podePagarCusto ? 'pointer' : 'not-allowed';
                    botaoImplantacaoAtiva.style.filter = podePagarCusto ? 'none' : 'grayscale(1)';
                }

                const botaoPolimorfose = document.getElementById('polymorph-summon-btn');
                if (botaoPolimorfose) {
                    const candidatos = carta.summonType === 'polimorfose'
                        ? getPolymorphMaterialCandidates('p1', carta)
                        : [];
                    const custoPolimorfose = carta.summonType === 'polimorfose'
                        ? getPolymorphCost(carta)
                        : 0;
                    const podePolimorfose =
                        carta.summonType === 'polimorfose' &&
                        state.initiativeOwner === 'p1' &&
                        !state.activeAttack &&
                        candidatos.length > 0 &&
                        jogador.energy >= custoPolimorfose;

                    botaoPolimorfose.style.display = carta.summonType === 'polimorfose' ? 'block' : 'none';
                    botaoPolimorfose.disabled = !podePolimorfose;
                    botaoPolimorfose.textContent = carta.summonType === 'polimorfose'
                        ? `Invocar por Polimorfose (Custo ${custoPolimorfose})`
                        : 'Invocar por Polimorfose';
                }

                if (titulo) {
                    titulo.innerText =
                        `Como deseja implantar esta carta?`;
                }

                modal.style.display = 'flex';
            }
        }

        return;
    }

    if (zone !== 'field') {
        return;
    }

    const carta = jogador.field[index];

    if (!carta) return;

    if (carta.isFaceDown) {
        if (!revealFaceDownCard(index, 'p1')) {
            return;
        }

        showToast(
            `${carta.name} foi revelada e está pronta para atacar ou bloquear!`,
            "success"
        );

        /*
        * NÃO registramos registerActionDone aqui.
        *
        * A revelação deixa a carta imediatamente pronta
        * e o jogador continua com a iniciativa para poder
        * atacar com ela no mesmo momento.
        */
        return;
    }

    /*
     * Toda carta virada para cima no campo abre o mesmo menu:
     * - Ativar efeito Custo X (quando disponível);
     * - Atacar (quando disponível).
     *
     * Botões indisponíveis ficam cinza/desabilitados.
     */
    abrirMenuDeAcaoDaCarta(index);
}