// Ponte de recompensa: cada chamada corresponde a uma moeda realmente coletada.
window.DigiBridge = {
  reward(coins = 1) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "COIN_REWARD", coins: coins }, "*");
    }
  }
};
