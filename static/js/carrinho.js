document.addEventListener('DOMContentLoaded', () => {
    const WHATSAPP_NUMBER = '5519994221212';
    const deliveryFee = 5.00;

    const itemsContainer = document.getElementById('cart-items-container');
    const summaryCard = document.getElementById('cart-summary-card');
    const subtotalEl = document.getElementById('subtotal-value');
    const deliveryFeeRow = document.getElementById('delivery-fee-row');
    const finalTotalEl = document.getElementById('final-total-value');
    const deliveryOptions = document.querySelectorAll('input[name="delivery_option"]');
    const sendButton = document.getElementById('send-whatsapp-order');

    const formatarPreco = (valor) => `R$ ${valor.toFixed(2)}`;

    const carregarCarrinho = () => {
        const carrinho = JSON.parse(localStorage.getItem('montakiCart')) || {};
        itemsContainer.innerHTML = '';
        
        if (Object.keys(carrinho).length === 0) {
            itemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
            summaryCard.style.display = 'none';
            return;
        }

        summaryCard.style.display = 'block';

        for (const id in carrinho) {
            const item = carrinho[id];
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item-row';
            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.nome}</span>
                    <span class="cart-item-price">${formatarPreco(item.valor)}</span>
                </div>
                <div class="cart-item-controls">
                    <input type="number" class="item-quantity-cart" data-id="${id}" value="${item.quantidade}" min="1" step="1">
                    <button class="button-danger small-btn remove-item-btn" data-id="${id}"><i class="fas fa-trash-can"></i></button>
                </div>
            `;
            itemsContainer.appendChild(itemElement);
        }
        addEventListeners();
        calcularTotais();
    };

    const calcularTotais = () => {
        const carrinho = JSON.parse(localStorage.getItem('montakiCart')) || {};
        let subtotal = 0;
        for (const id in carrinho) {
            subtotal += carrinho[id].valor * carrinho[id].quantidade;
        }

        const isDelivery = document.getElementById('delivery').checked;
        const totalFinal = isDelivery ? subtotal + deliveryFee : subtotal;

        subtotalEl.textContent = formatarPreco(subtotal);
        deliveryFeeRow.style.display = isDelivery ? 'flex' : 'none';
        finalTotalEl.textContent = formatarPreco(totalFinal);
    };

    const addEventListeners = () => {
        document.querySelectorAll('.item-quantity-cart').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const novaQuantidade = parseInt(e.target.value, 10);
                const carrinho = JSON.parse(localStorage.getItem('montakiCart'));
                if (novaQuantidade > 0) {
                    carrinho[id].quantidade = novaQuantidade;
                } else {
                    delete carrinho[id];
                }
                localStorage.setItem('montakiCart', JSON.stringify(carrinho));
                carregarCarrinho();
            });
        });

        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const carrinho = JSON.parse(localStorage.getItem('montakiCart'));
                delete carrinho[id];
                localStorage.setItem('montakiCart', JSON.stringify(carrinho));
                carregarCarrinho();
            });
        });
    };
    
    deliveryOptions.forEach(option => option.addEventListener('change', calcularTotais));

    sendButton.addEventListener('click', () => {
        const carrinho = JSON.parse(localStorage.getItem('montakiCart'));
        if (!carrinho || Object.keys(carrinho).length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }

        const deliveryType = document.getElementById('delivery').checked ? 'Delivery' : 'Retirada no local';
        const totalValue = finalTotalEl.textContent;
        
        let mensagem = `Olá, Montaki Confeitaria! Gostaria de fazer o seguinte pedido:\n\n`;
        for (const id in carrinho) {
            const item = carrinho[id];
            mensagem += `• ${item.quantidade}x - ${item.nome}\n`;
        }
        mensagem += `\n*Tipo de Entrega:* ${deliveryType}\n`;
        mensagem += `*Valor Total:* ${totalValue}\n\n`;
        mensagem += `Obrigado(a)!`;

        const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
        window.open(urlWhatsApp, '_blank');
    });

    carregarCarrinho();
});