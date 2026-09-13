function obterAtacantesDisponiveisDoInimigo() {
    return state.players.p2.field.filter(carta => {
        return cartaPodeAtacar(carta);
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

    if (!cartaPodeAtacar(cartaAtacante)) {
        return false;
    }

    if (!marcarAtaqueDaCarta(cartaAtacante)) {
        return false;
    }

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

    const bloqueadores = jogadorInimigo.field.filter(carta => {
        return cartaPodeBloquear(carta);
    });

    if (!bloqueadores.length) {
        return null;
    }

    const ataqueDoAtacante = obterAtaqueDaCartaInimiga(attackerCard);
    const defesaDoAtacante = obterDefesaDaCartaInimiga(attackerCard);

    const informacoesDosBloqueadores = bloqueadores.map(carta => {
        return {
            carta,
            ataque: carta.isFaceDown
                ? 0
                : (
                    carta.type === 'terreno'
                        ? 0
                        : obterAtaqueDaCartaInimiga(carta)
                ),
            defesa: carta.isFaceDown
                ? 1
                : obterDefesaDaCartaInimiga(carta),
            oculta: !!carta.isFaceDown
        };
    });

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
        return prepararBloqueioDoInimigo(escolha.carta);
    }

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
        return prepararBloqueioDoInimigo(escolha.carta);
    }

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

        return prepararBloqueioDoInimigo(escolha.carta);
    }

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
        ? prepararBloqueioDoInimigo(escolha.carta)
        : null;
}

function prepararBloqueioDoInimigo(cartaBloqueadora) {
    const jogadorInimigo = state.players.p2;
    const indice = jogadorInimigo.field.indexOf(cartaBloqueadora);

    if (indice < 0) return null;

    // A IA pode revelar sua própria carta oculta durante a defesa,
    // mas somente se puder pagar o custo original.
    if (
        cartaBloqueadora.isFaceDown &&
        jogadorInimigo.energy >= obterCustoOriginalDaCarta(cartaBloqueadora)
    ) {
        const ataqueDoAtacante =
            Number(state.activeAttack?.attackerCard?.atk) || 0;

        const defesaOriginal =
            Number(cartaBloqueadora._faceDownOriginalDef) || 0;

        // Revela quando isso permite uma troca melhor que o 0/1 oculto.
        if (defesaOriginal > ataqueDoAtacante || ataqueDoAtacante <= 1) {
            revealFaceDownCard(indice, 'p2');
        }
    }

    return indice;
}
