document.addEventListener('DOMContentLoaded', () => {
    // IMPORTANTE: Troque pelo seu número de WhatsApp no formato internacional
    const WHATSAPP_NUMBER = '5519994221212'; 

    // Elementos da página
    const quantityInput = document.getElementById('quantity');
    const deliveryOptions = document.querySelectorAll('input[name="delivery_option"]');
    const basePriceElement = document.getElementById('base-price');
    const subtotalValueElement = document.getElementById('subtotal-value');
    const deliveryFeeRow = document.getElementById('delivery-fee-row');
    const finalTotalValueElement = document.getElementById('final-total-value');
    const sendButton = document.getElementById('send-whatsapp-order');

    const basePrice = parseFloat(basePriceElement.dataset.price);
    const deliveryFee = 5.00;

    const formatarPreco = (valor) => `R$ ${valor.toFixed(2)}`;

    // Função para calcular e atualizar todos os totais na tela
    const updateTotals = () => {
        const quantity = parseInt(quantityInput.value, 10);
        const isDelivery = document.getElementById('delivery').checked;

        const subtotal = basePrice * quantity;
        const finalTotal = isDelivery ? subtotal + deliveryFee : subtotal;

        subtotalValueElement.textContent = formatarPreco(subtotal);
        deliveryFeeRow.style.display = isDelivery ? 'flex' : 'none';
        finalTotalValueElement.textContent = formatarPreco(finalTotal);
    };

    // Função para montar e enviar a mensagem do WhatsApp
    const sendWhatsAppMessage = () => {
        const itemName = document.querySelector('.item-details-publico h3').textContent;
        const quantity = quantityInput.value;
        const deliveryType = document.getElementById('delivery').checked ? 'Delivery' : 'Retirada no local';
        const totalValue = finalTotalValueElement.textContent;

        let mensagem = `Olá, Montaki Confeitaria!\n\nGostaria de fazer o seguinte pedido:\n\n`;
        mensagem += `*Produto:* ${itemName}\n`;
        mensagem += `*Quantidade:* ${quantity}\n`;
        mensagem += `*Tipo de Entrega:* ${deliveryType}\n\n`;
        mensagem += `*Valor Total:* ${totalValue}\n\n`;
        mensagem += `Obrigado(a)!`;

        const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
        window.open(urlWhatsApp, '_blank');
    };

    // Adiciona os "escutadores" de eventos
    quantityInput.addEventListener('input', updateTotals);
    deliveryOptions.forEach(option => {
        option.addEventListener('change', updateTotals);
    });
    sendButton.addEventListener('click', sendWhatsAppMessage);

    // Calcula os totais iniciais ao carregar a página
    updateTotals();
});