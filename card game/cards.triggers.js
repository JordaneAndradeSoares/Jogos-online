const GATILHOS_EFEITOS = Object.freeze(['campo', 'destruido', 'ativo']);
const CardTriggers = {};

function obterGatilhoDaCarta(carta) {
    if (!carta) return null;
    if (GATILHOS_EFEITOS.includes(carta.gatilho)) return carta.gatilho;

    const descricao = carta.desc || '';
    if (descricao.includes('[Campo]')) return 'campo';
    if (descricao.includes('[Destruído]')) return 'destruido';
    if (descricao.includes('[Ativo]')) return 'ativo';
    return null;
}

function criarFuncaoDoEfeito(carta) {
    const descricao = carta.desc || '';

    return contexto => {
        if (descricao.includes('Causa 2 dano direto')) {
            return CardEffects.damageOpponent(contexto, 2);
        }
        if (descricao.includes('Causa 1 dano direto')) {
            return CardEffects.damageOpponent(contexto, 1);
        }
        if (descricao.includes('Restaura 2 de vida')) {
            return CardEffects.healSelf(contexto, 2);
        }
        if (descricao.includes('Restaura 1 de vida')) {
            return CardEffects.healSelf(contexto, 1);
        }
        if (descricao.includes('Outra criatura recebe +2 DEF')) {
            return CardEffects.buffOtherCreature(contexto, 2);
        }
        if (descricao.includes('Outra criatura recebe +1 DEF')) {
            return CardEffects.buffOtherCreature(contexto, 1);
        }
        if (descricao.includes('+2 DEF')) {
            return CardEffects.buffSelf(contexto, 0, 2);
        }
        if (descricao.includes('+1 DEF')) {
            return CardEffects.buffSelf(contexto, 0, 1);
        }
        if (descricao.includes('+1 ATK')) {
            return CardEffects.buffSelf(contexto, 1, 0);
        }
        if (descricao.includes('Causa 1 dano à criatura')) {
            return CardEffects.damageEnemyTarget(contexto, 1);
        }
    };
}

function criarEfeitosDaCarta(carta) {
    const gatilho = obterGatilhoDaCarta(carta);
    if (!gatilho) return {};

    const funcaoEfeito = criarFuncaoDoEfeito(carta);
    return { [gatilho]: funcaoEfeito };
}

function anexarGatilhosNaCarta(carta) {
    const gatilho = obterGatilhoDaCarta(carta);
    carta.gatilho = gatilho;
    carta.effects = criarEfeitosDaCarta(carta);
    return carta;
}

// Mantém compatibilidade com o código já existente.
function attachTriggersToCard(card) {
    return anexarGatilhosNaCarta(card);
}
