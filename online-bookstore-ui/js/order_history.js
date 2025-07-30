document.addEventListener('DOMContentLoaded', async () => {
    if (typeof updateNav === 'function') {
        updateNav();
    } else {
        console.warn("updateNav function not found. Please ensure scripts.js is loaded.");
    }

    const user = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user'));
    if (!user || !user.id) {
        alert('Please log in to view your order history.');
        window.location.href = 'login.html';
        return;
    }

    await loadOrderHistory(user.id);
});

async function loadOrderHistory(userId) {
    const orderHistoryContainer = document.getElementById('orderHistoryContainer');
    orderHistoryContainer.innerHTML = '<p>Loading order history...</p>';

    try {
        const response = await ApiService.getOrderHistory(userId);

        if (response.success && response.orders && response.orders.length > 0) {
            let historyHtml = '';
            response.orders.forEach(order => {
                historyHtml += `
                    <div class="order-card">
                        <div class="order-header">
                            <h3>Order ID: ${order.id}</h3>
                            <p><strong>Order Date:</strong> ${order.order_date}</p>
                            <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                            <p><strong>Status:</strong> <span class="order-status-${order.status.toLowerCase()}">${order.status}</span></p>
                            <button class="button reorder-btn" onclick="reorderOrder(${order.id})">Reorder</button>
                        </div>
                        <div class="order-details-toggle" onclick="toggleOrderItems(this)">
                            <span>View Details</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="order-items-collapsed">
                            <h4>Shipping:</h4>
                            <p>${order.shipping_name}<br>
                               ${order.shipping_street}<br>
                               ${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}</p>
                            <h4>Payment:</h4>
                            <p><i class="fas fa-credit-card" style="margin-right: 5px;"></i> ${order.payment_display}</p>
                            
                            ${order.promo_code_applied ? `
                            <h4>Promotion:</h4>
                            <p>Code: ${order.promo_code_applied} (Discount: -$${order.discount_amount.toFixed(2)})</p>
                            ` : ''}

                            <h4>Items:</h4>
                            <table class="order-items-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Book Title</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Order Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;

                order.items.forEach(item => {
                    const itemTotal = (item.price_at_purchase * item.quantity).toFixed(2);
                    const imageUrl = item.image_at_purchase || 'https://placehold.co/50x75/cccccc/333333?text=No+Image';
                    historyHtml += `
                                    <tr>
                                        <td><img src="${imageUrl}" alt="${item.title_at_purchase}" style="width: 50px; height: 75px; object-fit: cover; border-radius: 5px;"></td>
                                        <td>${item.title_at_purchase}</td>
                                        <td>$${item.price_at_purchase.toFixed(2)}</td>
                                        <td>${item.quantity}</td>
                                        <td>$${order.total}</td>
                                    </tr>
                    `;
                });

                historyHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });
            orderHistoryContainer.innerHTML = historyHtml;
        } else {
            orderHistoryContainer.innerHTML = '<p>You have no past orders.</p>';
        }

    } catch (error) {
        console.error('Error loading order history:', error);
        orderHistoryContainer.innerHTML = '<p style="color: red;">Failed to load order history. Please try again.</p>';
        alert('Failed to load order history. Please try again.');
    }
}

function toggleOrderItems(element) {
    const itemsContainer = element.nextElementSibling;
    const icon = element.querySelector('i');

    if (itemsContainer.style.maxHeight && itemsContainer.style.maxHeight !== '0px') {
        itemsContainer.style.maxHeight = '0px';
        itemsContainer.style.padding = '0 15px';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    } else {
        itemsContainer.style.maxHeight = itemsContainer.scrollHeight + 'px';
        itemsContainer.style.padding = '15px';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    }
}

async function reorderOrder(orderId) {
    try {
        const response = await ApiService.getSingleOrder(orderId);

        if (response.success && response.order) {
            const orderToReorder = response.order;
            let currentCart = JSON.parse(localStorage.getItem('cart')) || [];

            orderToReorder.items.forEach(item => {
                const existingItemIndex = currentCart.findIndex(cartItem => cartItem.id === item.book_id);

                if (existingItemIndex > -1) {
                    currentCart[existingItemIndex].quantity += item.quantity;
                } else {
                    currentCart.push({
                        id: item.book_id,
                        title: item.title_at_purchase,
                        price: item.price_at_purchase,
                        quantity: item.quantity,
                        image: item.image_at_purchase
                    });
                }
            });

            localStorage.setItem('cart', JSON.stringify(currentCart));
            alert('Items from order have been added to your cart!');
            window.location.href = 'cart.html';

        } else {
            alert('Failed to retrieve order details for reorder.');
        }
    } catch (error) {
        console.error('Error reordering order:', error);
        alert('An error occurred while trying to reorder. Please try again.');
    }
}
