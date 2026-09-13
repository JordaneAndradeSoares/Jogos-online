const CardEffects = {

    /*
     * DANO DIRETO AO JOGADOR INIMIGO
     */
    damageOpponent(context, amount) {
        if (!context || !context.owner) {
            return false;
        }

        const jogadorAlvo =
            context.owner === 'p1'
                ? 'p2'
                : 'p1';

        const dano =
            Math.max(
                0,
                Number(amount) || 0
            );

        if (dano <= 0) {
            return false;
        }

        if (
            typeof damagePlayer !== 'function'
        ) {
            console.error(
                'A função damagePlayer não está disponível.'
            );

            return false;
        }

        damagePlayer(
            jogadorAlvo,
            dano
        );

        showToast?.(
            `${context.card?.name || 'Efeito'}: causou ${dano} de dano direto.`,
            'success'
        );

        return true;
    },

    /*
     * CURA O PRÓPRIO JOGADOR
     */
    healSelf(context, amount) {
        if (!context || !context.owner) {
            return false;
        }

        const cura =
            Math.max(
                0,
                Number(amount) || 0
            );

        if (cura <= 0) {
            return false;
        }

        if (
            typeof healPlayer !== 'function'
        ) {
            console.error(
                'A função healPlayer não está disponível.'
            );

            return false;
        }

        healPlayer(
            context.owner,
            cura
        );

        showToast?.(
            `${context.card?.name || 'Efeito'}: restaurou ${cura} de vida.`,
            'success'
        );

        return true;
    },

    /*
     * AUMENTA ATK/DEF DA PRÓPRIA CARTA
     */
    buffSelf(
        context,
        atkBonus = 0,
        defBonus = 0
    ) {
        const carta =
            context?.card;

        if (!carta) {
            return false;
        }

        const ataque =
            Number(atkBonus) || 0;

        const defesa =
            Number(defBonus) || 0;

        if (
            ataque === 0 &&
            defesa === 0
        ) {
            return false;
        }

        /*
         * Efeito ativo não deve ser aplicado
         * várias vezes à mesma carta.
         */
        if (
            context.trigger === 'ativo' &&
            carta._activeStatApplied
        ) {
            return false;
        }

        /*
         * ATK
         */
        if (
            ataque !== 0 &&
            carta.atk !== null &&
            carta.atk !== undefined
        ) {
            carta.atk =
                (Number(carta.atk) || 0) +
                ataque;
        }

        /*
         * DEF
         */
        if (defesa !== 0) {

            carta.def =
                (Number(carta.def) || 0) +
                defesa;

            carta.currentDef =
                (
                    Number(
                        carta.currentDef ??
                        carta.def
                    ) || 0
                ) + defesa;
        }

        if (
            context.trigger === 'ativo'
        ) {
            carta._activeStatApplied = true;
        }

        const partes = [];

        if (ataque !== 0) {
            partes.push(
                `${ataque > 0 ? '+' : ''}${ataque} ATK`
            );
        }

        if (defesa !== 0) {
            partes.push(
                `${defesa > 0 ? '+' : ''}${defesa} DEF`
            );
        }

        showToast?.(
            `${carta.name}: ${partes.join(' / ')}.`,
            'success'
        );

        return true;
    },

    /*
     * AUMENTA A DEFESA DE UMA CARTA ESCOLHIDA
     *
     * Pode atingir:
     * - carta aliada;
     * - carta inimiga;
     * - carta virada para baixo;
     *
     * desde que a função de seleção de alvo tenha permitido
     * aquele alvo.
     */
    buffTarget(
        context,
        defBonus = 1
    ) {
        const alvo =
            context?.targetCard;

        const donoAlvo =
            context?.targetOwner;

        const origem =
            context?.card;

        if (
            !alvo ||
            !donoAlvo ||
            !origem
        ) {
            return false;
        }

        const jogadorAlvo =
            state.players?.[donoAlvo];

        if (!jogadorAlvo) {
            return false;
        }

        /*
         * O alvo precisa realmente estar no campo.
         */
        if (
            !Array.isArray(jogadorAlvo.field) ||
            !jogadorAlvo.field.includes(alvo)
        ) {
            return false;
        }

        /*
         * Uma carta não pode escolher a si mesma
         * quando o efeito exige "outra carta".
         */
        if (
            alvo === origem &&
            /\boutra\b/i.test(
                String(origem.desc || '')
            )
        ) {
            return false;
        }

        const bonus =
            Number(defBonus) || 0;

        if (bonus === 0) {
            return false;
        }

        /* 
         * EFEITO ATIVO
         *
         * Guardamos a origem do bônus para podermos remover
         * corretamente o bônus quando a carta que gerou o efeito
         * sair do campo.
         */
        if (
            context.trigger === 'ativo'
        ) {

            if (
                !Array.isArray(
                    alvo._activeDefModifiers
                )
            ) {
                alvo._activeDefModifiers = [];
            }


            const modificadorExistente =
                alvo._activeDefModifiers.find(
                    modificador =>
                        modificador.source === origem
                );

            if (modificadorExistente) {
                return false;
            }

            alvo._activeDefModifiers.push({
                source: origem,
                bonus
            });
        }

        /*
         * CARTA VIRADA PARA BAIXO
         *
         * O bônus precisa continuar existindo enquanto a carta
         * estiver escondida.
         */
        if (
            alvo.isFaceDown
        ) {

            const defesaOcultaAtual =
                Number(
                    alvo._faceDownOriginalDef
                ) || 0;

            const defesaAtualOculta =
                Number(
                    alvo._faceDownOriginalCurrentDef ??
                    defesaOcultaAtual
                ) || 0;


            alvo._faceDownOriginalDef =
                defesaOcultaAtual +
                bonus;

            alvo._faceDownOriginalCurrentDef =
                defesaAtualOculta +
                bonus;
        }

        /*         
         * CARTA REVELADA
         */
        else {

            alvo.def =
                (Number(alvo.def) || 0) +
                bonus;

            alvo.currentDef =
                (
                    Number(
                        alvo.currentDef ??
                        alvo.def
                    ) || 0
                ) + bonus;
        }

        showToast?.(
            `${origem.name}: ${alvo.name} recebeu ${bonus > 0 ? '+' : ''}${bonus} DEF.`,
            'success'
        );

        return true;
    },

    /*
     * CAUSA DANO A UMA CARTA ESCOLHIDA
     *
     * Pode atingir:
     * - cartas aliadas;
     * - cartas inimigas;
     * - cartas viradas para baixo;
     *
     * conforme o alvo autorizado pelo sistema de gatilhos.
     */
    damageTarget(
        context,
        amount
    ) {
        const alvo =
            context?.targetCard;

        const donoAlvo =
            context?.targetOwner;

        if (
            !alvo ||
            !donoAlvo
        ) {
            return false;
        }

        const jogadorAlvo =
            state.players?.[donoAlvo];

        if (!jogadorAlvo) {
            return false;
        }

        /*
         * Confirma que a carta ainda está no campo.
         */
        if (
            !Array.isArray(jogadorAlvo.field) ||
            !jogadorAlvo.field.includes(alvo)
        ) {
            return false;
        }

        const dano =
            Math.max(
                0,
                Number(amount) || 0
            );

        if (dano <= 0) {
            return false;
        }


        /*
         * CARTA VIRADA PARA BAIXO
         *
         * Não revelamos a carta.
         *
         * O dano é armazenado nos valores ocultos.
         */
        if (
            alvo.isFaceDown
        ) {

            let defesaAtual =
                Number(
                    alvo._faceDownOriginalCurrentDef
                );

            if (
                !Number.isFinite(defesaAtual)
            ) {
                defesaAtual =
                    Number(
                        alvo._faceDownOriginalDef
                    );

                if (
                    !Number.isFinite(defesaAtual)
                ) {
                    defesaAtual = 1;
                }
            }

            defesaAtual -= dano;


            alvo._faceDownOriginalCurrentDef =
                defesaAtual;

            showToast?.(
                `${context.card?.name || 'Efeito'} causou ${dano} de dano em uma carta virada para baixo.`,
                'success'
            );

            /*
             * Se a defesa chegou a zero,
             * a carta é destruída sem ser revelada.
             */
            if (
                defesaAtual <= 0
            ) {

                removerEfeitosAtivosDaCarta(
                    alvo
                );

                jogadorAlvo.field =
                    jogadorAlvo.field.filter(
                        cartaDoCampo =>
                            cartaDoCampo !== alvo
                    );

                if (
                    typeof sendCardToGraveyard === 'function'
                ) {
                    sendCardToGraveyard(
                        alvo,
                        donoAlvo,
                        true
                    );
                }

                showToast?.(
                    `Uma carta virada para baixo foi destruída pelo efeito.`,
                    'warning'
                );
            }

            return true;
        }

        /*        
         * CARTA REVELADA
         */
        const defesaAnterior =
            Number(
                alvo.currentDef ??
                alvo.def
            ) || 0;

        alvo.currentDef =
            defesaAnterior -
            dano;

        showToast?.(
            `${context.card?.name || 'Efeito'} causou ${dano} de dano em ${alvo.name}.`,
            'success'
        );

        /*
         * A carta é destruída quando sua DEF chega a zero.
         */
        if (
            alvo.currentDef <= 0
        ) {

            removerEfeitosAtivosDaCarta(
                alvo
            );

            jogadorAlvo.field =
                jogadorAlvo.field.filter(
                    cartaDoCampo =>
                        cartaDoCampo !== alvo
                );

            if (
                typeof sendCardToGraveyard === 'function'
            ) {
                sendCardToGraveyard(
                    alvo,
                    donoAlvo,
                    true
                );
            }

            showToast?.(
                `${alvo.name} foi destruída pelo efeito.`,
                'warning'
            );
        }

        return true;
    },

    /*    
     * ATORDOA UMA CARTA
     *
     * Atordoamento só pode existir no campo.
     */
    stunTarget(context) {
        const alvo =
            context?.targetCard;

        const donoAlvo =
            context?.targetOwner;

        if (
            !alvo ||
            !donoAlvo
        ) {
            return false;
        }

        const jogadorAlvo =
            state.players?.[donoAlvo];

        if (!jogadorAlvo) {
            return false;
        }

        /*
         * Uma carta na mão nunca pode ficar atordoada.
         */
        if (
            !Array.isArray(jogadorAlvo.field) ||
            !jogadorAlvo.field.includes(alvo)
        ) {
            return false;
        }

        /*
         * Apenas criaturas podem ser atordoadas.
         */
        if (
            alvo.type !== 'criatura'
        ) {
            return false;
        }

        alvo.isStunned = true;

        alvo.stunReason =
            'effect';

        alvo.casusBelli =
            0;

        alvo.attackedThisTurn =
            false;


        showToast?.(
            `${alvo.name} está atordoada.`,
            'warning'
        );

        return true;
    }
};

