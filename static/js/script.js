// /montaki_agenda/static/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    const mesAnoElement = document.getElementById('mes-ano');
    const diasGridElement = document.getElementById('dias-grid');
    const prevMesBtn = document.getElementById('prev-mes');
    const nextMesBtn = document.getElementById('next-mes');

    // Elementos do Modal
    const modal = document.getElementById('modal-tarefas');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalCorpo = document.getElementById('modal-corpo');
    const modalFecharBtn = document.getElementById('modal-fechar');
    const modalAdicionarBtn = document.getElementById('modal-adicionar-tarefa');

    let dataAtual = new Date();
    let tarefasCache = {};

    const fetchTarefas = async () => {
        const response = await fetch('/api/tarefas');
        tarefasCache = await response.json();
    };

    const gerarCalendario = () => {
        diasGridElement.innerHTML = '';
        mesAnoElement.textContent = `${new Date(dataAtual.getFullYear(), dataAtual.getMonth()).toLocaleString('pt-BR', { month: 'long' })} ${dataAtual.getFullYear()}`;

        let primeiroDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1).getDay();
        let diasNoMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0).getDate();

        for (let i = 0; i < primeiroDia; i++) {
            diasGridElement.innerHTML += `<div class="dia outro-mes"></div>`;
        }

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const dataCompleta = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const diaElement = document.createElement('div');
            diaElement.className = 'dia';

            const numeroDia = document.createElement('div');
            numeroDia.className = 'numero-dia';
            numeroDia.textContent = dia;
            diaElement.appendChild(numeroDia);

            if (tarefasCache[dataCompleta]) {
                diaElement.classList.add('has-task');
                const taskListElement = document.createElement('div');
                taskListElement.className = 'task-list';
                tarefasCache[dataCompleta].forEach(tarefa => {
                    const taskItem = document.createElement('div');
                    taskItem.className = 'task-item';
                    taskItem.textContent = tarefa.descricao;
                    taskListElement.appendChild(taskItem);
                });
                diaElement.appendChild(taskListElement);
            }
            
            diaElement.addEventListener('click', () => abrirModal(dataCompleta));
            diasGridElement.appendChild(diaElement);
        }
    };

    const abrirModal = (data) => {
        const dataFormatada = data.split('-').reverse().join('/');
        modalTitulo.textContent = `Tarefas de ${dataFormatada}`;
        modalCorpo.innerHTML = ''; // Limpa o corpo do modal

        const tarefasDoDia = tarefasCache[data] || [];
        
        if (tarefasDoDia.length > 0) {
            tarefasDoDia.forEach(tarefa => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'tarefa-item-modal';
                itemDiv.innerHTML = `
                    <span>${tarefa.descricao}</span>
                    <div class="botoes-acao">
                        <button class="btn-editar" data-id="${tarefa.id}">Editar</button>
                        <button class="btn-excluir" data-id="${tarefa.id}">Excluir</button>
                    </div>
                `;
                modalCorpo.appendChild(itemDiv);
            });
        } else {
            modalCorpo.innerHTML = '<p>Nenhuma tarefa para este dia.</p>';
        }

        // Adiciona eventos aos botões de editar e excluir
        document.querySelectorAll('.btn-editar').forEach(btn => btn.addEventListener('click', (e) => editarTarefa(e.target.dataset.id)));
        document.querySelectorAll('.btn-excluir').forEach(btn => btn.addEventListener('click', (e) => excluirTarefa(e.target.dataset.id)));

        // Configura o botão de adicionar para a data atual
        modalAdicionarBtn.onclick = () => adicionarTarefa(data);

        modal.style.display = 'flex';
    };

    const fecharModal = () => {
        modal.style.display = 'none';
    };

    const adicionarTarefa = async (data) => {
        const descricao = prompt(`Adicionar nova tarefa para ${data.split('-').reverse().join('/')}:`);
        if (descricao && descricao.trim() !== '') {
            await fetch('/api/tarefas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data, descricao: descricao.trim() }),
            });
            await atualizarCalendario();
            fecharModal();
        }
    };

    const editarTarefa = async (id) => {
        const novaDescricao = prompt('Digite a nova descrição da tarefa:');
        if (novaDescricao && novaDescricao.trim() !== '') {
            await fetch(`/api/tarefas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descricao: novaDescricao.trim() }),
            });
            await atualizarCalendario();
            fecharModal();
        }
    };

    const excluirTarefa = async (id) => {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            await fetch(`/api/tarefas/${id}`, { method: 'DELETE' });
            await atualizarCalendario();
            fecharModal();
        }
    };

    const atualizarCalendario = async () => {
        await fetchTarefas();
        gerarCalendario();
    };

    // Event Listeners
    prevMesBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() - 1);
        gerarCalendario();
    });

    nextMesBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        gerarCalendario();
    });

    modalFecharBtn.addEventListener('click', fecharModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal(); // Fecha se clicar fora do conteúdo
    });

    // Inicia a aplicação
    atualizarCalendario();
});