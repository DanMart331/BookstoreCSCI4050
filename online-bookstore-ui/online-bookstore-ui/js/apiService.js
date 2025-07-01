const API_CONFIG = {
  GOOGLE_BOOKS: {
    BASE_URL: 'https://www.googleapis.com/books/v1/volumes',
    API_KEY: 'AIzaSyBIwD9xaqV1Pd6jLYuVQqWyQzBu-JdbDsM'
  },
  STRIPE: {
    PUBLIC_KEY: 'pk_test_51Rel5jP9fb1HIuhDPq88snJjaIjozxstdS9pMgH2dgNFXmIB8W88wI7W7dndy4OOZ7jgFtq14JZQHR6V7TKGjEHU00R231FEA4'
  }
};

class ApiService {
  static async fetchBooks(query = '', maxResults = 12) {
    try {
      const response = await fetch(
        `${API_CONFIG.GOOGLE_BOOKS.BASE_URL}?q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${API_CONFIG.GOOGLE_BOOKS.API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  static async getFeaturedBooks() {
    return this.fetchBooks('subject:bestsellers');
  }

  static async getNewReleases() {
    return this.fetchBooks('subject:new_releases');
  }

  static async searchBooks(query, genre = '') {
    let searchQuery = query;
    if (genre) searchQuery += ` subject:${genre}`;
    return this.fetchBooks(searchQuery);
  }

  static async getBookDetails(bookId) {
    try {
      const response = await fetch(
        `${API_CONFIG.GOOGLE_BOOKS.BASE_URL}/${bookId}?key=${API_CONFIG.GOOGLE_BOOKS.API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch book details');
      }
      
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  static async createPaymentIntent(amount) {
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }
      
      return response.json();
    } catch (error) {
      console.error('Payment Error:', error);
      throw error;
    }
  }
}

// Helper function to transform API data to our format
function transformBookData(apiBook) {
  return {
    id: apiBook.id,
    title: apiBook.volumeInfo.title,
    author: apiBook.volumeInfo.authors?.join(', ') || 'Unknown Author',
    description: apiBook.volumeInfo.description || 'No description available',
    genre: apiBook.volumeInfo.categories?.[0] || 'General',
    price: apiBook.saleInfo?.listPrice?.amount || 9.99,
    image: apiBook.volumeInfo.imageLinks?.thumbnail || 'assets/book_images/default.jpg',
    isbn: apiBook.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier,
    publishedDate: apiBook.volumeInfo.publishedDate
  };
}