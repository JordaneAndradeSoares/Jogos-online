const GATILHOS_EFEITOS = Object.freeze([
    'campo',
    'destruido',
    'ativo',
    'custo'
]);

/*
 * Normaliza a descrição para facilitar a interpretação
 * dos efeitos independentemente de acentos e maiúsculas.
 */
function normalizarDescricaoEfeito(descricao) {
    return String(descricao || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

/*
 * Descobre o gatilho da carta.
 */
function obterGatilhoDaCarta(carta) {
    if (!carta) return null;

    if (GATILHOS_EFEITOS.includes(carta.gatilho)) {
        return carta.gatilho;
    }

    const descricao =
        normalizarDescricaoEfeito(carta.desc);

    if (descricao.includes('[campo]')) {
        return 'campo';
    }

    if (descricao.includes('[destruido]')) {
        return 'destruido';
    }

    if (descricao.includes('[ativo]')) {
        return 'ativo';
    }

    /*
     * CUSTO X
     *
     * É um efeito ativável manualmente. O X pode ser:
     * - um número escrito na descrição; ou
     * - o placeholder X, caso a carta use o custo da própria carta
     *   (ou activationCost/activeCost, quando informado).
     */
    if (
        /(?:\[\s*)?custo\s+(?:x|\d+)(?:\s*\])?/i.test(
            String(carta.desc || '')
        ) ||
        String(carta.gatilho || '').toLowerCase() === 'custo'
    ) {
        return 'custo';
    }

    return null;
}


/*
 * Descobre se o efeito precisa que o jogador
 * escolha uma carta no campo.
 */
function efeitoPrecisaDeAlvo(carta) {
    if (!carta) return false;

    const descricao =
        normalizarDescricaoEfeito(carta.desc);

    /*
     * Efeitos que mencionam explicitamente
     * uma carta ou criatura como alvo.
     */
    const possuiExpressaoDeAlvo =
        /\b(?:uma|outra)?\s*(?:carta|criatura)\b/.test(descricao);

    /*
     * Efeitos que causam dano a uma carta/criatura.
     */
    const causaDanoEmCarta =
        /causa\s+\d+\s+dano\s+a\s+(?:uma\s+)?(?:carta|criatura)/.test(
            descricao
        );

    /*
     * Efeitos que dão bônus para outra carta/criatura.
     */
    const concedeBonus =
        /(?:outra\s+)?(?:carta|criatura).*\b(?:recebe|ganha)\b/.test(
            descricao
        );

    /*
     * Efeitos de atordoamento.
     */
    const atordoaCarta =
        /\batordoa\b/.test(descricao) &&
        /\b(?:carta|criatura)\b/.test(descricao);

    return (
        possuiExpressaoDeAlvo ||
        causaDanoEmCarta ||
        concedeBonus ||
        atordoaCarta
    );
}


/*
 * Analisa exatamente QUEM pode ser escolhido.
 *
 * Resultado:
 *
 * {
 *     tipo: 'carta' | 'criatura',
 *     lado: 'aliado' | 'inimigo' | 'qualquer'
 * }
 */
function obterRestricaoDeAlvoDoEfeito(carta) {
    const descricao =
        normalizarDescricaoEfeito(carta?.desc);

    const eCriatura =
        /\bcriatura\b/.test(descricao);

    const eCarta =
        /\bcarta\b/.test(descricao);

    let lado = 'qualquer';

    /*
     * Aliados.
     */
    if (
        /carta\s+do\s+seu\s+campo/.test(descricao) ||
        /criatura\s+do\s+seu\s+campo/.test(descricao) ||
        /sua\s+carta/.test(descricao) ||
        /sua\s+criatura/.test(descricao) ||
        /carta\s+aliada/.test(descricao) ||
        /criatura\s+aliada/.test(descricao)
    ) {
        lado = 'aliado';
    }

    /*
     * Inimigos.
     */
    else if (
        /carta\s+inimiga/.test(descricao) ||
        /criatura\s+inimiga/.test(descricao) ||
        /carta\s+do\s+jogador\s+inimigo/.test(descricao) ||
        /criatura\s+do\s+jogador\s+inimigo/.test(descricao)
    ) {
        lado = 'inimigo';
    }

    return {
        tipo: eCriatura && !eCarta
            ? 'criatura'
            : 'carta',

        lado
    };
}


/*
 * Retorna todas as cartas que podem ser escolhidas
 * como alvo.
 */
function obterAlvosValidosDoEfeito(carta, owner) {
    if (!carta || !owner) {
        return [];
    }

    const restricao =
        obterRestricaoDeAlvoDoEfeito(carta);

    const donoInimigo =
        owner === 'p1'
            ? 'p2'
            : 'p1';

    let donosPermitidos = [];

    if (restricao.lado === 'aliado') {
        donosPermitidos = [owner];
    }

    else if (restricao.lado === 'inimigo') {
        donosPermitidos = [donoInimigo];
    }

    else {
        donosPermitidos = [
            owner,
            donoInimigo
        ];
    }

    const alvos = [];

    for (const donoAlvo of donosPermitidos) {
        const jogadorAlvo =
            state.players[donoAlvo];

        if (!jogadorAlvo) {
            continue;
        }

        const campo =
            jogadorAlvo.field || [];

        campo.forEach((cartaDoCampo, indice) => {
            if (!cartaDoCampo) {
                return;
            }

            /*
             * A carta que originou o efeito não pode
             * ser escolhida quando a descrição diz "outra".
             */
            if (
                cartaDoCampo === carta &&
                /\boutra\b/.test(
                    normalizarDescricaoEfeito(carta.desc)
                )
            ) {
                return;
            }

            /*
             * Se o efeito exige uma criatura,
             * terrenos não podem ser escolhidos.
             */
            if (
                restricao.tipo === 'criatura' &&
                cartaDoCampo.type !== 'criatura'
            ) {
                return;
            }

            alvos.push({
                carta: cartaDoCampo,
                owner: donoAlvo,
                index: indice
            });
        });
    }

    return alvos;
}



/*
 * Retorna o custo de ativação de um efeito "Custo X".
 *
 * Prioridade:
 * 1. activationCost / activeCost / custoAtivacao, se a carta definir;
 * 2. número escrito depois de "Custo";
 * 3. custo original da própria carta quando estiver escrito "Custo X".
 */
function obterCustoDeAtivacao(carta) {
    if (!carta) return 0;

    const custoConfigurado =
        carta.activationCost ??
        carta.activeCost ??
        carta.custoAtivacao;

    if (
        custoConfigurado !== undefined &&
        custoConfigurado !== null &&
        Number.isFinite(Number(custoConfigurado))
    ) {
        return Math.max(0, Number(custoConfigurado));
    }

    const descricao = String(carta.desc || '');
    const correspondencia = descricao.match(
        /(?:\[\s*)?custo\s+(\d+)(?:\s*\])?/i
    );

    if (correspondencia) {
        return Math.max(0, Number(correspondencia[1]) || 0);
    }

    return typeof obterCustoOriginalDaCarta === 'function'
        ? obterCustoOriginalDaCarta(carta)
        : Math.max(0, Number(carta.cost) || 0);
}

/*
 * Texto visível da carta:
 * "Custo X" -> "Custo <valor>".
 *
 * A descrição original continua intacta para o parser dos efeitos.
 */
function obterDescricaoVisivelDaCarta(carta) {
    if (!carta) return '';

    const descricao = String(carta.desc || '');
    const gatilho = obterGatilhoDaCarta(carta);

    if (gatilho !== 'custo') {
        return descricao;
    }

    const custo = obterCustoDeAtivacao(carta);

    return descricao.replace(
        /custo\s+(?:x|\d+)/i,
        `Custo ${custo}`
    );
}

function efeitoCustoPodeSerAtivado(carta, owner = 'p1') {
    if (!carta || obterGatilhoDaCarta(carta) !== 'custo') {
        return false;
    }

    if (carta.isFaceDown) return false;

    const jogador = state.players?.[owner];
    if (!jogador) return false;

    if (!Array.isArray(jogador.field) || !jogador.field.includes(carta)) {
        return false;
    }

    if (state.initiativeOwner !== owner) return false;
    if (state.activeAttack) return false;
    if (state.pendingDiscard?.[owner]) return false;

    const custo = obterCustoDeAtivacao(carta);

    if (Number(jogador.energy) < custo) return false;

    if (carta._activeCostUsedTurn === state.turn) {
        return false;
    }

    /*
     * Se o efeito precisa de alvo, também não consideramos o botão
     * disponível quando não existe nenhum alvo válido.
     */
    if (
        typeof efeitoPrecisaDeAlvo === 'function' &&
        efeitoPrecisaDeAlvo(carta)
    ) {
        const alvos = typeof obterAlvosValidosDoEfeito === 'function'
            ? obterAlvosValidosDoEfeito(carta, owner)
            : [];

        if (!alvos.length) return false;
    }

    return true;
}

/*
 * Cria a função que executa o texto da carta.
 */
/*
 * Cria a função que executa o texto da carta.
 */
function criarFuncaoDoEfeito(carta) {
    const descricao =
        normalizarDescricaoEfeito(carta.desc);

    return contexto => {

        /*
         * DANO DIRETO AO JOGADOR
         */
        let correspondencia =
            descricao.match(
                /causa\s+(\d+)\s+dano\s+direto\s+ao\s+jogador\s+inimigo/
            );

        if (correspondencia) {
            return CardEffects.damageOpponent(
                contexto,
                Number(correspondencia[1])
            );
        }


        /*
         * DANO A CARTA/CRIATURA
         */
        correspondencia =
            descricao.match(
                /causa\s+(\d+)\s+dano\s+a\s+(?:uma\s+)?(?:carta|criatura)/
            );

        if (correspondencia) {
            return CardEffects.damageTarget(
                contexto,
                Number(correspondencia[1])
            );
        }


        /*
         * CURA O JOGADOR
         */
        correspondencia =
            descricao.match(
                /restaura\s+(\d+)\s+de\s+vida\s+do\s+seu\s+jogador/
            );

        if (correspondencia) {
            return CardEffects.healSelf(
                contexto,
                Number(correspondencia[1])
            );
        }


        /*
         * OUTRA CARTA/CRIATURA RECEBE DEFESA
         */
        correspondencia =
            descricao.match(
                /(?:outra\s+)?(?:carta|criatura).*recebe\s+\+(\d+)\s+def/
            );

        if (correspondencia) {
            return CardEffects.buffTarget(
                contexto,
                Number(correspondencia[1])
            );
        }


        /*
         * ATK + DEF DA PRÓPRIA CARTA
         *
         * Importante:
         * Este teste precisa vir antes dos testes individuais.
         *
         * Exemplo:
         * "[Custo X] Recebe +3 ATK e +1 DEF"
         *
         * Os dois valores são aplicados na mesma ativação.
         */
        let atkDef =
            descricao.match(
                /\+(\d+)\s+atk.*\+(\d+)\s+def/
            );

        if (atkDef) {
            return CardEffects.buffSelf(
                contexto,
                Number(atkDef[1]),
                Number(atkDef[2])
            );
        }


        /*
         * DEF + ATK DA PRÓPRIA CARTA
         *
         * Mantém o parser funcionando caso alguma carta
         * seja escrita na ordem inversa:
         *
         * "+1 DEF e +3 ATK"
         */
        let defAtk =
            descricao.match(
                /\+(\d+)\s+def.*\+(\d+)\s+atk/
            );

        if (defAtk) {
            return CardEffects.buffSelf(
                contexto,
                Number(defAtk[2]),
                Number(defAtk[1])
            );
        }


        /*
         * ATK
         */
        correspondencia =
            descricao.match(
                /\+(\d+)\s+atk/
            );

        if (correspondencia) {
            return CardEffects.buffSelf(
                contexto,
                Number(correspondencia[1]),
                0
            );
        }


        /*
         * DEF
         */
        correspondencia =
            descricao.match(
                /\+(\d+)\s+def/
            );

        if (correspondencia) {
            return CardEffects.buffSelf(
                contexto,
                0,
                Number(correspondencia[1])
            );
        }


        /*
         * ATORDOAMENTO
         */
        if (
            descricao.includes('atordoa')
        ) {
            return CardEffects.stunTarget(
                contexto
            );
        }


        console.warn(
            `Efeito sem implementação para "${carta.name}": ${carta.desc}`
        );

        return false;
    };
}

/*
 * Cria os efeitos da carta.
 */
function criarEfeitosDaCarta(carta) {
    const gatilho =
        obterGatilhoDaCarta(carta);

    if (!gatilho) {
        return {};
    }

    return {
        [gatilho]:
            criarFuncaoDoEfeito(carta)
    };
}


/*
 * Anexa os gatilhos à carta.
 */
function anexarGatilhosNaCarta(carta) {
    if (!carta) {
        return carta;
    }

    carta.gatilho =
        obterGatilhoDaCarta(carta);

    carta.effects =
        criarEfeitosDaCarta(carta);

    return carta;
}


function attachTriggersToCard(card) {
    return anexarGatilhosNaCarta(card);
}