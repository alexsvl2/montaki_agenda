document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-add-ingrediente');
    const tbody = document.getElementById('lista-ingredientes');
    const unidadeSelect = document.getElementById('unidade_medida');
    const quantidadeLabel = document.getElementById('label-quantidade');
    const quantidadeInput = document.getElementById('quantidade_pacote');

    const formatarPreco = (valor) => {
        // Mostra mais casas decimais para valores pequenos (custo por grama)
        if (valor < 0.01) return `R$ ${valor.toFixed(5)}`;
        return `R$ ${valor.toFixed(2)}`;
    };

    // Altera o placeholder do input de quantidade conforme a unidade selecionada
    const atualizarPlaceholder = () => {
        const unidade = unidadeSelect.value;
        if (unidade === 'g') {
            quantidadeLabel.textContent = "Quantidade no Pacote (em gramas)";
            quantidadeInput.placeholder = "Ex: 1000 (para 1kg)";
        } else if (unidade === 'ml') {
            quantidadeLabel.textContent = "Quantidade no Pacote (em ml)";
            quantidadeInput.placeholder = "Ex: 1000 (para 1L)";
        } else if (unidade === 'un') {
            quantidadeLabel.textContent = "Quantidade no Pacote (unidades)";
            quantidadeInput.placeholder = "Ex: 12 (para uma dúzia)";
        }
    };
    
    unidadeSelect.addEventListener('change', atualizarPlaceholder);

    const carregarIngredientes = async () => {
        try {
            const response = await fetch('/api/ingredientes');
            const ingredientes = await response.json();
            tbody.innerHTML = '';

            if (ingredientes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">Nenhum ingrediente cadastrado.</td></tr>';
                return;
            }

            ingredientes.forEach(ing => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${ing.nome}</td>
                    <td>${formatarPreco(ing.custo_unitario_base)} / ${ing.unidade_medida}</td>
                    <td>${formatarPreco(ing.preco_pacote)} / ${ing.quantidade_pacote}${ing.unidade_medida}</td>
                    <td>
                        <button class="button-danger" data-id="${ing.id}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar ingredientes.</td></tr>';
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dados = {
            nome: form.nome.value,
            preco_pacote: form.preco_pacote.value,
            quantidade_pacote: form.quantidade_pacote.value,
            unidade_medida: form.unidade_medida.value, // Enviando a unidade
        };

        try {
            const response = await fetch('/api/ingredientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
            });
            if (!response.ok) throw new Error('Falha ao adicionar ingrediente.');
            form.reset();
            atualizarPlaceholder(); // Reseta o label do placeholder
            carregarIngredientes();
        } catch (error) {
            alert('Não foi possível adicionar o ingrediente.');
        }
    });

    tbody.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.button-danger');
        if (deleteButton) {
            const id = deleteButton.dataset.id;
            if (confirm('Tem certeza que deseja remover este ingrediente?')) {
                try {
                    const response = await fetch(`/api/ingredientes/${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Falha ao remover ingrediente.');
                    carregarIngredientes();
                } catch (error) {
                    alert('Não foi possível remover o ingrediente.');
                }
            }
        }
    });
    
    // Chama as funções iniciais
    atualizarPlaceholder();
    carregarIngredientes();
});