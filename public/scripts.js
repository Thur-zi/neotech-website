window.addEventListener('load', () => {
    const perfilLogadoDiv = document.getElementById('perfil-logado');
    const perfilDeslogadoDiv = document.getElementById('perfil-deslogado');
    const linksUsuarioHeader = document.getElementById('links-usuario');
    const usuarioLogadoEmail = localStorage.getItem('usuarioLogado');

    if (usuarioLogadoEmail) {
        perfilLogadoDiv.style.display = 'block';
        perfilDeslogadoDiv.style.display = 'none';
        linksUsuarioHeader.style.display = 'none';

        fetch(`/api/perfil/${usuarioLogadoEmail}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'sucesso') {
                    document.getElementById('nome-sidebar').textContent = data.utilizador.nome;
                    // --- CORREÇÃO ESTÁ AQUI ---
                    document.getElementById('saldo-sidebar').textContent = parseFloat(data.utilizador.saldo_cartao).toFixed(2);
                }
            });

        document.getElementById('logout-sidebar').addEventListener('click', () => {
            localStorage.removeItem('usuarioLogado');
            alert('Você saiu da sua conta.');
            window.location.reload();
        });

    } else {
        perfilLogadoDiv.style.display = 'none';
        perfilDeslogadoDiv.style.display = 'block';
        linksUsuarioHeader.style.display = 'flex';
    }

    const botoesComprar = document.querySelectorAll('button');
    botoesComprar.forEach(botao => {
        if (botao.textContent === 'Comprar') {
            botao.addEventListener('click', (event) => {
                const emailUsuario = localStorage.getItem('usuarioLogado');
                if (!emailUsuario) {
                    alert('Você precisa de fazer o login para poder comprar!');
                    window.location.href = '/login.html';
                    return;
                }

                const linhaProduto = event.target.closest('tr');
                // Corrigido para pegar o produto no lugar certo (coluna 2, não 1)
                const nomeProduto = linhaProduto.querySelector('td:nth-child(2)').textContent;
                const precoProduto = parseFloat(linhaProduto.dataset.preco);

                const dadosDaCompra = { emailUsuario, nomeProduto, precoProduto };

                fetch('/api/comprar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosDaCompra)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'sucesso') {
                        alert(data.mensagem);
                        // Atualiza o saldo na barra lateral visualmente
                        document.getElementById('saldo-sidebar').textContent = data.novoSaldo.toFixed(2);
                    } else {
                        alert(`Erro: ${data.mensagem}`);
                    }
                })
                .catch(error => {
                    console.error('Erro ao comprar:', error);
                    alert('Ocorreu um erro de comunicação ao tentar comprar.');
                });
            });
        }
    });
});