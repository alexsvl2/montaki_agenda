// /montaki_agenda/static/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do Calendário
    const mesAnoElement = document.getElementById('mes-ano');
    const diasGridElement = document.getElementById('dias-grid');
    const prevMesBtn = document.getElementById('prev-mes');
    const nextMesBtn = document.getElementById('next-mes');

    // Elementos do Modal
    const modal = document.getElementById('modal-tarefas');
    const modalFecharBtn = document.getElementById('modal-fechar');
    const modalDataElement = document.getElementById('modal-data');
    const modalCorpo = document.getElementById('modal-corpo');

    let dataAtual = new Date();
    let tarefasDoMes = {};

    const gerarCalendario = async () => {
        const ano = dataAtual.getFullYear();
        const mes = dataAtual.getMonth();
        
        diasGridElement.innerHTML = '';
        mesAnoElement.textContent = `${new Date(ano, mes).toLocaleString('pt-BR', { month: 'long' })} ${ano}`;

        const response = await fetch('/api/tarefas');
        tarefasDoMes = await response.json();

        let primeiroDia = new Date(ano, mes, 1).getDay();
        let diasNoMes = new Date(ano, mes + 1, 0).getDate();

        for (let i = 0; i < primeiroDia; i++) {
            diasGridElement.innerHTML += `<div class="dia outro-mes"></div>`;
        }

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const dataCompleta = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const diaElement = document.createElement('div');
            diaElement.className = 'dia';
            
            // --- ALTERAÇÃO AQUI ---
            // Criamos um elemento separado para o número do dia
            const numeroDia = document.createElement('div');
            numeroDia.className = 'numero-dia';
            numeroDia.textContent = dia;
            diaElement.appendChild(numeroDia);

            // Se existirem tarefas para este dia
            if (tarefasDoMes[dataCompleta]) {
                diaElement.classList.add('has-task');

                // Criamos a lista de resumos de tarefas
                const taskList = document.createElement('div');
                taskList.className = 'task-list';
                
                // Iteramos sobre as tarefas e adicionamos a descrição
                tarefasDoMes[dataCompleta].forEach(tarefa => {
                    const taskItem = document.createElement('div');
                    taskItem.className = 'task-item';
                    taskItem.textContent = tarefa.descricao; // Acessa a propriedade 'descricao'
                    taskList.appendChild(taskItem);
                });
                diaElement.appendChild(taskList);
            }
            // --- FIM DA ALTERAÇÃO ---
            
            diaElement.addEventListener('click', () => abrirModal(dataCompleta));
            diasGridElement.appendChild(diaElement);
        }
    };

    const abrirModal = (data) => {
        modalDataElement.textContent = data.split('-').reverse().join('/');
        modalCorpo.innerHTML = '';

        const tarefasDoDia = tarefasDoMes[data] || [];

        if (tarefasDoDia.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'lista-tarefas-modal';
            tarefasDoDia.forEach(tarefa => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${tarefa.descricao}</span>
                    <div class="task-actions">
                        <button class="btn-action btn-edit" data-id="${tarefa.id}"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn-action btn-delete" data-id="${tarefa.id}"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                `;
                ul.appendChild(li);
            });
            modalCorpo.appendChild(ul);
        }

        const btnAdicionar = document.createElement('button');
        btnAdicionar.textContent = 'Adicionar Nova Tarefa';
        btnAdicionar.className = 'button-primary';
        btnAdicionar.addEventListener('click', () => adicionarTarefa(data));
        modalCorpo.appendChild(btnAdicionar);

        modalCorpo.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', (e) => editarTarefa(e.currentTarget.dataset.id)));
        modalCorpo.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', (e) => deletarTarefa(e.currentTarget.dataset.id)));

        modal.style.display = 'flex';
    };

    const fecharModal = () => {
        modal.style.display = 'none';
    };

    const adicionarTarefa = async (data) => {
        const descricao = prompt('Digite a nova tarefa:');
        if (descricao && descricao.trim() !== '') {
            await fetch('/api/tarefas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: data, descricao: descricao.trim() })
            });
            fecharModal();
            gerarCalendario();
        }
    };

    const editarTarefa = async (id) => {
        const descricaoAntiga = document.querySelector(`.btn-edit[data-id='${id}']`).closest('li').querySelector('span').textContent;
        const novaDescricao = prompt('Edite a tarefa:', descricaoAntiga);
        if (novaDescricao && novaDescricao.trim() !== '' && novaDescricao !== descricaoAntiga) {
            await fetch(`/api/tarefa/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descricao: novaDescricao.trim() })
            });
            fecharModal();
            gerarCalendario();
        }
    };

    const deletarTarefa = async (id) => {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            await fetch(`/api/tarefa/${id}`, { method: 'DELETE' });
            fecharModal();
            gerarCalendario();
        }
    };

    modalFecharBtn.addEventListener('click', fecharModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal();
    });
    prevMesBtn.addEventListener('click', () => { dataAtual.setMonth(dataAtual.getMonth() - 1); gerarCalendario(); });
    nextMesBtn.addEventListener('click', () => { dataAtual.setMonth(dataAtual.getMonth() + 1); gerarCalendario(); });
    
    gerarCalendario();
});