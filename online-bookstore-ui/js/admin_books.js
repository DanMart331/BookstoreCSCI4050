const booksTableBody = document.querySelector('#booksTable tbody');
const modal          = document.getElementById('bookModal');
const closeBtn       = modal.querySelector('.close');
const form           = document.getElementById('bookForm');
const newBookBtn     = document.getElementById('newBookBtn');

function openModal(book = {}) {
  modal.style.display = 'flex';
  document.getElementById('modalTitle').textContent = book.id ? 'Edit Book' : 'New Book';
  ['bookId','title','author','genre','price','image'].forEach(id => {
    document.getElementById(id).value = book[id] || '';
  });
  document.getElementById('featured').checked    = !!book.featured;
  document.getElementById('comingSoon').checked  = !!book.coming_soon;
}

closeBtn.onclick = () => modal.style.display = 'none';

async function loadBooks() {
  const res = await fetch('/api/admin/books');
  const { books } = await res.json();
  booksTableBody.innerHTML = books.map(b => `
    <tr>
      <td>${b.id}</td>
      <td>${b.title}</td>
      <td>${b.author}</td>
      <td>${b.genre}</td>
      <td>$${b.price.toFixed(2)}</td>
      <td>${b.featured ? '✔' : ''}</td>
      <td>${b.coming_soon ? '✔' : ''}</td>
      <td>
        <button class="editBtn" data-id="${b.id}">Edit</button>
        <button class="delBtn"  data-id="${b.id}">Delete</button>
      </td>
    </tr>
  `).join('');
  attachRowHandlers();
}

function attachRowHandlers() {
  document.querySelectorAll('.editBtn').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const res = await fetch(`/api/admin/books`);
      const { books } = await res.json();
      const book = books.find(x => x.id == id);
      openModal(book);
    };
  });
  document.querySelectorAll('.delBtn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Delete this book?')) return;
      await fetch(`/api/admin/books/${btn.dataset.id}`, { method: 'DELETE' });
      loadBooks();
    };
  });
}

form.onsubmit = async e => {
  e.preventDefault();
  const id   = document.getElementById('bookId').value;
  const body = {
    title:       document.getElementById('title').value,
    author:      document.getElementById('author').value,
    genre:       document.getElementById('genre').value,
    price:       parseFloat(document.getElementById('price').value),
    image:       document.getElementById('image').value,
    featured:    document.getElementById('featured').checked,
    coming_soon: document.getElementById('comingSoon').checked
  };
  const url    = id ? `/api/admin/books/${id}` : '/api/admin/books';
  const method = id ? 'PUT' : 'POST';
  await fetch(url, {
    method, headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(body)
  });
  modal.style.display = 'none';
  loadBooks();
};

newBookBtn.onclick = () => openModal();

document.addEventListener('DOMContentLoaded', () => {
  loadBooks();
});