/* ==========================================================================
   FLAVOUR HOUSE - APPLICATION & CART CONTROLLER
   Full-stack Frontend Controller: Menu, Cart, Table Booking, & Payment Gateway
   ========================================================================== */

class AuraApp {
  constructor() {
    this.menuItems = [];
    this.cart = [];
    this.activeCategory = 'all';
    this.activeDiet = 'all';
    this.searchQuery = '';
    this.audioEnabled = true;

    this.audioCtx = null;

    // DOM Elements
    this.menuGrid = document.getElementById('menu-grid');
    this.searchInput = document.getElementById('menu-search-input');
    this.cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
    this.cartItemsContainer = document.getElementById('cart-items-container');
    this.cartBadge = document.getElementById('cart-badge');
    this.cartSubtotal = document.getElementById('cart-subtotal');
    this.cartTax = document.getElementById('cart-tax');
    this.cartFee = document.getElementById('cart-fee');
    this.cartTotal = document.getElementById('cart-total');
    this.proceedCheckoutBtn = document.getElementById('proceed-checkout-btn');

    // Dialog Modals
    this.paymentModal = document.getElementById('payment-modal');
    this.receiptModal = document.getElementById('receipt-modal');
    this.itemDetailModal = document.getElementById('item-detail-modal');

    // Payment Form & 3D Card
    this.card3dInner = document.getElementById('card-3d-inner');
    this.cardNumInput = document.getElementById('pay-card-num');
    this.cardNameInput = document.getElementById('pay-card-name');
    this.cardExpInput = document.getElementById('pay-card-exp');
    this.cardCvvInput = document.getElementById('pay-card-cvv');

    this.cardNumDisplay = document.getElementById('card-num-display');
    this.cardNameDisplay = document.getElementById('card-name-display');
    this.cardExpDisplay = document.getElementById('card-exp-display');
    this.cardCvvDisplay = document.getElementById('card-cvv-display');
    this.payableAmountDisplay = document.getElementById('payment-payable-amount');

    this.init();
  }

  async init() {
    this.loadCartFromStorage();
    this.bindEvents();
    await this.fetchMenu();
    this.updateCartUI();
  }

  playHapticSound(freq = 440, type = 'sine', duration = 0.08) {
    if (!this.audioEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Browser audio policy catch
    }
  }

