document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-add-ingrediente');
    const tbody = document.getElementById('lista-ingredientes');

    // Função para formatar o preço em Reais (R$)
    const formatarPreco = (valor) => {
        if (valor < 0.01) {
            // Para valores muito pequenos, mostra mais casas decimais
            return `R$ ${valor.toFixed(5)}`;
        }
        return `R$ ${valor.toFixed(2)}`;
    };

    // Função para carregar e exibir os ingredientes na tabela
    const carregarIngredientes = async () => {
        try {
            const response = await fetch('/api/ingredientes');
            if (!response.ok) throw new Error('Falha ao buscar ingredientes.');
            
            const ingredientes = await response.json();
            tbody.innerHTML = ''; // Limpa a tabela antes de preencher

            if (ingredientes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">Nenhum ingrediente cadastrado.</td></tr>';
                return;
            }

            ingredientes.forEach(ing => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${ing.nome}</td>
                    <td>${formatarPreco(ing.preco_por_grama)}</td>
                    <td>${formatarPreco(ing.preco_pacote)} / ${ing.peso_pacote_gramas}g</td>
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

    // Evento para adicionar um novo ingrediente
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dados = {
            nome: form.nome.value,
            preco_pacote: form.preco_pacote.value,
            peso_pacote_gramas: form.peso_pacote_gramas.value,
        };

        try {
            const response = await fetch('/api/ingredientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
            });

            if (!response.ok) throw new Error('Falha ao adicionar ingrediente.');
            
            form.reset(); // Limpa o formulário
            carregarIngredientes(); // Recarrega a lista
        } catch (error) {
            console.error('Erro:', error);
            alert('Não foi possível adicionar o ingrediente.');
        }
    });

    // Evento para deletar um ingrediente (usando delegação de evento)
    tbody.addEventListener('click', async (e) => {
        // Verifica se o clique foi no botão de deletar ou no ícone dentro dele
        const deleteButton = e.target.closest('.button-danger');
        if (deleteButton) {
            const id = deleteButton.dataset.id;
            if (confirm('Tem certeza que deseja remover este ingrediente?')) {
                try {
                    const response = await fetch(`/api/ingredientes/${id}`, {
                        method: 'DELETE',
                    });

                    if (!response.ok) throw new Error('Falha ao remover ingrediente.');
                    
                    carregarIngredientes(); // Recarrega a lista
                } catch (error) {
                    console.error('Erro:', error);
                    alert('Não foi possível remover o ingrediente.');
                }
            }
        }
    });

    // Carrega a lista inicial ao entrar na página
    carregarIngredientes();
});