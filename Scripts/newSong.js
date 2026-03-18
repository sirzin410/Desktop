const openBtn  = document.getElementById('openModalBtn');
const closeBtn = document.getElementById('closeModalBtn');
const overlay  = document.getElementById('popupOverlay');
const form     = document.getElementById('popupForm');

// Open modal
openBtn.addEventListener('click', () => {
  overlay.style.display = 'flex';
});

// Close modal
closeBtn.addEventListener('click', () => {
  overlay.style.display = 'none';
});

// Close when clicking outside popup
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) {
    overlay.style.display = 'none';
  }
});

// Handle form submission
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const name  = form.querySelector('[name="name"]').value;
  const email = form.querySelector('[name="email"]').value;

  console.log('Form data:', { name, email });
  
  overlay.style.display = 'none';
  form.reset();
});
