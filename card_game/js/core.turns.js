function getPlayerGeneration(player) {
if (!player || !Array.isArray(player.field)) return 0;


return player.field.reduce((total, card) => {
    if (!card || card.type === 'efeito' || card.isFaceDown) return total;

    return total + (Number(card.energyRecharge ?? card.generation) || 0);
}, 0);


}

function gainEnergyFromCard(player, card) {
if (!player || !card || card.type === 'efeito') return;


player.energy = Math.min(
    20,
    player.energy + (Number(card.energyRecharge ?? card.generation) || 0)
);


}

function pushEffect(effectFn) {
if (typeof effectFn === 'function') state.effectStack.push(effectFn);
}

function resolveEffectStack() {
while (state.effectStack.length > 0) {
const effectFn = state.effectStack.pop();


    try {
        effectFn();
    } catch (error) {
        console.error("Erro ao resolver efeito:", error);

        if (typeof showToast === 'function') {
            showToast(
                "Um efeito falhou. Veja o console para detalhes.",
                "error"
            );
        }
    }
}


}

function triggerEffect(triggerType, card, context = {}) {
    if (
        !card ||
        !card.effects ||
        typeof card.effects[triggerType] !== 'function'
    ) {
        return false;
    }

    const owner =
        context.owner ||
        (
            state.players.p1.field.includes(card)
                ? 'p1'
                : 'p2'
        );

    // Uma carta só pode ativar efeitos sob controle do jogador que
    // a controla. Isso evita que uma referência de carta do adversário
    // seja usada acidentalmente por uma ação do jogador atual.
    const controlaCarta =
        state.players[owner]?.field?.includes(card) ||
        state.players[owner]?.hand?.includes(card);

    if (!controlaCarta && !context.allowOffFieldEffect) {
        console.warn('Tentativa de ativar efeito de carta fora do controle do jogador:', card?.name, owner);
        return false;
    }

    /*
     * Verifica se este efeito precisa de alvo.
     */
    const precisaDeAlvo =
        typeof efeitoPrecisaDeAlvo === 'function' &&
        efeitoPrecisaDeAlvo(card);

    /*
     * Se precisa de alvo e ainda não temos um,
     * precisamos abrir a seleção.
     */
    if (
        precisaDeAlvo &&
        !context.targetCard
    ) {

        /*
         * Para efeitos [Ativo], reutilizamos o alvo
         * anteriormente escolhido enquanto ele ainda
         * estiver no campo.
         */
        const alvoAnteriorValido =
            triggerType === 'ativo' &&
            card._activeTarget &&
            state.players[
                card._activeTargetOwner
            ]?.field?.includes(
                card._activeTarget
            );

        if (alvoAnteriorValido) {

            context.targetCard =
                card._activeTarget;

            context.targetOwner =
                card._activeTargetOwner;
        }

        else {

            if (triggerType === 'ativo') {
                card._activeTarget = null;
                card._activeTargetOwner = null;
            }

            const alvos =
                obterAlvosValidosDoEfeito(
                    card,
                    owner
                );

            if (!alvos.length) {
                showToast?.(
                    `${card.name}: não há alvo válido para este efeito.`,
                    'warning'
                );

                return false;
            }

            /*
             * Jogador humano:
             * abre a tela para escolher.
             */
            if (
                owner === 'p1' &&
                typeof abrirSelecaoDeAlvoDoEfeito === 'function'
            ) {
                const abriu =
                    abrirSelecaoDeAlvoDoEfeito(
                        card,
                        triggerType,
                        owner,
                        context
                    );

                return abriu
                    ? 'pending'
                    : false;
            }


            /*
             * IA:
             * escolhe automaticamente.
             */
            const alvoEscolhido =
                typeof escolherAlvoDoInimigo === 'function'
                    ? escolherAlvoDoInimigo(
                        alvos,
                        card,
                        triggerType
                    )
                    : alvos[0];

            if (!alvoEscolhido) {
                return false;
            }

            context.targetCard =
                alvoEscolhido.carta;

            context.targetOwner =
                alvoEscolhido.owner;

            if (triggerType === 'ativo') {
                card._activeTarget =
                    context.targetCard;

                card._activeTargetOwner =
                    context.targetOwner;
            }
        }
    }


    /*
     * Segurança final: mesmo que alguém tente escolher um alvo manualmente,
     * ele precisa obedecer à regra específica da carta.
     */
    if (context.targetCard) {
        const alvoPermitido =
            typeof alvoValidoParaEfeito === 'function'
                ? alvoValidoParaEfeito(
                    card,
                    owner,
                    context.targetCard,
                    context.targetOwner
                )
                : true;

        if (!alvoPermitido) {
            console.warn(
                'Alvo inválido para o efeito:',
                card?.name,
                context.targetCard?.name
            );
            return false;
        }
    }

    /*
     * Guarda o alvo dos efeitos ativos.
     */
    if (
        triggerType === 'ativo' &&
        context.targetCard
    ) {
        card._activeTarget =
            context.targetCard;

        card._activeTargetOwner =
            context.targetOwner;
    }


    /*
     * Monta o contexto definitivo.
     */
    const efeitoContexto = {
        ...context,
        owner,
        card,
        trigger: triggerType
    };


    let resultado = false;

    /*
     * Executa o efeito diretamente.
     *
     * Não precisamos esconder o resultado
     * da função CardEffects.
     */
    try {
        resultado =
            card.effects[triggerType](
                efeitoContexto
            );
    }

    catch (erro) {
        console.error(
            `Erro ao executar efeito de ${card.name}:`,
            erro
        );

        showToast?.(
            `Erro ao executar o efeito de ${card.name}.`,
            'error'
        );

        return false;
    }


    if (
        typeof renderUI === 'function'
    ) {
        renderUI();
    }

    return resultado !== false;
}

