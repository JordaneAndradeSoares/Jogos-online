const CARD_DATABASE = [
    // Efeitos: são ativados diretamente da mão pelo gatilho [Efeito] e vão ao Arquivo após a resolução.
    { name: "Efeito 1", type: "efeito", cost: 0, desc: "[Efeito] Restaura 2 de vida do seu jogador", gatilho: "efeito", art: "imagens/21.png", force: "Gravidade" },
    { name: "Efeito 2", type: "efeito", cost: 2, desc: "[Efeito] Causa 1 dano a uma carta inimiga", targetRule: "enemy_card", gatilho: "efeito", art: "imagens/22.png", force: "Força Forte" },
    { name: "Efeito 3", type: "efeito", cost: 3, desc: "[Efeito] Outra carta do seu campo recebe +2 DEF", targetRule: "ally_other_card", gatilho: "efeito", art: "imagens/23.png", force: "Força Fraca" },
    { name: "Efeito 4", type: "efeito", cost: 3, desc: "[Efeito] Causa 2 dano direto ao jogador inimigo", gatilho: "efeito", art: "imagens/24.png", force: "Eletromagnetismo" },
    { name: "Efeito 5", type: "efeito", cost: 3, desc: "[Efeito] Restaura 2 de vida do seu jogador", gatilho: "efeito", art: "imagens/25.png", force: "Gravidade" },
    { name: "Efeito 6", type: "efeito", cost: 0, desc: "[Efeito] Causa 1 dano a uma carta inimiga", targetRule: "enemy_card", gatilho: "efeito", art: "imagens/26.png", force: "Força Forte" },
    { name: "Efeito 7", type: "efeito", cost: 2, desc: "[Efeito] Outra carta do seu campo recebe +2 DEF", targetRule: "ally_other_card", gatilho: "efeito", art: "imagens/27.png", force: "Força Fraca" },
    { name: "Efeito 8", type: "efeito", cost: 3, desc: "[Efeito] Causa 2 dano direto ao jogador inimigo", gatilho: "efeito", art: "imagens/28.png", force: "Eletromagnetismo" },
    { name: "Efeito 9", type: "efeito", cost: 3, desc: "[Efeito] Restaura 2 de vida do seu jogador", gatilho: "efeito", art: "imagens/29.png", force: "Gravidade" },
    { name: "Efeito 10", type: "efeito", cost: 3, desc: "[Efeito] Causa 1 dano a uma carta inimiga", targetRule: "enemy_card", gatilho: "efeito", art: "imagens/30.png", force: "Força Forte" },
    { name: "Efeito 11", type: "efeito", cost: 0, desc: "[Efeito] Outra carta do seu campo recebe +2 DEF", targetRule: "ally_other_card", gatilho: "efeito", art: "imagens/31.png", force: "Força Fraca" },
    { name: "Efeito 12", type: "efeito", cost: 2, desc: "[Efeito] Causa 2 dano direto ao jogador inimigo", gatilho: "efeito", art: "imagens/32.png", force: "Eletromagnetismo" },
    { name: "Efeito 13", type: "efeito", cost: 3, desc: "[Efeito] Restaura 1 de vida do seu jogador", gatilho: "efeito", art: "imagens/33.png", force: "Gravidade" },
    { name: "Efeito 14", type: "efeito", cost: 3, desc: "[Efeito] Causa 1 dano a uma carta inimiga", targetRule: "enemy_card", gatilho: "efeito", art: "imagens/34.png", force: "Força Forte" },
    { name: "Efeito 15", type: "efeito", cost: 3, desc: "[Efeito] Outra carta do seu campo recebe +2 DEF", targetRule: "ally_other_card", gatilho: "efeito", art: "imagens/35.png", force: "Força Fraca" },
    { name: "Efeito 16", type: "efeito", cost: 0, desc: "[Efeito] Causa 2 dano direto ao jogador inimigo", gatilho: "efeito", art: "imagens/36.png", force: "Eletromagnetismo" },
    { name: "Efeito 17", type: "efeito", cost: 2, desc: "[Efeito] Restaura 2 de vida do seu jogador", gatilho: "efeito", art: "imagens/37.png", force: "Gravidade" },
    { name: "Efeito 18", type: "efeito", cost: 3, desc: "[Efeito] Causa 1 dano a uma carta inimiga", targetRule: "enemy_card", gatilho: "efeito", art: "imagens/38.png", force: "Força Forte" },
    { name: "Efeito 19", type: "efeito", cost: 3, desc: "[Efeito] Outra carta do seu campo recebe +2 DEF", targetRule: "ally_other_card", gatilho: "efeito", art: "imagens/39.png", force: "Força Fraca" },
    { name: "Efeito 20", type: "efeito", cost: 3, desc: "[Efeito] Causa 2 dano direto ao jogador inimigo", gatilho: "efeito", art: "imagens/40.png", force: "Eletromagnetismo" },

    // Criaturas
    { name: "Criatura 1", type: "criatura", cost: 0, generation: 2, atk: 2, def: 3, desc: "[Ativo] Recebe +2 DEF", gatilho: "ativo", art: "imagens/1.png", force: "Gravidade" },
    { name: "Criatura 2", type: "criatura", cost: 2, generation: 3, atk: 3, def: 4, desc: "[Destruído] Causa 1 dano direto ao jogador inimigo", gatilho: "destruido", art: "imagens/2.png", force: "Força Forte" },
    { name: "Criatura 3", type: "criatura", cost: 3, generation: 1, atk: 4, def: 5, desc: "[Campo] Restaura 1 de vida do seu jogador", gatilho: "campo", art: "imagens/3.png", force: "Força Fraca" },
    { name: "Criatura 4", type: "criatura", cost: 3, generation: 2, atk: 5, def: 6, desc: "", art: "imagens/4.png", force: "Eletromagnetismo" },
    { name: "Criatura 5", type: "criatura", cost: 3, generation: 3, atk: 6, def: 7, desc: "[Destruído] Restaura 2 de vida do seu jogador", gatilho: "destruido", art: "imagens/5.png", force: "Gravidade" },
    { name: "Criatura 6", type: "criatura", cost: 3, generation: 1, atk: 7, def: 2, desc: "[Campo] Causa 1 dano direto ao jogador inimigo", gatilho: "campo", art: "imagens/6.png", force: "Força Forte" },
    { name: "Criatura 7", type: "criatura", cost: 0, generation: 2, atk: 1, def: 3, desc: "[Ativo] Restaura 1 de vida do seu jogador", gatilho: "ativo", art: "imagens/7.png", force: "Força Fraca" },
    { name: "Criatura 8", type: "criatura", cost: 2, generation: 3, atk: 2, def: 4, desc: "", art: "imagens/8.png", force: "Eletromagnetismo" },
    { name: "Criatura 9", type: "criatura", cost: 3, generation: 1, atk: 3, def: 5, desc: "", art: "imagens/9.png", force: "Gravidade" },
    { name: "Criatura 10", type: "criatura", cost: 3, generation: 2, atk: 4, def: 6, desc: "[Ativo] Causa 1 dano direto ao jogador inimigo", gatilho: "ativo", art: "imagens/10.png", force: "Força Forte" },
    { name: "Criatura 11", type: "criatura", cost: 3, generation: 3, atk: 5, def: 7, desc: "[Destruído] Restaura 1 de vida do seu jogador", gatilho: "destruido", art: "imagens/11.png", force: "Força Fraca" },
    { name: "Criatura 12", type: "criatura", cost: 3, generation: 1, atk: 6, def: 2, desc: "[Campo] Recebe +1 ATK", gatilho: "campo", art: "imagens/12.png", force: "Eletromagnetismo" },
    { name: "Criatura 13", type: "criatura", cost: 0, generation: 2, atk: 7, def: 3, desc: "[Ativo] Recebe +2 DEF", gatilho: "ativo", art: "imagens/13.png", force: "Gravidade" },
    { name: "Criatura 14", type: "criatura", cost: 2, generation: 3, atk: 1, def: 4, desc: "[Destruído] Causa 1 dano direto ao jogador inimigo", gatilho: "destruido", art: "imagens/14.png", force: "Força Forte" },
    { name: "Criatura 15", type: "criatura", cost: 3, generation: 1, atk: 2, def: 5, desc: "", art: "imagens/15.png", force: "Força Fraca" },
    { name: "Criatura 16", type: "criatura", cost: 3, generation: 2, atk: 3, def: 6, desc: "[Ativo] Recebe +1 ATK", gatilho: "ativo", art: "imagens/16.png", force: "Eletromagnetismo" },
    { name: "Criatura 17", type: "criatura", cost: 3, generation: 3, atk: 4, def: 7, desc: "", art: "imagens/17.png", force: "Gravidade" },
    { name: "Criatura 18", type: "criatura", cost: 3, generation: 1, atk: 5, def: 2, desc: "[Campo] Causa 1 dano direto ao jogador inimigo", gatilho: "campo", art: "imagens/18.png", force: "Força Forte" },
    { name: "Criatura 19", type: "criatura", cost: 0, generation: 2, atk: 6, def: 3, desc: "[Ativo] Restaura 1 de vida do seu jogador", gatilho: "ativo", art: "imagens/19.png", force: "Força Fraca" },
    { name: "Criatura 20", type: "criatura", cost: 2, generation: 3, atk: 7, def: 4, desc: "", art: "imagens/20.png", force: "Eletromagnetismo" },
    { name: "Criatura 21", type: "criatura", cost: 2, generation: 2, atk: 3, def: 4, desc: "[Custo X] Recebe +2 ATK", gatilho: "custo", activationCost: 1, art: "imagens/61.png", force: "Gravidade" },
    { name: "Criatura 22", type: "criatura", cost: 3, generation: 3, atk: 4, def: 5, desc: "[Custo X] Recebe +2 DEF", gatilho: "custo", activationCost: 1, art: "imagens/62.png", force: "Força Forte" },
    { name: "Criatura 23", type: "criatura", cost: 3, generation: 1, atk: 5, def: 4, desc: "[Custo X] Causa 2 dano direto ao jogador inimigo", gatilho: "custo", activationCost: 2, art: "imagens/63.png", force: "Força Fraca" },
    { name: "Criatura 24", type: "criatura", cost: 1, generation: 2, atk: 6, def: 6, desc: "[Custo X] Restaura 2 de vida do seu jogador", gatilho: "custo", activationCost: 2, art: "imagens/64.png", force: "Eletromagnetismo" },
    { name: "Criatura 25", type: "criatura", cost: 1, generation: 3, atk: 7, def: 7, desc: "[Custo X] Recebe +3 ATK e +1 DEF", gatilho: "custo", activationCost: 3, art: "imagens/65.png", force: "Gravidade" },
    
    // Terrenos
    { name: "Terreno 1", type: "terreno", cost: 0, generation: 2, atk: null, def: 4, desc: "[Ativo] Causa 1 dano direto ao jogador inimigo", gatilho: "ativo", art: "imagens/41.png", force: "Gravidade" },
    { name: "Terreno 2", type: "terreno", cost: 2, generation: 3, atk: null, def: 5, desc: "[Destruído] Restaura 1 de vida do seu jogador", gatilho: "destruido", art: "imagens/42.png", force: "Força Forte" },
    { name: "Terreno 3", type: "terreno", cost: 3, generation: 1, atk: null, def: 6, desc: "", art: "imagens/43.png", force: "Força Fraca" },
    { name: "Terreno 4", type: "terreno", cost: 3, generation: 2, atk: null, def: 7, desc: "[Ativo] +1 DEF", gatilho: "ativo", art: "imagens/44.png", force: "Eletromagnetismo" },
    { name: "Terreno 5", type: "terreno", cost: 3, generation: 3, atk: null, def: 8, desc: "[Destruído] Causa 1 dano direto ao jogador inimigo", gatilho: "destruido", art: "imagens/45.png", force: "Gravidade" },
    { name: "Terreno 6", type: "terreno", cost: 0, generation: 2, atk: null, def: 9, desc: "[Campo] Restaura 1 de vida do seu jogador", gatilho: "campo", art: "imagens/46.png", force: "Força Forte" },
    { name: "Terreno 7", type: "terreno", cost: 2, generation: 3, atk: null, def: 3, desc: "", art: "imagens/47.png", force: "Força Fraca" },
    { name: "Terreno 8", type: "terreno", cost: 3, generation: 1, atk: null, def: 4, desc: "[Destruído] Causa 2 dano direto ao jogador inimigo", gatilho: "destruido", art: "imagens/48.png", force: "Eletromagnetismo" },
    { name: "Terreno 9", type: "terreno", cost: 3, generation: 2, atk: null, def: 5, desc: "[Campo] Causa 1 dano direto ao jogador inimigo", gatilho: "campo", art: "imagens/49.png", force: "Gravidade" },
    { name: "Terreno 10", type: "terreno", cost: 3, generation: 3, atk: null, def: 6, desc: "[Ativo] Restaura 1 de vida do seu jogador", gatilho: "ativo", art: "imagens/50.png", force: "Força Forte" },
    { name: "Terreno 11", type: "terreno", cost: 0, generation: 2, atk: null, def: 7, desc: "[Destruído] Outra carta do seu campo recebe +1 DEF", targetRule: "ally_other_card", gatilho: "destruido", art: "imagens/51.png", force: "Força Fraca" },
    { name: "Terreno 12", type: "terreno", cost: 2, generation: 3, atk: null, def: 8, desc: "", art: "imagens/52.png", force: "Eletromagnetismo" },
    { name: "Terreno 13", type: "terreno", cost: 3, generation: 1, atk: null, def: 9, desc: "[Ativo] Causa 1 dano direto ao jogador inimigo", gatilho: "ativo", art: "imagens/53.png", force: "Gravidade" },
    { name: "Terreno 14", type: "terreno", cost: 3, generation: 2, atk: null, def: 3, desc: "[Destruído] Restaura 1 de vida do seu jogador", gatilho: "destruido", art: "imagens/54.png", force: "Força Forte" },
    { name: "Terreno 15", type: "terreno", cost: 3, generation: 3, atk: null, def: 4, desc: "[Campo] Outra carta do seu campo recebe +1 DEF", targetRule: "ally_other_card", gatilho: "campo", art: "imagens/55.png", force: "Força Fraca" },
    { name: "Terreno 16", type: "terreno", cost: 0, generation: 2, atk: null, def: 5, desc: "[Ativo] +1 DEF", gatilho: "ativo", art: "imagens/56.png", force: "Eletromagnetismo" },
    { name: "Terreno 17", type: "terreno", cost: 2, generation: 3, atk: null, def: 6, desc: "[Destruído] Causa 1 dano direto ao jogador inimigo", gatilho: "destruido", art: "imagens/57.png", force: "Gravidade" },
    { name: "Terreno 18", type: "terreno", cost: 3, generation: 1, atk: null, def: 7, desc: "", art: "imagens/58.png", force: "Força Forte" },
    { name: "Terreno 19", type: "terreno", cost: 3, generation: 2, atk: null, def: 8, desc: "[Ativo] Outra carta do seu campo recebe +1 DEF", targetRule: "ally_other_card", gatilho: "ativo", art: "imagens/59.png", force: "Força Fraca" },
    { name: "Terreno 20", type: "terreno", cost: 3, generation: 3, atk: null, def: 9, desc: "[Destruído] Restaura 2 de vida do seu jogador", gatilho: "destruido", art: "imagens/60.png", force: "Eletromagnetismo" },
    { name: "Terreno 21", type: "terreno", cost: 1, generation: 2, atk: null, def: 5, desc: "[Custo X] Causa 1 dano direto ao jogador inimigo", gatilho: "custo", activationCost: 1, art: "imagens/71.png", force: "Gravidade" },
    { name: "Terreno 22", type: "terreno", cost: 2, generation: 2, atk: null, def: 6, desc: "[Custo X] Recebe +2 DEF", gatilho: "custo", activationCost: 1, art: "imagens/72.png", force: "Força Forte" },
    { name: "Terreno 23", type: "terreno", cost: 2, generation: 3, atk: null, def: 7, desc: "[Custo X] Restaura 2 de vida do seu jogador", gatilho: "custo", activationCost: 2, art: "imagens/73.png", force: "Força Fraca" },
    { name: "Terreno 24", type: "terreno", cost: 3, generation: 2, atk: null, def: 8, desc: "[Custo X] Outra carta do seu campo recebe +2 DEF", targetRule: "ally_other_card", gatilho: "custo", activationCost: 2, art: "imagens/74.png", force: "Eletromagnetismo" },
    { name: "Terreno 25", type: "terreno", cost: 3, generation: 3, atk: null, def: 9, desc: "[Custo X] Causa 2 dano direto ao jogador inimigo", gatilho: "custo", activationCost: 3, art: "imagens/75.png", force: "Gravidade" },

    // deck extra
    // fusões 
    { name: "Criatura Fusão 1", type: "criatura", cost: 4, generation: 3, atk: 8, def: 8, desc: "[Fusão] Requer 2 criaturas como matéria. [Ativo] Recebe +2 ATK", gatilho: "ativo", art: "imagens/fusao_criatura_1.png", force: "Gravidade", summonType: "fusao", materialType: "criatura", minMaterials: 2 },
    { name: "Criatura Fusão 2", type: "criatura", cost: 5, generation: 3, atk: 10, def: 7, desc: "[Fusão] Requer 3 criaturas como matéria. [Campo] Causa 2 dano direto ao jogador inimigo", gatilho: "campo", art: "imagens/fusao_criatura_2.png", force: "Força Forte", summonType: "fusao", materialType: "criatura", minMaterials: 3 },
    { name: "Terreno Fusão 1", type: "terreno", cost: 4, generation: 3, atk: null, def: 10, desc: "[Fusão] Requer 2 terrenos como matéria. [Ativo] Causa 2 dano direto ao jogador inimigo", gatilho: "ativo", art: "imagens/fusao_terreno_1.png", force: "Eletromagnetismo", summonType: "fusao", materialType: "terreno", minMaterials: 2 },
    { name: "Terreno Fusão 2", type: "terreno", cost: 5, generation: 3, atk: null, def: 12, desc: "[Fusão] Requer 3 terrenos como matéria. [Campo] Restaura 3 de vida do seu jogador", gatilho: "campo", art: "imagens/fusao_terreno_2.png", force: "Gravidade", summonType: "fusao", materialType: "terreno", minMaterials: 3 },

    // polimorfose
    { name: "Criatura Polimorfose 1", type: "criatura", cost: 3, generation: 3, atk: 6, def: 7, desc: "[Polimorfose] Requer 1 criatura como matéria. [Ativo] Recebe +2 ATK", gatilho: "ativo", art: "imagens/polimorfose_criatura_1.png", force: "Força Fraca", summonType: "polimorfose", materialType: "criatura" },
    { name: "Criatura Polimorfose 2", type: "criatura", cost: 4, generation: 3, atk: 8, def: 9, desc: "[Polimorfose] Requer 1 criatura como matéria. [Campo] Causa 2 dano direto ao jogador inimigo", gatilho: "campo", art: "imagens/polimorfose_criatura_2.png", force: "Força Forte", summonType: "polimorfose", materialType: "criatura" },
    { name: "Terreno Polimorfose 1", type: "terreno", cost: 3, generation: 3, atk: null, def: 8, desc: "[Polimorfose] Requer 1 terreno como matéria. [Ativo] +2 DEF", gatilho: "ativo", art: "imagens/polimorfose_terreno_1.png", force: "Eletromagnetismo", summonType: "polimorfose", materialType: "terreno" },
    { name: "Terreno Polimorfose 2", type: "terreno", cost: 4, generation: 3, atk: null, def: 10, desc: "[Polimorfose] Requer 1 terreno como matéria. [Campo] Restaura 2 de vida do seu jogador", gatilho: "campo", art: "imagens/polimorfose_terreno_2.png", force: "Gravidade", summonType: "polimorfose", materialType: "terreno" },

    // especialidade
    { name: "Criatura Especialista 1", type: "criatura", cost: 3, generation: 3, atk: 7, def: 6, desc: "[Especialidade] Só pode ser invocada se você não controlar nenhuma carta. [Ativo] Recebe +2 ATK", gatilho: "ativo", art: "imagens/especialista_criatura_1.png", force: "Força Forte", summonType: "especialidade", specialCondition: "no_cards_controlled" },
    { name: "Terreno Especialista 1", type: "terreno", cost: 2, generation: 3, atk: null, def: 8, desc: "[Especialidade] Só pode ser invocado se você controlar outra carta. [Ativo] +2 DEF", gatilho: "ativo", art: "imagens/especialista_terreno_1.png", force: "Força Fraca", summonType: "especialidade", specialCondition: "controls_other_card" }
];

