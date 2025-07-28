// js/admin_users.js

const usersTableBody = document.querySelector('#usersTable tbody');
const deleteSelectedUserBtn = document.getElementById('deleteSelectedUserBtn');
const toggleAdminSelectedUserBtn = document.getElementById('toggleAdminSelectedUserBtn');

let selectedUserId = null;
let selectedUserIsAdmin = false; // To keep track of the selected user's admin status

async function loadUsers() {
  try {
    const res = await fetch('/api/admin/users');
    const { users } = await res.json();
    usersTableBody.innerHTML = users.map(u => `
      <tr data-user-id="${u.id}" data-is-admin="${u.is_admin}">
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.city || ''}</td>
        <td>${u.state || ''}</td>
        <td>${u.zip || ''}</td>
        <td>${u.promotion_opt_in ? '✔' : ''}</td>
        <td>${u.status}</td>
        <td class="admin-status">${u.is_admin ? '✔' : ''}</td>
      </tr>
    `).join('');

    // Attach event listeners for row selection
    addEventListenersToRows();
    updateGlobalButtonState(); // Update button state after loading users

  } catch (err) {
    console.error('Error loading users:', err);
    usersTableBody.innerHTML = `<tr><td colspan="9">Failed to load users</td></tr>`;
    updateGlobalButtonState(); // Ensure buttons are disabled on error
  }
}

function addEventListenersToRows() {
  usersTableBody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', () => {
      // Remove 'selected' class from all rows
      usersTableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));

      // Add 'selected' class to the clicked row
      row.classList.add('selected');

      // Set the selected user ID and admin status
      selectedUserId = row.dataset.userId;
      selectedUserIsAdmin = row.dataset.isAdmin === 'true';

      // Update the global buttons' state
      updateGlobalButtonState();
    });
  });
}

function updateGlobalButtonState() {
  if (selectedUserId) {
    deleteSelectedUserBtn.disabled = false;
    toggleAdminSelectedUserBtn.disabled = false;

    // Update the text and class for the admin toggle button
    if (selectedUserIsAdmin) {
      toggleAdminSelectedUserBtn.textContent = 'Remove Admin';
      toggleAdminSelectedUserBtn.classList.add('is-admin');
    } else {
      toggleAdminSelectedUserBtn.textContent = 'Make Admin';
      toggleAdminSelectedUserBtn.classList.remove('is-admin');
    }
  } else {
    // No user selected
    deleteSelectedUserBtn.disabled = true;
    toggleAdminSelectedUserBtn.disabled = true;
    toggleAdminSelectedUserBtn.textContent = 'Make Admin'; // Reset text
    toggleAdminSelectedUserBtn.classList.remove('is-admin');
  }
}

// Global Delete Button Listener
deleteSelectedUserBtn.addEventListener('click', async () => {
  if (!selectedUserId) {
    alert('Please select a user to delete.');
    return;
  }

  if (confirm(`Are you sure you want to delete user ID ${selectedUserId}? This action cannot be undone.`)) {
    try {
      await ApiService.deleteUser(selectedUserId);
      alert(`User ID ${selectedUserId} deleted successfully.`);
      selectedUserId = null; // Clear selection after deletion
      selectedUserIsAdmin = false;
      loadUsers(); // Reload table
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.message || 'Failed to delete user.');
    }
  }
});

// Global Toggle Admin Button Listener
toggleAdminSelectedUserBtn.addEventListener('click', async () => {
  if (!selectedUserId) {
    alert('Please select a user to modify admin status.');
    return;
  }

  const newStatus = !selectedUserIsAdmin; // Toggle the status

  if (confirm(`Are you sure you want to ${newStatus ? 'make' : 'remove'} admin status for user ID ${selectedUserId}?`)) {
    try {
      await ApiService.updateUserAdminStatus(selectedUserId, newStatus);
      alert(`User ID ${selectedUserId} admin status updated.`);
      selectedUserId = null; // Clear selection after update (optional, but often cleaner)
      selectedUserIsAdmin = false;
      loadUsers(); // Reload table
    } catch (err) {
      console.error('Error updating admin status:', err);
      alert(err.message || 'Failed to update admin status.');
    }
  }
});


document.addEventListener('DOMContentLoaded', () => {
  loadUsers();

  document.getElementById('logoutLink')?.addEventListener('click', e => {
    e.preventDefault();
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    window.location.href = 'admin_login.html';
  });
});