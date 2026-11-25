document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobilne menu nawigacji
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2. Kalkulator oszczędności fotowoltaicznych
  const billRange = document.getElementById('billRange');
  const billDisplay = document.getElementById('billDisplay');
  const withBattery = document.getElementById('withBattery');
  const segButtons = document.querySelectorAll('.seg-btn');

  const annualSavingsEl = document.getElementById('annualSavings');
  const tenYearSavingsEl = document.getElementById('tenYearSavings');
  const recommendedKwpEl = document.getElementById('recommendedKwp');
  const panelCountEl = document.getElementById('panelCount');
  const paybackYearsEl = document.getElementById('paybackYears');
  const co2SavedEl = document.getElementById('co2Saved');
  const calcCta = document.getElementById('calcCta');

  let buildingType = 'dom';

  function formatPln(amount) {
    return `${Math.round(amount).toLocaleString('pl-PL')} zł`;
  }

  function updateCalculator() {
    if (!billRange) return;

    const monthlyBill = Number(billRange.value);
    const hasBattery = Boolean(withBattery && withBattery.checked);

    billDisplay.textContent = formatPln(monthlyBill);

    // Orientacyjne założenia rynkowe PL (net-billing + autokonsumpcja)
    const annualBill = monthlyBill * 12;
    const savingsRate = hasBattery ? 0.84 : 0.68;
    const annualSavings = annualBill * savingsRate;

    // Dobór mocy: ok. 1 kWp na każde ~95 zł miesięcznego rachunku (dom) lub ~105 zł (firma)
    const billPerKwp = buildingType === 'firma' ? 105 : 92;
    const rawKwp = Math.max(3.6, monthlyBill / billPerKwp);
    const recommendedKwp = Math.round(rawKwp * 2) / 2; // zaokrąglenie do 0.5 kWp

    const panelCount = Math.ceil((recommendedKwp * 1000) / 450);

    // Szacowany koszt netto po ulgach/dotacji i okres zwrotu
    const costPerKwp = buildingType === 'firma' ? 3600 : 4100;
    const batteryCost = hasBattery ? 11500 : 0;
    const subsidy = buildingType === 'dom' ? (hasBattery ? 16000 : 6000) : 0;
    const netCost = Math.max(12000, recommendedKwp * costPerKwp + batteryCost - subsidy);
    const payback = Math.max(3.2, Math.min(8.5, netCost / annualSavings));

    // Oszczędność CO2 (~0.71 t na każdy MWh z węgla/miksu)
    const annualProductionMwh = recommendedKwp * 1.02;
    const co2Saved = annualProductionMwh * 0.71;

    annualSavingsEl.textContent = formatPln(annualSavings);
    tenYearSavingsEl.textContent = `To ok. ${formatPln(annualSavings * 10)} w ciągu 10 lat (bez uwzględnienia wzrostu cen prądu)`;
    recommendedKwpEl.textContent = `${recommendedKwp.toFixed(1).replace('.', ',')} kWp`;
    panelCountEl.textContent = `${panelCount} szt.`;
    paybackYearsEl.textContent = `${payback.toFixed(1).replace('.', ',')} roku`;
    co2SavedEl.textContent = `${co2Saved.toFixed(1).replace('.', ',')} tony`;

    if (calcCta) {
      calcCta.dataset.kwp = recommendedKwp.toFixed(1);
    }
  }

  segButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      segButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      buildingType = btn.dataset.type || 'dom';
      updateCalculator();
    });
  });

  if (billRange) {
    billRange.addEventListener('input', updateCalculator);
  }
  if (withBattery) {
    withBattery.addEventListener('change', updateCalculator);
  }
  if (calcCta) {
    calcCta.addEventListener('click', () => {
      const notesField = document.getElementById('notes');
      const interestSelect = document.getElementById('interest');
      if (notesField && calcCta.dataset.kwp) {
        notesField.value = `Wstępne wyliczenie z kalkulatora: ok. ${calcCta.dataset.kwp} kWp (rachunek ${billRange.value} zł/mies.).`;
      }
      if (interestSelect) {
        if (buildingType === 'firma') {
          interestSelect.value = 'firma';
        } else if (withBattery && withBattery.checked) {
          interestSelect.value = 'dom-pv-magazyn';
        } else {
          interestSelect.value = 'dom-pv';
        }
      }
    });
  }

  updateCalculator();

  // 3. Akordeon FAQ
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const questionBtn = item.querySelector('.faq-question');
    const answerEl = item.querySelector('.faq-answer');

    if (!questionBtn || !answerEl) return;

    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      faqItems.forEach((other) => {
        other.classList.remove('open');
        const otherBtn = other.querySelector('.faq-question');
        const otherAns = other.querySelector('.faq-answer');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        if (otherAns) otherAns.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        questionBtn.setAttribute('aria-expanded', 'true');
        answerEl.style.maxHeight = `${answerEl.scrollHeight}px`;
      }
    });
  });

  // 4. Walidacja i obsługa formularza kontaktowego
  const quoteForm = document.getElementById('quoteForm');
  const formFeedback = document.getElementById('formFeedback');

  if (quoteForm && formFeedback) {
    quoteForm.addEventListener('submit', (event) => {
      event.preventDefault();
      formFeedback.className = 'form-feedback';

      const fullName = quoteForm.fullName.value.trim();
      const phone = quoteForm.phone.value.replace(/\s+/g, '');
      const postalCode = quoteForm.postalCode.value.trim();
      const consent = document.getElementById('consent').checked;

      if (fullName.length < 2) {
        formFeedback.textContent = 'Proszę podać imię i nazwisko.';
        formFeedback.classList.add('error');
        return;
      }

      if (!/^\+?\d{9,12}$/.test(phone)) {
        formFeedback.textContent = 'Proszę podać poprawny numer telefonu (min. 9 cyfr).';
        formFeedback.classList.add('error');
        return;
      }

      if (!/^\d{2}-\d{3}$/.test(postalCode) && postalCode.length < 5) {
        formFeedback.textContent = 'Proszę podać poprawny kod pocztowy (np. 00-001).';
        formFeedback.classList.add('error');
        return;
      }

      if (!consent) {
        formFeedback.textContent = 'Zaznacz zgodę na kontakt, aby wysłać zapytanie.';
        formFeedback.classList.add('error');
        return;
      }

      formFeedback.textContent = 'Dziękujemy! Zgłoszenie zostało przyjęte — nasz doradca skontaktuje się w ciągu 24 godzin.';
      formFeedback.classList.add('success');
      quoteForm.reset();
    });
  }
});
