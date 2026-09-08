/*
 * Gatilhos das cartas no universo sci-fi.
 * tecnologia = carta tecnológica é usada.
 * aoEntrar = unidade entra no campo.
 */
const CardTriggers = {
    "Pulso Incendiário": { tecnologia: c => CardEffects.damageOpponent(c, 3) },
    "Arco Elétrico": { tecnologia: c => CardEffects.damageOpponent(c, 2) },
    "Nanorreparo": { tecnologia: c => CardEffects.healSelf(c, 3) },
    "Campo Defletor": { tecnologia: c => CardEffects.buffOtherCreature(c, 2) },

    "Soldado de Plasma": { aoEntrar: c => CardEffects.buffSelf(c, 1, 0) },
    "Atirador de Precisão": { aoEntrar: c => CardEffects.damageEnemyTarget(c, 1) },
    "Drone Guardião": { aoEntrar: c => CardEffects.buffSelf(c, 0, 2) },
    "Colosso Mecânico": { aoEntrar: c => CardEffects.buffSelf(c, 1, 1) },
    "Piloto de Elite": { aoEntrar: c => CardEffects.healSelf(c, 1) },
    "Drone Sabotador": { aoEntrar: c => CardEffects.damageOpponent(c, 1) },
    "Técnico de Energia": { aoEntrar: c => CardEffects.damageOpponent(c, 1) },
    "Operador Stealth": { aoEntrar: c => CardEffects.buffSelf(c, 2, 0) },
    "Unidade Reanimada": {
        aoEntrar: c => {
            CardEffects.healSelf(c, 1);
            CardEffects.damageOpponent(c, 1);
        }
    },
    "Titã de Liga": { aoEntrar: c => CardEffects.buffSelf(c, 0, 3) },
    "Interceptor Dracônico": { aoEntrar: c => CardEffects.damageEnemyTarget(c, 2) },
    "Reator Instável": { aoEntrar: c => CardEffects.damageOpponent(c, 1) }
};

function attachTriggersToCard(card) {
    if (CardTriggers[card.name]) card.effects = CardTriggers[card.name];
    return card;
}
