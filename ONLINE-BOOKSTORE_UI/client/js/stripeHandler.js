const stripe = Stripe(API_CONFIG.STRIPE.PUBLIC_KEY);

async function initializeStripe() {

  const elements = stripe.elements();
  const cardElement = elements.create('card');
  cardElement.mount('#card-element');

  const paymentForm = document.getElementById('payment-form');
  if (paymentForm) {
    paymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitButton = paymentForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Processing...';
      
      try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const amount = calculateOrderTotal(cart) * 100; 
        
        const { clientSecret } = await ApiService.createPaymentIntent(amount);
        
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: document.getElementById('card-name').value
            }
          }
        });
        
        if (error) {
          throw error;
        }
        
        if (paymentIntent.status === 'succeeded') {
          completeOrder(paymentIntent);
        }
      } catch (error) {
        console.error('Payment error:', error);
        showPaymentError(error.message);
        submitButton.disabled = false;
        submitButton.textContent = 'Pay Now';
      }
    });
  }
}

function calculateOrderTotal(cart) {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.07; 
  return subtotal + tax;
}

function showPaymentError(message) {
  const errorElement = document.getElementById('card-errors');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

function completeOrder(paymentIntent) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const order = {
    id: paymentIntent.id,
    date: new Date().toLocaleString(),
    items: cart,
    total: paymentIntent.amount / 100,
    status: 'completed'
  };
  
  const orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
  orderHistory.push(order);
  localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
  localStorage.removeItem('cart');
  
  window.location.href = 'order_summary.html?id=' + paymentIntent.id;
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('payment-form')) {
    initializeStripe();
  }
});