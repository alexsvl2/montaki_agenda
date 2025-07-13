// /montaki_agenda/static/js/produtos.js

document.addEventListener('DOMContentLoaded', () => {
    // Elementos da página
    const listaProdutosElement = document.getElementById('lista-produtos');
    const btnNovoProduto = document.getElementById('btn-novo-produto');
    const placeholderView = document.getElementById('placeholder-produto');
    const detalheView = document.getElementById('detalhe-view');
    const nomeProdutoElement = document.getElementById('nome-produto');
    const custoProdutoElement = document.getElementById('custo-produto');
    const corpoTabelaReceita = document.getElementById('corpo-tabela-receita');
    const formAddIngrediente = document.getElementById('form-add-ingrediente-receita');
    const buscaIngredienteInput = document.getElementById('busca-ingrediente');
    const datalistIngredientes = document.getElementById('datalist-ingredientes');
    const quantidadeIngredienteInput = document.getElementById('quantidade-ingrediente');
    const unidadeSelecionadaSpan = document.getElementById('unidade-selecionada');

    // Variáveis de estado
    let produtoSelecionadoId = null;
    let todosIngredientes = [];

    // --- FUNÇÕES PRINCIPAIS ---

    // Carrega a lista de produtos na barra lateral
    const carregarProdutos = async () => {
        const response = await fetch('/api/produtos');
        const produtos = await response.json();
        
        listaProdutosElement.innerHTML = '';
        produtos.forEach(produto => {
            const li = document.createElement('li');
            li.textContent = produto.nome;
            li.dataset.id = produto.id;
            if (produto.id === produtoSelecionadoId) {
                li.classList.add('active');
            }
            li.addEventListener('click', () => selecionarProduto(produto.id));
            listaProdutosElement.appendChild(li);
        });
    };

    // Carrega todos os ingredientes disponíveis para o formulário de busca
    const carregarTodosIngredientes = async () => {
        const response = await fetch('/api/ingredientes');
        todosIngredientes = await response.json();
        
        datalistIngredientes.innerHTML = '';
        todosIngredientes.forEach(ing => {
            const option = document.createElement('option');
            option.value = ing.nome;
            option.dataset.id = ing.id;
            datalistIngredientes.appendChild(option);
        });
    };

    // Exibe os detalhes de um produto selecionado
    const selecionarProduto = async (id) => {
        produtoSelecionadoId = id;
        carregarProdutos(); // Para destacar o item ativo

        const response = await fetch(`/api/produto/${id}`);
        const produto = await response.json();

        // Preenche os detalhes do produto
        nomeProdutoElement.textContent = produto.nome;
        custoProdutoElement.textContent = `Custo Total: R$ ${produto.custo_total.toFixed(2)}`;

        // Preenche a tabela da receita
        corpoTabelaReceita.innerHTML = '';
        produto.receita.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.ingrediente_nome}</td>
                <td>${item.quantidade} ${item.unidade_medida}</td>
                <td>R$ ${item.custo_item.toFixed(2)}</td>
                <td>
                    <button class="button-danger small-btn" data-item-id="${item.item_id}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
            // Adiciona evento ao botão de deletar
            tr.querySelector('.button-danger').addEventListener('click', () => deletarItemReceita(item.item_id));
            corpoTabelaReceita.appendChild(tr);
        });

        // Mostra a tela de detalhes
        placeholderView.style.display = 'none';
        detalheView.style.display = 'block';
    };

    // Deleta um item da receita
    const deletarItemReceita = async (itemId) => {
        if (!confirm('Tem certeza que deseja remover este ingrediente da receita?')) return;
        
        await fetch(`/api/receita_item/${itemId}`, { method: 'DELETE' });
        selecionarProduto(produtoSelecionadoId); // Recarrega os detalhes do produto
    };

    // --- EVENT LISTENERS ---

    // Botão de criar novo produto
    btnNovoProduto.addEventListener('click', async () => {
        const nome = prompt('Digite o nome do novo produto:');
        if (nome && nome.trim() !== '') {
            await fetch('/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nome.trim() })
            });
            carregarProdutos();
        }
    });

    // Formulário para adicionar ingrediente à receita
    formAddIngrediente.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nomeIngrediente = buscaIngredienteInput.value;
        const quantidade = quantidadeIngredienteInput.value;

        const ingredienteSelecionado = todosIngredientes.find(ing => ing.nome === nomeIngrediente);

        if (!ingredienteSelecionado) {
            alert('Ingrediente não encontrado. Por favor, selecione um da lista.');
            return;
        }

        await fetch(`/api/produto/${produtoSelecionadoId}/ingrediente`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ingrediente_id: ingredienteSelecionado.id,
                quantidade: quantidade
            })
        });

        formAddIngrediente.reset();
        unidadeSelecionadaSpan.textContent = 'g/ml/un';
        selecionarProduto(produtoSelecionadoId); // Recarrega os detalhes
    });

    // Atualiza a unidade de medida no formulário quando um ingrediente é selecionado
    buscaIngredienteInput.addEventListener('input', () => {
        const ingrediente = todosIngredientes.find(ing => ing.nome === buscaIngredienteInput.value);
        if (ingrediente) {
            unidadeSelecionadaSpan.textContent = ingrediente.unidade_medida;
        } else {
            unidadeSelecionadaSpan.textContent = 'g/ml/un';
        }
    });


    // --- INICIALIZAÇÃO ---
    carregarProdutos();
    carregarTodosIngredientes();
});