  async fetchMenu() {
    try {
      const response = await fetch('/api/menu');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        this.menuItems = data.data;
      } else {
        await fetch('/api/seed', { method: 'POST' });
        const res2 = await fetch('/api/menu');
        const data2 = await res2.json();
        this.menuItems = data2.data || [];
      }
      this.renderMenu();
    } catch (err) {
      console.error('[Flavour House Menu Error]', err);
      this.menuGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: #f43f5e; margin-bottom: 12px;"></i>
          <p>Failed to load culinary menu. Please verify your backend connection.</p>
        </div>
      `;
    }
  }

  bindEvents() {
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        this.audioEnabled = !this.audioEnabled;
        audioBtn.innerHTML = this.audioEnabled ? 
          '<i class="fa-solid fa-volume-high"></i>' : 
          '<i class="fa-solid fa-volume-xmark" style="color:#f43f5e;"></i>';
      });
    }

    const catTabs = document.querySelectorAll('#category-tabs .tab-btn');
    catTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        catTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeCategory = tab.dataset.category;
        this.playHapticSound(520, 'sine');
        this.renderMenu();
      });
    });

    const dietPills = document.querySelectorAll('.diet-pill');
    dietPills.forEach(pill => {
      pill.addEventListener('click', () => {
        dietPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeDiet = pill.dataset.diet;
        this.playHapticSound(580, 'sine');
        this.renderMenu();
      });
    });

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderMenu();
      });
    }

    const openCartBtn = document.getElementById('open-cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    if (openCartBtn) {
      openCartBtn.addEventListener('click', () => {
        this.cartDrawerOverlay.classList.add('active');
        this.playHapticSound(650, 'sine');
      });
    }
    if (closeCartBtn) {
      closeCartBtn.addEventListener('click', () => {
        this.cartDrawerOverlay.classList.remove('active');
      });
    }
    if (this.cartDrawerOverlay) {
      this.cartDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === this.cartDrawerOverlay) {
          this.cartDrawerOverlay.classList.remove('active');
        }
      });
    }

    if (this.proceedCheckoutBtn) {
      this.proceedCheckoutBtn.addEventListener('click', () => {
        if (this.cart.length === 0) return;
        this.cartDrawerOverlay.classList.remove('active');
        this.openPaymentModal();
      });
    }

    document.getElementById('close-payment-btn')?.addEventListener('click', () => this.paymentModal.close());
    document.getElementById('close-receipt-btn')?.addEventListener('click', () => this.receiptModal.close());
    document.getElementById('close-item-modal-btn')?.addEventListener('click', () => this.itemDetailModal.close());
    document.getElementById('print-receipt-btn')?.addEventListener('click', () => window.print());

    const resForm = document.getElementById('reservation-form');
    if (resForm) {
      resForm.addEventListener('submit', (e) => this.handleReservationSubmit(e));
    }

    this.bindPaymentCardInputs();
  }

  bindPaymentCardInputs() {
    if (!this.cardNumInput) return;

    this.cardNumInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      val = val.match(/.{1,4}/g)?.join(' ') || val;
      e.target.value = val;
      this.cardNumDisplay.textContent = val || '•••• •••• •••• ••••';
    });

    this.cardNameInput.addEventListener('input', (e) => {
      this.cardNameDisplay.textContent = e.target.value.toUpperCase() || 'RESHMA SHARMA';
    });

    this.cardExpInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2);
      e.target.value = val;
      this.cardExpDisplay.textContent = val || '12/28';
    });

    this.cardCvvInput.addEventListener('focus', () => {
      this.card3dInner.classList.add('flipped');
      this.playHapticSound(720, 'triangle');
    });

    this.cardCvvInput.addEventListener('blur', () => {
      this.card3dInner.classList.remove('flipped');
    });

    this.cardCvvInput.addEventListener('input', (e) => {
      this.cardCvvDisplay.textContent = e.target.value || '•••';
    });

    const payForm = document.getElementById('payment-gateway-form');
    if (payForm) {
      payForm.addEventListener('submit', (e) => this.handlePaymentSubmit(e));
    }
  }

  renderMenu() {
    if (!this.menuGrid) return;

    let filtered = this.menuItems;

    if (this.activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === this.activeCategory);
    }
    if (this.activeDiet !== 'all') {
      filtered = filtered.filter(item => item.diet && item.diet.includes(this.activeDiet));
    }
    if (this.searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(this.searchQuery) ||
        item.description.toLowerCase().includes(this.searchQuery) ||
        (item.spatialTag && item.spatialTag.toLowerCase().includes(this.searchQuery))
      );
    }

    if (filtered.length === 0) {
      this.menuGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 60px;">
          <i class="fa-solid fa-utensils" style="font-size: 2.5rem; color: var(--gold-primary); margin-bottom: 14px;"></i>
          <h3>No Menu Items Found</h3>
          <p>Try adjusting your search criteria or choosing another category tab.</p>
        </div>
      `;
      return;
    }

