// --- VERSÃO FINAL E CORRIGIDA DO ADMIN.JS ---

window.addEventListener('load', () => {
    // Referências aos elementos da página
    const listaVendas = document.getElementById('lista-vendas');
    const botaoResetar = document.getElementById('botao-resetar');
    const totalVendasEl = document.getElementById('total-vendas');
    const tabelaUtilizadoresBody = document.querySelector('#tabela-utilizadores tbody');

    // Função para buscar e mostrar as VENDAS
    function carregarVendas() {
        fetch('/api/vendas')
            .then(response => response.json())
            .then(data => {
                listaVendas.innerHTML = '';
                if (data.vendas.length === 0) {
                    listaVendas.innerHTML = '<li>Nenhuma venda encontrada.</li>';
                } else {
                    data.vendas.forEach(venda => {
                        const item = document.createElement('li');
                        const dataFormatada = new Date(venda.data).toLocaleString('pt-BR');
                        // --- CORREÇÃO APLICADA AQUI ---
                        item.textContent = `Comprador: ${venda.comprador} | Produto: ${venda.produto} | Preço: R$ ${parseFloat(venda.preco).toFixed(2)} | Data: ${dataFormatada}`;
                        listaVendas.appendChild(item);
                    });
                }
                totalVendasEl.textContent = `Total Vendido: R$ ${data.totalVendido.toFixed(2)}`;
            })
            .catch(error => {
                console.error("Erro ao carregar vendas:", error);
                listaVendas.innerHTML = `<li>Ocorreu um erro ao carregar as vendas.</li>`;
                totalVendasEl.textContent = 'Total Vendido: Erro';
            });
    }

    // Função para buscar e mostrar os UTILIZADORES
    function carregarUtilizadores() {
        fetch('/api/utilizadores')
            .then(response => response.json())
            .then(data => {
                tabelaUtilizadoresBody.innerHTML = '';
                if (data.status === 'sucesso') {
                    data.utilizadores.forEach(user => {
                        const linha = document.createElement('tr');
                        linha.innerHTML = `
                            <td>${user.id}</td>
                            <td>${user.nome}</td>
                            <td>${user.email}</td>
                            <td>${parseFloat(user.saldo_cartao).toFixed(2)}</td>
                        `;
                        tabelaUtilizadoresBody.appendChild(linha);
                    });
                }
            })
            .catch(error => console.error("Erro ao carregar utilizadores:", error));
    }

    // Lógica do botão de resetar
    botaoResetar.addEventListener('click', () => {
        const senha = prompt("Por favor, insira a senha de administrador para resetar os dados:");
        if (senha !== null) {
            fetch('/api/resetar-vendas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senha: senha })
            })
            .then(response => response.json())
            .then(data => {
                alert(data.mensagem);
                if (data.status === 'sucesso') {
                    carregarVendas();
                    carregarUtilizadores();
                }
            })
            .catch(error => console.error("Erro ao resetar:", error));
        }
    });

    // Carregar os dados iniciais assim que a página abrir
    carregarVendas();
    carregarUtilizadores();
});