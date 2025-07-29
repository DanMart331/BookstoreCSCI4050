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

function showLoading(container, message = 'Loading...') {
  container.innerHTML = `<div class="loading">${message}</div>`;
}

function showError(container, message) {
  container.innerHTML = `<div class="error">${message}</div>`;
}

function showToast(message, isError = false) {
  console.log('showToast:', message, isError);
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : ''}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function updateApiStatus(message, isError = false) {
  const el = document.getElementById('apiStatus');
  if (!el) return;
  el.textContent = message;
  el.className = isError ? 'error' : '';
}

function showApiError(message) {
  const modal = document.getElementById('apiErrorModal');
  const text  = document.getElementById('apiErrorText');
  if (!modal || !text) return;
  text.textContent = message;
  modal.style.display = 'flex';
}

function updateNav() {
  const user = getCurrentUser();
  const loginLink = document.getElementById('loginLink');
  const registerLink = document.getElementById('registerLink');
  const adminLoginLink = document.getElementById('adminLoginLink');
  const adminDashboardLink = document.getElementById('adminDashboardLink');
  const logoutLink = document.getElementById('logoutLink');
  const profileLink = document.getElementById('profileLink');

  if (user) {
    loginLink.style.display = 'none';
    registerLink.style.display = 'none';
    adminLoginLink.style.display = 'none';
    logoutLink.style.display = 'inline';
    profileLink.style.display = 'inline';
    if (adminDashboardLink) {
      adminDashboardLink.style.display = user.is_admin ? 'inline' : 'none';
    }
  } else {
    loginLink.style.display = 'inline';
    registerLink.style.display = 'inline';
    logoutLink.style.display = 'none';
    profileLink.style.display = 'none';
    adminLoginLink.style.display = 'inline';
    if (adminDashboardLink) {
      adminDashboardLink.style.display = 'none';
    }
  }
  updateCartCount();
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value;
  const password = form.password.value;
  const remember = form.rememberMe.checked;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || 'Login failed');

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(payload));
    updateNav();

    if (payload.is_admin) {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'index.html';
    }
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value;
  const password = form.password.value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || 'Login failed');
    if (!payload.is_admin) throw new Error('Admin access only');

    localStorage.setItem('user', JSON.stringify(payload));
    updateNav();
    window.location.href = 'admin.html';
  } catch (err) {
    showToast(err.message, true);
  }
}

function handleLogout(e) {
  e.preventDefault();
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  updateNav();
  window.location.href = 'index.html';
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const total = cart.reduce((sum, i) => sum + i.quantity, 0);
  const el = document.getElementById('cartCount');
  if (el) el.textContent = total;
}

function viewBookDetails(id) {
  window.location.href = `book_details.html?id=${id}`;
}

async function addToCart(id) {
  if (!getCurrentUser()) {
    alert('Please log in or register to add books to your cart.');
    return;
  }

  try {
    const book = await ApiService.getBookDetails(id);
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const ex = cart.find(i => i.id === book.id);
    if (ex) ex.quantity += 1;
    else cart.push({ id: book.id, title: book.title, price: book.price, image: book.image, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast(`${book.title} added to cart`);
  } catch (err) {
    console.error('Failed to add to cart:', err);
    showToast('Failed to add to cart', true);
  }
}

async function loadFeaturedBooks() {
  const container = document.getElementById('featuredBooks');
  if (!container) return;
  showLoading(container, 'Loading featured books...');
  updateApiStatus('Loading featured books...');
  try {
    const { items } = await ApiService.getFeaturedBooks();
    renderBooks(container, items);
    updateApiStatus('Featured books loaded');
  } catch (err) {
    showError(container, 'Unable to load featured books');
    showApiError('Featured service unavailable');
    console.error('Error loading featured books:', err);
  }
}

async function loadComingSoonBooks() {
  const container = document.getElementById('comingSoonBooks');
  if (!container) return;
  showLoading(container, 'Loading coming soon...');
  updateApiStatus('Loading coming soon');
  try {
    const { items } = await ApiService.getComingSoon();
    renderBooks(container, items);
    updateApiStatus('Coming soon loaded');
  } catch (err) {
    showError(container, 'Unable to load coming soon');
    showApiError('ComingSoon service unavailable');
    console.error('Error loading coming soon books:', err);
  }
}

async function searchBooks() {
  const query = document.getElementById('searchBar')?.value.trim() || '';
  const genre = document.getElementById('genreFilter')?.value || '';
  const container = document.getElementById('featuredBooks');
  const comingSoonContainer = document.getElementById('comingSoonBooks');

  if (!container) return;

  if (!query && !genre) {
    container.innerHTML = '';
    comingSoonContainer.innerHTML = '';
    await loadFeaturedBooks();
    await loadComingSoonBooks();
    return;
  }

  showLoading(container, 'Searching books...');
  updateApiStatus('Searching books...');
  try {
    const { items } = await ApiService.searchBooks(query);
    let books = items;

    if (genre) {
      books = books.filter(b => b.genre?.toLowerCase() === genre.toLowerCase());
    }

    container.innerHTML = '';
    comingSoonContainer.innerHTML = '';

    if (books.length === 0) {
      container.innerHTML = '<p class="no-results">No books found for your search.</p>';
    } else {
      renderBooks(container, books);
    }

    updateApiStatus(`Found ${books.length} books`);
  } catch (err) {
    showError(container, 'Search failed');
    showApiError('Search service unavailable');
    console.error('Search books error:', err);
  }
}

function renderBooks(container, books) {
  container.innerHTML = '';
  if (!books || books.length === 0) {
    container.innerHTML = '<p class="no-results">No books found.</p>';
    return;
  }

  books.forEach(book => {
    const el = document.createElement('div');
    el.className = 'book';
    el.innerHTML = `
      <img src="${book.image || 'assets/book_images/default.jpg'}" alt="${book.title}" onclick="viewBookDetails('${book.id}')">
      <h3 onclick="viewBookDetails('${book.id}')">${book.title}</h3>
      <p class="author">by ${book.author}</p>
      <p class="price">$${book.price.toFixed(2)}</p>
      <div class="add-to-cart-container">
        <button class="add-to-cart-btn" data-book-id="${book.id}">
          Add to Cart
        </button>
      </div>
    `;

    const addToCartButton = el.querySelector('.add-to-cart-btn');
    if (addToCartButton) {
      addToCartButton.addEventListener('click', (event) => {
        event.preventDefault();
        addToCart(book.id);
      });
    }
    container.appendChild(el);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  updateNav();
  document.getElementById('logoutLink')?.addEventListener('click', handleLogout);
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('adminLoginForm')?.addEventListener('submit', handleAdminLogin);

  loadFeaturedBooks();
  loadComingSoonBooks();

  let searchTimeout;
  document.getElementById('searchBar')?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(searchBooks, 300);
  });
  document.getElementById('genreFilter')?.addEventListener('change', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(searchBooks, 0);
  });

  document.querySelector('.modal .close')?.addEventListener('click', function() {
    document.getElementById('apiErrorModal').style.display = 'none';
  });
});