function createCard(baseCard) {
    const hasAttack = baseCard.atk !== null && baseCard.atk !== undefined;

    const card = {
        ...baseCard,

        // Sistema de invocação
        // "normal" = carta normal do Deck principal
        // "fusao" = carta que começa no Extra Deck
        // "polimorfose" = carta do Deck principal que pode usar uma matéria
        // "especialidade" = carta que começa no Extra Deck
        summonType: baseCard.summonType ?? "normal",

        // Regra explícita de alvo do efeito.
        // enemy_card | ally_other_card | ally_card | enemy_creature | ally_creature | any_card | any_creature
        targetRule: baseCard.targetRule ?? null,

        // Tipo de matéria exigida.
        // Exemplos: "criatura" ou "terreno".
        materialType: baseCard.materialType ?? null,

        // Quantidade mínima de matérias exigidas por uma Fusão.
        minMaterials: Math.max(0, Number(baseCard.minMaterials ?? 0)),

        // Condição especial para cartas de Especialidade.
        // Exemplos:
        // "controls_other_card"
        // "no_cards_controlled"
        specialCondition: baseCard.specialCondition ?? null,

        // Sistema de energia: cartas recarregam de 0 a 3 energia.
        energyRecharge: Math.max(
            0,
            Math.min(
                3,
                Number(baseCard.energyRecharge ?? baseCard.generation ?? 0)
            )
        ),

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

        // Matérias utilizadas para invocação.
        // Em uma Fusão ou Polimorfose, as cartas usadas ficam aqui.
        materials: [],

        _activeStatApplied: false,
        _activeTickedTurn: null
    };

    if (typeof attachTriggersToCard === 'function') {
        attachTriggersToCard(card);
    }

    return card;
}