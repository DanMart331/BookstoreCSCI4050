// navbar.js
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));

  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  navbar.innerHTML = `
    <nav>
      <a href="index.html">Home</a>
      <a href="cart.html">Cart</a>
      ${user ? `
        <a href="#" id="logoutLink">Logout</a>
      ` : `
        <a href="login.html">Login</a>
      `}
    </nav>
  `;

  if (user) {
    document.getElementById('logoutLink')?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem(`cart_${user.email}`);
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      window.location.href = 'login.html';
    });
  }
});
