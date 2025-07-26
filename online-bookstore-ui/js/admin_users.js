const usersTableBody = document.querySelector('#usersTable tbody');

async function loadUsers() {
  try {
    const res = await fetch('/api/admin/users');
    const { users } = await res.json();
    usersTableBody.innerHTML = users.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.city || ''}</td>
        <td>${u.state || ''}</td>
        <td>${u.zip || ''}</td>
        <td>${u.promotion_opt_in ? '✔' : ''}</td>
        <td>${u.status}</td>
        <td>${u.is_admin ? '✔' : ''}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading users:', err);
    usersTableBody.innerHTML = `<tr><td colspan="9">Failed to load users</td></tr>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadUsers();

  document.getElementById('logoutLink')?.addEventListener('click', e => {
    e.preventDefault();
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    window.location.href = 'admin_login.html';
  });
});