    this.menuGrid.innerHTML = filtered.map(item => {
      return `
        <div class="spatial-menu-card" data-id="${item._id}">
          <div class="card-img-wrapper" onclick="window.auraApp.openItemDetailModal('${item._id}')">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <span class="item-tag-badge">${item.spatialTag || 'Flavour Special'}</span>
            <span class="card-rating-badge"><i class="fa-solid fa-star"></i> ${item.rating || 4.9}</span>
          </div>

          <div class="card-content">
            <div class="card-title-row">
              <h3 class="card-item-title">${item.name}</h3>
              <span class="card-item-price">$${item.price.toFixed(2)}</span>
            </div>

            <p class="card-item-desc">${item.description}</p>

            <div class="card-diets">
              ${(item.diet || []).map(d => `<span class="diet-chip">${d}</span>`).join('')}
            </div>

            <div class="card-action-row">
              <button class="add-cart-btn" onclick="window.auraApp.addToCart('${item._id}')">
                <i class="fa-solid fa-plus"></i> Add to Cart
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const cards = this.menuGrid.querySelectorAll('.spatial-menu-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        card.style.transform = `perspective(1000px) rotateX(${-y / 18}deg) rotateY(${x / 18}deg) translateY(-8px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

  openItemDetailModal(itemId) {
    const item = this.menuItems.find(i => i._id === itemId);
    if (!item) return;

    document.getElementById('modal-item-img').src = item.image;
    document.getElementById('modal-item-title').textContent = item.name;
    document.getElementById('modal-item-price').textContent = `$${item.price.toFixed(2)}`;
    document.getElementById('modal-item-rating').textContent = `★ ${item.rating || 4.9}`;
    document.getElementById('modal-item-calories').textContent = `${item.calories || 350} cal`;
    document.getElementById('modal-item-desc').textContent = item.description;
    document.getElementById('modal-item-spatial-tag').textContent = item.spatialTag || 'Flavour Special';

    const dietContainer = document.getElementById('modal-diet-container');
    dietContainer.innerHTML = (item.diet || []).map(d => `<span class="diet-chip">${d}</span>`).join('');

    let qty = 1;
    const qtyVal = document.getElementById('modal-qty-val');
    qtyVal.textContent = qty;

    document.getElementById('modal-qty-minus').onclick = () => {
      if (qty > 1) { qty--; qtyVal.textContent = qty; }
    };
    document.getElementById('modal-qty-plus').onclick = () => {
      qty++; qtyVal.textContent = qty;
    };

    const addBtn = document.getElementById('add-modal-item-to-cart-btn');
    addBtn.onclick = () => {
      const notes = document.getElementById('modal-notes').value || '';
      this.addToCart(item._id, qty, notes);
      this.itemDetailModal.close();
    };

    this.playHapticSound(480, 'sine');
    this.itemDetailModal.showModal();
  }

  addToCart(itemId, quantity = 1, notes = '') {
    const item = this.menuItems.find(i => i._id === itemId);
    if (!item) return;

    const existingIndex = this.cart.findIndex(c => c.itemId === itemId && c.notes === notes);
    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += quantity;
    } else {
      this.cart.push({
        itemId: item._id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity,
        notes
      });
    }

    this.saveCartToStorage();
    this.updateCartUI();
    this.playHapticSound(820, 'sine', 0.12);

    this.cartDrawerOverlay.classList.add('active');
  }

  updateQuantity(index, delta) {
    if (!this.cart[index]) return;
    this.cart[index].quantity += delta;
    if (this.cart[index].quantity <= 0) {
      this.cart.splice(index, 1);
    }
    this.saveCartToStorage();
    this.updateCartUI();
  }

  updateCartUI() {
    const totalItemsCount = this.cart.reduce((acc, i) => acc + i.quantity, 0);
    if (this.cartBadge) this.cartBadge.textContent = totalItemsCount;

    if (this.cart.length === 0) {
      this.cartItemsContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); margin: 60px 0;">
          <i class="fa-solid fa-basket-shopping" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.4;"></i>
          <p>Your cart is currently empty.</p>
        </div>
      `;
      this.cartSubtotal.textContent = '$0.00';
      this.cartTax.textContent = '$0.00';
      this.cartTotal.textContent = '$0.00';
      if (this.proceedCheckoutBtn) this.proceedCheckoutBtn.disabled = true;
      return;
    }

    if (this.proceedCheckoutBtn) this.proceedCheckoutBtn.disabled = false;

    this.cartItemsContainer.innerHTML = this.cart.map((item, idx) => `
      <div class="cart-item-card">
        <img src="${item.image}" class="cart-item-img" alt="${item.name}">
        <div class="cart-item-info">
          <h4 class="cart-item-title">${item.name}</h4>
          <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
          ${item.notes ? `<p style="font-size: 0.75rem; color: var(--text-muted);">${item.notes}</p>` : ''}
        </div>

        <div class="cart-qty-ctrl">
          <button class="cart-qty-btn" onclick="window.auraApp.updateQuantity(${idx}, -1)"><i class="fa-solid fa-minus"></i></button>
          <span class="cart-qty-val">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="window.auraApp.updateQuantity(${idx}, 1)"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
    `).join('');

    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const fee = 2.50;
    const total = subtotal + tax + fee;

    this.cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    this.cartTax.textContent = `$${tax.toFixed(2)}`;
    this.cartFee.textContent = `$${fee.toFixed(2)}`;
    this.cartTotal.textContent = `$${total.toFixed(2)}`;
    if (this.payableAmountDisplay) {
      this.payableAmountDisplay.textContent = `$${total.toFixed(2)}`;
    }
  }

  saveCartToStorage() {
    localStorage.setItem('flavour_house_cart', JSON.stringify(this.cart));
  }

  loadCartFromStorage() {
    const saved = localStorage.getItem('flavour_house_cart');
    if (saved) {
      try { this.cart = JSON.parse(saved); } catch (e) { this.cart = []; }
    }
  }

  async handleReservationSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('res-name').value;
    const email = document.getElementById('res-email').value;
    const phone = document.getElementById('res-phone').value;
    const guests = document.getElementById('res-guests').value;
    const date = document.getElementById('res-date').value;
    const time = document.getElementById('res-time').value;
    const tableId = document.getElementById('res-table-select').value;
    const notes = document.getElementById('res-notes').value;

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          email,
          phone,
          guests,
          date,
          time,
          tableId,
          specialRequests: notes
        })
      });

      const result = await response.json();
      if (result.success) {
        this.playHapticSound(900, 'sine', 0.2);
        alert(`✨ Flavour House Table Reservation Confirmed!\nBooking Ref: ${result.data.bookingId}\nTable: ${result.data.tableId}\nDate: ${result.data.date} at ${result.data.time}`);
      } else {
        alert(`Reservation Error: ${result.error}`);
      }
    } catch (err) {
      alert(`Server error processing reservation.`);
    }
  }

  openPaymentModal() {
    if (!this.paymentModal) return;
    this.playHapticSound(600, 'sine');
    this.paymentModal.showModal();
  }

  async handlePaymentSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-payment-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authorizing Flavour House Gateway...';

    const cardNum = this.cardNumInput.value;
    const cardName = this.cardNameInput.value;
    const cardExp = this.cardExpInput.value;
    const cardCvv = this.cardCvvInput.value;
    const email = document.getElementById('pay-email').value;

    try {
      const simRes = await fetch('/api/orders/payment/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: cardNum,
          cardName,
          expiry: cardExp,
          cvv: cardCvv,
          paymentMethod: 'card'
        })
      });
      const simData = await simRes.json();

      if (!simData.success) {
        alert(simData.error || 'Payment Authorization Failed');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-shield-check"></i> Authorize & Complete Order';
        return;
      }

      const selectedTableId = window.spatialSeatingMap ? window.spatialSeatingMap.selectedTableId : 'PRIV-01';
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: this.cart,
          customerInfo: {
            name: cardName,
            email,
            phone: '+1 555 019 2834'
          },
          paymentMethod: 'card',
          tableId: selectedTableId
        })
      });
      const orderData = await orderRes.json();

      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-shield-check"></i> Authorize & Complete Order';

      if (orderData.success) {
        this.cart = [];
        this.saveCartToStorage();
        this.updateCartUI();

        this.paymentModal.close();
        this.showReceiptModal(orderData.data, simData.transactionHash);
      } else {
        alert(`Order creation failed: ${orderData.error}`);
      }
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-shield-check"></i> Authorize & Complete Order';
      alert('Error communicating with Payment Gateway.');
    }
  }

  showReceiptModal(order, txHash) {
    const receiptBody = document.getElementById('receipt-details-body');
    if (!receiptBody) return;

    receiptBody.innerHTML = `
      <div class="receipt-row"><span>Order Reference</span><span style="font-weight:700; color:white;">${order.orderId}</span></div>
      <div class="receipt-row"><span>Transaction Hash</span><span style="font-family:monospace; color:var(--gold-primary);">${txHash || order.transactionId}</span></div>
      <div class="receipt-row"><span>Reserved Suite / Table</span><span>${order.tableId || 'PRIV-01'}</span></div>
      <div class="receipt-row"><span>Guest Name</span><span>${order.customerInfo.name}</span></div>
      <div class="receipt-row"><span>Payment Status</span><span style="color:#10b981; font-weight:700;">AUTHORIZED (PAID)</span></div>
      
      <div style="border-top:1px dashed rgba(212,175,55,0.2); margin: 14px 0; padding-top: 14px;">
        <h4 style="margin-bottom:10px; font-family:'Cormorant Garamond'; font-size:1.2rem; color:var(--gold-primary);">Ordered Items:</h4>
        ${order.items.map(i => `
          <div class="receipt-row">
            <span>${i.name} (x${i.quantity})</span>
            <span>$${(i.price * i.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>

      <div class="receipt-row"><span>Subtotal</span><span>$${order.subtotal.toFixed(2)}</span></div>
      <div class="receipt-row"><span>Sales Tax</span><span>$${order.tax.toFixed(2)}</span></div>
      <div class="receipt-row"><span>House Service Fee</span><span>$${order.serviceFee.toFixed(2)}</span></div>
      <div class="receipt-row bold"><span>Total Charged</span><span>$${order.total.toFixed(2)}</span></div>
    `;

    this.playHapticSound(950, 'sine', 0.3);
    this.receiptModal.showModal();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.auraApp = new AuraApp();
});
