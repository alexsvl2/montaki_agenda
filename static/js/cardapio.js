document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('cardapio-grid');
    const btnAddItem = document.getElementById('btn-add-item');
    const modal = document.getElementById('item-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalClose = document.getElementById('modal-close');
    const itemForm = document.getElementById('item-form');
    const itemIdInput = document.getElementById('item-id');
    const itemNameInput = document.getElementById('item-nome');
    const itemDescricaoInput = document.getElementById('item-descricao');
    const itemValorInput = document.getElementById('item-valor');
    const itemFotoInput = document.getElementById('item-foto');
    const fotoAtualContainer = document.getElementById('foto-atual-container');
    const fotoAtualImg = document.getElementById('foto-atual-img');

    const carregarItens = async () => {
        const response = await fetch('/api/cardapio');
        const itens = await response.json();
        grid.innerHTML = '';
        itens.forEach(item => {
            const card = document.createElement('div');
            card.className = 'cardapio-card';
            card.classList.toggle('disabled', !item.ativo);
            const fotoSrc = item.foto ? `/static/uploads/${item.foto}` : 'https://via.placeholder.com/300x200.png?text=Sem+Foto';
            card.innerHTML = `
                <img src="${fotoSrc}" alt="${item.nome}" class="cardapio-foto">
                <div class="cardapio-body">
                    <h4>${item.nome}</h4>
                    <p>${item.descricao}</p>
                    <div class="cardapio-footer">
                        <span class="cardapio-valor">R$ ${item.valor.toFixed(2)}</span>
                        <div class="cardapio-actions">
                            <label class="switch"><input type="checkbox" class="toggle-status" data-id="${item.id}" ${item.ativo ? 'checked' : ''}><span class="slider round"></span></label>
                            <button class="btn-action btn-edit" data-id="${item.id}"><i class="fas fa-pencil"></i></button>
                            <button class="btn-action btn-delete" data-id="${item.id}"><i class="fas fa-trash-can"></i></button>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        addEventListeners();
    };

    const abrirModal = (item = null) => {
        itemForm.reset();
        fotoAtualContainer.style.display = 'none';
        if (item) {
            modalTitle.textContent = 'Editar Item';
            itemIdInput.value = item.id;
            itemNameInput.value = item.nome;
            itemDescricaoInput.value = item.descricao;
            itemValorInput.value = item.valor;
            if (item.foto) {
                fotoAtualContainer.style.display = 'block';
                fotoAtualImg.src = `/static/uploads/${item.foto}?v=${new Date().getTime()}`; // Adiciona timestamp para evitar cache
            }
        } else {
            modalTitle.textContent = 'Adicionar Novo Item';
            itemIdInput.value = '';
        }
        modal.style.display = 'flex';
    };

    const fecharModal = () => {
        modal.style.display = 'none';
    };

    const addEventListeners = () => {
        document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            const response = await fetch('/api/cardapio');
            const itens = await response.json();
            const item = itens.find(i => i.id == id);
            abrirModal(item);
        }));
        document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm('Tem certeza que deseja excluir este item?')) {
                await fetch(`/api/cardapio/${id}`, { method: 'DELETE' });
                carregarItens();
            }
        }));
        document.querySelectorAll('.toggle-status').forEach(toggle => toggle.addEventListener('change', async (e) => {
            const id = e.currentTarget.dataset.id;
            await fetch(`/api/cardapio/${id}/toggle`, { method: 'PATCH' });
            carregarItens();
        }));
    };

    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(itemForm); // Usa FormData para capturar todos os campos, incluindo o arquivo
        const id = itemIdInput.value;
        const url = id ? `/api/cardapio/${id}` : '/api/cardapio';
        const method = id ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, { method: method, body: formData });
            if (!response.ok) throw new Error('Falha ao salvar o item.');
            fecharModal();
            carregarItens();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert(error.message);
        }
    });

    btnAddItem.addEventListener('click', () => abrirModal());
    modalClose.addEventListener('click', fecharModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal();
    });

    carregarItens();
});