// orderSummary.js
document.addEventListener('DOMContentLoaded', () => {
    // Ensure updateNav is called if you have it in a separate nav.js
    // If updateNav is in apiService.js, it might already be called.
    if (typeof updateNav === 'function') {
        updateNav();
    }

    loadOrderSummary();
});

function loadOrderSummary() {
    const orderDetailsContainer = document.getElementById('orderSummaryDetails');
    const noOrderMessage = document.getElementById('noOrderMessage');

    // Retrieve the last order from localStorage
    const lastOrderString = localStorage.getItem('lastOrder');

    if (lastOrderString) {
        try {
            const order = JSON.parse(lastOrderString);

            // Populate Order Information
            document.getElementById('orderId').textContent = order.userId ? `${order.userId.substring(0, 8)}...` : 'N/A'; // Display truncated user ID
            document.getElementById('orderDate').textContent = order.date || 'N/A';
            // Order status is hardcoded as 'Completed' based on the flow

            // Populate Items Ordered
            const orderItemsTableBody = document.querySelector('#orderItems tbody');
            orderItemsTableBody.innerHTML = ''; // Clear existing content
            if (order.cart && order.cart.length > 0) {
                order.cart.forEach(item => {
                    const itemTotal = (item.price * item.quantity).toFixed(2);
                    const row = `
                        <tr>
                            <td class="py-2 px-4">${item.title}</td>
                            <td class="py-2 px-4">$${item.price.toFixed(2)}</td>
                            <td class="py-2 px-4">${item.quantity}</td>
                            <td class="py-2 px-4">$${itemTotal}</td>
                        </tr>
                    `;
                    orderItemsTableBody.insertAdjacentHTML('beforeend', row);
                });
            } else {
                orderItemsTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">No items found for this order.</td></tr>';
            }

            // Populate Order Totals
            document.getElementById('orderSubtotal').textContent = `$${parseFloat(order.subtotal || 0).toFixed(2)}`;
            document.getElementById('orderTax').textContent = `$${parseFloat(order.tax || 0).toFixed(2)}`;
            document.getElementById('orderTotal').textContent = `$${parseFloat(order.total || 0).toFixed(2)}`;

            // Populate Shipping Address
            if (order.shipping) {
                document.getElementById('shippingName').textContent = order.shipping.name || '';
                document.getElementById('shippingStreet').textContent = order.shipping.street || '';
                document.getElementById('shippingCityStateZip').textContent = 
                    `${order.shipping.city || ''}, ${order.shipping.state || ''} ${order.shipping.zip || ''}`.trim();
            } else {
                document.getElementById('shippingName').textContent = 'No shipping address provided.';
                document.getElementById('shippingStreet').textContent = '';
                document.getElementById('shippingCityStateZip').textContent = '';
            }

            // Populate Payment Method
            const paymentMethodDisplay = document.getElementById('paymentMethodDisplay');
            if (order.payment && order.payment.display) {
                // The display string from checkout.js already includes brand icon and details
                paymentMethodDisplay.innerHTML = order.payment.display;
            } else {
                paymentMethodDisplay.textContent = 'Payment method details not available.';
            }

            // Show order details and hide no order message
            orderDetailsContainer.classList.remove('hidden');
            noOrderMessage.classList.add('hidden');

        } catch (error) {
            console.error('Error parsing order data from localStorage:', error);
            orderDetailsContainer.classList.add('hidden');
            noOrderMessage.classList.remove('hidden');
        }
    } else {
        // No order found in localStorage
        orderDetailsContainer.classList.add('hidden');
        noOrderMessage.classList.remove('hidden');
    }
}
