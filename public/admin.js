// --- LÓGICA DO PAINEL DE ADMINISTRAÇÃO ---

window.addEventListener('load', () => {
    const listaVendas = document.getElementById('lista-vendas');
    const botaoResetar = document.getElementById('botao-resetar');
    const totalVendasEl = document.getElementById('total-vendas'); // Pega o novo h3 do total

    // Função para buscar e mostrar as vendas E O TOTAL
    function carregarVendas() {
        fetch('/api/vendas')
            .then(response => response.json())
            .then(data => {
                listaVendas.innerHTML = ''; // Limpa a lista atual

                if (data.vendas.length === 0) {
                    listaVendas.innerHTML = '<li>Nenhuma venda encontrada.</li>';
                } else {
                    // Cria um item de lista (<li>) para cada venda
                    data.vendas.forEach(venda => {
                        const item = document.createElement('li');
                        const dataFormatada = new Date(venda.data).toLocaleString('pt-BR');
                        item.textContent = `Comprador: ${venda.comprador} | Produto: ${venda.produto} | Preço: R$ ${venda.preco.toFixed(2)} | Data: ${dataFormatada}`;
                        listaVendas.appendChild(item);
                    });
                }

                // ATUALIZA O TOTAL NA PÁGINA com o valor que veio da API
                totalVendasEl.textContent = `Total Vendido: R$ ${data.totalVendido.toFixed(2)}`;
            })
            .catch(error => {
                console.error("Erro ao carregar vendas:", error);
                listaVendas.innerHTML = '<li>Ocorreu um erro ao carregar as vendas.</li>';
                totalVendasEl.textContent = 'Total Vendido: Erro';
            });
    }

    // Lógica do botão de resetar (continua a mesma)
    botaoResetar.addEventListener('click', () => {
        const senha = prompt("Por favor, insira a senha de administrador para resetar as vendas:");

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
                    carregarVendas(); // Apenas chama a função de recarregar, que já atualiza tudo
                }
            })
            .catch(error => {
                console.error("Erro ao resetar:", error);
                alert("Ocorreu um erro de comunicação ao tentar resetar.");
            });
        }
    });

    // Carregar os dados assim que a página abrir
    carregarVendas();
});