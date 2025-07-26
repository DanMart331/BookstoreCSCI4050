document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Login failed');
        }
        
        const user = await response.json();
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = 'index.html';
      } catch (error) {
        alert(error.message);
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        name: registerForm.querySelector('input[placeholder="Full Name"]').value,
        email: registerForm.querySelector('input[type="email"]').value,
        password: registerForm.querySelector('input[type="password"]').value,
        street: registerForm.querySelector('input[placeholder="Street"]').value,
        city: registerForm.querySelector('input[placeholder="City"]').value,
        state: registerForm.querySelector('input[placeholder="State"]').value,
        zip: registerForm.querySelector('input[placeholder="ZIP"]').value,
        card_number: registerForm.querySelector('input[placeholder="Card Number"]').value,
        card_exp: registerForm.querySelector('input[placeholder="Expiration"]').value,
        card_cvv: registerForm.querySelector('input[placeholder="CVV"]').value
      };
      
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Registration failed');
        }
        
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
      } catch (error) {
        alert(error.message);
      }
    });
  }
});