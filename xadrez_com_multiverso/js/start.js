"use strict";

// Inicia diretamente uma partida local para dois jogadores.
window.addEventListener("load", () => {
  const options = {
    public: false,
    time: { start: [-1, -1] },
    players: [
      // O índice 0 é sempre o lado preto; o índice 1 é o lado branco.
      { name: "Pretas" },
      { name: "Brancas" }
    ]
  };
  try {
    window.game = new ClientGame(document.body, options, false);
  } catch (error) {
    console.error("Não foi possível iniciar a partida:", error);
    const message = document.createElement("p");
    message.style.cssText = "position:fixed;z-index:99999;top:1rem;left:1rem;background:#fff;color:#900;padding:1rem;border:2px solid #900";
    message.textContent = "Não foi possível iniciar o jogo. Abra o Console (F12) para consultar os detalhes.";
    document.body.append(message);
  }
});
