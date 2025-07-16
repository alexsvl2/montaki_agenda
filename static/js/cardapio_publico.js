document.addEventListener('DOMContentLoaded', () => {
    const pedirButtons = document.querySelectorAll('.btn-pedir');
    const cartItemCount = document.getElementById('cart-item-count');

    // Função para atualizar a contagem de itens no ícone do carrinho
    const atualizarContagemCarrinho = () => {
        // Pega o carrinho do localStorage ou cria um objeto vazio se não existir
        const carrinho = JSON.parse(localStorage.getItem('montakiCart')) || {};
        // Soma as quantidades de todos os itens no carrinho
        const totalItens = Object.values(carrinho).reduce((total, item) => total + item.quantidade, 0);

        if (totalItens > 0) {
            cartItemCount.textContent = totalItens;
            cartItemCount.style.display = 'block';
        } else {
            cartItemCount.style.display = 'none';
        }
    };

    // Função para adicionar um item ao carrinho
    const adicionarAoCarrinho = (e) => {
        const button = e.currentTarget;
        const id = button.dataset.id;
        const nome = button.dataset.nome;
        const valor = parseFloat(button.dataset.valor);

        // Pega o carrinho do localStorage ou cria um novo
        let carrinho = JSON.parse(localStorage.getItem('montakiCart')) || {};

        // Se o item já está no carrinho, incrementa a quantidade. Se não, adiciona com quantidade 1.
        if (carrinho[id]) {
            carrinho[id].quantidade += 1;
        } else {
            carrinho[id] = {
                nome: nome,
                valor: valor,
                quantidade: 1
            };
        }

        // Salva o carrinho atualizado de volta no localStorage
        localStorage.setItem('montakiCart', JSON.stringify(carrinho));

        // Atualiza o número no ícone do carrinho
        atualizarContagemCarrinho();

        // Dá um feedback visual para o usuário
        button.textContent = 'Adicionado!';
        button.disabled = true;
        setTimeout(() => {
            button.textContent = 'Pedir';
            button.disabled = false;
        }, 1000);
    };

    // Adiciona o evento de clique a todos os botões "Pedir"
    pedirButtons.forEach(button => {
        button.addEventListener('click', adicionarAoCarrinho);
    });

    // Atualiza a contagem no ícone assim que a página carrega
    atualizarContagemCarrinho();
});