function descartarUmaCartaAleatoriaPorTempo(playerKey) {
    const jogador = state.players[playerKey];

    if (!jogador || !Array.isArray(jogador.hand)) {
        return false;
    }

    if (jogador.hand.length <= 8) {
        state.pendingDiscard[playerKey] = false;
        return false;
    }

    const indiceAleatorio = Math.floor(
        Math.random() * jogador.hand.length
    );

    const cartaDescartada = jogador.hand.splice(indiceAleatorio, 1)[0];

    if (cartaDescartada) {
        sendCardToGraveyard(cartaDescartada, playerKey, false);
    }

    state.pendingDiscard[playerKey] =
        jogador.hand.length > 8;

    if (typeof showToast === 'function') {
        if (playerKey === 'p1') {
            showToast(
                `Tempo esgotado! Uma carta aleatória foi descartada. Você ficou com ${jogador.hand.length} carta(s).`,
                'warning'
            );
        } else {
            showToast(
                `Tempo esgotado! O inimigo descartou uma carta aleatória. Ele ficou com ${jogador.hand.length} carta(s).`,
                'warning'
            );
        }
    }

    if (typeof renderUI === 'function') {
        renderUI();
    }

    return true;
}

function atualizarTemporizadorAcao() {
    const elementoTempo = document.getElementById('action-timer');
    const elementoTempoTutorial = document.getElementById('tutorial-action-timer');

    if (!elementoTempo && !elementoTempoTutorial) return;

    let tempo = state.tempoRestanteAcao;

    /*
     * Enquanto o jogo estiver rodando, o tempo é calculado pelo prazo.
     * Durante a pausa, mantemos o valor salvo e não deixamos o relógio
     * continuar diminuindo.
     */
    if (!state.jogoPausado && state.prazoAcao !== null) {
        tempo = Math.max(
            0,
            Math.ceil((state.prazoAcao - Date.now()) / 1000)
        );

        state.tempoRestanteAcao = tempo;
    }

    if (elementoTempo) {
        elementoTempo.textContent = `${tempo}s`;
        elementoTempo.classList.toggle(
            'action-timer-warning',
            tempo <= 10
        );
    }

    if (elementoTempoTutorial) {
        elementoTempoTutorial.textContent = `${tempo}s`;
        elementoTempoTutorial.classList.toggle(
            'action-timer-warning',
            tempo <= 10
        );
    }
}

/*
 * Executa a consequência de o cronômetro chegar a zero.
 *
 * Esta função fica separada do intervalo do cronômetro para que a pausa
 * possa interromper o intervalo sem duplicar toda a lógica de expiração.
 */
