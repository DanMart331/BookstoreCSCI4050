const stripe = Stripe(API_CONFIG.STRIPE.PUBLIC_KEY);
const elements = stripe.elements();

const cardStyle = {
    base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
            color: '#aab7c4'
        }
    },
    invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
    }
};

const cardElement = elements.create('card', { style: cardStyle });

document.addEventListener('DOMContentLoaded', () => {
    cardElement.mount('#card-element');

    cardElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });
});


document.addEventListener('DOMContentLoaded', async () => {
    updateNav();
    loadCheckoutSummary();

    const user = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user'));
    console.log(user);
    if (!user || !user.id) {
        alert('Please log in to continue checkout.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch(`/api/auth/profile?id=${user.id}`);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const { user: u } = await res.json();
        console.log("User Profile Data:", u);

        if (u) {
            document.getElementById('shippingName').value = u.name || '';
            document.getElementById('shippingStreet').value = u.street || '';
            document.getElementById('shippingCity').value = u.city || '';
            document.getElementById('shippingState').value = u.state || '';
            document.getElementById('shippingZip').value = u.zip || '';

            displayPaymentMethods(u.allPaymentMethods, u.defaultPaymentMethod);
        }
    } catch (error) {
        console.error('Error fetching user profile or payment methods:', error);
        alert('Failed to load user information and payment methods. Please try again.');
        document.getElementById('paymentMethodsDisplay').innerHTML = '<p style="color: red;">Could not load saved payment methods.</p>';
    }

    document.getElementById('addNewPaymentMethodBtn').addEventListener('click', () => {
        document.getElementById('newPaymentMethodForm').style.display = 'block';
        document.getElementById('addNewPaymentMethodBtn').style.display = 'none';
    });

    document.getElementById('saveNewCardBtn').addEventListener('click', async () => {
        const cardErrors = document.getElementById('card-errors');
        cardErrors.textContent = '';

        document.getElementById('saveNewCardBtn').disabled = true;
        document.getElementById('saveNewCardBtn').textContent = 'Saving...';

        try {
            const { paymentMethod, error } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                cardErrors.textContent = error.message;
            } else {
                console.log('Stripe Payment Method created:', paymentMethod);

                const setDefault = document.getElementById('setDefaultCard').checked;
                const saveRes = await fetch('/api/auth/save-payment-method', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        paymentMethodId: paymentMethod.id,
                        setDefault: setDefault
                    })
                });

                const saveResult = await saveRes.json();
                if (saveResult.success) {
                    alert('Payment method saved successfully!');
                    const updatedUserRes = await fetch(`/api/auth/profile?id=${user.id}`);
                    const { user: updatedUser } = await updatedUserRes.json();
                    if (updatedUser) {
                        displayPaymentMethods(updatedUser.allPaymentMethods, updatedUser.defaultPaymentMethod);
                    }
                    document.getElementById('newPaymentMethodForm').style.display = 'none';
                    document.getElementById('addNewPaymentMethodBtn').style.display = 'block';
                    cardElement.clear();
                } else {
                    cardErrors.textContent = saveResult.error || 'Failed to save payment method.';
                }
            }
        } catch (err) {
            console.error('Error in saving new card process:', err);
            cardErrors.textContent = 'An unexpected error occurred while saving your card.';
        } finally {
            document.getElementById('saveNewCardBtn').disabled = false;
            document.getElementById('saveNewCardBtn').textContent = 'Save New Card';
        }
    });


    document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.07;
        const total = subtotal + tax;
        const submitButton = document.getElementById('checkoutForm').querySelector('button[type="submit"]');

        const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
        if (!currentUser || !currentUser.id) {
            alert('User not logged in or ID missing.');
            submitButton.disabled = false;
            submitButton.textContent = 'Place Order';
            return;
        }

        const selectedPaymentMethodRadio = document.querySelector('input[name="paymentMethod"]:checked');

        if (!selectedPaymentMethodRadio) {
            alert('Please select a payment method.');
            submitButton.disabled = false;
            submitButton.textContent = 'Place Order';
            return;
        }
        const paymentMethodIdForOrder = selectedPaymentMethodRadio.value;
        const selectedPaymentMethodDisplay = selectedPaymentMethodRadio.nextElementSibling.textContent.trim();

        try {
            const { clientSecret } = await ApiService.createPaymentIntent(Math.round(total * 100), currentUser.id);

            if (!clientSecret) {
                throw new Error('Failed to get client secret for payment.');
            }

            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: paymentMethodIdForOrder, 
            });

            if (stripeError) {
                console.error('Stripe Payment Confirmation Error:', stripeError);
                alert('Payment failed: ' + (stripeError.message || 'Unknown payment error.'));
            }

            if (paymentIntent.status === 'succeeded') {
                console.log('Payment successful:', paymentIntent);

                const order = {
                    userId: currentUser.id,
                    cart: cart,
                    subtotal: subtotal.toFixed(2),
                    tax: tax.toFixed(2),
                    total: total.toFixed(2),
                    shipping: {
                        name: e.target.shippingName.value,
                        street: e.target.shippingStreet.value,
                        city: e.target.shippingCity.value,
                        state: e.target.shippingState.value,
                        zip: e.target.shippingZip.value
                    },
                    payment: {
                        stripePaymentIntentId: paymentIntent.id, // Send the Payment Intent ID
                        display: selectedPaymentMethodDisplay
                    },
                    date: new Date().toLocaleString()
                };

                const placeOrderRes = await fetch('/api/orders/place', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order)
                });

                const placeOrderResult = await placeOrderRes.json();

                if (placeOrderResult.success) {
                    localStorage.setItem('lastOrder', JSON.stringify(order));

                    const history = JSON.parse(localStorage.getItem('orderHistory')) || [];
                    history.push(order);
                    localStorage.setItem('orderHistory', JSON.stringify(history));
                    localStorage.removeItem('cart');

                    alert('Order placed successfully!');
                    window.location.href = 'order_summary.html';
                } else {
                    alert('Order failed: ' + (placeOrderResult.error || 'Unknown error.'));
                }
            } else {
                // Handle other paymentIntent statuses (e.g., requires_action) if necessary
                alert('Payment not completed. Status: ' + paymentIntent.status);
            }
        } catch (orderError) {
            console.error('Error placing order or confirming payment:', orderError);
            alert('An error occurred while processing your order. Please try again.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Place Order';
        }
    });
});

