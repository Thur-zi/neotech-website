const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const porta = 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function criarTabelas() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL,
                limite_cartao NUMERIC(10, 2) DEFAULT 500.00,
                saldo_cartao NUMERIC(10, 2) DEFAULT 500.00
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS vendas (
                id SERIAL PRIMARY KEY,
                comprador_email VARCHAR(100) NOT NULL,
                produto VARCHAR(100) NOT NULL,
                preco NUMERIC(10, 2) NOT NULL,
                data TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('Tabelas verificadas/criadas com sucesso na base de dados PostgreSQL!');
    } catch (error) {
        console.error('Erro ao criar as tabelas:', error);
    } finally {
        client.release();
    }
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// --- ROTAS DE UTILIZADOR ---
app.post('/api/criar-conta', async (req, res) => {
    const { nome, email, password } = req.body;
    try {
        const result = await pool.query('INSERT INTO users (nome, email, password) VALUES ($1, $2, $3) RETURNING id', [nome, email, password]);
        res.json({ status: 'sucesso', mensagem: `Conta para ${nome} criada com sucesso!` });
    } catch (error) {
        if (error.code === '23505') { return res.status(400).json({ status: 'erro', mensagem: 'Este email já está registado.' }); }
        console.error('Erro ao criar conta:', error);
        res.status(500).json({ status: 'erro', mensagem: 'Ocorreu um erro no servidor.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const utilizador = result.rows[0];
        if (utilizador && utilizador.password === password) {
            delete utilizador.password;
            res.json({ status: 'sucesso', mensagem: `Bem-vindo de volta, ${utilizador.nome}!`, utilizador });
        } else {
            res.status(401).json({ status: 'erro', mensagem: 'Email ou password incorretos.' });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ status: 'erro', mensagem: 'Ocorreu um erro no servidor.' });
    }
});

app.get('/api/perfil/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const result = await pool.query('SELECT nome, email, limite_cartao, saldo_cartao FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            res.json({ status: 'sucesso', utilizador: result.rows[0] });
        } else {
            res.status(404).json({ status: 'erro', mensagem: 'Utilizador não encontrado.' });
        }
    } catch (error) {
        console.error('Erro ao obter perfil:', error);
        res.status(500).json({ status: 'erro', mensagem: 'Ocorreu um erro no servidor.' });
    }
});

app.post('/api/apagar-conta', async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query('DELETE FROM users WHERE email = $1', [email]);
        if (result.rowCount > 0) {
            res.json({ status: 'sucesso', mensagem: 'A sua conta foi apagada com sucesso.' });
        } else {
            res.status(404).json({ status: 'erro', mensagem: 'Utilizador não encontrado para apagar.' });
        }
    } catch (error) {
        console.error('Erro ao apagar conta:', error);
        res.status(500).json({ status: 'erro', mensagem: 'Ocorreu um erro no servidor.' });
    }
});

app.post('/api/comprar', async (req, res) => {
    const { emailUsuario, nomeProduto, precoProduto } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [emailUsuario]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ status: 'erro', mensagem: 'Utilizador não encontrado.' });
        }
        const utilizador = userResult.rows[0];
        if (utilizador.saldo_cartao < precoProduto) {
            return res.status(400).json({ status: 'erro', mensagem: 'Saldo insuficiente para esta compra.' });
        }
        const novoSaldo = utilizador.saldo_cartao - precoProduto;
        await pool.query('UPDATE users SET saldo_cartao = $1 WHERE email = $2', [novoSaldo, emailUsuario]);
        await pool.query('INSERT INTO vendas (comprador_email, produto, preco) VALUES ($1, $2, $3)', [emailUsuario, nomeProduto, precoProduto]);
        res.json({ status: 'sucesso', mensagem: 'Compra efetuada com sucesso!', novoSaldo: novoSaldo });
    } catch (error) {
        console.error('Erro ao processar a compra:', error);
        res.status(500).json({ status: 'erro', mensagem: 'Ocorreu um erro no servidor.' });
    }
});


// --- ROTAS DE ADMIN ---

app.get('/api/vendas', async (req, res) => {
    try {
        const vendasResult = await pool.query('SELECT * FROM vendas ORDER BY data DESC');
        const totalResult = await pool.query('SELECT SUM(preco) as total FROM vendas');
        res.json({ status: 'sucesso', vendas: vendasResult.rows, totalVendido: parseFloat(totalResult.rows[0].total) || 0 });
    } catch (error) {
        res.status(500).json({ status: 'erro', mensagem: 'Ocorreu um erro ao ler o histórico de vendas.' });
    }
});

app.post('/api/resetar-vendas', async (req, res) => {
    const senhaAdmin = "neotech123";
    const { senha } = req.body;
    if (senha !== senhaAdmin) {
        return res.status(401).json({ status: 'erro', mensagem: 'Senha de administrador incorreta.' });
    }
    try {
        await pool.query('UPDATE users SET saldo_cartao = limite_cartao');
        await pool.query('DELETE FROM vendas');
        res.json({ status: 'sucesso', mensagem: 'Histórico de vendas e saldos resetados com sucesso!' });
    } catch (error) {
        res.status(500).json({ status: 'erro', mensagem: 'Ocorreu um erro ao resetar os dados.' });
    }
});

// ******** NOVA ROTA DE ADMIN PARA LISTAR UTILIZADORES ********
app.get('/api/utilizadores', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nome, email, limite_cartao, saldo_cartao FROM users ORDER BY id ASC');
        res.json({ status: 'sucesso', utilizadores: result.rows });
    } catch (error) {
        console.error('Erro ao buscar utilizadores:', error);
        res.status(500).json({ status: 'erro', mensagem: 'Ocorreu um erro ao buscar a lista de utilizadores.' });
    }
});


// --- INICIAR O SERVIDOR ---
app.listen(porta, () => {
    console.log(`Servidor a funcionar na porta ${porta}`);
    criarTabelas();
});