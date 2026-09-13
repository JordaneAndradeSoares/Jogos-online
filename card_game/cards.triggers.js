const GATILHOS_EFEITOS = Object.freeze(['campo', 'destruido', 'ativo']);
const CardTriggers = {};

function normalizarDescricaoEfeito(descricao) {
    return String(descricao || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function obterGatilhoDaCarta(carta) {
    if (!carta) return null;

    if (GATILHOS_EFEITOS.includes(carta.gatilho)) {
        return carta.gatilho;
    }

    const descricao = normalizarDescricaoEfeito(carta.desc);

    if (descricao.includes('[campo]')) return 'campo';
    if (descricao.includes('[destruido]')) return 'destruido';
    if (descricao.includes('[ativo]')) return 'ativo';

    return null;
}

function criarFuncaoDoEfeito(carta) {
    const descricao = normalizarDescricaoEfeito(carta.desc);

    return contexto => {
        // IMPORTANTE: danos diretos são testados antes dos demais danos.
        // Isso garante que cartas como Efeito 16 ("Causa 2 dano direto")
        // sempre acertem o jogador inimigo.
        let match = descricao.match(/causa\s+(\d+)\s+dano\s+direto/);
        if (match) {
            return CardEffects.damageOpponent(contexto, Number(match[1]));
        }

        match = descricao.match(/causa\s+(\d+)\s+dano\s+a\s+criatura/);
        if (match) {
            return CardEffects.damageEnemyTarget(contexto, Number(match[1]));
        }

        match = descricao.match(/restaura\s+(\d+)\s+de\s+vida/);
        if (match) {
            return CardEffects.healSelf(contexto, Number(match[1]));
        }

        match = descricao.match(/outra\s+criatura\s+recebe\s+\+(\d+)\s+def/);
        if (match) {
            return CardEffects.buffOtherCreature(contexto, Number(match[1]));
        }

        match = descricao.match(/\+(\d+)\s+atk/);
        if (match) {
            return CardEffects.buffSelf(contexto, Number(match[1]), 0);
        }

        match = descricao.match(/\+(\d+)\s+def/);
        if (match) {
            return CardEffects.buffSelf(contexto, 0, Number(match[1]));
        }

        if (descricao.includes('atordoa')) {
            return CardEffects.stunTarget(contexto);
        }

        console.warn(`Efeito sem implementação para a carta "${carta.name}": ${carta.desc}`);
        return false;
    };
}

function criarEfeitosDaCarta(carta) {
    const gatilho = obterGatilhoDaCarta(carta);

    if (!gatilho) return {};

    return {
        [gatilho]: criarFuncaoDoEfeito(carta)
    };
}

function anexarGatilhosNaCarta(carta) {
    if (!carta) return carta;

    const gatilho = obterGatilhoDaCarta(carta);
    carta.gatilho = gatilho;
    carta.effects = criarEfeitosDaCarta(carta);

    return carta;
}

// Mantém compatibilidade com o código já existente.
function attachTriggersToCard(card) {
    return anexarGatilhosNaCarta(card);
}
