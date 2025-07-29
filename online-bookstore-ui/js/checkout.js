document.addEventListener('DOMContentLoaded', async () => {
      updateNav();
      loadCheckoutSummary();
      
      const user = JSON.parse(localStorage.getItem('user'));
      
      const res = await fetch(`/api/auth/profile?id=${user.id}`);
      const { user: u } = await res.json();
      console.log(u);
      if (u) {
        document.getElementById('shippingName').value = u.name || '';
        document.getElementById('shippingStreet').value = u.street || '';
        document.getElementById('shippingCity').value = u.city || '';
        document.getElementById('shippingState').value = u.state || '';
        document.getElementById('shippingZip').value = u.zip || '';

        document.getElementById('cardNumber').value = u.cardNumber || '';
        document.getElementById('cardExp').value = u.cardExp || '';
        document.getElementById('cardCvv').value = u.cardCvv || '';
      }

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
        
        const order = {
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
            cardNumber: e.target.cardNumber.value.slice(-4),
            cardExp: e.target.cardExp.value
          },
          date: new Date().toLocaleString()
        };
        
        localStorage.setItem('lastOrder', JSON.stringify(order));
        
        const history = JSON.parse(localStorage.getItem('orderHistory')) || [];
        history.push(order);
        localStorage.setItem('orderHistory', JSON.stringify(history));
        localStorage.removeItem('cart');
        
        window.location.href = 'order_summary.html';
      });
    });

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