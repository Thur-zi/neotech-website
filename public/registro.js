// --- VERSÃO FINAL DO REGISTRO.JS ---

const formRegistro = document.getElementById('form-registro');
const mensagemResposta = document.getElementById('mensagem-resposta');

formRegistro.addEventListener('submit', (event) => {
    event.preventDefault();

    const nome = event.target.nome.value;
    const email = event.target.email.value;
    const password = event.target.password.value;

    const dadosDoUsuario = { nome, email, password };

    fetch('/api/criar-conta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosDoUsuario),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.mensagem) });
        }
        return response.json();
    })
    .then(data => {
        mensagemResposta.textContent = data.mensagem;
        mensagemResposta.style.color = 'green';

        // ***** NOVIDADE AQUI *****
        // 1. "Logamos" o novo utilizador automaticamente guardando o seu email
        localStorage.setItem('usuarioLogado', email);

        // 2. Redirecionamos para a página principal após 1 segundo
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000); // 1 segundo para o utilizador ler a mensagem de sucesso
    })
    .catch((error) => {
        console.error('Erro:', error);
        mensagemResposta.textContent = error.message;
        mensagemResposta.style.color = 'red';
    });
});