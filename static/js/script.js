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
                    taskItem.textContent = tarefa.desc;
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
        modalCorpo.innerHTML = '';

        if (tarefas.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'lista-tarefas-modal';
            tarefas.forEach(tarefa => {
                const li = document.createElement('li');
                li.dataset.tarefaId = tarefa.id; // Guarda o ID no elemento li
                li.innerHTML = `
                    <span class="tarefa-texto">${tarefa.desc}</span>
                    <div class="tarefa-botoes">
                        <button class="button-icon button-edit-tarefa">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="button-icon button-danger button-delete-tarefa">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
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

    // --- FUNÇÕES DE API (Adicionar/Editar/Excluir) ---
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
    
    const salvarEdicaoTarefa = async (tarefaId, novoTexto) => {
        await fetch(`/api/tarefas/${tarefaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descricao: novoTexto }),
        });
        fecharModal();
        gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
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
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal();
    });

    modalAdicionarTarefaBtn.addEventListener('click', () => {
        adicionarTarefa(dataSelecionadaParaAdicionar);
    });
    
    modalCorpo.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.button-delete-tarefa');
        if (deleteButton) {
            const tarefaId = deleteButton.closest('li').dataset.tarefaId;
            excluirTarefa(tarefaId);
            return;
        }

        const editButton = e.target.closest('.button-edit-tarefa');
        if (editButton) {
            const li = editButton.closest('li');
            const tarefaId = li.dataset.tarefaId;
            const spanTexto = li.querySelector('.tarefa-texto');
            const textoAtual = spanTexto.textContent;
            
            // Substitui o texto por um campo de input
            li.innerHTML = `
                <input type="text" class="tarefa-edit-input" value="${textoAtual}">
                <button class="button-icon button-save-tarefa">
                    <i class="fa-solid fa-check"></i>
                </button>
            `;
            li.querySelector('.tarefa-edit-input').focus();
            return;
        }
        
        const saveButton = e.target.closest('.button-save-tarefa');
        if (saveButton) {
            const li = saveButton.closest('li');
            const tarefaId = li.dataset.tarefaId;
            const input = li.querySelector('.tarefa-edit-input');
            const novoTexto = input.value;
            salvarEdicaoTarefa(tarefaId, novoTexto);
        }
    });

    // --- INICIALIZAÇÃO ---
    gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
});