function finalizarTemporizadorPorExpiracao() {
    const jogadorQueTerminouOTempo =
        state.activeAttack &&
        state.activeAttack.attackerOwner === 'p2'
            ? 'p1'
            : state.initiativeOwner;

    /*
     * Se o jogador tiver mais de 8 cartas, primeiro descarta uma carta
     * aleatória. Enquanto ainda estiver acima de 8, o cronômetro volta
     * a contar para permitir os descartes restantes.
     */
    if (
        jogadorQueTerminouOTempo &&
        state.players[jogadorQueTerminouOTempo] &&
        state.players[jogadorQueTerminouOTempo].hand.length > 8
    ) {
        const descartou =
            descartarUmaCartaAleatoriaPorTempo(
                jogadorQueTerminouOTempo
            );

        if (descartou) {
            if (
                state.players[jogadorQueTerminouOTempo].hand.length > 8
            ) {
                iniciarTemporizadorAcao();
                return;
            }

            /*
             * Depois de ficar com no máximo 8 cartas, a ação termina.
             */
            if (
                state.activeAttack &&
                state.activeAttack.attackerOwner === 'p2'
            ) {
                passBlock();
            } else {
                passAction(jogadorQueTerminouOTempo);
            }

            return;
        }
    }

    if (typeof showToast === 'function') {
        showToast(
            'Tempo esgotado! A vez passa automaticamente.',
            'warning'
        );
    }

    /*
     * Durante um bloqueio, o tempo esgotado encerra automaticamente
     * a decisão de bloqueio.
     */
    if (
        state.activeAttack &&
        state.activeAttack.attackerOwner === 'p2'
    ) {
        passBlock();
        return;
    }

    /*
     * Ação normal:
     * passa a iniciativa para o próximo jogador.
     * passAction() também reinicia o cronômetro.
     */
    if (state.initiativeOwner === 'p1') {
        passAction('p1');
    } else {
        passAction('p2');
    }
}

function iniciarTemporizadorAcao() {
    if (state.intervaloTemporizadorAcao) {
        clearInterval(state.intervaloTemporizadorAcao);
        state.intervaloTemporizadorAcao = null;
    }

    /*
     * Não inicia um novo cronômetro enquanto o jogo estiver pausado.
     */
    if (state.jogoPausado) {
        return;
    }

    state.prazoAcao =
        Date.now() + state.tempoLimiteAcao * 1000;

    state.tempoRestanteAcao =
        state.tempoLimiteAcao;

    atualizarTemporizadorAcao();

    state.intervaloTemporizadorAcao = setInterval(() => {
        if (state.jogoPausado) {
            return;
        }

        atualizarTemporizadorAcao();

        if (Date.now() >= state.prazoAcao) {
            clearInterval(state.intervaloTemporizadorAcao);
            state.intervaloTemporizadorAcao = null;
            state.tempoRestanteAcao = 0;

            atualizarTemporizadorAcao();

            finalizarTemporizadorPorExpiracao();
        }
    }, 250);
}

function pararTemporizadorAcao() {
    if (state.intervaloTemporizadorAcao) {
        clearInterval(state.intervaloTemporizadorAcao);
        state.intervaloTemporizadorAcao = null;
    }
}


/* =========================================================
   PAUSA DO JOGO
========================================================= */

function alternarPausaJogo() {
    if (state.jogoPausado) {
        continuarJogo();
    } else {
        pausarJogo();
    }
}

function pausarJogo() {
    if (state.jogoPausado) {
        return;
    }

    /*
     * Calcula e salva o tempo exato que ainda restava antes de pausar.
     */
    if (state.prazoAcao !== null) {
        state.tempoRestanteAcao = Math.max(
            0,
            Math.ceil(
                (state.prazoAcao - Date.now()) / 1000
            )
        );
    }

    state.tempoRestanteAntesDaPausa =
        state.tempoRestanteAcao;

    pararTemporizadorAcao();

    state.jogoPausado = true;

    atualizarTemporizadorAcao();
    atualizarInterfacePausa();
}

