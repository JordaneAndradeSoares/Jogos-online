function obterCartasJogaveisDoInimigo() {
    const jogadorInimigo = state.players.p2;

    return jogadorInimigo.hand
        .map((carta, indice) => ({ carta, indice }))
        .filter(({ carta }) => {
            if (jogadorInimigo.energy < obterCustoDaCartaInimiga(carta)) {
                return false;
            }

            if (carta.type === 'efeito') {
                return true;
            }

            return jogadorInimigo.field.length < 6;
        });
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
    const custo = obterCustoDaCartaInimiga(carta);

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

function jogarCartaDoInimigo(indiceDaCarta) {
    const jogadorInimigo = state.players.p2;

    if (
        indiceDaCarta < 0 ||
        indiceDaCarta >= jogadorInimigo.hand.length
    ) {
        return false;
    }

    const carta = jogadorInimigo.hand[indiceDaCarta];
    const custo = obterCustoDaCartaInimiga(carta);

    if (jogadorInimigo.energy < custo) {
        return false;
    }

    if (
        carta.type !== 'efeito' &&
        jogadorInimigo.field.length >= 6
    ) {
        return false;
    }

    jogadorInimigo.hand.splice(indiceDaCarta, 1);
    jogadorInimigo.energy -= custo;

    if (carta.type === 'efeito') {
        triggerEffect('campo', carta, {
            owner: 'p2',
            card: carta
        });

        sendCardToGraveyard(carta, 'p2', false);

        if (carta.gatilho === 'ativo') {
            triggerEffect('ativo', carta, {
                owner: 'p2',
                card: carta
            });
        }
    } else {
        carta.summonedTurn = state.turn;
        carta.isFaceDown = false;
        carta._activeStatApplied = false;
        carta._activeTickedTurn = null;
        carta.isResting = false;
        carta.isStunned = false;
        carta.stunReason = null;

        if (carta.type === 'criatura') {
            carta.casusBelli = 1;
        }

        jogadorInimigo.field.push(carta);

        triggerEffect('campo', carta, {
            owner: 'p2',
            card: carta
        });

        if (carta.gatilho === 'ativo') {
            triggerEffect('ativo', carta, {
                owner: 'p2',
                card: carta
            });
        }
    }

    if (typeof showToast === 'function') {
        showToast(`Inimigo jogou ${carta.name}.`, 'info');
    }

    registerActionDone('p2');
    return true;
}
