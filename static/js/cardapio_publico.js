document.addEventListener('DOMContentLoaded', () => {
    
    const WHATSAPP_NUMBER = '5519994221212';

    const quantityInputs = document.querySelectorAll('.item-quantity');
    const whatsappCart = document.getElementById('whatsapp-cart');
    const cartSummary = document.getElementById('cart-summary');
    const btnSendWhatsapp = document.getElementById('btn-send-whatsapp');

    let pedido = {};

    const atualizarCarrinho = () => {
        pedido = {};
        let totalItens = 0;

        quantityInputs.forEach(input => {
            const nome = input.dataset.nome;
            const quantidade = parseInt(input.value, 10);

            if (quantidade > 0) {
                pedido[nome] = quantidade;
                totalItens += quantidade;
            }
        });

        if (totalItens > 0) {
            cartSummary.textContent = `Seu pedido: ${totalItens} item(ns)`;
            whatsappCart.style.display = 'flex';
        } else {
            whatsappCart.style.display = 'none';
        }
    };

    const enviarPedidoWhatsApp = () => {
        if (Object.keys(pedido).length === 0) {
            alert('Seu carrinho está vazio. Adicione itens para fazer um pedido.');
            return;
        }

        let mensagem = 'Olá, Montaki Confeitaria! Gostaria de fazer o seguinte pedido:\n\n';
        for (const nome in pedido) {
            mensagem += `• ${pedido[nome]}x - ${nome}\n`;
        }
        mensagem += '\nObrigado(a)!';

        const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
        
        window.open(urlWhatsApp, '_blank');
    };

    // Adiciona um listener para cada campo de quantidade
    quantityInputs.forEach(input => {
        input.addEventListener('input', atualizarCarrinho);
    });

    // Adiciona o listener para o botão de enviar
    btnSendWhatsapp.addEventListener('click', enviarPedidoWhatsApp);
});