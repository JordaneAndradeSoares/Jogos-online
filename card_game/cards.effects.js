const CardEffects = {
    damageOpponent(context, amount) {
        const alvo = context.owner === 'p1' ? 'p2' : 'p1';
        const dano = Math.max(0, Number(amount) || 0);
        if (dano <= 0) return false;
        damagePlayer(alvo, dano);
        showToast?.(`${context.card?.name || 'Efeito'}: causou ${dano} de dano direto.`, 'success');
        return true;
    },

    healSelf(context, amount) {
        const cura = Math.max(0, Number(amount) || 0);
        if (cura <= 0) return false;
        healPlayer(context.owner, cura);
        showToast?.(`${context.card?.name || 'Efeito'}: restaurou ${cura} de vida.`, 'success');
        return true;
    },

    buffSelf(context, atkBonus = 0, defBonus = 0) {
        const carta = context.card;
        if (!carta) return false;

        const ataque = Number(atkBonus) || 0;
        const defesa = Number(defBonus) || 0;

        if (carta._activeStatApplied) return false;

        if (carta.atk !== null && carta.atk !== undefined) {
            carta.atk = (Number(carta.atk) || 0) + ataque;
        }
        carta.def = (Number(carta.def) || 0) + defesa;
        carta.currentDef = (Number(carta.currentDef ?? carta.def) || 0) + defesa;

        carta._activeStatApplied = true;

        const partes = [];
        if (ataque) partes.push(`${ataque > 0 ? '+' : ''}${ataque} ATK`);
        if (defesa) partes.push(`${defesa > 0 ? '+' : ''}${defesa} DEF`);
        showToast?.(`${carta.name}: ${partes.join(' / ') || 'efeito ativo aplicado'}.`, 'success');
        return true;
    },

    buffTarget(context, defBonus = 1) {
        const alvo = context.targetCard;
        const origem = context.card;
        const jogador = state.players[context.owner];
        if (!alvo || !jogador || !jogador.field.includes(alvo)) return false;
        if (alvo === origem) return false;

        const bonus = Number(defBonus) || 0;
        if (!bonus) return false;

        const eAtivo = context.trigger === 'ativo';

        if (eAtivo) {
            alvo._activeDefModifiers ??= [];
            const existente = alvo._activeDefModifiers.find(modificador => modificador.source === origem);
            if (existente) return false;

            alvo._activeDefModifiers.push({ source: origem, bonus });
        }

        alvo.def = (Number(alvo.def) || 0) + bonus;
        alvo.currentDef = (Number(alvo.currentDef ?? alvo.def) || 0) + bonus;

        showToast?.(`${origem?.name || 'Efeito'}: ${alvo.name} recebeu +${bonus} DEF.`, 'success');
        return true;
    },

    damageTarget(context, amount) {
        const alvo = context.targetCard;
        const donoAlvo = context.targetOwner;
        if (!alvo || !donoAlvo || !state.players[donoAlvo]?.field.includes(alvo)) return false;

        const dano = Math.max(0, Number(amount) || 0);
        if (!dano) return false;

        if (alvo.isFaceDown) {
            showToast?.(`${context.card?.name || 'Efeito'} não pode atingir uma carta virada para baixo.`, 'warning');
            return false;
        }

        alvo.currentDef = (Number(alvo.currentDef ?? alvo.def) || 0) - dano;
        showToast?.(`${context.card?.name || 'Efeito'} causou ${dano} dano em ${alvo.name}.`, 'success');

        if (alvo.currentDef <= 0) {
            state.players[donoAlvo].field = state.players[donoAlvo].field.filter(carta => carta !== alvo);
            sendCardToGraveyard(alvo, donoAlvo, true);
            showToast?.(`${alvo.name} foi destruída pelo efeito.`, 'warning');
        }
        return true;
    },

    stunTarget(context) {
        const alvo = context.targetCard;
        const donoAlvo = context.targetOwner;
        if (!alvo || !donoAlvo || !state.players[donoAlvo]?.field.includes(alvo)) return false;
        if (alvo.type !== 'criatura' || alvo.isFaceDown) return false;

        alvo.isStunned = true;
        alvo.stunReason = 'effect';
        alvo.casusBelli = 0;
        alvo.attackedThisTurn = false;
        showToast?.(`${alvo.name} está atordoada e não pode atacar nem defender.`, 'warning');
        return true;
    }
};

function removerEfeitosAtivosDaCarta(carta) {
    if (!carta) return;

    if (carta._activeDefModifiers?.length) {
        for (const modificador of carta._activeDefModifiers) {
            const origem = modificador.source;
            if (!origem) continue;
            origem._activeTarget = origem._activeTarget === carta ? null : origem._activeTarget;
        }
        carta._activeDefModifiers = [];
    }

    for (const jogador of Object.values(state.players || {})) {
        for (const outraCarta of jogador.field || []) {
            if (!outraCarta?._activeDefModifiers?.length) continue;
            const modificadoresRestantes = outraCarta._activeDefModifiers.filter(modificador => modificador.source !== carta);
            const removidos = outraCarta._activeDefModifiers.filter(modificador => modificador.source === carta);
            for (const modificador of removidos) {
                outraCarta.def = (Number(outraCarta.def) || 0) - modificador.bonus;
                outraCarta.currentDef = (Number(outraCarta.currentDef ?? outraCarta.def) || 0) - modificador.bonus;
            }
            outraCarta._activeDefModifiers = modificadoresRestantes;
        }
    }

    carta._activeStatApplied = false;
    carta._activeTickedTurn = null;
    carta._activeTarget = null;
}
