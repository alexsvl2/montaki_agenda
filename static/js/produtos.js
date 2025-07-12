document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById('lista-produtos');
    const newProductBtn = document.getElementById('btn-novo-produto');
    const detailContainer = document.getElementById('detalhe-produto-container');
    const placeholderView = document.getElementById('placeholder-produto');
    const detailView = document.getElementById('detalhe-view');
    
    let activeProductId = null;

    const formatarCusto = (valor) => `R$ ${valor.toFixed(2)}`;

    // Carrega a lista de produtos na barra lateral
    const carregarProdutos = async () => {
        const response = await fetch('/api/produtos');
        const produtos = await response.json();
        productList.innerHTML = '';
        produtos.forEach(p => {
            const li = document.createElement('li');
            li.className = 'product-list-item';
            li.dataset.id = p.id;
            li.textContent = p.nome;
            li.addEventListener('click', () => carregarDetalheProduto(p.id));
            productList.appendChild(li);
        });
    };

    // Carrega os detalhes de um produto específico na área principal
    const carregarDetalheProduto = async (productId) => {
        activeProductId = productId;
        
        // Marca o item ativo na lista
        document.querySelectorAll('.product-list-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id == productId);
        });

        const response = await fetch(`/api/produtos/${productId}`);
        const produto = await response.json();
        
        placeholderView.style.display = 'none';
        detailView.style.display = 'block';

        detailView.innerHTML = `
            <div class="product-detail-header">
                <h3>${produto.nome}</h3>
                <div class="custo-total-display">
                    Custo Total: <strong>${formatarCusto(produto.custo_total)}</strong>
                </div>
            </div>
            
            <div class="card">
                <h4>Receita</h4>
                <table class="recipe-table">
                    <thead>
                        <tr>
                            <th>Ingrediente</th>
                            <th>Gramas</th>
                            <th>Custo</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${produto.receita.map(item => `
                            <tr>
                                <td>${item.ingrediente_nome}</td>
                                <td>${item.gramas}g</td>
                                <td>${formatarCusto(item.custo_item)}</td>
                                <td>
                                    <button class="button-danger small-btn btn-delete-item" data-item-id="${item.item_id}">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h4>Adicionar Ingrediente à Receita</h4>
                <form id="form-add-ingrediente-receita" class="form-grid">
                    <div class="form-group">
                        <label>Buscar Ingrediente</label>
                        <input type="search" id="input-busca-ingrediente" placeholder="Digite para buscar..." autocomplete="off">
                        <div id="resultados-busca-ingrediente"></div>
                    </div>
                    <input type="hidden" id="input-ingrediente-id">
                    <div class="form-group">
                        <label>Gramas</label>
                        <input type="number" id="input-gramas" step="any" placeholder="Ex: 250" required>
                    </div>
                    <button type="submit" class="button-primary">Adicionar à Receita</button>
                </form>
            </div>
        `;
        // Adiciona os event listeners para os novos elementos criados
        adicionarEventListenersDetalhe();
    };

    const adicionarEventListenersDetalhe = () => {
        // Busca de ingredientes
        const inputBusca = document.getElementById('input-busca-ingrediente');
        const resultadosBusca = document.getElementById('resultados-busca-ingrediente');
        inputBusca.addEventListener('keyup', async () => {
            const query = inputBusca.value;
            if (query.length < 2) {
                resultadosBusca.innerHTML = '';
                return;
            }
            const response = await fetch(`/api/ingredientes/search?q=${query}`);
            const ingredientes = await response.json();
            resultadosBusca.innerHTML = ingredientes.map(ing => 
                `<div class="search-result-item" data-id="${ing.id}" data-nome="${ing.nome}">${ing.nome}</div>`
            ).join('');
        });

        // Selecionar um ingrediente da busca
        resultadosBusca.addEventListener('click', (e) => {
            if (e.target.classList.contains('search-result-item')) {
                document.getElementById('input-ingrediente-id').value = e.target.dataset.id;
                inputBusca.value = e.target.dataset.nome;
                resultadosBusca.innerHTML = '';
            }
        });

        // Adicionar ingrediente à receita
        document.getElementById('form-add-ingrediente-receita').addEventListener('submit', async (e) => {
            e.preventDefault();
            const ingredienteId = document.getElementById('input-ingrediente-id').value;
            const gramas = document.getElementById('input-gramas').value;

            if (!ingredienteId || !gramas) {
                alert('Por favor, selecione um ingrediente e informe as gramas.');
                return;
            }

            await fetch(`/api/produtos/${activeProductId}/ingredientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ingrediente_id: ingredienteId, gramas: gramas })
            });
            carregarDetalheProduto(activeProductId); // Recarrega os detalhes
        });
        
        // Deletar item da receita
        document.querySelectorAll('.btn-delete-item').forEach(btn => {
            btn.addEventListener('click', async () => {
                const itemId = btn.dataset.itemId;
                if (confirm('Remover este ingrediente da receita?')) {
                    await fetch(`/api/receita_item/${itemId}`, { method: 'DELETE' });
                    carregarDetalheProduto(activeProductId); // Recarrega
                }
            });
        });
    };
    
    // Criar um novo produto
    newProductBtn.addEventListener('click', async () => {
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

    // Carga inicial
    carregarProdutos();
});