function continuarJogo() {
    if (!state.jogoPausado) {
        return;
    }

    state.jogoPausado = false;

    state.tempoRestanteAcao =
        Math.max(
            0,
            Number(state.tempoRestanteAntesDaPausa) || 0
        );

    /*
     * Se a pausa aconteceu exatamente quando o tempo acabou,
     * passa a vez imediatamente em vez de deixar o jogo travado.
     */
    if (state.tempoRestanteAcao <= 0) {
        state.prazoAcao = Date.now();

        atualizarInterfacePausa();
        atualizarTemporizadorAcao();

        finalizarTemporizadorPorExpiracao();
        return;
    }

    /*
     * Cria um novo prazo usando somente o tempo que havia sido salvo.
     */
    state.prazoAcao =
        Date.now() +
        state.tempoRestanteAcao * 1000;

    atualizarInterfacePausa();
    atualizarTemporizadorAcao();

    /*
     * Retoma o intervalo do cronômetro sem resetar para 60 segundos.
     */
    if (state.intervaloTemporizadorAcao) {
        clearInterval(state.intervaloTemporizadorAcao);
    }

    state.intervaloTemporizadorAcao = setInterval(() => {
        if (state.jogoPausado) {
            return;
        }

        atualizarTemporizadorAcao();

        if (Date.now() >= state.prazoAcao) {
            clearInterval(state.intervaloTemporizadorAcao);
            state.intervaloTemporizadorAcao = null;
            state.tempoRestanteAcao = 0;

            atualizarTemporizadorAcao();

            finalizarTemporizadorPorExpiracao();
        }
    }, 250);
}

function atualizarInterfacePausa() {
    const overlay =
        document.getElementById('pause-overlay');

    const botao =
        document.getElementById('pause-game-btn');

    if (overlay) {
        overlay.classList.toggle(
            'visible',
            state.jogoPausado
        );
    }

    if (botao) {
        botao.textContent = state.jogoPausado
            ? '▶ Continuar'
            : '⏸ Pausar';
    }
}

function passAction(playerKey) {
if (state.activeAttack) return;


if (state.pendingDiscard[playerKey]) {
    if (typeof showToast === 'function') {
        showToast(
            playerKey === 'p1'
                ? 'Você precisa descartar até ficar com 8 cartas.'
                : 'O inimigo precisa descartar até ficar com 8 cartas.',
            'warning'
        );
    }

    return;
}

if (state.initiativeOwner !== playerKey) return;

state.consecutivePasses++;

if (state.consecutivePasses >= 2) {
    endTurnCycle();
} else {
    state.initiativeOwner =
        playerKey === 'p1'
            ? 'p2'
            : 'p1';

    if (
        state.initiativeOwner === 'p2' &&
        typeof executeEnemyTurn === 'function'
    ) {
        setTimeout(() => {
            if (state.jogoPausado) return;
            executeEnemyTurn();
        }, 700);
    }
}

iniciarTemporizadorAcao();

if (typeof renderUI === 'function') renderUI();


}

function endMyTurn() {
passAction('p1');
}

function registerActionDone(actorKey) {
state.consecutivePasses = 0;


state.initiativeOwner =
    actorKey === 'p1'
        ? 'p2'
        : 'p1';

resolveEffectStack();

if (
    state.initiativeOwner === 'p2' &&
    typeof executeEnemyTurn === 'function'
) {
    setTimeout(() => {
        if (state.jogoPausado) return;
        executeEnemyTurn();
    }, 700);
}

iniciarTemporizadorAcao();

if (typeof renderUI === 'function') renderUI();


}

