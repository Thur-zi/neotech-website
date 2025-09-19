const formLogin = document.getElementById('form-login');
const mensagemResposta = document.getElementById('mensagem-resposta');

formLogin.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = event.target.email.value;
    const password = event.target.password.value;

    const dadosLogin = { email, password };

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosLogin)
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
        // 1. Guardar o email do utilizador no localStorage
        localStorage.setItem('usuarioLogado', email);

        // 2. Redirecionar para a página de perfil após 1 segundo
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000); // 1000 milissegundos = 1 segundo
    })
    .catch((error) => {
        console.error('Erro no login:', error);
        mensagemResposta.textContent = error.message;
        mensagemResposta.style.color = 'red';
    });
});