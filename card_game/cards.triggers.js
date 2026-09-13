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
    if (GATILHOS_EFEITOS.includes(carta.gatilho)) return carta.gatilho;

    const descricao = normalizarDescricaoEfeito(carta.desc);
    if (descricao.includes('[campo]')) return 'campo';
    if (descricao.includes('[destruido]')) return 'destruido';
    if (descricao.includes('[ativo]')) return 'ativo';
    return null;
}

function efeitoPrecisaDeAlvo(carta) {
    const descricao = normalizarDescricaoEfeito(carta?.desc);
    return /outra\s+criatura\s+recebe\s+\+\d+\s+def/.test(descricao) ||
           /outra\s+carta\s+recebe\s+\+\d+\s+def/.test(descricao) ||
           /causa\s+\d+\s+dano\s+a\s+criatura/.test(descricao) ||
           /causa\s+\d+\s+dano\s+a\s+carta/.test(descricao) ||
           descricao.includes('atordoa');
}

function obterAlvosValidosDoEfeito(carta, owner) {
    const descricao = normalizarDescricaoEfeito(carta?.desc);
    const eAlvoAliado = /outra\s+(criatura|carta)\s+recebe/.test(descricao);
    const donoAlvo = eAlvoAliado ? owner : (owner === 'p1' ? 'p2' : 'p1');
    const campo = state.players[donoAlvo]?.field || [];

    return campo.map((cartaDoCampo, indice) => ({
        carta: cartaDoCampo,
        owner: donoAlvo,
        index: indice
    })).filter(alvo => {
        if (alvo.carta === carta) return false;
        if (/atordoa/.test(descricao)) return alvo.carta.type === 'criatura' && !alvo.carta.isFaceDown;
        if (/dano/.test(descricao)) return !alvo.carta.isFaceDown;
        return true;
    });
}

function criarFuncaoDoEfeito(carta) {
    const descricao = normalizarDescricaoEfeito(carta.desc);

    return contexto => {
        let match = descricao.match(/causa\s+(\d+)\s+dano\s+direto/);
        if (match) return CardEffects.damageOpponent(contexto, Number(match[1]));

        match = descricao.match(/causa\s+(\d+)\s+dano\s+a\s+(?:criatura|carta)/);
        if (match) return CardEffects.damageTarget(contexto, Number(match[1]));

        match = descricao.match(/restaura\s+(\d+)\s+de\s+vida/);
        if (match) return CardEffects.healSelf(contexto, Number(match[1]));

        match = descricao.match(/outra\s+(?:criatura|carta)\s+recebe\s+\+(\d+)\s+def/);
        if (match) return CardEffects.buffTarget(contexto, Number(match[1]));

        match = descricao.match(/\+(\d+)\s+atk/);
        if (match) return CardEffects.buffSelf(contexto, Number(match[1]), 0);

        match = descricao.match(/\+(\d+)\s+def/);
        if (match) return CardEffects.buffSelf(contexto, 0, Number(match[1]));

        if (descricao.includes('atordoa')) return CardEffects.stunTarget(contexto);

        console.warn(`Efeito sem implementação para a carta "${carta.name}": ${carta.desc}`);
        return false;
    };
}

function criarEfeitosDaCarta(carta) {
    const gatilho = obterGatilhoDaCarta(carta);
    if (!gatilho) return {};
    return { [gatilho]: criarFuncaoDoEfeito(carta) };
}

function anexarGatilhosNaCarta(carta) {
    if (!carta) return carta;
    carta.gatilho = obterGatilhoDaCarta(carta);
    carta.effects = criarEfeitosDaCarta(carta);
    return carta;
}

function attachTriggersToCard(card) {
    return anexarGatilhosNaCarta(card);
}
