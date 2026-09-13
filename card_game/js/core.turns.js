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
    if (!card || !card.effects || typeof card.effects[triggerType] !== 'function') {
        return false;
    }

    const owner = context.owner || (
        state.players.p1.field.includes(card) ? 'p1' : 'p2'
    );

    if (
        typeof efeitoPrecisaDeAlvo === 'function' &&
        efeitoPrecisaDeAlvo(card) &&
        !context.targetCard
    ) {
        const alvoAtivoAindaNoCampo =
            triggerType === 'ativo' &&
            card._activeTarget &&
            state.players[card._activeTargetOwner]?.field?.includes(card._activeTarget);

        if (alvoAtivoAindaNoCampo) {
            context.targetCard = card._activeTarget;
            context.targetOwner = card._activeTargetOwner;
        } else {
            if (triggerType === 'ativo') {
                card._activeTarget = null;
                card._activeTargetOwner = null;
            }

            const alvos = obterAlvosValidosDoEfeito(card, owner);

            if (!alvos.length) {
                showToast?.(`${card.name}: não há alvo válido para este efeito.`, 'warning');
                return false;
            }

            if (owner === 'p1' && typeof abrirSelecaoDeAlvoDoEfeito === 'function') {
                abrirSelecaoDeAlvoDoEfeito(card, triggerType, owner, context);
                return 'pending';
            }

            const alvoEscolhido = typeof escolherAlvoDoInimigo === 'function'
                ? escolherAlvoDoInimigo(alvos, card, triggerType)
                : alvos[0];

            if (!alvoEscolhido) return false;
            context.targetCard = alvoEscolhido.carta;
            context.targetOwner = alvoEscolhido.owner;

            if (triggerType === 'ativo') {
                card._activeTarget = context.targetCard;
                card._activeTargetOwner = context.targetOwner;
            }
        }
    }

    if (triggerType === 'ativo' && context.targetCard) {
        card._activeTarget = context.targetCard;
        card._activeTargetOwner = context.targetOwner;
    }

    const efeitoContexto = {
        ...context,
        owner,
        card,
        trigger: triggerType
    };

    pushEffect(() => card.effects[triggerType](efeitoContexto));
    resolveEffectStack();

    if (typeof renderUI === 'function') renderUI();
    return true;
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

    const tempo = Math.max(
        0,
        Math.ceil((state.prazoAcao - Date.now()) / 1000)
    );

    state.tempoRestanteAcao = tempo;

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

function iniciarTemporizadorAcao() {
    if (state.intervaloTemporizadorAcao) {
        clearInterval(state.intervaloTemporizadorAcao);
    }

    state.prazoAcao = Date.now() + state.tempoLimiteAcao * 1000;
    state.tempoRestanteAcao = state.tempoLimiteAcao;

    atualizarTemporizadorAcao();

    state.intervaloTemporizadorAcao = setInterval(() => {
        atualizarTemporizadorAcao();

        if (Date.now() >= state.prazoAcao) {
            clearInterval(state.intervaloTemporizadorAcao);
            state.intervaloTemporizadorAcao = null;
            state.tempoRestanteAcao = 0;

            const jogadorQueTerminouOTempo =
                state.activeAttack &&
                state.activeAttack.attackerOwner === 'p2'
                    ? 'p1'
                    : state.initiativeOwner;

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
                    /*
                     * Se ainda houver mais de 8 cartas,
                     * o jogador continua na mesma ação.
                     * A cada novo estouro de tempo, uma única
                     * carta será descartada aleatoriamente.
                     */
                    if (
                        state.players[jogadorQueTerminouOTempo].hand.length > 8
                    ) {
                        iniciarTemporizadorAcao();
                        return;
                    }

                    /*
                     * Depois de chegar a 8 cartas, a ação termina
                     * normalmente.
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
                showToast('Tempo esgotado! A vez passa automaticamente.', 'warning');
            }

            if (state.activeAttack && state.activeAttack.attackerOwner === 'p2') {
                passBlock();
            } else if (state.initiativeOwner === 'p1') {
                passAction('p1');
            } else {
                passAction('p2');
            }
        }
    }, 250);
}

function pararTemporizadorAcao() {
    if (state.intervaloTemporizadorAcao) {
        clearInterval(state.intervaloTemporizadorAcao);
        state.intervaloTemporizadorAcao = null;
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
        setTimeout(executeEnemyTurn, 700);
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
    setTimeout(executeEnemyTurn, 700);
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

        card.currentDef =
            card.def ??
            card.baseDef ??
            card.currentDef;

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
ativo: 0
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