// ─── CONFIGURATION ───
// Replace with your actual WhatsApp number (country code + number, no spaces/dashes)
const WHATSAPP_NUMBER = '919019879108';

document.addEventListener('DOMContentLoaded', () => {
  // ─── DOM REFERENCES ───
  const form = document.getElementById('signup-form');
  const firstName = document.getElementById('firstName');
  const lastName = document.getElementById('lastName');
  const email = document.getElementById('emailId');
  const plan = document.getElementById('kiroPlan');
  const header = document.querySelector('header');
  const btnUSD = document.getElementById('btn-usd');
  const btnINR = document.getElementById('btn-inr');
  const pricingCards = document.querySelectorAll('.flip-card');

  let currentCurrency = 'usd';

  // ─── CURRENCY TOGGLE ───
  function switchCurrency(currency) {
    currentCurrency = currency;

    // Update button styles
    if (currency === 'usd') {
      btnUSD.classList.add('bg-indigo-600', 'text-white');
      btnUSD.classList.remove('text-gray-400');
      btnINR.classList.remove('bg-indigo-600', 'text-white');
      btnINR.classList.add('text-gray-400');
    } else {
      btnINR.classList.add('bg-indigo-600', 'text-white');
      btnINR.classList.remove('text-gray-400');
      btnUSD.classList.remove('bg-indigo-600', 'text-white');
      btnUSD.classList.add('text-gray-400');
    }

    // Flip animation + update prices
    pricingCards.forEach(card => {
      const inner = card.querySelector('.flip-card-inner');
      inner.classList.add('flipping');

      setTimeout(() => {
        const original = card.querySelector('.original-price');
        const discounted = card.querySelector('.discounted-price');
        const origVal = card.dataset[`${currency}Original`];
        const discVal = card.dataset[`${currency}Discounted`];
        const symbol = currency === 'usd' ? '$' : '₹';

        original.textContent = `${symbol}${origVal}/month`;
        discounted.innerHTML = `${symbol}${discVal}<span class="text-base font-normal text-gray-400">/mo</span>`;
      }, 300);

      setTimeout(() => {
        inner.classList.remove('flipping');
      }, 600);
    });
  }

  btnUSD.addEventListener('click', () => switchCurrency('usd'));
  btnINR.addEventListener('click', () => switchCurrency('inr'));

  // ─── VALIDATION ───
  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function showError(field, message) {
    const errorEl = document.getElementById(`${field.id}-error`);
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    field.classList.add('border-red-500');
    field.classList.remove('border-gray-700');
  }

  function clearError(field) {
    const errorEl = document.getElementById(`${field.id}-error`);
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
    field.classList.remove('border-red-500');
    field.classList.add('border-gray-700');
  }

  function validateField(field) {
    const value = field.value.trim();
    switch (field.id) {
      case 'firstName':
        if (!value) { showError(field, 'First name is required'); return false; }
        break;
      case 'lastName':
        if (!value) { showError(field, 'Last name is required'); return false; }
        break;
      case 'emailId':
        if (!value) { showError(field, 'Email is required'); return false; }
        if (!validateEmail(value)) { showError(field, 'Enter a valid email address'); return false; }
        break;
      case 'kiroPlan':
        if (!value) { showError(field, 'Please select a plan'); return false; }
        break;
    }
    clearError(field);
    return true;
  }

  // ─── REAL-TIME VALIDATION ───
  [firstName, lastName, email, plan].forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('border-red-500')) validateField(field);
    });
  });

  // ─── FORM SUBMIT → WHATSAPP WITH USER DATA ───
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isValid = [firstName, lastName, email, plan].every(f => validateField(f));

    if (isValid) {
      const fName = firstName.value.trim();
      const lName = lastName.value.trim();
      const emailVal = email.value.trim();
      const planVal = plan.value;

      const message = `Hi! I'd like to purchase a subscription.\n\nFirst Name: ${fName}\nLast Name: ${lName}\nEmail: ${emailVal}\nSelected Plan: ${planVal}\n\nPlease share payment details and schedule my 1:1 Google Meet setup. Thanks!`;

      const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, '_blank');
    }
  });

  // ─── HEADER SCROLL EFFECT ───
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.background = 'rgba(3, 7, 18, 0.95)';
    } else {
      header.style.background = 'rgba(17, 24, 39, 0.8)';
    }
  });

  // ─── SCROLL REVEAL ANIMATION ───
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('#pricing .flip-card, #what .bg-gray-900\\/50').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});
