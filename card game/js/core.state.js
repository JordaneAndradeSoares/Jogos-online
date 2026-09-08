let state = {
    turn: 1,
    initiativeOwner: 'p1',
    consecutivePasses: 0,
    effectStack: [],
    selectedCardIndex: null,
    activeAttack: null,
    pendingDiscard: { p1: false, p2: false },
    players: {
        p1: { life: 20, energy: 1, maxEnergy: 1, deck: [], hand: [], field: [], gy: [] },
        p2: { life: 20, energy: 1, maxEnergy: 1, deck: [], hand: [], field: [], gy: [] }
    }
};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}