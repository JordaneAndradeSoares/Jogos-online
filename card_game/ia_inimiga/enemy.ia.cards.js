function obterCartasJogaveisDoInimigo() {
    const jogadorInimigo = state.players.p2;

    return jogadorInimigo.hand
        .map((carta, indice) => ({ carta, indice }))
        .filter(({ carta }) => {
            return (
                jogadorInimigoPodeJogarCarta(carta, false) ||
                jogadorInimigoPodeJogarCarta(carta, true)
            );
        });
}

function jogadorInimigoPodeJogarCarta(carta, faceDown = false) {
    return jogadorPodeJogarCarta('p2', carta, faceDown);
}

function avaliarJogadaDaCartaInimiga(carta) {
    if (!carta) return -Infinity;

    if (carta.type === 'efeito') {
        if (carta.name === 'Nanorreparo') {
            return state.players.p2.life <= 16 ? 8 : 1;
        }

        if (carta.name === 'Campo Defletor') {
            return state.players.p2.field.some(cartaDoCampo => {
                return cartaDoCampo.type === 'criatura';
            }) ? 7 : 0;
        }

        return 6 + obterCustoDaCartaInimiga(carta);
    }

    const ataque = obterAtaqueDaCartaInimiga(carta);
    const defesa = obterDefesaDaCartaInimiga(carta);
    const custo = obterCustoOriginalDaCarta(carta);

    let valor = ataque * 2 + defesa + custo;

    if (carta.effects && carta.effects.campo) {
        valor += 4;
    }

    if (carta.type === 'terreno') {
        valor += Math.max(2, defesa);
    }

    return valor;
}

function escolherMelhorCartaDoInimigo() {
    const cartasJogaveis = obterCartasJogaveisDoInimigo();

    if (!cartasJogaveis.length) {
        return null;
    }

    cartasJogaveis.sort((primeira, segunda) => {
        return (
            avaliarJogadaDaCartaInimiga(segunda.carta) -
            avaliarJogadaDaCartaInimiga(primeira.carta)
        );
    });

    return cartasJogaveis[0];
}

function decidirSeInimigoJogaCartaOculta(carta) {
    if (!carta) return false;
    if (carta.type !== 'criatura' && carta.type !== 'terreno') {
        return false;
    }

    const jogadorInimigo = state.players.p2;
    const custo = obterCustoOriginalDaCarta(carta);

    // Se não puder pagar, a única implantação possível é oculta.
    if (jogadorInimigo.energy < custo) {
        return true;
    }

    // Com pouca energia, a IA pode preservar recursos usando uma unidade oculta.
    if (jogadorInimigo.energy <= 2 && custo >= 2) {
        return true;
    }

    return false;
}

function jogarCartaDoInimigo(indiceDaCarta) {
    const jogadorInimigo = state.players.p2;

    if (
        indiceDaCarta < 0 ||
        indiceDaCarta >= jogadorInimigo.hand.length
    ) {
        return false;
    }

    const carta = jogadorInimigo.hand[indiceDaCarta];
    const faceDown = decidirSeInimigoJogaCartaOculta(carta);

    if (!jogadorInimigoPodeJogarCarta(carta, faceDown)) {
        // Se a implantação oculta não for escolhida, tenta a implantação normal.
        if (
            faceDown ||
            !jogadorInimigoPodeJogarCarta(carta, false)
        ) {
            return false;
        }
    }

    const custo = obterCustoOriginalDaCarta(carta);

    jogadorInimigo.hand.splice(indiceDaCarta, 1);

    if (carta.type === 'efeito') {
        jogadorInimigo.energy -= custo;

        triggerEffect(
            'campo',
            carta,
            {
                owner: 'p2',
                card: carta
            }
        );

        sendCardToGraveyard(carta, 'p2', false);

        if (typeof showToast === 'function') {
            showToast(
                `Inimigo usou a tecnologia ${carta.name}.`,
                'info'
            );
        }
    } else if (faceDown) {
        prepararCartaFaceDown(carta, jogadorInimigo);
        jogadorInimigo.field.push(carta);

        if (typeof showToast === 'function') {
            showToast(
                `Inimigo implantou ${carta.name} oculta.`,
                'info'
            );
        }
    } else {
        if (!prepararCartaFaceUp(carta, jogadorInimigo)) {
            jogadorInimigo.hand.push(carta);
            return false;
        }

        jogadorInimigo.field.push(carta);
        gainEnergyFromCard(jogadorInimigo, carta);

        triggerEffect(
            'campo',
            carta,
            {
                owner: 'p2',
                card: carta
            }
        );

        if (carta.gatilho === 'ativo') {
            triggerEffect(
                'ativo',
                carta,
                {
                    owner: 'p2',
                    card: carta
                }
            );
        }

        if (typeof showToast === 'function') {
            showToast(
                `Inimigo implantou ${carta.name}.`,
                'info'
            );
        }
    }

    registerActionDone('p2');
    return true;
}

function escolherMelhorCartaOcultaDoInimigo() {
    const cartasOcultas = state.players.p2.field
        .map((carta, indice) => ({ carta, indice }))
        .filter(({ carta }) => {
            return (
                carta &&
                carta.isFaceDown &&
                carta.type === 'criatura' &&
                state.players.p2.energy >= obterCustoOriginalDaCarta(carta)
            );
        });

    if (!cartasOcultas.length) {
        return null;
    }

    cartasOcultas.sort((primeira, segunda) => {
        return (
            obterAtaqueDaCartaInimiga(segunda.carta) * 2 +
            obterDefesaDaCartaInimiga(segunda.carta) -
            (
                obterAtaqueDaCartaInimiga(primeira.carta) * 2 +
                obterDefesaDaCartaInimiga(primeira.carta)
            )
        );
    });

    return cartasOcultas[0];
}

function revelarMelhorCartaOcultaDoInimigo() {
    const escolha = escolherMelhorCartaOcultaDoInimigo();

    if (!escolha) return false;

    const revelada = revealFaceDownCard(
        escolha.indice,
        'p2'
    );

    if (revelada && typeof showToast === 'function') {
        showToast(
            `Inimigo revelou ${escolha.carta.name}.`,
            'info'
        );
    }

    if (revelada) {
        registerActionDone('p2');
    }

    return revelada;
}
