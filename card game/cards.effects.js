const CardEffects = {
    damageOpponent(context, amount) {
        const target = context.owner === 'p1' ? 'p2' : 'p1';
        damagePlayer(target, amount);
        if (typeof showToast === 'function') showToast(`Efeito: ${amount} de dano direto.`, "success");
    },

    healSelf(context, amount) {
        healPlayer(context.owner, amount);
        if (typeof showToast === 'function') showToast(`Efeito: +${amount} de vida.`, "success");
    },

    buffSelf(context, atkBonus = 0, defBonus = 0) {
        const card = context.card;
        if (!card) return;
        card.atk = (card.atk === null ? 0 : card.atk) + atkBonus;
        card.def = (card.def === null ? 0 : card.def) + defBonus;
        card.currentDef = (card.currentDef === null ? 0 : card.currentDef) + defBonus;
        if (typeof showToast === 'function') showToast(`${card.name}: ${atkBonus >= 0 ? '+' : ''}${atkBonus} ATK / ${defBonus >= 0 ? '+' : ''}${defBonus} DEF.`, "success");
    },


    buffOtherCreature(context, defBonus = 2) {
        const owner = context.owner;
        const source = context.card;
        const field = state.players[owner].field.filter(c =>
            c.type === 'criatura' && !c.isFaceDown && c !== source
        );

        if (!field.length) {
            if (typeof showToast === 'function') showToast('Não há outra criatura aliada para receber o Campo Defletor.', "warning");
            return;
        }

        // Protege primeiro a criatura aliada com menor DEF atual.
        const target = [...field].sort((a, b) => (a.currentDef - b.currentDef) || (a.atk - b.atk))[0];
        target.def = (target.def || 0) + defBonus;
        target.currentDef = (target.currentDef || 0) + defBonus;

        if (typeof showToast === 'function') {
            showToast(`${source?.name || 'Campo Defletor'}: ${target.name} recebeu +${defBonus} DEF.`, "success");
        }
    },

    damageEnemyTarget(context, amount) {
        const targetKey = context.owner === 'p1' ? 'p2' : 'p1';
        const enemyField = state.players[targetKey].field.filter(c => c.type === 'criatura' && !c.isFaceDown);
        if (!enemyField.length) return CardEffects.damageOpponent(context, amount);

        const targetCard = [...enemyField].sort((a,b) => (a.currentDef - b.currentDef) || (a.atk - b.atk))[0];
        targetCard.currentDef -= amount;
        if (typeof showToast === 'function') showToast(`${context.card.name} causou ${amount} dano em ${targetCard.name}.`, "success");

        if (targetCard.currentDef <= 0) {
            sendCardToGraveyard(targetCard, targetKey, true);
            state.players[targetKey].field = state.players[targetKey].field.filter(c => c !== targetCard);
            if (typeof showToast === 'function') showToast(`${targetCard.name} foi destruído pelo efeito.`, "warning");
        }
    },

    stunTarget(context) {
        const targetKey = context.owner === 'p1' ? 'p2' : 'p1';
        const target = state.players[targetKey].field.find(c => c.type === 'criatura' && !c.isFaceDown);
        if (!target) return;
        target.isStunned = true;
        target.casusBelli = 0;
        target.attackedThisTurn = false;
        if (typeof showToast === 'function') showToast(`${target.name} está atordoada e não pode atacar nem bloquear.`, "warning");
    }
};
