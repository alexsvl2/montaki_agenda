document.addEventListener('DOMContentLoaded', () => {
    // Elementos principais da página
    const productGrid = document.getElementById('product-grid');
    const btnNovoProduto = document.getElementById('btn-novo-produto');

    // Elementos do Modal
    const recipeModal = document.getElementById('recipe-modal');
    const modalCloseBtn = document.getElementById('modal-recipe-close');
    const modalTitle = document.getElementById('modal-recipe-title');
    const modalCost = document.getElementById('modal-recipe-cost');
    const recipeItemsBody = document.getElementById('recipe-items-body');
    const formAddIngredient = document.getElementById('form-add-ingredient-to-recipe');
    const buscaIngredienteInput = document.getElementById('busca-ingrediente');
    const datalistIngredientes = document.getElementById('datalist-ingredientes');
    const quantidadeIngredienteInput = document.getElementById('quantidade-ingrediente');
    const unidadeSelecionadaSpan = document.getElementById('unidade-selecionada');

    let todosIngredientes = [];
    let produtoSelecionadoId = null;

    const formatarPreco = (valor) => `R$ ${valor.toFixed(2)}`;

    // Carrega os produtos e os exibe como cartões
    const carregarProdutos = async () => {
        const response = await fetch('/api/produtos');
        const produtos = await response.json();
        productGrid.innerHTML = '';
        if (produtos.length === 0) {
            productGrid.innerHTML = '<p>Nenhum produto cadastrado. Clique em "Adicionar Novo Produto" para começar.</p>';
        }
        produtos.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <h4>${produto.nome}</h4>
                <p>Clique para ver/editar a receita</p>
            `;
            card.addEventListener('click', () => abrirModalReceita(produto.id));
            productGrid.appendChild(card);
        });
    };

    // Abre e preenche o modal com os detalhes da receita
    const abrirModalReceita = async (id) => {
        produtoSelecionadoId = id;
        const response = await fetch(`/api/produto/${id}`);
        const produto = await response.json();

        modalTitle.textContent = `Receita de ${produto.nome}`;
        modalCost.textContent = `Custo Total: ${formatarPreco(produto.custo_total)}`;
        recipeItemsBody.innerHTML = '';
        produto.receita.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.ingrediente_nome}</td>
                <td>${item.quantidade} ${item.unidade_medida}</td>
                <td>${formatarPreco(item.custo_item)}</td>
                <td><button class="button-danger small-btn" data-item-id="${item.item_id}"><i class="fa-solid fa-trash-can"></i></button></td>
            `;
            tr.querySelector('button').addEventListener('click', () => deletarItemReceita(item.item_id));
            recipeItemsBody.appendChild(tr);
        });

        recipeModal.style.display = 'flex';
    };

    const fecharModalReceita = () => {
        recipeModal.style.display = 'none';
        produtoSelecionadoId = null;
        carregarProdutos(); // Recarrega os produtos para atualizar o custo se necessário
    };
    
    // Deleta um ingrediente da receita
    const deletarItemReceita = async (itemId) => {
        if (!confirm('Remover este ingrediente da receita?')) return;
        await fetch(`/api/receita_item/${itemId}`, { method: 'DELETE' });
        abrirModalReceita(produtoSelecionadoId); // Recarrega os detalhes no modal
    };

    // Carrega todos os ingredientes para a busca
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

    // Event Listeners
    btnNovoProduto.addEventListener('click', async () => {
        const nome = prompt('Digite o nome do novo produto:');
        if (nome && nome.trim()) {
            await fetch('/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nome.trim() })
            });
            carregarProdutos();
        }
    });

    modalCloseBtn.addEventListener('click', fecharModalReceita);
    recipeModal.addEventListener('click', (e) => {
        if (e.target === recipeModal) fecharModalReceita();
    });

    formAddIngredient.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nomeIngrediente = buscaIngredienteInput.value;
        const ingrediente = todosIngredientes.find(ing => ing.nome === nomeIngrediente);
        if (!ingrediente) {
            alert('Ingrediente inválido. Selecione um da lista.');
            return;
        }
        const dados = {
            ingrediente_id: ingrediente.id,
            quantidade: quantidadeIngredienteInput.value
        };
        await fetch(`/api/produto/${produtoSelecionadoId}/ingrediente`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        formAddIngredient.reset();
        unidadeSelecionadaSpan.textContent = 'g/ml/un';
        abrirModalReceita(produtoSelecionadoId);
    });

    buscaIngredienteInput.addEventListener('input', () => {
        const ingrediente = todosIngredientes.find(ing => ing.nome === buscaIngredienteInput.value);
        unidadeSelecionadaSpan.textContent = ingrediente ? ingrediente.unidade_medida : 'g/ml/un';
    });

    // Cargas iniciais
    carregarProdutos();
    carregarTodosIngredientes();
});