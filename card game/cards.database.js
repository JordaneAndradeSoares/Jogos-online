const CARD_DATABASE = [
    // Criaturas
    { name: "Criatura 1", type: "criatura", cost: 1, atk: 2, def: 3, desc: "[Ativo] +2 DEF", gatilho: "ativo", art: "imagens/1.png", force: "Gravidade" },
    { name: "Criatura 2", type: "criatura", cost: 2, atk: 3, def: 4, desc: "[Destruído] Causa 1 dano direto", gatilho: "destruido", art: "imagens/2.png", force: "Força Forte" },
    { name: "Criatura 3", type: "criatura", cost: 3, atk: 4, def: 5, desc: "[Campo] Restaura 1 de vida", gatilho: "campo", art: "imagens/3.png", force: "Força Fraca" },
    { name: "Criatura 4", type: "criatura", cost: 4, atk: 5, def: 6, desc: "", art: "imagens/4.png", force: "Eletromagnetismo" },
    { name: "Criatura 5", type: "criatura", cost: 5, atk: 6, def: 7, desc: "[Destruído] Restaura 2 de vida", gatilho: "destruido", art: "imagens/5.png", force: "Gravidade" },
    { name: "Criatura 6", type: "criatura", cost: 6, atk: 7, def: 2, desc: "[Campo] Causa 1 dano direto", gatilho: "campo", art: "imagens/6.png", force: "Força Forte" },
    { name: "Criatura 7", type: "criatura", cost: 1, atk: 1, def: 3, desc: "[Ativo] Restaura 1 de vida", gatilho: "ativo", art: "imagens/7.png", force: "Força Fraca" },
    { name: "Criatura 8", type: "criatura", cost: 2, atk: 2, def: 4, desc: "", art: "imagens/8.png", force: "Eletromagnetismo" },
    { name: "Criatura 9", type: "criatura", cost: 3, atk: 3, def: 5, desc: "", art: "imagens/9.png", force: "Gravidade" },
    { name: "Criatura 10", type: "criatura", cost: 4, atk: 4, def: 6, desc: "[Ativo] Causa 1 dano direto", gatilho: "ativo", art: "imagens/10.png", force: "Força Forte" },
    { name: "Criatura 11", type: "criatura", cost: 5, atk: 5, def: 7, desc: "[Destruído] Restaura 1 de vida", gatilho: "destruido", art: "imagens/11.png", force: "Força Fraca" },
    { name: "Criatura 12", type: "criatura", cost: 6, atk: 6, def: 2, desc: "[Campo] +1 ATK", gatilho: "campo", art: "imagens/12.png", force: "Eletromagnetismo" },
    { name: "Criatura 13", type: "criatura", cost: 1, atk: 7, def: 3, desc: "[Ativo] +2 DEF", gatilho: "ativo", art: "imagens/13.png", force: "Gravidade" },
    { name: "Criatura 14", type: "criatura", cost: 2, atk: 1, def: 4, desc: "[Destruído] Causa 1 dano direto", gatilho: "destruido", art: "imagens/14.png", force: "Força Forte" },
    { name: "Criatura 15", type: "criatura", cost: 3, atk: 2, def: 5, desc: "", art: "imagens/15.png", force: "Força Fraca" },
    { name: "Criatura 16", type: "criatura", cost: 4, atk: 3, def: 6, desc: "[Ativo] +1 ATK", gatilho: "ativo", art: "imagens/16.png", force: "Eletromagnetismo" },
    { name: "Criatura 17", type: "criatura", cost: 5, atk: 4, def: 7, desc: "[Destruído] +2 DEF", gatilho: "destruido", art: "imagens/17.png", force: "Gravidade" },
    { name: "Criatura 18", type: "criatura", cost: 6, atk: 5, def: 2, desc: "[Campo] Causa 1 dano direto", gatilho: "campo", art: "imagens/18.png", force: "Força Forte" },
    { name: "Criatura 19", type: "criatura", cost: 1, atk: 6, def: 3, desc: "[Ativo] Restaura 1 de vida", gatilho: "ativo", art: "imagens/19.png", force: "Força Fraca" },
    { name: "Criatura 20", type: "criatura", cost: 2, atk: 7, def: 4, desc: "", art: "imagens/20.png", force: "Eletromagnetismo" },
    
    // Tecnologias
    { name: "Tecnologia 1", type: "tecnologia", cost: 1, desc: "[Campo] Restaura 2 de vida", gatilho: "campo", art: "imagens/21.png", force: "Gravidade" },
    { name: "Tecnologia 2", type: "tecnologia", cost: 2, desc: "[Campo] Causa 1 dano à criatura inimiga", gatilho: "campo", art: "imagens/22.png", force: "Força Forte" },
    { name: "Tecnologia 3", type: "tecnologia", cost: 3, desc: "[Campo] Outra criatura recebe +2 DEF", gatilho: "campo", art: "imagens/23.png", force: "Força Fraca" },
    { name: "Tecnologia 4", type: "tecnologia", cost: 4, desc: "[Campo] Causa 2 dano direto", gatilho: "campo", art: "imagens/24.png", force: "Eletromagnetismo" },
    { name: "Tecnologia 5", type: "tecnologia", cost: 5, desc: "[Campo] Restaura 2 de vida", gatilho: "campo", art: "imagens/25.png", force: "Gravidade" },
    { name: "Tecnologia 6", type: "tecnologia", cost: 1, desc: "[Campo] Causa 1 dano à criatura inimiga", gatilho: "campo", art: "imagens/26.png", force: "Força Forte" },
    { name: "Tecnologia 7", type: "tecnologia", cost: 2, desc: "[Campo] Outra criatura recebe +2 DEF", gatilho: "campo", art: "imagens/27.png", force: "Força Fraca" },
    { name: "Tecnologia 8", type: "tecnologia", cost: 3, desc: "[Campo] Causa 2 dano direto", gatilho: "campo", art: "imagens/28.png", force: "Eletromagnetismo" },
    { name: "Tecnologia 9", type: "tecnologia", cost: 4, desc: "[Campo] Restaura 2 de vida", gatilho: "campo", art: "imagens/29.png", force: "Gravidade" },
    { name: "Tecnologia 10", type: "tecnologia", cost: 5, desc: "[Campo] Causa 1 dano à criatura inimiga", gatilho: "campo", art: "imagens/30.png", force: "Força Forte" },
    { name: "Tecnologia 11", type: "tecnologia", cost: 1, desc: "[Campo] Outra criatura recebe +2 DEF", gatilho: "campo", art: "imagens/31.png", force: "Força Fraca" },
    { name: "Tecnologia 12", type: "tecnologia", cost: 2, desc: "[Campo] Causa 2 dano direto", gatilho: "campo", art: "imagens/32.png", force: "Eletromagnetismo" },
    { name: "Tecnologia 13", type: "tecnologia", cost: 3, desc: "[Campo] Restaura 2 de vida", gatilho: "campo", art: "imagens/33.png", force: "Gravidade" },
    { name: "Tecnologia 14", type: "tecnologia", cost: 4, desc: "[Campo] Causa 1 dano à criatura inimiga", gatilho: "campo", art: "imagens/34.png", force: "Força Forte" },
    { name: "Tecnologia 15", type: "tecnologia", cost: 5, desc: "[Campo] Outra criatura recebe +2 DEF", gatilho: "campo", art: "imagens/35.png", force: "Força Fraca" },
    { name: "Tecnologia 16", type: "tecnologia", cost: 1, desc: "[Campo] Causa 2 dano direto", gatilho: "campo", art: "imagens/36.png", force: "Eletromagnetismo" },
    { name: "Tecnologia 17", type: "tecnologia", cost: 2, desc: "[Campo] Restaura 2 de vida", gatilho: "campo", art: "imagens/37.png", force: "Gravidade" },
    { name: "Tecnologia 18", type: "tecnologia", cost: 3, desc: "[Campo] Causa 1 dano à criatura inimiga", gatilho: "campo", art: "imagens/38.png", force: "Força Forte" },
    { name: "Tecnologia 19", type: "tecnologia", cost: 4, desc: "[Campo] Outra criatura recebe +2 DEF", gatilho: "campo", art: "imagens/39.png", force: "Força Fraca" },
    { name: "Tecnologia 20", type: "tecnologia", cost: 5, desc: "[Campo] Causa 2 dano direto", gatilho: "campo", art: "imagens/40.png", force: "Eletromagnetismo" },
    
    // Terrenos
    { name: "Terreno 1", type: "terreno", cost: 1, atk: null, def: 4, desc: "[Ativo] Causa 1 dano direto", gatilho: "ativo", art: "imagens/41.png", force: "Gravidade" },
    { name: "Terreno 2", type: "terreno", cost: 2, atk: null, def: 5, desc: "[Destruído] Restaura 1 de vida", gatilho: "destruido", art: "imagens/42.png", force: "Força Forte" },
    { name: "Terreno 3", type: "terreno", cost: 3, atk: null, def: 6, desc: "", art: "imagens/43.png", force: "Força Fraca" },
    { name: "Terreno 4", type: "terreno", cost: 4, atk: null, def: 7, desc: "[Ativo] +1 DEF", gatilho: "ativo", art: "imagens/44.png", force: "Eletromagnetismo" },
    { name: "Terreno 5", type: "terreno", cost: 5, atk: null, def: 8, desc: "[Destruído] Causa 1 dano direto", gatilho: "destruido", art: "imagens/45.png", force: "Gravidade" },
    { name: "Terreno 6", type: "terreno", cost: 1, atk: null, def: 9, desc: "[Campo] Restaura 1 de vida", gatilho: "campo", art: "imagens/46.png", force: "Força Forte" },
    { name: "Terreno 7", type: "terreno", cost: 2, atk: null, def: 3, desc: "", art: "imagens/47.png", force: "Força Fraca" },
    { name: "Terreno 8", type: "terreno", cost: 3, atk: null, def: 4, desc: "[Destruído] Causa 2 dano direto", gatilho: "destruido", art: "imagens/48.png", force: "Eletromagnetismo" },
    { name: "Terreno 9", type: "terreno", cost: 4, atk: null, def: 5, desc: "[Campo] Causa 1 dano direto", gatilho: "campo", art: "imagens/49.png", force: "Gravidade" },
    { name: "Terreno 10", type: "terreno", cost: 5, atk: null, def: 6, desc: "[Ativo] Restaura 1 de vida", gatilho: "ativo", art: "imagens/50.png", force: "Força Forte" },
    { name: "Terreno 11", type: "terreno", cost: 1, atk: null, def: 7, desc: "[Destruído] Outra criatura recebe +1 DEF", gatilho: "destruido", art: "imagens/51.png", force: "Força Fraca" },
    { name: "Terreno 12", type: "terreno", cost: 2, atk: null, def: 8, desc: "", art: "imagens/52.png", force: "Eletromagnetismo" },
    { name: "Terreno 13", type: "terreno", cost: 3, atk: null, def: 9, desc: "[Ativo] Causa 1 dano direto", gatilho: "ativo", art: "imagens/53.png", force: "Gravidade" },
    { name: "Terreno 14", type: "terreno", cost: 4, atk: null, def: 3, desc: "[Destruído] Restaura 1 de vida", gatilho: "destruido", art: "imagens/54.png", force: "Força Forte" },
    { name: "Terreno 15", type: "terreno", cost: 5, atk: null, def: 4, desc: "[Campo] Outra criatura recebe +1 DEF", gatilho: "campo", art: "imagens/55.png", force: "Força Fraca" },
    { name: "Terreno 16", type: "terreno", cost: 1, atk: null, def: 5, desc: "[Ativo] +1 DEF", gatilho: "ativo", art: "imagens/56.png", force: "Eletromagnetismo" },
    { name: "Terreno 17", type: "terreno", cost: 2, atk: null, def: 6, desc: "[Destruído] Causa 1 dano direto", gatilho: "destruido", art: "imagens/57.png", force: "Gravidade" },
    { name: "Terreno 18", type: "terreno", cost: 3, atk: null, def: 7, desc: "", art: "imagens/58.png", force: "Força Forte" },
    { name: "Terreno 19", type: "terreno", cost: 4, atk: null, def: 8, desc: "[Ativo] Outra criatura recebe +1 DEF", gatilho: "ativo", art: "imagens/59.png", force: "Força Fraca" },
    { name: "Terreno 20", type: "terreno", cost: 5, atk: null, def: 9, desc: "[Destruído] Restaura 2 de vida", gatilho: "destruido", art: "imagens/60.png", force: "Eletromagnetismo" }
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
        isResting: false,
        _activeStatApplied: false,
        _activeTickedTurn: null
    };

    if (typeof attachTriggersToCard === 'function') {
        attachTriggersToCard(card);
    }

    return card;
}