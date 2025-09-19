window.addEventListener('load', () => {
    const usuarioLogadoEmail = localStorage.getItem('usuarioLogado');
    const saudacaoPerfil = document.getElementById('saudacao-perfil');

    if (!usuarioLogadoEmail) {
        saudacaoPerfil.textContent = 'Acesso negado. Por favor, faça o login.';
        setTimeout(() => { window.location.href = '/login.html'; }, 2000);
        return;
    }

    fetch(`/api/perfil/${usuarioLogadoEmail}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'sucesso') {
                const utilizador = data.utilizador;
                saudacaoPerfil.textContent = `Olá, ${utilizador.nome}!`;
                document.getElementById('email-usuario').textContent = utilizador.email;
                // --- CORREÇÃO ESTÁ AQUI ---
                document.getElementById('limite-cartao').textContent = parseFloat(utilizador.limite_cartao).toFixed(2);
                document.getElementById('saldo-cartao').textContent = parseFloat(utilizador.saldo_cartao).toFixed(2);
            } else {
                saudacaoPerfil.textContent = data.mensagem;
            }
        })
        .catch(error => {
            console.error('Erro ao buscar dados do perfil:', error);
            saudacaoPerfil.textContent = 'Não foi possível carregar os seus dados.';
        });

    const botaoLogout = document.getElementById('botao-logout');
    botaoLogout.addEventListener('click', () => {
        localStorage.removeItem('usuarioLogado');
        alert('Você saiu da sua conta.');
        window.location.href = '/index.html';
    });

    const botaoApagar = document.getElementById('botao-apagar');
    botaoApagar.addEventListener('click', () => {
        const confirmacao = confirm('Você tem a certeza que quer apagar a sua conta? Esta ação é irreversível!');
        if (confirmacao) {
            fetch('/api/apagar-conta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: usuarioLogadoEmail })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'sucesso') {
                    localStorage.removeItem('usuarioLogado');
                    alert(data.mensagem);
                    window.location.href = '/index.html';
                } else {
                    alert(`Erro: ${data.mensagem}`);
                }
            })
            .catch(error => console.error("Erro ao apagar conta:", error));
        }
    });
});