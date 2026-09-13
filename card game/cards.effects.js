const CardEffects = {
    damageOpponent(context, amount) {
        const target = context.owner === 'p1' ? 'p2' : 'p1';
        const damage = Math.max(0, Number(amount) || 0);

        if (damage <= 0) return false;

        damagePlayer(target, damage);

        if (typeof showToast === 'function') {
            showToast(`${context.card?.name || 'Efeito'}: causou ${damage} de dano direto.`, "success");
        }

        return true;
    },

    healSelf(context, amount) {
        const heal = Math.max(0, Number(amount) || 0);
        if (heal <= 0) return false;

        healPlayer(context.owner, heal);

        if (typeof showToast === 'function') {
            showToast(`${context.card?.name || 'Efeito'}: restaurou ${heal} de vida.`, "success");
        }

        return true;
    },

    buffSelf(context, atkBonus = 0, defBonus = 0) {
        const card = context.card;
        if (!card) return false;

        // Bônus de ATIVO e CAMPO são aplicados apenas uma vez enquanto a carta
        // permanecer em campo. Isso evita somar o mesmo bônus novamente a cada turno.
        if (card._activeStatApplied) return false;

        const atk = Number(atkBonus) || 0;
        const def = Number(defBonus) || 0;

        if (card.atk !== null) {
            card.atk = (Number(card.atk) || 0) + atk;
        }

        card.def = (Number(card.def) || 0) + def;
        card.currentDef = (Number(card.currentDef ?? card.def) || 0) + def;

        card._activeStatApplied = true;

        if (typeof showToast === 'function') {
            const parts = [];
            if (atk !== 0) parts.push(`${atk > 0 ? '+' : ''}${atk} ATK`);
            if (def !== 0) parts.push(`${def > 0 ? '+' : ''}${def} DEF`);
            showToast(`${card.name}: ${parts.join(' / ') || 'efeito aplicado'}.`, "success");
        }

        return true;
    },

    buffOtherCreature(context, defBonus = 2) {
        const owner = context.owner;
        const source = context.card;
        const player = state.players[owner];

        if (!player) return false;

        const field = player.field.filter(c =>
            c &&
            c.type === 'criatura' &&
            !c.isFaceDown &&
            c !== source
        );

        if (!field.length) {
            if (typeof showToast === 'function') {
                showToast('Não há outra criatura aliada para receber o bônus de DEF.', "warning");
            }
            return false;
        }

        // Protege primeiro a criatura aliada com menor DEF atual.
        const target = [...field].sort((a, b) =>
            (Number(a.currentDef ?? a.def) - Number(b.currentDef ?? b.def)) ||
            ((Number(a.atk) || 0) - (Number(b.atk) || 0))
        )[0];

        const bonus = Number(defBonus) || 0;
        target.def = (Number(target.def) || 0) + bonus;
        target.currentDef = (Number(target.currentDef ?? target.def) || 0) + bonus;

        if (typeof showToast === 'function') {
            showToast(
                `${source?.name || 'Efeito'}: ${target.name} recebeu +${bonus} DEF.`,
                "success"
            );
        }

        return true;
    },

    damageEnemyTarget(context, amount) {
        const targetKey = context.owner === 'p1' ? 'p2' : 'p1';
        const enemy = state.players[targetKey];

        if (!enemy) return false;

        const damage = Math.max(0, Number(amount) || 0);
        if (damage <= 0) return false;

        const enemyField = enemy.field.filter(c =>
            c &&
            (c.type === 'criatura' || c.type === 'terreno') &&
            !c.isFaceDown
        );

        // Sem alvo válido, o efeito de dano em criatura não vira dano direto.
        // Isso respeita exatamente o texto da carta.
        if (!enemyField.length) {
            if (typeof showToast === 'function') {
                showToast(`${context.card?.name || 'Efeito'}: não há alvo inimigo válido.`, "warning");
            }
            return false;
        }

        const targetCard = [...enemyField].sort((a, b) =>
            (Number(a.currentDef ?? a.def) - Number(b.currentDef ?? b.def)) ||
            ((Number(a.atk) || 0) - (Number(b.atk) || 0))
        )[0];

        targetCard.currentDef = (Number(targetCard.currentDef ?? targetCard.def) || 0) - damage;

        if (typeof showToast === 'function') {
            showToast(
                `${context.card?.name || 'Efeito'} causou ${damage} dano em ${targetCard.name}.`,
                "success"
            );
        }

        if (targetCard.currentDef <= 0) {
            enemy.field = enemy.field.filter(c => c !== targetCard);
            sendCardToGraveyard(targetCard, targetKey, true);

            if (typeof showToast === 'function') {
                showToast(`${targetCard.name} foi destruído pelo efeito.`, "warning");
            }
        }

        return true;
    },

    stunTarget(context) {
        const targetKey = context.owner === 'p1' ? 'p2' : 'p1';
        const target = state.players[targetKey]?.field.find(c =>
            c.type === 'criatura' && !c.isFaceDown
        );

        if (!target) return false;

        target.isStunned = true;
        target.stunReason = 'effect';
        target.casusBelli = 0;
        target.attackedThisTurn = false;

        if (typeof showToast === 'function') {
            showToast(`${target.name} está atordoada e não pode atacar nem defender.`, "warning");
        }

        return true;
    }
};
