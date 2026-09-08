const CARD_DATABASE = [
    // Criaturas
    { name: "Soldado de Plasma", type: "criatura", cost: 1, atk: 2, def: 2, desc: "[Ao Entrar] +1 ATK", art: "imagens/1.png", force: "Eletromagnetismo" },
    { name: "Atirador de Precisão", type: "criatura", cost: 2, atk: 3, def: 1, desc: "[Ao Entrar] Causa 1 dano à criatura inimiga mais fraca", art: "imagens/2.png", force: "Eletromagnetismo" },
    { name: "Drone Guardião", type: "criatura", cost: 2, atk: 1, def: 4, desc: "[Ao Entrar] +2 DEF", art: "imagens/3.png", force: "Gravidade" },
    { name: "Colosso Mecânico", type: "criatura", cost: 4, atk: 5, def: 5, desc: "[Ao Entrar] +1/+1", art: "imagens/4.png", force: "Força Forte" },
    { name: "Piloto de Elite", type: "criatura", cost: 3, atk: 4, def: 3, desc: "[Ao Entrar] Nanorreparo 1", art: "imagens/5.png", force: "Eletromagnetismo" },
    { name: "Drone Sabotador", type: "criatura", cost: 1, atk: 2, def: 1, desc: "[Ao Entrar] Causa 1 dano direto", art: "imagens/6.png", force: "Força Fraca" },
    { name: "Técnico de Energia", type: "criatura", cost: 2, atk: 2, def: 2, desc: "[Ao Entrar] Causa 1 dano direto", art: "imagens/7.png", force: "Eletromagnetismo" },
    { name: "Operador Stealth", type: "criatura", cost: 3, atk: 5, def: 1, desc: "[Ao Entrar] +2 ATK", art: "imagens/8.png", force: "Força Fraca" },
    { name: "Unidade Reanimada", type: "criatura", cost: 2, atk: 2, def: 3, desc: "[Ao Entrar] Nanorreparo 1 e causa 1 dano", art: "imagens/9.png", force: "Força Fraca" },
    { name: "Titã de Liga", type: "criatura", cost: 5, atk: 4, def: 7, desc: "[Ao Entrar] +3 DEF", art: "imagens/10.png", force: "Gravidade" },
    { name: "Interceptor Dracônico", type: "criatura", cost: 6, atk: 6, def: 5, desc: "[Ao Entrar] Causa 2 dano à criatura inimiga mais fraca", art: "imagens/11.png", force: "Força Forte" },

    // Tecnologias
    { name: "Pulso Incendiário", type: "tecnologia", cost: 2, desc: "[Tecnologia] Causa 3 de dano direto", art: "imagens/12.png", force: "Força Forte" },
    { name: "Arco Elétrico", type: "tecnologia", cost: 1, desc: "[Tecnologia] Causa 2 de dano direto", art: "imagens/13.png", force: "Eletromagnetismo" },
    { name: "Nanorreparo", type: "tecnologia", cost: 2, desc: "[Tecnologia] Restaura 3 de vida", art: "imagens/14.png", force: "Força Fraca" },
    { name: "Campo Defletor", type: "tecnologia", cost: 1, desc: "[Tecnologia] Outra criatura aliada recebe +2 DEF", art: "imagens/15.png", force: "Gravidade" },

    // Terrenos
    { name: "Planície de Titânio", type: "terreno", cost: 2, atk: null, def: 5, desc: "", art: "imagens/16.png", force: "Gravidade" },
    { name: "Reator Instável", type: "terreno", cost: 3, atk: null, def: 4, desc: "[Ao Entrar] Causa 1 dano direto.", art: "imagens/17.png", force: "Força Forte" }
];

function createCard(baseCard) {
    const hasAttack = baseCard.atk !== null && baseCard.atk !== undefined;

    const card = {
        ...baseCard,

        // Mantém null para cartas que não possuem ataque.
        baseAtk: hasAttack ? baseCard.atk : null,
        baseDef: baseCard.def ?? 0,

        atk: hasAttack ? baseCard.atk : null,
        def: baseCard.def ?? 0,
        currentDef: baseCard.def ?? 0,

        casusBelli: 0,
        isFaceDown: false,
        isStunned: false,
        attackedThisTurn: false,
        attackedLastTurn: false,
        lastAttackTurn: null,
        summonedTurn: 1,
        isDestroyed: false,
        isResting: false
    };

    if (typeof attachTriggersToCard === 'function') {
        attachTriggersToCard(card);
    }

    return card;
}