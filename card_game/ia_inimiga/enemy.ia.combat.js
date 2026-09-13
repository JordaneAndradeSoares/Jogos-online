function obterCustoOriginalParaBloqueioInimigo(carta) {
    if (!carta) return 0;

    return Number(
        carta._faceDownOriginalCost ??
        carta.baseCost ??
        carta.custoBase ??
        carta.cost
    ) || 0;
}

function obterAtacanteAtkParaBloqueio(carta) {
    if (!carta || carta.isFaceDown) return 0;

    return carta.type === 'terreno'
        ? 0
        : (Number(carta.atk) || 0);
}

function obterDefesaAtualParaBloqueio(carta) {
    if (!carta) return 0;

    return Number(
        carta.currentDef ??
        carta.def ??
        carta.baseDef
    ) || 0;
}

function obterValorRealDaCartaOculta(carta) {
    if (!carta) return 0;

    const atk = Number(
        carta._faceDownOriginalAtk ?? carta.atk
    ) || 0;

    const def = Number(
        carta._faceDownOriginalDef ?? carta.def
    ) || 0;

    return atk * 3 + def;
}

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

    const ataqueDoAtacante =
        obterAtacanteAtkParaBloqueio(attackerCard);

    const defesaDoAtacante =
        obterDefesaAtualParaBloqueio(attackerCard);

    const informacoesDosBloqueadores =
        bloqueadores.map(carta => {
            const oculto = !!carta.isFaceDown;

            return {
                carta,
                ataque: oculto
                    ? 0
                    : (
                        carta.type === 'terreno'
                            ? 0
                            : Number(carta.atk) || 0
                    ),
                defesa: oculto
                    ? Number(carta.currentDef) || 1
                    : obterDefesaAtualParaBloqueio(carta),
                ataqueReal: oculto
                    ? Number(carta._faceDownOriginalAtk) || 0
                    : Number(carta.atk) || 0,
                defesaReal: oculto
                    ? Number(carta._faceDownOriginalDef) || 0
                    : Number(carta.def) || 0,
                oculta: oculto,
                custo: obterCustoOriginalParaBloqueioInimigo(carta)
            };
        });

    /*
     * PRIMEIRO: tenta uma troca favorável usando uma carta que já
     * está revelada. A IA não precisa revelar uma carta oculta só
     * para conseguir bloquear.
     */
    let escolha = informacoesDosBloqueadores
        .filter(informacao => {
            return (
                !informacao.oculta &&
                informacao.ataque >= defesaDoAtacante &&
                informacao.defesa > ataqueDoAtacante
            );
        })
        .sort((primeiro, segundo) => {
            return primeiro.custo - segundo.custo;
        })[0];

    if (escolha) {
        return prepararBloqueioDoInimigo(
            escolha.carta
        );
    }

    /*
     * SEGUNDO: usa uma carta oculta como bloqueador 0/1.
     * Isso é totalmente legal e não custa energia.
     *
     * A carta continua oculta durante a resolução do combate.
     */
    escolha = informacoesDosBloqueadores
        .filter(informacao => {
            return (
                informacao.oculta &&
                informacao.ataque >= defesaDoAtacante
            );
        })
        .sort((primeiro, segundo) => {
            return primeiro.custo - segundo.custo;
        })[0];

    if (escolha) {
        return prepararBloqueioDoInimigo(
            escolha.carta,
            false
        );
    }

    /*
     * TERCEIRO: se a carta oculta 0/1 não consegue matar o atacante,
     * ainda pode ser usada como bloqueio sacrificial para impedir
     * dano direto. A regra é a mesma para os dois jogadores.
     */
    if (ataqueDoAtacante > 0) {
        const bloqueadoresOcultos =
            informacoesDosBloqueadores.filter(informacao => {
                return informacao.oculta;
            });

        if (bloqueadoresOcultos.length) {
            escolha = bloqueadoresOcultos.sort((primeiro, segundo) => {
                return primeiro.custo - segundo.custo;
            })[0];

            return prepararBloqueioDoInimigo(
                escolha.carta,
                false
            );
        }
    }

    /*
     * QUARTO: considera revelar uma carta oculta.
     *
     * Só revela se puder pagar o custo e se os atributos reais
     * trouxerem uma vantagem relevante para o bloqueio.
     */
    const cartasOcultasQuePodemSerReveladas =
        informacoesDosBloqueadores
            .filter(informacao => {
                if (!informacao.oculta) {
                    return false;
                }

                if (
                    jogadorInimigo.energy <
                    informacao.custo
                ) {
                    return false;
                }

                return (
                    informacao.ataqueReal >= defesaDoAtacante ||
                    informacao.defesaReal > ataqueDoAtacante
                );
            })
            .sort((primeiro, segundo) => {
                const valorPrimeiro =
                    primeiro.ataqueReal * 3 +
                    primeiro.defesaReal -
                    primeiro.custo;

                const valorSegundo =
                    segundo.ataqueReal * 3 +
                    segundo.defesaReal -
                    segundo.custo;

                return valorSegundo - valorPrimeiro;
            });

    if (
        cartasOcultasQuePodemSerReveladas.length
    ) {
        escolha =
            cartasOcultasQuePodemSerReveladas[0];

        return prepararBloqueioDoInimigo(
            escolha.carta,
            true
        );
    }

    /*
     * Por último, usa qualquer bloqueador revelado que esteja
     * disponível para impedir dano direto quando necessário.
     */
    escolha = informacoesDosBloqueadores
        .filter(informacao => {
            return !informacao.oculta;
        })
        .sort((primeiro, segundo) => {
            const valorPrimeiro =
                primeiro.ataque * 2 +
                primeiro.defesa;

            const valorSegundo =
                segundo.ataque * 2 +
                segundo.defesa;

            return valorPrimeiro - valorSegundo;
        })[0];

    return escolha
        ? prepararBloqueioDoInimigo(
            escolha.carta,
            false
        )
        : null;
}

function prepararBloqueioDoInimigo(
    cartaBloqueadora,
    deveRevelar = false
) {
    const jogadorInimigo = state.players.p2;
    const indice =
        jogadorInimigo.field.indexOf(
            cartaBloqueadora
        );

    if (indice < 0) return null;

    if (
        cartaBloqueadora.isFaceDown &&
        deveRevelar
    ) {
        const custo =
            obterCustoOriginalParaBloqueioInimigo(
                cartaBloqueadora
            );

        if (
            jogadorInimigo.energy < custo
        ) {
            /*
             * Não pode revelar: usa a carta oculta
             * normalmente como 0/1.
             */
            return indice;
        }

        const revelada =
            revealFaceDownCard(
                indice,
                'p2'
            );

        if (!revelada) {
            return indice;
        }

        if (typeof showToast === 'function') {
            showToast(
                `Inimigo revelou ${cartaBloqueadora.name} para bloquear, pagando ${custo} de energia.`,
                'info'
            );
        }
    }

    /*
     * Se não foi escolhida a revelação, a carta permanece oculta
     * e bloqueia com 0 ATK / DEF oculta atual.
     */
    return indice;
}
