// orderHistory.js
document.addEventListener('DOMContentLoaded', () => {
    // Ensure updateNav is called if you have it in a separate nav.js
    // If updateNav is in apiService.js, it might already be called.
    if (typeof updateNav === 'function') {
        updateNav();
    }

    loadOrderHistory();
});

function loadOrderHistory() {
    const orderHistoryContainer = document.getElementById('orderHistoryContainer');
    const noOrderMessage = document.getElementById('noOrderMessage');

    // Retrieve the order history from localStorage
    const history = JSON.parse(localStorage.getItem('orderHistory')) || [];

    if (history.length === 0) {
        orderHistoryContainer.classList.add('hidden');
        noOrderMessage.classList.remove('hidden');
        return;
    }
    
    orderHistoryContainer.innerHTML = ''; // Clear existing content
    noOrderMessage.classList.add('hidden'); // Hide no order message

    // Display orders in reverse chronological order (most recent first)
    history.slice().reverse().forEach((order, index) => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card'; // Tailwind classes for styling

        let itemsHtml = '';
        if (order.cart && order.cart.length > 0) {
            order.cart.forEach(item => {
                const itemTotal = (item.price * item.quantity).toFixed(2);
                itemsHtml += `
                    <div class="order-item">
                        <img src="${item.image || 'https://placehold.co/60x80/e0e0e0/555555?text=No+Image'}" alt="${item.title}" class="w-16 h-20 object-cover rounded-md mr-4">
                        <div class="order-item-info flex-grow">
                            <h4 class="text-md font-medium text-gray-900">${item.title}</h4>
                            <p class="text-sm text-gray-600">$${item.price.toFixed(2)} &times; ${item.quantity}</p>
                        </div>
                        <span class="text-gray-800 font-semibold">$${itemTotal}</span>
                    </div>
                `;
            });
        } else {
            itemsHtml = '<p class="text-center text-gray-500 py-4">No items found for this order.</p>';
        }
        
        // Calculate the actual index for reorder based on the reversed array
        // The original `reorder` function expects the index from the *original* array,
        // so we need to pass the correct original index.
        const originalIndex = history.length - 1 - index;

        orderCard.innerHTML = `
            <div class="order-header">
                <h3>Order ID: ${order.id ? order.id.substring(0, 8) + '...' : 'N/A'}</h3>
                <p>Date: ${order.date || 'N/A'}</p>
            </div>
            <div class="order-items">
                ${itemsHtml}
            </div>
            <div class="order-total">
                <p>Total: <span class="font-bold text-lg text-green-700">$${parseFloat(order.total || 0).toFixed(2)}</span></p>
                <button onclick="reorder(${originalIndex})" class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300">Reorder</button>
            </div>
        `;
        
        orderHistoryContainer.appendChild(orderCard);
    });
}

// This function needs to be globally accessible or exported if using modules
function reorder(originalIndex) {
    const history = JSON.parse(localStorage.getItem('orderHistory')) || [];
    // Access the order from the original (non-reversed) history array
    const order = history[originalIndex]; 
    
    if (order && order.cart) {
        localStorage.setItem('cart', JSON.stringify(order.cart));
        // Provide a user-friendly message before redirecting
        alert('Items added to your cart! Redirecting to cart page.');
        window.location.href = 'cart.html';
    } else {
        alert('Could not reorder. Order details are missing or invalid.');
    }
}
