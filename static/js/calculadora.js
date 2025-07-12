document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-add-ingrediente');
    const tbody = document.getElementById('lista-ingredientes');
    const selectUnidade = document.getElementById('unidade_medida');
    const labelMedidaPacote = document.getElementById('label-medida-pacote');
    const inputMedidaPacote = document.getElementById('medida_pacote');

    const formatarPreco = (valor) => {
        if (valor < 0.01) {
            return `R$ ${valor.toFixed(5)}`;
        }
        return `R$ ${valor.toFixed(2)}`;
    };

    const carregarIngredientes = async () => {
        try {
            const response = await fetch('/api/ingredientes');
            if (!response.ok) throw new Error('Falha ao buscar ingredientes.');
            
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
                    <td>${formatarPreco(ing.preco_unidade_base)} / ${ing.unidade_medida}</td>
                    <td>${formatarPreco(ing.preco_pacote)} / ${ing.medida_pacote}${ing.unidade_medida}</td>
                    <td>
                        <button class="button-danger" data-id="${ing.id}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error('Erro:', error);
            tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar ingredientes.</td></tr>';
        }
    };

    const atualizarFormulario = () => {
        const unidade = selectUnidade.value;
        if (unidade === 'g') {
            labelMedidaPacote.textContent = 'Peso do Pacote (em gramas)';
            inputMedidaPacote.placeholder = 'Ex: 1000 para 1kg';
        } else if (unidade === 'ml') {
            labelMedidaPacote.textContent = 'Volume do Pacote (em ml)';
            inputMedidaPacote.placeholder = 'Ex: 1000 para 1L';
        } else if (unidade === 'un') {
            labelMedidaPacote.textContent = 'Quantidade no Pacote (unidades)';
            inputMedidaPacote.placeholder = 'Ex: 12 (para uma dúzia)';
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dados = {
            nome: form.nome.value,
            preco_pacote: form.preco_pacote.value,
            medida_pacote: form.medida_pacote.value,
            unidade_medida: form.unidade_medida.value,
        };

        try {
            const response = await fetch('/api/ingredientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
            });

            if (!response.ok) throw new Error('Falha ao adicionar ingrediente.');
            
            form.reset();
            atualizarFormulario();
            carregarIngredientes();
        } catch (error) {
            console.error('Erro:', error);
            alert('Não foi possível adicionar o ingrediente.');
        }
    });

    tbody.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.button-danger');
        if (deleteButton) {
            const id = deleteButton.dataset.id;
            if (confirm('Tem certeza que deseja remover este ingrediente?')) {
                await fetch(`/api/ingredientes/${id}`, { method: 'DELETE' });
                carregarIngredientes();
            }
        }
    });

    selectUnidade.addEventListener('change', atualizarFormulario);

    atualizarFormulario();
    carregarIngredientes();
});