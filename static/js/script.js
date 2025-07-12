document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE ELEMENTOS ---
    const mesAnoElement = document.getElementById('mes-ano');
    const diasGridElement = document.getElementById('dias-grid');
    const prevMesBtn = document.getElementById('prev-mes');
    const nextMesBtn = document.getElementById('next-mes');
    const modal = document.getElementById('modal-tarefas');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalCorpo = document.getElementById('modal-corpo');
    const modalFecharBtn = document.getElementById('modal-fechar');
    const modalAdicionarTarefaBtn = document.getElementById('modal-adicionar-tarefa');

    let dataAtual = new Date();
    let dataSelecionadaParaAdicionar = null;

    // --- FUNÇÕES DO CALENDÁRIO ---
    const gerarCalendario = async (ano, mes) => {
        diasGridElement.innerHTML = '';
        mesAnoElement.textContent = `${new Date(ano, mes).toLocaleString('pt-BR', { month: 'long' })} ${ano}`;
        const response = await fetch('/api/tarefas');
        const tarefas = await response.json();
        let primeiroDia = new Date(ano, mes, 1).getDay();
        let diasNoMes = new Date(ano, mes + 1, 0).getDate();

        for (let i = 0; i < primeiroDia; i++) {
            diasGridElement.innerHTML += `<div class="dia outro-mes"></div>`;
        }

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const dataCompleta = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const diaElement = document.createElement('div');
            diaElement.className = 'dia';
            diaElement.innerHTML = `<div class="numero-dia">${dia}</div>`;
            const tarefasDoDia = tarefas[dataCompleta] || [];

            if (tarefasDoDia.length > 0) {
                diaElement.classList.add('has-task');
                const taskListElement = document.createElement('div');
                taskListElement.className = 'task-list';
                tarefasDoDia.forEach(tarefa => {
                    const taskItem = document.createElement('div');
                    taskItem.className = 'task-item';
                    taskItem.textContent = tarefa.desc; // ALTERADO: Usa tarefa.desc
                    taskListElement.appendChild(taskItem);
                });
                diaElement.appendChild(taskListElement);
            }
            
            diaElement.addEventListener('click', () => abrirModal(dataCompleta, tarefasDoDia));
            diasGridElement.appendChild(diaElement);
        }
    };

    // --- FUNÇÕES DA MODAL ---
    const abrirModal = (data, tarefas) => {
        dataSelecionadaParaAdicionar = data;
        const dataFormatada = data.split('-').reverse().join('/');
        modalTitulo.textContent = `Tarefas para ${dataFormatada}`;
        modalCorpo.innerHTML = ''; // Limpa o corpo da modal

        if (tarefas.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'lista-tarefas-modal';
            tarefas.forEach(tarefa => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${tarefa.desc}</span>
                    <button class="button-danger button-delete-tarefa" data-id="${tarefa.id}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                `;
                ul.appendChild(li);
            });
            modalCorpo.appendChild(ul);
        } else {
            modalCorpo.innerHTML = '<p>Nenhuma tarefa para este dia.</p>';
        }
        modal.style.display = 'flex';
    };

    const fecharModal = () => {
        modal.style.display = 'none';
    };

    // --- FUNÇÕES DE API (Adicionar/Excluir) ---
    const adicionarTarefa = async (data) => {
        const descricao = prompt(`Adicionar tarefa para ${data.split('-').reverse().join('/')}:`);
        if (descricao && descricao.trim() !== '') {
            await fetch('/api/tarefas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data, descricao: descricao.trim() }),
            });
            fecharModal();
            gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
        }
    };

    const excluirTarefa = async (tarefaId) => {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            await fetch(`/api/tarefas/${tarefaId}`, { method: 'DELETE' });
            fecharModal();
            gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
        }
    };

    // --- EVENT LISTENERS ---
    prevMesBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() - 1);
        gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
    });

    nextMesBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
    });

    modalFecharBtn.addEventListener('click', fecharModal);
    modal.addEventListener('click', (e) => { // Fecha se clicar fora do conteúdo
        if (e.target === modal) fecharModal();
    });

    modalAdicionarTarefaBtn.addEventListener('click', () => {
        adicionarTarefa(dataSelecionadaParaAdicionar);
    });
    
    // Delegação de evento para o botão de excluir
    modalCorpo.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.button-delete-tarefa');
        if (deleteButton) {
            const tarefaId = deleteButton.dataset.id;
            excluirTarefa(tarefaId);
        }
    });

    // --- INICIALIZAÇÃO ---
    gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
});