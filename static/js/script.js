// /montaki_agenda/static/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    const mesAnoElement = document.getElementById('mes-ano');
    const diasGridElement = document.getElementById('dias-grid');
    const prevMesBtn = document.getElementById('prev-mes');
    const nextMesBtn = document.getElementById('next-mes');

    let dataAtual = new Date();

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

            const numeroDia = document.createElement('div');
            numeroDia.className = 'numero-dia';
            numeroDia.textContent = dia;
            diaElement.appendChild(numeroDia);
            
            if (tarefas[dataCompleta]) {
                diaElement.classList.add('has-task');
                const taskListElement = document.createElement('div');
                taskListElement.className = 'task-list';
                tarefas[dataCompleta].forEach(descricao => {
                    const taskItem = document.createElement('div');
                    taskItem.className = 'task-item';
                    taskItem.textContent = descricao;
                    taskListElement.appendChild(taskItem);
                });
                diaElement.appendChild(taskListElement);
            }
            
            // Lógica de clique original
            diaElement.addEventListener('click', () => {
                const tarefasDoDia = tarefas[dataCompleta];
                if (tarefasDoDia && tarefasDoDia.length > 0) {
                    mostrarTarefas(dataCompleta, tarefasDoDia);
                } else {
                    adicionarTarefa(dataCompleta);
                }
            });
            
            diasGridElement.appendChild(diaElement);
        }
    };

    const mostrarTarefas = (data, descricoes) => {
        const dataFormatada = data.split('-').reverse().join('/');
        const listaFormatada = descricoes.map(d => `• ${d}`).join('\n');
        alert(`Tarefas para ${dataFormatada}:\n\n${listaFormatada}`);
    };

    const adicionarTarefa = async (data) => {
        const descricao = prompt(`Adicionar tarefa para ${data.split('-').reverse().join('/')}:\n(Ex: Bolo de casamento 3 andares)`);
        if (descricao && descricao.trim() !== '') {
            await fetch('/api/tarefas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: data, descricao: descricao.trim() }),
            });
            gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
        }
    };

    prevMesBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() - 1);
        gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
    });

    nextMesBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
    });
    
    gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
});