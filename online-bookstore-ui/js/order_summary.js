document.addEventListener('DOMContentLoaded', () => {
    if (typeof updateNav === 'function') {
        updateNav();
    } else {
        console.warn("updateNav function not found. Please ensure scripts.js is loaded.");
    }

    showOrderSummary();
});

function showOrderSummary() {
    const orderDetailsContainer = document.getElementById('orderDetails');
    const totalDisplay = document.getElementById('totalDisplay');

    const lastOrder = JSON.parse(localStorage.getItem('lastOrder'));

    if (!lastOrder) {
        orderDetailsContainer.innerHTML = '<p>No order found. Please place an order first.</p>';
        totalDisplay.textContent = '';
        return;
    }

    let orderHtml = `
        <h3>Order ID: ${lastOrder.orderId || 'N/A'}</h3>
        <p><strong>Confirmation Number:</strong> ${lastOrder.payment.stripePaymentIntentId}</p>
        <p><strong>Order Date:</strong> ${lastOrder.date}</p>
        
        <h4>Shipping Information:</h4>
        <p>${lastOrder.shipping.name}</p>
        <p>${lastOrder.shipping.street}</p>
        <p>${lastOrder.shipping.city}, ${lastOrder.shipping.state} ${lastOrder.shipping.zip}</p>
        
        <h4>Payment Method:</h4>
        <p><i class="fas fa-credit-card" style="margin-right: 5px;"></i> ${lastOrder.payment.display}</p>

        <h4>Items Ordered:</h4>
        <table class="order-items-table">
            <thead>
                <tr>
                    <th></th> <!-- For image -->
                    <th>Book Title</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Item Total</th>
                </tr>
            </thead>
            <tbody>
    `;

    lastOrder.cart.forEach(item => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        const imageUrl = item.image || 'https://placehold.co/50x75/cccccc/333333?text=No+Image';

        orderHtml += `
            <tr>
                <td><img src="${imageUrl}" alt="${item.title}" style="width: 50px; height: 75px; object-fit: cover; border-radius: 5px;"></td>
                <td>${item.title}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>$${itemTotal}</td>
            </tr>
        `;
    });

    orderHtml += `
            </tbody>
        </table>
    `;

    orderDetailsContainer.innerHTML = orderHtml;

    totalDisplay.innerHTML = `
        <div class="summary-totals">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>$${lastOrder.subtotal}</span>
            </div>
            <div class="summary-row">
                <span>Tax:</span>
                <span>$${lastOrder.tax}</span>
            </div>
            <div class="summary-row total">
                <span>Total Paid:</span>
                <span>$${lastOrder.total}</span>
            </div>
        </div>
    `;
}