function endTurnCycle() {
state.turn++;
state.consecutivePasses = 0;
state.activeAttack = null;


['p1', 'p2'].forEach(playerKey => {
    const player = state.players[playerKey];

    player.maxEnergy = 20;

    player.energy = Math.min(
        20,
        player.energy + getPlayerGeneration(player)
    );

    player.field.forEach(card => {
        if (
            !card.isFaceDown &&
            card.gatilho === 'ativo' &&
            card.effects &&
            card.effects.ativo &&
            card._activeTickedTurn !== state.turn
        ) {
            card._activeTickedTurn = state.turn;

            triggerEffect('ativo', card, {
                owner: playerKey,
                card
            });
        }

        /*
         * Cartas ocultas possuem uma DEF própria (1 + buffs - dano).
         * Não recalculamos currentDef a partir de card.def aqui, pois isso
         * apagaria o dano já sofrido enquanto a carta estava oculta.
         */
        if (!card.isFaceDown) {
            card.currentDef =
                card.def ??
                card.baseDef ??
                card.currentDef;
        }

        if (card.type !== 'criatura') return;

        card.isResting = false;
        card.attackedLastTurn = card.attackedThisTurn;
        card.attackedThisTurn = false;

        /*
         * CARTA VIRADA PARA BAIXO
         *
         * - Ataque NULO.
         * - Pode defender.
         * - Não fica atordoada somente por estar oculta.
         */
        if (card.isFaceDown) {
            card.isStunned = false;
            card.stunReason = null;
            card.stunPhase = null;
            card.casusBelli = 0;

            return;
        }

        /*
         * CARTA QUE ACABOU DE ENTRAR VIRADA PARA CIMA
         *
         * Fica ATORDOADA em vermelho somente no turno
         * em que entrou.
         *
         * No próximo ciclo de turno ela fica pronta.
         */
        if (card.stunReason === 'summon') {
            const summonTurn =
                card.summonedTurn ?? state.turn;

            if (summonTurn < state.turn) {
                card.isStunned = false;
                card.stunReason = null;
                card.stunPhase = null;
                card.casusBelli = 1;
            } else {
                card.isStunned = true;
                card.stunPhase = 'red';
                card.casusBelli = 0;
            }

            return;
        }

        /*
         * A criatura atacou no turno anterior.
         *
         * Agora está no último turno de atordoamento:
         * ATORDOADO em amarelo.
         */
        if (
            card.stunReason === 'attack' &&
            card.lastAttackTurn === state.turn - 1
        ) {
            card.isStunned = true;
            card.stunPhase = 'yellow';
            card.casusBelli = 0;

            return;
        }

        /*
         * A criatura já passou pelo turno amarelo.
         *
         * Agora volta a ficar pronta.
         */
        if (
            card.stunReason === 'attack' &&
            card.stunPhase === 'yellow'
        ) {
            card.isStunned = false;
            card.stunReason = null;
            card.stunPhase = null;
            card.casusBelli = 1;

            return;
        }

        /*
         * Efeito de atordoamento de outra origem continua ativo.
         *
         * O visual padrão desse tipo de atordoamento é roxo.
         */
        if (
            card.isStunned &&
            card.stunReason === 'effect'
        ) {
            card.casusBelli = 0;

            return;
        }

        card.isStunned = false;
        card.stunReason = null;
        card.stunPhase = null;
        card.casusBelli = 1;
    });

    if (player.deck.length > 0) {
        player.hand.push(player.deck.pop());
    } else {
        const winner =
            playerKey === 'p1'
                ? 'Inimigo (P2)'
                : 'Você (P1)';

        alert(
            `O deck de ${playerKey} acabou! ${winner} venceu por esgotamento!`
        );

        location.reload();
        return;
    }

    if (
        playerKey === 'p1' &&
        player.hand.length > 8
    ) {
        state.pendingDiscard.p1 = true;

        if (typeof showToast === 'function') {
            showToast(
                'Você tem mais de 8 cartas na mão. Descarte até ficar com 8.',
                'warning'
            );
        }
    } else if (
        playerKey === 'p2' &&
        player.hand.length > 8
    ) {
        state.pendingDiscard.p2 = true;

        if (typeof showToast === 'function') {
            showToast(
                'O inimigo está acima do limite de 8 cartas e deverá descartar antes de agir.',
                'warning'
            );
        }
    }
});

if (state.players.p1.hand.length <= 8) {
    state.pendingDiscard.p1 = false;
}

if (state.players.p2.hand.length <= 8) {
    state.pendingDiscard.p2 = false;
}

state.initiativeOwner = 'p1';
iniciarTemporizadorAcao();

if (typeof renderUI === 'function') renderUI();


}

window.onload = function () {
if (typeof initGame === 'function') initGame();
};

function testarTodosOsEfeitos() {
const erros = [];
const contagem = {
campo: 0,
destruido: 0,
ativo: 0,
custo: 0
};


if (typeof CARD_DATABASE === 'undefined') {
    return {
        correto: false,
        erros: ['Banco de cartas não carregado.'],
        contagem
    };
}

CARD_DATABASE.forEach(carta => {
    const gatilho =
        carta.gatilho ||
        (
            typeof obterGatilhoDaCarta === 'function'
                ? obterGatilhoDaCarta(carta)
                : null
        );

    if (carta.desc && !gatilho) {
        erros.push(`${carta.name}: efeito sem gatilho.`);
    }

    if (
        gatilho &&
        !['campo', 'destruido', 'ativo'].includes(gatilho)
    ) {
        erros.push(`${carta.name}: gatilho inválido.`);
    }

    if (gatilho) contagem[gatilho]++;
});

const resultado = {
    correto: erros.length === 0,
    erros,
    contagem
};

console.info('Teste dos efeitos:', resultado);

return resultado;


}

function testAllCardEffects() {
const resultado = testarTodosOsEfeitos();


return {
    ok: resultado.correto,
    missing: resultado.erros,
    tested: Object
        .values(resultado.contagem)
        .reduce((a, b) => a + b, 0)
};


}