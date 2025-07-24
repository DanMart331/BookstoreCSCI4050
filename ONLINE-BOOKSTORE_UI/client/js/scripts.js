function getCurrentUser() {
  const ls = localStorage.getItem('user');
  if (ls) {
    try { return JSON.parse(ls); }
    catch { return null; }
  }
  const ss = sessionStorage.getItem('user');
  if (ss) {
    try { return JSON.parse(ss); }
    catch { return null; }
  }
  return null;
}

function showLoading(container, msg='Loading…') {
  container.innerHTML = `<div class="loading">${msg}</div>`;
}
function showError(container, msg) {
  container.innerHTML = `<div class="error">${msg}</div>`;
}
function showToast(msg, isError=false) {
  const t = document.createElement('div');
  t.className = `toast ${isError ? 'error' : ''}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function updateApiStatus(msg, isError=false) {
  const el = document.getElementById('apiStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = isError ? 'error' : '';
}
function showApiError(msg) {
  const modal = document.getElementById('apiErrorModal');
  const text  = document.getElementById('apiErrorText');
  if (!modal || !text) return;
  text.textContent = msg;
  modal.style.display = 'flex';
}

function updateNav() {
  const user         = getCurrentUser();
  const loginLink    = document.getElementById('loginLink');
  const registerLink = document.getElementById('registerLink');
  const logoutLink   = document.getElementById('logoutLink');
  const profileLink  = document.getElementById('profileLink');
  const adminLink    = document.getElementById('adminLink');

  if (user) {
    loginLink.style.display    = 'none';
    registerLink.style.display = 'none';
    logoutLink.style.display   = 'inline';
    profileLink.style.display  = 'inline';
    adminLink.style.display    = user.is_admin ? 'inline' : 'none';
  } else {
    loginLink.style.display    = 'inline';
    registerLink.style.display = 'inline';
    logoutLink.style.display   = 'none';
    profileLink.style.display  = 'none';
    adminLink.style.display    = 'none';
  }

  updateCartCount();
}

function handleLogout(e) {
  e.preventDefault();
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  updateNav();
  window.location.href = 'index.html';
}

async function handleLogin(e) {
  e.preventDefault();
  const form     = e.target;
  const email    = form.email.value;
  const password = form.password.value;
  const remember = form.rememberMe.checked;

  try {
    const res     = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const payload = await res.json();
    console.log(payload);
    if (!res.ok) throw new Error(payload.error || 'Login failed');

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(payload));
    updateNav();

    if (payload.status !== 'active') {
      alert('Please confirm your email before logging in.');
      window.location.href = 'login.html';
    } else if (payload.is_admin) {
      alert('Login successful!');
      window.location.href = 'admin.html';
    } else {
      alert('Login successful!');
      window.location.href = 'index.html';
    }
  } catch (err) {
    alert('Login failed: ' + err.message);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;

  const data = {
    name: form.name.value,
    email: form.email.value,
    password: form.password.value,
    street: form.street?.value || '',
    city: form.city?.value || '',
    state: form.state?.value || '',
    zip: form.zip?.value || '',
    card_number: form.card_number?.value || '',
    card_exp: form.card_exp?.value || '',
    card_cvv: form.card_cvv?.value || '',
    promotion_opt_in: form.promotion_opt_in?.checked ? 1 : 0
  };

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    console.log('Response status:', res.status);  // Debug log

    const payload = await res.json();
    console.log('Response payload:', payload);    // Debug log

    if (!res.ok) throw new Error(payload.error || 'Registration failed');

    showToast('Account created! You can now log in.');
    window.location.href = 'login.html';
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

async function fillProfile() {
  const user = getCurrentUser();
  if (!user) return window.location.href = 'login.html';

  try {
    const res = await fetch(`/api/users/${user.id}`);
    if (!res.ok) throw new Error('Failed to fetch user profile');
    console.log(user);
    document.getElementById('name').value = user.name;
    document.getElementById('email').value = user.email;
    document.getElementById('oldPassword').value = user.password;
    document.getElementById('newPassword').value = '';
    document.getElementById('street').value = user.street || '';
    document.getElementById('city').value = user.city || '';
    document.getElementById('state').value = user.state || '';
    document.getElementById('zip').value = user.zip || '';
    document.getElementById('card_number').value = user.card_number || '';
    document.getElementById('card_exp').value = user.card_exp || '';
    document.getElementById('card_cvv').value = user.card_cvv || '';
    document.getElementById('promotion_opt_in').checked = user.promotion_opt_in === 1;
  } catch (err) {
    console.error(err);
    alert('Error loading profile');
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  const oldPassword = document.getElementById('oldPassword').value;
  const newPassword = document.getElementById('newPassword').value;

  const updated = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    password: oldPassword,
    street: document.getElementById('street').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    zip: document.getElementById('zip').value,
    card_number: document.getElementById('card_number').value,
    card_exp: document.getElementById('card_exp').value,
    card_cvv: document.getElementById('card_cvv').value,
    promotion_opt_in: document.getElementById('promotion_opt_in').checked ? 1 : 0
  };

  if (newPassword) {
    // Only include passwords if newPassword is filled
    updated.password = newPassword;
  }

  try {
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });

    console.log(updated)
    localStorage.setItem('user', JSON.stringify(updated));
    sessionStorage.setItem('user', JSON.stringify(updated));

    if (!res.ok) throw new Error('Failed to update profile');
    alert('Profile updated successfully!');
    fillProfile(); // Refresh the form just in case
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}


function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const total = cart.reduce((sum, i) => sum + i.quantity, 0);
  const el = document.getElementById('cartCount');
  if (el) el.textContent = total;
}

async function loadFeaturedBooks() {
  const container = document.getElementById('featuredBooks');
  if (!container) return;
  showLoading(container, 'Loading featured books…');
  updateApiStatus('Loading featured books…');
  try {
    const { items } = await ApiService.getFeaturedBooks();
    updateApiStatus('Featured books loaded');
    renderBooks(container, items, true);
  } catch (err) {
    console.error(err);
    showError(container, 'Cannot load featured books');
    showApiError('Featured books service unavailable');
  }
}

async function loadComingSoonBooks() {
  const container = document.getElementById('comingSoonBooks');
  if (!container) return;
  showLoading(container, 'Loading coming‑soon books…');
  updateApiStatus('Loading coming‑soon books…');
  try {
    const { items } = await ApiService.getComingSoon();
    updateApiStatus('Coming‑soon books loaded');
    renderBooks(container, items, false);
  } catch (err) {
    console.error(err);
    showError(container, 'Cannot load coming‑soon books');
    showApiError('Coming‑soon service unavailable');
  }
}

async function searchBooks() {
  const query = document.getElementById('searchBar').value.trim();
  const genre = document.getElementById('genreFilter')?.value;
  const container = document.getElementById('featuredBooks');
  if (!container) return;

  if (!query && !genre) return loadFeaturedBooks();
  showLoading(container, 'Searching books…');
  updateApiStatus('Searching books…');
  try {
    const { items } = await ApiService.searchBooks(query);
    let books = items;
    if (genre) {
      books = books.filter(b => b.genre?.toLowerCase() === genre.toLowerCase());
    }
    updateApiStatus(`Found ${books.length} books`);
    renderBooks(container, books, true);
  } catch (err) {
    console.error(err);
    showError(container, 'Search failed');
    showApiError('Search service unavailable');
  }
}

function renderBooks(container, books, enableCart) {
  container.innerHTML = '';
  if (!books.length) {
    container.innerHTML = '<p class="no-results">No books found</p>';
    return;
  }
  for (const book of books) {
    const el = document.createElement('div');
    el.className = 'book';
    el.innerHTML = `
      <img src="${book.image}" alt="${book.title}" onclick="viewBookDetails('${book.id}')">
      <h3 onclick="viewBookDetails('${book.id}')">${book.title}</h3>
      <p class="author">by ${book.author}</p>
      <p class="price">$${book.price.toFixed(2)}</p>
      ${enableCart ? `<button onclick="addToCart('${book.id}')">Add to Cart</button>` : ''}
    `;
    container.appendChild(el);
  }
}

function viewBookDetails(id) {
  window.location.href = `book_details.html?id=${id}`;
}

async function addToCart(id) {
  try {
    const book = await ApiService.getBookDetails(id);
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(i => i.id === book.id);
    if (existing) existing.quantity++;
    else cart.push({ id: book.id, title: book.title, price: book.price, image: book.image, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast(`${book.title} added to cart`);
  } catch (err) {
    console.error(err);
    showToast('Failed to add to cart', true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  document.getElementById('logoutLink')?.addEventListener('click', handleLogout);
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);

  document.getElementById('registerForm')?.addEventListener('submit', handleRegister);

  document.getElementById('editProfileForm')?.addEventListener('submit', handleProfileUpdate);
  loadFeaturedBooks();
  loadComingSoonBooks();
  document.getElementById('searchBar')?.addEventListener('input', searchBooks);
  document.getElementById('genreFilter')?.addEventListener('change', searchBooks);

  document.querySelector('.modal .close')?.addEventListener('click', () => {
    document.getElementById('apiErrorModal').style.display = 'none';
  });
});

if (window.location.pathname.includes('edit_profile.html')) {
  document.addEventListener('DOMContentLoaded', fillProfile);
  document.getElementById('editProfileForm')?.addEventListener('submit', handleProfileUpdate);

}
