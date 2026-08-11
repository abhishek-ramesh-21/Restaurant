/* ==========================================================================
   FLAVOUR HOUSE - SEATING & TABLE SUITE MODULE
   Interactive Floorplan & Real-Time Seat Selection Engine
   ========================================================================== */

class SpatialSeatingMap {
  constructor() {
    this.tables = [];
    this.selectedTableId = 'PRIV-01';
    this.currentZone = 'all';

    this.gridElement = document.getElementById('spatial-seating-grid');
    this.badgeCardName = document.getElementById('preview-table-name');
    this.reservationSelect = document.getElementById('res-table-select');
    
    this.init();
  }

  async init() {
    await this.fetchTables();
    this.bindEvents();
  }

  async fetchTables() {
    try {
      const response = await fetch('/api/reservations/tables');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        this.tables = data.data;
        this.render();
      } else {
        this.useFallbackTables();
      }
    } catch (err) {
      console.warn('[Flavour House Seating] Using fallback table layout:', err);
      this.useFallbackTables();
    }
  }

  useFallbackTables() {
    this.tables = [
      { tableId: 'PRIV-01', name: 'Private Champagne Suite A', zone: 'Private Dining Suite', capacity: 6, type: 'vip', status: 'available' },
      { tableId: 'PRIV-02', name: 'Private Champagne Suite B', zone: 'Private Dining Suite', capacity: 8, type: 'vip', status: 'reserved' },
      { tableId: 'CHEF-01', name: "Chef's Tasting Counter 01", zone: "Chef's Kitchen Bar", capacity: 4, type: 'interactive', status: 'available' },
      { tableId: 'TER-01', name: 'Garden Terrace Table 1', zone: 'Outdoor Courtyard', capacity: 2, type: 'romantic', status: 'available' },
      { tableId: 'TER-02', name: 'Garden Terrace Table 2', zone: 'Outdoor Courtyard', capacity: 4, type: 'romantic', status: 'available' },
      { tableId: 'SALON-01', name: 'Main Dining Salon 1', zone: 'Main Dining Room', capacity: 4, type: 'standard', status: 'available' },
      { tableId: 'SALON-02', name: 'Main Dining Salon 2', zone: 'Main Dining Room', capacity: 6, type: 'standard', status: 'occupied' },
      { tableId: 'SALON-03', name: 'Grand Family Salon Booth', zone: 'Main Dining Room', capacity: 8, type: 'family', status: 'available' }
    ];
    this.render();
  }

  bindEvents() {
    const filterBtns = document.querySelectorAll('.map-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentZone = btn.dataset.zone;
        this.render();
      });
    });

    if (this.reservationSelect) {
      this.reservationSelect.addEventListener('change', (e) => {
        this.selectTable(e.target.value);
      });
    }
  }

  selectTable(tableId) {
    const table = this.tables.find(t => t.tableId === tableId);
    if (!table || table.status === 'reserved' || table.status === 'occupied') {
      return;
    }

    this.selectedTableId = tableId;
    this.render();

    if (this.badgeCardName) {
      this.badgeCardName.textContent = `${table.tableId} (${table.name} - ${table.zone})`;
    }
    if (this.reservationSelect) {
      this.reservationSelect.value = tableId;
    }

    if (window.auraApp && typeof window.auraApp.playHapticSound === 'function') {
      window.auraApp.playHapticSound(560, 'sine', 0.1);
    }
  }

  render() {
    if (!this.gridElement) return;

    let filteredTables = this.tables;
    if (this.currentZone !== 'all') {
      filteredTables = this.tables.filter(t => t.zone === this.currentZone);
    }

    this.gridElement.innerHTML = filteredTables.map(t => {
      const isSelected = t.tableId === this.selectedTableId;
      const isReserved = t.status === 'reserved' || t.status === 'occupied';
      const badgeClass = `badge-${t.type}`;

      return `
        <div class="table-card ${isSelected ? 'selected' : ''} ${isReserved ? 'reserved' : ''}" 
             data-id="${t.tableId}">
          <div class="table-header">
            <span class="table-badge ${badgeClass}">${t.type}</span>
            <i class="fa-solid fa-gem" style="color: ${isSelected ? '#d4af37' : 'rgba(255,255,255,0.3)'}"></i>
          </div>

          <h3 class="table-title">${t.name}</h3>
          <p class="table-zone"><i class="fa-solid fa-location-dot"></i> ${t.zone}</p>

          <div class="table-footer">
            <span><i class="fa-solid fa-user-group"></i> Max ${t.capacity} Guests</span>
            <span style="color: ${isReserved ? '#64748b' : (isSelected ? '#d4af37' : '#10b981')}">
              ${isReserved ? 'Booked' : (isSelected ? 'Selected' : 'Available')}
            </span>
          </div>
        </div>
      `;
    }).join('');

    const cards = this.gridElement.querySelectorAll('.table-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        this.selectTable(id);
      });

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        card.style.transform = `perspective(1000px) rotateX(${-y / 14}deg) rotateY(${x / 14}deg) translateY(-6px)`;
      });

      card.addEventListener('mouseleave', () => {
        if (card.classList.contains('selected')) {
          card.style.transform = 'translateY(-6px)';
        } else {
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        }
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.spatialSeatingMap = new SpatialSeatingMap();
});
