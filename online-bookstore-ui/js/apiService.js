const API_CONFIG = {
  BOOKSTORE: {
    BASE_URL: '/api/books'
  },
  STRIPE: {
    PUBLIC_KEY: 'pk_test_51Rel5jP9fb1HIuhDPq88snJjaIjozxstdS9pMgH2dgNFXmIB8W88wI7W7dndy4OOZ7jgFtq14JZQHR6V7TKGjEHU00R231FEA4'
  },
  AUTH: { // Added for consistency, though '/api/auth' is hardcoded in register
    BASE_URL: '/api/auth'
  },
  ADMIN_USERS: { // NEW: Configuration for admin user routes
    BASE_URL: '/api/admin/users'
  },
  PROMOTIONS: { // NEW: Configuration for promotions routes
    BASE_URL: '/api/admin/promotions'
  }
};

class ApiService {
  // --- Bookstore API Methods ---
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

  // --- Payment API Methods ---
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
    const res = await fetch(`${API_CONFIG.AUTH.BASE_URL}/register`, { // Used API_CONFIG here
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || 'Registration failed');
    return payload;
  }

  static async getUsers() {
    const res = await fetch(API_CONFIG.ADMIN_USERS.BASE_URL); // Using API_CONFIG
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || 'Failed to retrieve users');
    return payload;
  }

  static async updateUserAdminStatus(userId, isAdmin) {
    const res = await fetch(`${API_CONFIG.ADMIN_USERS.BASE_URL}/${userId}/admin`, { // Using API_CONFIG
      method: 'PUT', // Using PUT for updating an existing resource
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_admin: isAdmin }) // Send the new status
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || 'Failed to update admin status');
    return payload;
  }

  static async deleteUser(userId) {
    const res = await fetch(`${API_CONFIG.ADMIN_USERS.BASE_URL}/${userId}`, { // Using API_CONFIG
      method: 'DELETE' // Using DELETE for deleting a resource
    });
    const payload = await res.json(); // Server might send a confirmation message
    if (!res.ok) throw new Error(payload.error || 'Failed to delete user');
    return payload;
  }

  static async getPromotions() {
    const res = await fetch(API_CONFIG.PROMOTIONS.BASE_URL);
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || 'Failed to retrieve promotions');
    return payload;
  }

  static async getPromotionById(promoId) {
    const res = await fetch(`${API_CONFIG.PROMOTIONS.BASE_URL}/${promoId}`);
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || 'Failed to retrieve promotion details');
    return payload;
  }

  static async createPromotion(promoData) {
    const res = await fetch(API_CONFIG.PROMOTIONS.BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promoData)
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || 'Failed to create promotion');
    return payload;
  }

  static async updatePromotion(promoId, promoData) {
    const res = await fetch(`${API_CONFIG.PROMOTIONS.BASE_URL}/${promoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promoData)
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || 'Failed to update promotion');
    return payload;
  }

  static async deletePromotion(promoId) {
    const res = await fetch(`${API_CONFIG.PROMOTIONS.BASE_URL}/${promoId}`, {
      method: 'DELETE'
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || 'Failed to delete promotion');
    return payload;
  }


}

window.API_CONFIG = API_CONFIG;
window.ApiService = ApiService;