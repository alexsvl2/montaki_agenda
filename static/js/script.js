// /montaki_agenda/static/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    const mesAnoElement = document.getElementById('mes-ano');
    const diasGridElement = document.getElementById('dias-grid');
    const prevMesBtn = document.getElementById('prev-mes');
    const nextMesBtn = document.getElementById('next-mes');

    let dataAtual = new Date();

    const gerarCalendario = async (ano, mes) => {
        // Limpa o calendário antigo
        diasGridElement.innerHTML = '';
        
        // Define o mês e ano no cabeçalho
        mesAnoElement.textContent = `${new Date(ano, mes).toLocaleString('pt-BR', { month: 'long' })} ${ano}`;

        // Obtém as tarefas do servidor
        const response = await fetch('/api/tarefas');
        const tarefas = await response.json();

        // Lógica para criar o calendário
        let primeiroDia = new Date(ano, mes, 1).getDay();
        let diasNoMes = new Date(ano, mes + 1, 0).getDate();

        // Cria as células vazias para os dias do mês anterior
        for (let i = 0; i < primeiroDia; i++) {
            diasGridElement.innerHTML += `<div class="dia outro-mes"></div>`;
        }

        // Cria as células para cada dia do mês atual
        for (let dia = 1; dia <= diasNoMes; dia++) {
            const dataCompleta = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            let classes = 'dia';

            if (tarefas[dataCompleta]) {
                classes += ' has-task';
            }

            const diaElement = document.createElement('div');
            diaElement.className = classes;
            diaElement.dataset.data = dataCompleta;
            
            const numeroDia = document.createElement('span');
            numeroDia.className = 'numero-dia';
            numeroDia.textContent = dia;
            diaElement.appendChild(numeroDia);

            // Adiciona um evento de clique para adicionar tarefas
            diaElement.addEventListener('click', () => adicionarTarefa(dataCompleta));
            
            diasGridElement.appendChild(diaElement);
        }
    };

    const adicionarTarefa = async (data) => {
        const descricao = prompt(`Adicionar tarefa para ${data.split('-').reverse().join('/')}:\n(Ex: Bolo de casamento 3 andares)`);
        
        if (descricao && descricao.trim() !== '') {
            try {
                const response = await fetch('/api/tarefas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ data: data, descricao: descricao.trim() }),
                });

                if (response.ok) {
                    // Recarrega o calendário para mostrar a nova cor
                    gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
                } else {
                    alert('Erro ao adicionar tarefa.');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro de conexão ao adicionar tarefa.');
            }
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
    
    // Gera o calendário inicial
    gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
});