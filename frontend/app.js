/* ============================================================
   app.js — Rajarajeswari Dental College & Hospital
   GSAP Animations + Form Handling + Interactivity
   Elder-Friendly: smooth, gentle animations
   ============================================================ */

/* ===== FAQ Accordion (global — called via onclick in HTML) ===== */
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const arrow  = btn.querySelector('.faq-arrow');
  const isOpen = answer.classList.contains('open');

  // Close all open FAQs
  document.querySelectorAll('.faq-a.open').forEach(a => {
    a.classList.remove('open');
    const arr = a.previousElementSibling.querySelector('.faq-arrow');
    if (arr) arr.classList.remove('rotated');
  });

  // Toggle clicked one
  if (!isOpen) {
    answer.classList.add('open');
    if (arrow) arrow.classList.add('rotated');
  }
}

/* ===== Dept Tab filter (Faculty page) ===== */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dept-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.dept-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
});

/* ===== Register ScrollTrigger (if available) ===== */
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/* ===== Wait for DOM ===== */
document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------
     1. HERO FADE-UP (immediate on page load)
  ------------------------------------------------ */
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    gsap.fromTo(heroContent,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.4, ease: 'power3.out', delay: 0.2 }
    );
  }

  /* Hero section fade-in */
  const heroSection = document.querySelector('.hero-building');
  if (heroSection) {
    gsap.to(heroSection, { opacity: 1, duration: 0.8, ease: 'power2.out' });
  }

  /* ------------------------------------------------
     2. SCROLL-TRIGGERED FADE-UPS (all .fade-up elements)
  ------------------------------------------------ */
  if (typeof ScrollTrigger !== 'undefined') {
    const fadeEls = document.querySelectorAll('.fade-up');
    fadeEls.forEach((el) => {
      // Skip hero-content (already animated above)
      if (el.classList.contains('hero-content')) return;

      gsap.fromTo(el,
        { y: 30, opacity: 0 },
        {
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power2.out'
        }
      );
    });
  } else {
    /* Fallback: just show all elements */
    document.querySelectorAll('.fade-up').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  /* Inner hero pages: show immediately */
  const innerHero = document.querySelector('.inner-hero');
  if (innerHero && typeof gsap !== 'undefined') {
    gsap.fromTo(innerHero,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.15 }
    );
  }

  /* ------------------------------------------------
     3. NAVBAR — Add shadow on scroll
  ------------------------------------------------ */
  const header = document.querySelector('.main-header, .glass-nav');
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        header.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
      } else {
        header.style.boxShadow = '';
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /* ------------------------------------------------
     4. FEATURE CARDS — Stagger on scroll
  ------------------------------------------------ */
  const featureCards = document.querySelectorAll('.feature-card');
  if (featureCards.length && typeof ScrollTrigger !== 'undefined') {
    gsap.fromTo('.feature-card',
      { y: 40, opacity: 0 },
      {
        scrollTrigger: {
          trigger: '.features-grid',
          start: 'top 85%'
        },
        y: 0,
        opacity: 1,
        duration: 0.75,
        ease: 'power2.out',
        stagger: 0.12
      }
    );
  }

  /* ------------------------------------------------
     5. STAT NUMBERS — Count-up animation
  ------------------------------------------------ */
  const statNumbers = document.querySelectorAll('.hero-stat-number');
  statNumbers.forEach(el => {
    const text = el.textContent.trim();
    const match = text.match(/^(\d+)/);
    if (!match) return;
    const end = parseInt(match[1], 10);
    const suffix = text.replace(match[1], '');
    let start = 0;
    const duration = 1800; // ms
    const step = 16;       // ms per frame
    const increment = end / (duration / step);

    const timer = setInterval(() => {
      start = Math.min(start + increment, end);
      el.textContent = Math.floor(start) + suffix;
      if (start >= end) clearInterval(timer);
    }, step);
  });

  /* ------------------------------------------------
     6. FORM SUBMISSION
  ------------------------------------------------ */
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = bookingForm.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '⏳ Sending...';
      submitBtn.disabled = true;

      const name       = document.getElementById('name')?.value?.trim() || '';
      const phone      = document.getElementById('phone')?.value?.trim() || '';
      const department = document.getElementById('department')?.value || '';
      const date       = document.getElementById('date')?.value || new Date().toISOString().split('T')[0];
      const message    = document.getElementById('message')?.value?.trim() || '';

      const msgBox = document.getElementById('booking-message');

      const showMsg = (text, success = true) => {
        if (!msgBox) return;
        msgBox.innerHTML = text;
        msgBox.style.background  = success ? '#D5F5E3' : '#FADBD8';
        msgBox.style.color       = success ? '#1E8449' : '#C0392B';
        msgBox.style.border      = success ? '2px solid #82E0AA' : '2px solid #F1948A';
        msgBox.classList.remove('hidden');
        msgBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => msgBox.classList.add('hidden'), 7000);
      };

      try {
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientName:  name,
            patientPhone: phone,
            department:   department,
            date:         date,
            service:      department,
            reason:       message || 'Website Inquiry'
          })
        });

        if (response.ok) {
          showMsg(`✅ <strong>Appointment Request Received!</strong><br>Thank you, <strong>${name}</strong>. We will call you shortly on <strong>${phone}</strong> to confirm your appointment.`, true);
          bookingForm.reset();
        } else {
          showMsg('⚠️ Could not send at this moment. Please call us directly: <strong>080 – 2848 4210</strong>', false);
        }
      } catch (err) {
        console.error('Form submission error:', err);
        showMsg('📞 Network issue. Please call us directly: <strong>080 – 2848 4210</strong>', false);
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  /* ------------------------------------------------
     7. CHATBOT LOGIC
  ------------------------------------------------ */
  const chatToggle = document.getElementById('chatbot-toggle');
  const chatWindow = document.getElementById('chatbot-window');
  const chatClose = document.getElementById('chatbot-close');
  const chatSend = document.getElementById('chat-send');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chatbot-messages');

  if (chatToggle && chatWindow) {
    chatToggle.addEventListener('click', () => {
      chatWindow.classList.add('open');
      chatToggle.style.transform = 'scale(0)';
    });
    chatClose.addEventListener('click', () => {
      chatWindow.classList.remove('open');
      chatToggle.style.transform = 'scale(1)';
    });

    const addMessage = (text, sender) => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `chat-msg ${sender}`;
      msgDiv.textContent = text;
      chatMessages.appendChild(msgDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleBotResponse = (userText) => {
      const text = userText.toLowerCase();
      setTimeout(() => {
        if (text.includes('book') || text.includes('appointment')) {
          addMessage('You can book an appointment by clicking the "Book Appointment" button in the header, or via the quick links.', 'bot');
        } else if (text.includes('course') || text.includes('admission')) {
          addMessage('Explore our Admissions portal for BDS and MDS program details and fee structures.', 'bot');
        } else if (text.includes('emergency')) {
          addMessage('For dental emergencies, please contact our 24/7 hotline directly: 080–2848 4210.', 'bot');
        } else {
          addMessage('That sounds interesting! For detailed information or to speak with a specialist, please call 080–2848 4210.', 'bot');
        }
      }, 600);
    };

    const handleSend = () => {
      const text = chatInput.value.trim();
      if (!text) return;
      addMessage(text, 'user');
      chatInput.value = '';
      
      const options = document.querySelector('.chat-options');
      if (options) options.style.display = 'none';

      handleBotResponse(text);
    };

    chatSend.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    window.sendQuickReply = (text) => {
      addMessage(text, 'user');
      const options = document.querySelector('.chat-options');
      if (options) options.style.display = 'none';
      handleBotResponse(text);
    };
  }

});
