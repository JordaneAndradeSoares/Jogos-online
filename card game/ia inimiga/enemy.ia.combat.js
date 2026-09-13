function obterAtacantesDisponiveisDoInimigo() {
    return state.players.p2.field.filter(carta => {
        return cartaInimigaPodeAtacar(carta);
    });
}

function escolherMelhorAtacanteDoInimigo() {
    const atacantesDisponiveis = obterAtacantesDisponiveisDoInimigo();

    if (!atacantesDisponiveis.length) {
        return null;
    }

    atacantesDisponiveis.sort((primeiro, segundo) => {
        const valorPrimeiro =
            obterAtaqueDaCartaInimiga(primeiro) * 3 +
            obterDefesaDaCartaInimiga(primeiro);

        const valorSegundo =
            obterAtaqueDaCartaInimiga(segundo) * 3 +
            obterDefesaDaCartaInimiga(segundo);

        return valorSegundo - valorPrimeiro;
    });

    return atacantesDisponiveis[0];
}

function iniciarAtaqueDoInimigo(cartaAtacante) {
    const jogadorInimigo = state.players.p2;

    if (!cartaInimigaPodeAtacar(cartaAtacante)) {
        return false;
    }

    cartaAtacante.attackedThisTurn = true;
    cartaAtacante.attackedLastTurn = false;
    cartaAtacante.lastAttackTurn = state.turn;
    cartaAtacante.casusBelli = 0;

    state.activeAttack = {
        attackerOwner: 'p2',
        attackerCard: cartaAtacante,
        attackerIndex: jogadorInimigo.field.indexOf(cartaAtacante)
    };

    if (typeof showToast === 'function') {
        showToast(
            `Inimigo atacou com ${cartaAtacante.name}! Escolha um bloqueio ou passe.`,
            'warning'
        );
    }

    if (typeof renderUI === 'function') {
        renderUI();
    }

    return true;
}

function enemyDecidesBlock(attackerCard) {
    const jogadorInimigo = state.players.p2;

    // Criaturas prontas, cartas ocultas e terrenos podem bloquear.
    const bloqueadores = jogadorInimigo.field.filter(carta => {
        if (!carta) return false;

        const tipoPodeBloquear =
            carta.type === 'criatura' ||
            carta.type === 'terreno' ||
            carta.isFaceDown;

        if (!tipoPodeBloquear) return false;

        // Uma criatura atordoada continua podendo defender.
        // O estado de atordoamento impede atacar, mas não impede bloquear.
        if (
            !carta.isFaceDown &&
            carta.type === 'criatura' &&
            carta.isResting
        ) {
            return false;
        }

        return obterDefesaDaCartaInimiga(carta) > 0;
    });

    if (!bloqueadores.length) {
        return null;
    }

    const ataqueDoAtacante = obterAtaqueDaCartaInimiga(attackerCard);
    const defesaDoAtacante = obterDefesaDaCartaInimiga(attackerCard);

    const informacoesDosBloqueadores = bloqueadores.map(carta => {
        return {
            carta,
            ataque: carta.type === 'terreno'
                ? 0
                : obterAtaqueDaCartaInimiga(carta),
            defesa: obterDefesaDaCartaInimiga(carta),
            oculta: !!carta.isFaceDown
        };
    });

    // Primeiro procura uma troca em que o bloqueador mata e sobrevive.
    let escolha = informacoesDosBloqueadores
        .filter(informacao => {
            return (
                informacao.ataque >= defesaDoAtacante &&
                informacao.defesa > ataqueDoAtacante
            );
        })
        .sort((primeiro, segundo) => {
            return (
                obterCustoDaCartaInimiga(primeiro.carta) -
                obterCustoDaCartaInimiga(segundo.carta)
            );
        })[0];

    if (escolha) {
        return jogadorInimigo.field.indexOf(escolha.carta);
    }

    // Depois procura uma troca favorável mesmo que o bloqueador também morra.
    escolha = informacoesDosBloqueadores
        .filter(informacao => {
            return informacao.ataque >= defesaDoAtacante;
        })
        .sort((primeiro, segundo) => {
            return (
                obterCustoDaCartaInimiga(primeiro.carta) -
                obterCustoDaCartaInimiga(segundo.carta)
            );
        })[0];

    if (escolha) {
        return jogadorInimigo.field.indexOf(escolha.carta);
    }

    // Se tiver muita vida, evita sacrificar uma criatura contra um ataque pequeno.
    if (jogadorInimigo.life > 8 && ataqueDoAtacante <= 2) {
        const bloqueadoresSeguros = informacoesDosBloqueadores.filter(informacao => {
            return (
                informacao.defesa > ataqueDoAtacante &&
                informacao.ataque > 0
            );
        });

        if (!bloqueadoresSeguros.length) {
            return null;
        }

        escolha = bloqueadoresSeguros.sort((primeiro, segundo) => {
            return primeiro.defesa - segundo.defesa;
        })[0];

        return jogadorInimigo.field.indexOf(escolha.carta);
    }

    // Por último usa o bloqueador de menor valor para absorver o dano.
    escolha = informacoesDosBloqueadores.sort((primeiro, segundo) => {
        const valorPrimeiro =
            primeiro.ataque * 2 +
            primeiro.defesa +
            (primeiro.oculta ? 1 : 0);

        const valorSegundo =
            segundo.ataque * 2 +
            segundo.defesa +
            (segundo.oculta ? 1 : 0);

        return valorPrimeiro - valorSegundo;
    })[0];

    return escolha
        ? jogadorInimigo.field.indexOf(escolha.carta)
        : null;
}