/*
 * REMOVE EFEITOS ATIVOS DE UMA CARTA
 *
 * É chamada quando uma carta sai do campo.
 */
function removerEfeitosAtivosDaCarta(carta) {

    if (!carta) {
        return;
    }

    /*    
     * REMOVE BÔNUS QUE ESTA CARTA RECEBEU
     */
    if (
        Array.isArray(carta._activeDefModifiers) &&
        carta._activeDefModifiers.length > 0
    ) {

        for (
            const modificador
            of carta._activeDefModifiers
        ) {

            const origem =
                modificador?.source;

            if (!origem) {
                continue;
            }

            /*
             * A origem deixa de apontar para esta carta.
             */
            if (
                origem._activeTarget === carta
            ) {
                origem._activeTarget =
                    null;

                origem._activeTargetOwner =
                    null;
            }
        }

        carta._activeDefModifiers = [];
    }

    /*
     * REMOVE OS BÔNUS QUE ESTA CARTA ESTAVA CONCEDENDO
     *
     * Procuramos nos dois campos porque o alvo pode ser:
     * - aliado;
     * - inimigo.
     */
    for (
        const jogador
        of Object.values(
            state.players || {}
        )
    ) {

        if (
            !Array.isArray(jogador.field)
        ) {
            continue;
        }

        for (
            const outraCarta
            of jogador.field
        ) {

            if (
                !outraCarta ||
                !Array.isArray(
                    outraCarta._activeDefModifiers
                )
            ) {
                continue;
            }

            const modificadoresRemovidos =
                outraCarta._activeDefModifiers.filter(
                    modificador =>
                        modificador?.source === carta
                );

            if (
                modificadoresRemovidos.length === 0
            ) {
                continue;
            }

            const modificadoresRestantes =
                outraCarta._activeDefModifiers.filter(
                    modificador =>
                        modificador?.source !== carta
                );

            /*
             * Remove cada bônus concedido pela carta.
             */
            for (
                const modificador
                of modificadoresRemovidos
            ) {

                const bonus =
                    Number(
                        modificador.bonus
                    ) || 0;

                if (
                    outraCarta.isFaceDown
                ) {

                    outraCarta._faceDownOriginalDef =
                        (
                            Number(
                                outraCarta._faceDownOriginalDef
                            ) || 0
                        ) - bonus;

                    outraCarta._faceDownOriginalCurrentDef =
                        (
                            Number(
                                outraCarta._faceDownOriginalCurrentDef ??
                                outraCarta._faceDownOriginalDef
                            ) || 0
                        ) - bonus;
                }

                else {

                    outraCarta.def =
                        (
                            Number(
                                outraCarta.def
                            ) || 0
                        ) - bonus;


                    outraCarta.currentDef =
                        (
                            Number(
                                outraCarta.currentDef ??
                                outraCarta.def
                            ) || 0
                        ) - bonus;
                }
            }

            outraCarta._activeDefModifiers =
                modificadoresRestantes;

            /*
             * Se não sobrou nenhum modificador,
             * limpamos o array.
             */
            if (
                outraCarta._activeDefModifiers.length === 0
            ) {
                outraCarta._activeDefModifiers = [];
            }
        }
    }

    /*
     * LIMPA ESTADOS DA PRÓPRIA CARTA
     */
    carta._activeStatApplied =
        false;

    carta._activeTickedTurn =
        null;

    carta._activeTarget =
        null;

    carta._activeTargetOwner =
        null;
}