function displayPaymentMethods(paymentMethods, defaultPaymentMethod) {
    const displayContainer = document.getElementById('paymentMethodsDisplay');
    displayContainer.innerHTML = ''; // Clear previous content

    if (paymentMethods && paymentMethods.length > 0) {
        let html = '<p><strong>Select a Payment Method:</strong></p>';
        paymentMethods.forEach(pm => {
            const isDefault = defaultPaymentMethod && pm.id === defaultPaymentMethod.id;
            html += `
                <div style="margin-bottom: 10px;">
                    <input type="radio" id="paymentMethod_${pm.id}" name="paymentMethod" value="${pm.id}" ${isDefault ? 'checked' : ''}>
                    <label for="paymentMethod_${pm.id}">
                        <i class="fas fa-credit-card" style="margin-right: 5px;"></i>
                        ${pm.brand.toUpperCase()} ending in ${pm.last4} (Exp: ${pm.exp_month}/${pm.exp_year})
                        ${isDefault ? ' (Default)' : ''}
                    </label>
                </div>
            `;
        });
        displayContainer.innerHTML = html;
    } else {
        displayContainer.innerHTML = `
            <p>No saved payment methods. Please add a new one.</p>
        `;
    }
}

function loadCheckoutSummary() {
    const container = document.getElementById('checkoutSummary');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        return;
    }

    let subtotal = 0;
    let html = '<table><thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead><tbody>';

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        html += `
            <tr>
                <td>${item.title}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>$${itemTotal.toFixed(2)}</td>
            </tr>
        `;
    });

    const tax = subtotal * 0.07;
    const total = subtotal + tax;

    html += `</tbody></table>
        <div class="summary-totals">
            <div class="summary-row">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
            <span>Tax (7%):</span>
            <span>$${tax.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
            <span>Total:</span>
            <span>$${total.toFixed(2)}</span>
            </div>
        </div>
    `;

    container.innerHTML = html;
}