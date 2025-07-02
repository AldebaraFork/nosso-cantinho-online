document.addEventListener('DOMContentLoaded', () => {

    const galeria = document.getElementById('galeria');
    // ... (resto das suas constantes de modal aqui)
    const modal = document.getElementById('modal-upload');
    const btnAbrir = document.getElementById('btn-abrir-modal');
    const btnFechar = document.getElementById('btn-fechar-modal');
    const form = document.querySelector('#modal-upload form');

    // Funções do Modal
    const abrirModal = () => modal.classList.add('aberto');
    const fecharModal = () => modal.classList.remove('aberto');
    btnAbrir.addEventListener('click', abrirModal);
    btnFechar.addEventListener('click', fecharModal);

    // Função para criar um cartão de foto no HTML (AGORA COM BOTÃO DE DELETE)
    const criarCartao = (foto) => {
        // A gente adiciona um 'data-id' para saber qual foto apagar
        // E também o botão com a classe 'btn-delete'
        return `
            <article class="cartao-foto" data-id="${foto.id}">
                <button class="btn-delete">🗑️</button>
                <img src="${foto.caminho}" alt="${foto.titulo}">
                <div class="info-foto">
                    <h3>${foto.titulo}</h3>
                    <p>${foto.descricao}</p>
                </div>
            </article>
        `;
    };

    // Função para carregar todas as fotos do servidor
    const carregarFotos = async () => {
        const response = await fetch('/fotos');
        const fotos = await response.json();
        galeria.innerHTML = ''; // Limpa a galeria
        fotos.forEach(foto => {
            galeria.insertAdjacentHTML('beforeend', criarCartao(foto));
        });
    };

    // Lógica do formulário de envio
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        await fetch('/upload', { method: 'POST', body: formData });
        await carregarFotos(); // Recarrega a galeria
        form.reset();
        fecharModal();
    });

    // ✨✨✨ NOVA LÓGICA PARA DELETAR ✨✨✨
    galeria.addEventListener('click', async (event) => {
        // Verifica se o que foi clicado foi um botão de deletar
        if (event.target.classList.contains('btn-delete')) {
            const cartao = event.target.closest('.cartao-foto');
            const id = cartao.dataset.id;
            
            // Pergunta de confirmação para não apagar sem querer
            if (confirm('Tem certeza que quer apagar esta memória para sempre?')) {
                const response = await fetch(`/fotos/${id}`, { method: 'DELETE' });
                const result = await response.json();
                console.log(result.message);
                
                // Remove o cartão da tela
                cartao.remove();
            }
        }
    });

    // Carrega todas as fotos quando a página abre
    carregarFotos();
    // ✨✨✨ NOVA LÓGICA DA MÚSICA ✨✨✨
const audio = document.getElementById('musica-fundo');
const btnMusica = document.getElementById('btn-musica');

// Garante que a música comece com um volume mais agradável
audio.volume = 0.3; // 30% do volume, você pode ajustar!

btnMusica.addEventListener('click', () => {
  // Se a música estiver pausada, dê play e mude o ícone
  if (audio.paused) {
    audio.play();
    btnMusica.textContent = '⏸️';
  } else { // Se estiver tocando, pause e mude o ícone
    audio.pause();
    btnMusica.textContent = '▶️';
  }
});

// Tenta dar autoplay de forma suave quando a página carrega
// Se o navegador bloquear, não tem problema, o usuário pode clicar.
const tentarAutoplay = async () => {
    try {
        await audio.play();
        btnMusica.textContent = '⏸️';
    } catch (err) {
        console.log("Autoplay foi bloqueado pelo navegador. Normal!");
        btnMusica.textContent = '▶️';
    }
};

// ... (resto do seu código, como o carregarFotos()) ...

// No final, troque a linha carregarFotos(); por esta, pra fazer as duas coisas
Promise.all([
    carregarFotos(),
    tentarAutoplay()
]);

}); // << Fim do 'DOMContentLoaded'
