const API_CONFIG = {
  BOOKSTORE: {
    BASE_URL: '/api/books'
  },
  STRIPE: {
    PUBLIC_KEY: 'pk_test_51Rel5jP9fb1HIuhDPq88snJjaIjozxstdS9pMgH2dgNFXmIB8W88wI7W7dndy4OOZ7jgFtq14JZQHR6V7TKGjEHU00R231FEA4'
  }
};

class ApiService {
  static async getFeaturedBooks() {
    const res = await fetch(`${API_CONFIG.BOOKSTORE.BASE_URL}/featured`);
    if (!res.ok) {
      throw new Error(`Error fetching featured books: ${res.statusText}`);
    }
    return res.json();
  }

  static async getComingSoon() {
    const res = await fetch(`${API_CONFIG.BOOKSTORE.BASE_URL}/coming-soon`);
    if (!res.ok) {
      throw new Error(`Error fetching coming-soon books: ${res.statusText}`);
    }
    return res.json();
  }

  static async searchBooks(query) {
    const res = await fetch(
      `${API_CONFIG.BOOKSTORE.BASE_URL}/search?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) {
      throw new Error(`Error searching books: ${res.statusText}`);
    }
    return res.json();
  }

  static async getBookDetails(bookId) {
    const res = await fetch(`${API_CONFIG.BOOKSTORE.BASE_URL}/${bookId}`);
    if (!res.ok) {
      throw new Error(`Error fetching book details: ${res.statusText}`);
    }
    return res.json(); 
  }

  static async createPaymentIntent(amount) {
    const res = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    if (!res.ok) {
      throw new Error(`Error creating payment intent: ${res.statusText}`);
    }
    return res.json(); 
  }

  static async register(data) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || 'Registration failed');
    return payload;
  }
}

window.API_CONFIG = API_CONFIG;
window.ApiService = ApiService;