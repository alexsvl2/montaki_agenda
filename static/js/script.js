// /montaki_agenda/static/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    const mesAnoElement = document.getElementById('mes-ano');
    const diasGridElement = document.getElementById('dias-grid');
    const prevMesBtn = document.getElementById('prev-mes');
    const nextMesBtn = document.getElementById('next-mes');
    
    // Encontra os elementos do painel lateral
    const btnAdicionarTarefaPainel = document.getElementById('btn-adicionar-tarefa-painel');
    const dataSelecionadaElement = document.getElementById('data-selecionada-painel');
    const listaTarefasElement = document.getElementById('lista-tarefas-painel');

    let dataAtual = new Date();
    // Variável para guardar o dia que foi selecionado
    let diaSelecionado = null;

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
            }
            
            // Evento de clique para cada dia do calendário
            diaElement.addEventListener('click', () => {
                // Guarda o dia selecionado
                diaSelecionado = dataCompleta;
                
                // Atualiza o painel lateral com as informações do dia clicado
                dataSelecionadaElement.textContent = diaSelecionado.split('-').reverse().join('/');
                
                listaTarefasElement.innerHTML = ''; // Limpa a lista anterior
                if (tarefas[diaSelecionado] && tarefas[diaSelecionado].length > 0) {
                    tarefas[diaSelecionado].forEach(descricao => {
                        const p = document.createElement('p');
                        p.className = 'item-tarefa';
                        p.textContent = `• ${descricao}`;
                        listaTarefasElement.appendChild(p);
                    });
                } else {
                    listaTarefasElement.innerHTML = '<p>Nenhuma tarefa para este dia.</p>';
                }
            });
            
            diasGridElement.appendChild(diaElement);
        }
    };
    
    // Função que abre o popup para adicionar tarefa
    const adicionarTarefa = async (data) => {
        if (!data) {
            alert('Por favor, selecione um dia no calendário primeiro.');
            return;
        }

        const descricao = prompt(`Adicionar tarefa para ${data.split('-').reverse().join('/')}:\n(Ex: Bolo de casamento 3 andares)`);
        
        if (descricao && descricao.trim() !== '') {
            await fetch('/api/tarefas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: data, descricao: descricao.trim() }),
            });
            // Recarrega o calendário para mostrar a nova cor e atualizar os dados
            gerarCalendario(dataAtual.getFullYear(), dataAtual.getMonth());
            // Limpa o painel após adicionar
            listaTarefasElement.innerHTML = '<p>Selecione um dia para ver as tarefas.</p>';
            dataSelecionadaElement.textContent = '--/--/----';
            diaSelecionado = null;
        }
    };
    
    // Adiciona o evento de clique ao botão "Adicionar Nova Tarefa" do painel
    if (btnAdicionarTarefaPainel) {
        btnAdicionarTarefaPainel.addEventListener('click', () => {
            // Chama a função de adicionar tarefa usando o último dia que foi clicado
            adicionarTarefa(diaSelecionado);
        });
    }

    // Eventos dos botões de navegação do mês
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