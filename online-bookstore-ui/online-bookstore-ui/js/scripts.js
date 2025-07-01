// DOM Elements
const apiStatusElement = document.getElementById('apiStatus');
const apiErrorModal = document.getElementById('apiErrorModal');
const apiErrorText = document.getElementById('apiErrorText');

// Book loading and display
async function loadBooks(sectionId, type = 'featured', enableCart = false) {
  const container = document.getElementById(sectionId);
  if (!container) return;

  showLoading(container, 'Loading books...');
  updateApiStatus('Loading books from API...');

  try {
    let apiData, books = [];
    
    // Fetch from API
    try {
      if (type === 'featured') {
        apiData = await ApiService.getFeaturedBooks();
      } else if (type === 'coming-soon') {
        apiData = await ApiService.getNewReleases();
      }
      
      books = apiData.items.map(transformBookData);
      updateApiStatus('Books loaded successfully');
    } catch (apiError) {
      console.error('API Error:', apiError);
      books = getLocalBooksByType(type);
      showApiError('Using local book data - API unavailable');
    }

    renderBooks(container, books, enableCart);
  } catch (error) {
    console.error('Error:', error);
    showError(container, 'Failed to load books');
    showApiError('Failed to load books. Please try again later.');
  }
}

async function searchBooks() {
  const searchTerm = document.getElementById('searchBar').value;
  const genre = document.getElementById('genreFilter').value;
  const container = document.getElementById('featuredBooks');
  
  if (!searchTerm && !genre) {
    loadBooks('featuredBooks', 'featured', true);
    return;
  }

  showLoading(container, 'Searching books...');
  updateApiStatus('Searching books...');

  try {
    const apiData = await ApiService.searchBooks(searchTerm, genre);
    const books = apiData.items.map(transformBookData);
    renderBooks(container, books, true);
    updateApiStatus(`Found ${books.length} books`);
  } catch (error) {
    console.error('Search error:', error);
    showError(container, 'Search failed');
    showApiError('Search service unavailable. Please try different terms.');
  }
}

// UI Helpers
function renderBooks(container, books, enableCart) {
  container.innerHTML = '';
  
  if (books.length === 0) {
    container.innerHTML = '<p class="no-results">No books found</p>';
    return;
  }

  books.forEach(book => {
    const bookElement = document.createElement('div');
    bookElement.className = 'book';
    bookElement.innerHTML = `
      <img src="${book.image}" alt="${book.title}" onclick="viewBookDetails('${book.id}')">
      <h3 onclick="viewBookDetails('${book.id}')">${book.title}</h3>
      <p class="author">by ${book.author}</p>
      <p class="price">$${book.price.toFixed(2)}</p>
      ${enableCart ? '<button onclick="addToCart(\'' + book.id + '\')">Add to Cart</button>' : ''}
    `;
    container.appendChild(bookElement);
  });
}

function showLoading(container, message = 'Loading...') {
  container.innerHTML = `<div class="loading">${message}</div>`;
}

function showError(container, message) {
  container.innerHTML = `<div class="error">${message}</div>`;
}

function updateApiStatus(message, isError = false) {
  if (!apiStatusElement) return;
  apiStatusElement.textContent = message;
  apiStatusElement.className = isError ? 'error' : '';
}

function showApiError(message) {
  if (!apiErrorModal || !apiErrorText) return;
  apiErrorText.textContent = message;
  apiErrorModal.style.display = 'block';
}

// Navigation
function updateNav() {
  const user = JSON.parse(localStorage.getItem('user'));
  const loginLink = document.getElementById('loginLink');
  const profileLink = document.getElementById('profileLink');
  
  if (user) {
    loginLink.style.display = 'none';
    profileLink.style.display = 'inline';
    profileLink.textContent = user.name || 'Profile';
  } else {
    loginLink.style.display = 'inline';
    profileLink.style.display = 'none';
  }
  
  updateCartCount();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountElement = document.getElementById('cartCount');
  if (cartCountElement) cartCountElement.textContent = totalItems;
}

// Book details
function viewBookDetails(bookId) {
  window.location.href = `book_details.html?id=${bookId}`;
}

// Cart functions
async function addToCart(bookId) {
  try {
    const bookData = await ApiService.getBookDetails(bookId);
    const book = transformBookData(bookData);
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === book.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: book.id,
        title: book.title,
        price: book.price,
        image: book.image,
        quantity: 1
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast(`${book.title} added to cart`);
  } catch (error) {
    console.error('Error adding to cart:', error);
    showToast('Failed to add book to cart', true);
  }
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : ''}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Local data fallback
function getLocalBooksByType(type) {
  const localBooks = {
    featured: [
      {
        id: 'local1',
        title: "The Alchemist",
        author: "Paulo Coelho",
        price: 12.99,
        image: "assets/book_images/default.jpg",
        description: "A magical fable about following your dreams."
      },
      {
        id: 'local2',
        title: "1984",
        author: "George Orwell",
        price: 9.99,
        image: "assets/book_images/default.jpg",
        description: "A dystopian novel about totalitarianism."
      }
    ],
    'coming-soon': [
      {
        id: 'local3',
        title: "New Release",
        author: "Future Author",
        price: 14.99,
        image: "assets/book_images/default.jpg",
        description: "An exciting new book coming soon."
      }
    ]
  };
  
  return localBooks[type] || [];
}