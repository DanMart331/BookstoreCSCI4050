const form       = document.getElementById('profileForm');
const editBtn    = document.getElementById('editBtn');
const saveBtn    = document.getElementById('saveBtn');
const logoutLink = document.getElementById('logoutLink');

const flds = [
  'name','oldPassword','newPassword',
  'street','city','state','zip',
  'promoOpt'
];

function setEditable(editable) {
  flds.forEach(id => {
    const el = document.getElementById(id);
    if (id === 'oldPassword') {
      el.disabled = !editable;
    } else if (id === 'newPassword') {
      el.disabled = !editable;
    } else {
      el.disabled = !editable;
    }
  });
  promoOpt.disabled = !editable;
  editBtn.style.display = editable ? 'none' : 'inline-block';
  saveBtn.style.display = editable ? 'inline-block' : 'none';
}

function getStoredUser() {
  return JSON.parse(
    localStorage.getItem('user') ||
    sessionStorage.getItem('user') ||
    'null'
  );
}

async function loadProfile() {
  const user = getStoredUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const res = await fetch(`/api/auth/profile?id=${user.id}`);
  const { user: u } = await res.json();
  document.getElementById('name').value       = u.name;
  document.getElementById('email').value      = u.email;
  document.getElementById('street').value     = u.street || '';
  document.getElementById('city').value       = u.city || '';
  document.getElementById('state').value      = u.state || '';
  document.getElementById('zip').value        = u.zip || '';
  document.getElementById('promoOpt').checked = !!u.promotion_opt_in;

  setEditable(false);
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const user = JSON.parse(localStorage.getItem('user'));

  const payload = {
    id: user.id,
    name:       name.value,
    street:     street.value,
    city:       city.value,
    state:      state.value,
    zip:        zip.value,
    promotion_opt_in: promoOpt.checked,
  };

  if (oldPassword.value && newPassword.value) {
    payload.password = newPassword.value;
  }
  
  const res = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!res.ok) return alert(json.error || 'Update failed');

  alert('Profile updated!');
  loadProfile();
});

editBtn.addEventListener('click', () => {
  setEditable(true);
});

logoutLink.addEventListener('click', e => {
  e.preventDefault();
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  window.location.href = 'login.html';
});

document.addEventListener('DOMContentLoaded', loadProfile);