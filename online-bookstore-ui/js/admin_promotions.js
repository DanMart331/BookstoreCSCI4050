// DOM Element References
const promotionsTableBody = document.querySelector('#promotionsTable tbody');
const newPromotionBtn = document.getElementById('newPromotionBtn');
const promotionModal = document.getElementById('promotionModal');
const modalTitle = document.getElementById('modalTitle');
const promotionForm = document.getElementById('promotionForm');
const closeButton = promotionModal.querySelector('.close');

// Form Input References
const promotionIdInput = document.getElementById('promotionId');
const codeInput = document.getElementById('code');
const discountInput = document.getElementById('discount');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const activeInput = document.getElementById('active');

// --- Functions for Loading and Rendering Promotions ---

async function loadPromotions() {
    try {
        // Assuming ApiService.getPromotions() will be implemented to fetch from backend
        const { promotions } = await ApiService.getPromotions();
        promotionsTableBody.innerHTML = ''; // Clear existing rows

        if (promotions.length === 0) {
            promotionsTableBody.innerHTML = '<tr><td colspan="7">No promotions found.</td></tr>';
            return;
        }

        promotions.forEach(promo => {
            const row = document.createElement('tr');
            row.dataset.promotionId = promo.id; // Store ID for actions

            // Format dates for display
            const formattedStartDate = new Date(promo.start_date).toLocaleDateString();
            const formattedEndDate = new Date(promo.end_date).toLocaleDateString();

            row.innerHTML = `
                <td>${promo.id}</td>
                <td>${promo.code}</td>
                <td>${promo.discount_percentage}%</td>
                <td>${formattedStartDate}</td>
                <td>${formattedEndDate}</td>
                <td>${promo.is_active ? '✔' : ''}</td>
                <td>
                    <button class="delete-promotion-btn" data-id="${promo.id}">Delete</button>
                </td>
            `;
            promotionsTableBody.appendChild(row);
        });

        addEventListenersToPromotionButtons(); // Attach listeners after rendering
    } catch (err) {
        console.error('Error loading promotions:', err);
        promotionsTableBody.innerHTML = `<tr><td colspan="7">Failed to load promotions.</td></tr>`;
        alert('Failed to load promotions.', true);
    }
}

// --- Functions for Modal and Form Management ---

function openModal(promotion = null) {
    promotionForm.reset(); // Clear form fields
    promotionIdInput.value = ''; // Clear hidden ID
    modalTitle.textContent = 'Add New Promotion';
    promotionModal.style.display = 'flex'; // Show the modal
}

function closeModal() {
    promotionModal.style.display = 'none'; // Hide the modal
    promotionForm.reset(); // Reset the form
    promotionIdInput.value = ''; // Clear hidden ID
}

// --- Event Handlers for Actions ---

async function handlePromotionFormSubmit(e) {
    e.preventDefault(); // Prevent default form submission

    const id = promotionIdInput.value;
    const promotionData = {
        code: codeInput.value,
        discount_percentage: parseFloat(discountInput.value), // Convert to number
        start_date: startDateInput.value, // YYYY-MM-DD
        end_date: endDateInput.value,     // YYYY-MM-DD
        is_active: activeInput.checked    // Boolean
    };

    try {
        await ApiService.createPromotion(promotionData);
        alert('Promotion added successfully!');
        closeModal();
        loadPromotions(); // Reload the table to show changes
    } catch (err) {
        console.error('Error saving promotion:', err);
        alert(err.message || 'Failed to save promotion.', true);
    }
}

async function handleDeleteButtonClick(id) {
    if (confirm('Are you sure you want to delete this promotion? This action cannot be undone.')) {
        try {
            await ApiService.deletePromotion(id);
            alert('Promotion deleted successfully!');
            loadPromotions(); // Reload the table
        } catch (err) {
            console.error('Error deleting promotion:', err);
            alert(err.message || 'Failed to delete promotion.', true);
        }
    }
}

// --- Event Listener Attachments ---

function addEventListenersToPromotionButtons() {

    // Delete buttons
    promotionsTableBody.querySelectorAll('.delete-promotion-btn').forEach(button => {
        button.addEventListener('click', () => handleDeleteButtonClick(button.dataset.id));
    });
}

// --- Initialize on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial load of promotions
    loadPromotions();

    // Event listener for "Add New Promotion" button
    newPromotionBtn.addEventListener('click', () => openModal());

    // Event listener for modal close button (X)
    closeButton.addEventListener('click', closeModal);

    // Event listener for clicking outside the modal to close it
    window.addEventListener('click', (event) => {
        if (event.target === promotionModal) {
            closeModal();
        }
    });

    // Event listener for form submission (Add/Edit)
    promotionForm.addEventListener('submit', handlePromotionFormSubmit);

    // Assuming these are in scripts.js, they should be called on admin pages too
    // updateNav() is called in the inline script of admin_promotions.html, which is good.
    // Logout link handler is also typically in scripts.js
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            // Assuming handleLogout() from scripts.js will redirect
            window.location.href = 'admin_login.html'; // Or 'index.html'
        });
    }
});