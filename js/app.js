// State
let itineraryData = null;
let activeDayIndex = 0;
let activeCategory = 'all';
let searchQuery = '';
let allExpanded = false;

// DOM Elements
const eventTitleEl = document.getElementById('eventTitle');
const eventSubtitleEl = document.getElementById('eventSubtitle');
const eventDressCodeEl = document.getElementById('eventDressCode');
const daysTabsContainer = document.getElementById('daysTabsContainer');

const currentDayTitleEl = document.getElementById('currentDayTitle');
const currentDayRouteEl = document.getElementById('currentDayRoute');
const currentDayStartTimeEl = document.getElementById('currentDayStartTime');

const stopsTimelineEl = document.getElementById('stopsTimeline');
const categoryFilterContainer = document.getElementById('categoryFilterContainer');
const searchInput = document.getElementById('searchInput');
const btnToggleAll = document.getElementById('btnToggleAll');
const btnToggleAllText = document.getElementById('btnToggleAllText');
const btnShare = document.getElementById('btnShare');
const btnPrint = document.getElementById('btnPrint');
const toastEl = document.getElementById('toast');
const toastMsgEl = document.getElementById('toastMsg');

// Toast notification helper
function showToast(msg) {
  toastMsgEl.textContent = msg;
  toastEl.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toastEl.classList.add('translate-y-20', 'opacity-0');
  }, 2500);
}

// Category helper maps
const categoryConfig = {
  meeting: { label: 'ประชุม', icon: 'users', color: 'badge-meeting' },
  inspection: { label: 'ตรวจงาน', icon: 'hard-hat', color: 'badge-inspection' },
  visit: { label: 'ตรวจเยี่ยม', icon: 'building-2', color: 'badge-visit' },
  meal: { label: 'อาหาร', icon: 'utensils', color: 'badge-meal' },
  sightseeing: { label: 'สิริมงคล', icon: 'sparkles', color: 'badge-sightseeing' },
  policy: { label: 'มอบนโยบาย', icon: 'award', color: 'badge-policy' },
  travel: { label: 'เดินทาง', icon: 'car', color: 'badge-travel' }
};

function getCategoryInfo(catKey) {
  return categoryConfig[catKey] || {
    label: 'ทั่วไป',
    icon: 'map-pin',
    color: 'badge-travel'
  };
}

// Helper to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Smart multiline & topic formatter
function formatRichText(text, theme = 'amber') {
  if (!text) return '';

  // Normalize all line break types
  let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // If text has inline bullets like " -หัวข้อ" or " •หัวข้อ", ensure they break into new lines
  normalized = normalized.replace(/([^\n])\s*([•\-*]|\d+\.)\s+/g, '$1\n$2 ');
  // Handle hyphen glued to word, e.g. "ราชการ -อุโบสถ"
  normalized = normalized.replace(/([^\n\s])\s*[-•]([^\s])/g, '$1\n- $2');

  const lines = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) return '';

  const bulletIcon = theme === 'amber' ? '🔸' : '🔹';
  const bulletDot = theme === 'amber' ? 'text-amber-500' : 'text-blue-500';
  const titleColor = theme === 'amber' ? 'text-amber-900' : 'text-slate-900';
  const textColor = theme === 'amber' ? 'text-amber-950' : 'text-slate-800';

  let html = '<div class="space-y-1.5 pt-0.5">';

  lines.forEach(line => {
    // Check if line starts with a bullet: -, •, *, or number 1., 2.
    const isBulletMatch = line.match(/^([•\-*]|\d+[\.)])\s*(.*)$/);
    if (isBulletMatch) {
      const content = isBulletMatch[2];
      
      // Check if content has a topic label with colon, e.g. "อุโบสถคอนกรีตเสริมเหล็กสง่างาม: รายละเอียด..."
      const colonMatch = content.match(/^([^:：]{2,40})[:：]\s*(.*)$/);
      if (colonMatch) {
        const topic = colonMatch[1].trim();
        const detail = colonMatch[2].trim();
        html += `
          <div class="flex items-start space-x-1.5 pl-0.5">
            <span class="shrink-0 mt-0.5 text-xs select-none">${bulletIcon}</span>
            <div class="${textColor} text-xs leading-relaxed">
              <strong class="${titleColor} font-bold">${escapeHtml(topic)}:</strong> ${escapeHtml(detail)}
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="flex items-start space-x-1.5 pl-0.5">
            <span class="${bulletDot} font-bold shrink-0 mt-0.5 text-xs select-none">•</span>
            <div class="${textColor} text-xs leading-relaxed">${escapeHtml(content)}</div>
          </div>
        `;
      }
    } else {
      // Check if a line without bullet starts with a bold topic with colon e.g. "หัวข้อ: รายละเอียด"
      const colonMatch = line.match(/^([^:：]{2,30})[:：]\s*(.*)$/);
      if (colonMatch && !line.includes('http')) {
        const topic = colonMatch[1].trim();
        const detail = colonMatch[2].trim();
        html += `
          <div class="flex items-start space-x-1.5 pl-0.5">
            <span class="shrink-0 mt-0.5 text-xs select-none">${bulletIcon}</span>
            <div class="${textColor} text-xs leading-relaxed">
              <strong class="${titleColor} font-bold">${escapeHtml(topic)}:</strong> ${escapeHtml(detail)}
            </div>
          </div>
        `;
      } else {
        // Regular paragraph (intro text or standard single line)
        html += `<p class="${textColor} text-xs leading-relaxed font-normal">${escapeHtml(line)}</p>`;
      }
    }
  });

  html += '</div>';
  return html;
}

// Fetch itinerary data
async function loadItinerary() {
  try {
    // 1. Check localStorage first if updated locally
    const localSaved = localStorage.getItem('alro_itinerary_custom');
    if (localSaved) {
      try {
        itineraryData = JSON.parse(localSaved);
        renderEventHeader();
        renderDaysTabs();
        renderCurrentDay();
        return;
      } catch (e) {}
    }

    let res = null;
    const candidatePaths = ['api/itinerary', './data/itinerary.json', 'data/itinerary.json', '/data/itinerary.json'];
    for (const p of candidatePaths) {
      try {
        const r = await fetch(p);
        if (r && r.ok) {
          res = r;
          break;
        }
      } catch (e) {}
    }
    if (!res || !res.ok) throw new Error('ไม่สามารถโหลดข้อมูลกำหนดการได้');
    itineraryData = await res.json();
    renderEventHeader();
    renderDaysTabs();
    renderCurrentDay();
  } catch (error) {
    console.error(error);
    stopsTimelineEl.innerHTML = `
      <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center space-y-1 text-xs">
        <i data-lucide="alert-triangle" class="w-6 h-6 text-red-500 mx-auto"></i>
        <h4 class="font-bold">โหลดข้อมูลไม่สำเร็จ</h4>
        <p>${error.message}</p>
        <button onclick="loadItinerary()" class="mt-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">ลองใหม่</button>
      </div>
    `;
    lucide.createIcons();
  }
}

// Render Header
function renderEventHeader() {
  if (!itineraryData || !itineraryData.event) return;
  const evt = itineraryData.event;
  if (eventTitleEl) eventTitleEl.textContent = evt.title || 'กำหนดการเดินทาง';
  if (eventSubtitleEl) eventSubtitleEl.textContent = evt.subtitle || '';
  if (eventDressCodeEl) eventDressCodeEl.textContent = evt.dressCode || '-';
}

// Render Compact Segmented Day Tabs
function renderDaysTabs() {
  if (!itineraryData || !itineraryData.days) return;
  const days = itineraryData.days;

  daysTabsContainer.innerHTML = days.map((day, idx) => {
    const isActive = idx === activeDayIndex;
    // Short date representation for mobile
    const shortDayName = day.dayName ? day.dayName.replace('วันพุธที่', 'พ.').replace('วันอังคารที่', 'อ.').replace('วันพฤหัสบดีที่', 'พฤ.').replace('วันศุกร์ที่', 'ศ.').replace('วันจันทร์ที่', 'จ.') : `วันที่ ${idx + 1}`;

    return `
      <button onclick="switchDay(${idx})" 
        class="py-1.5 px-2 rounded-lg text-xs font-bold transition text-center flex flex-col items-center justify-center ${
          isActive 
            ? 'bg-blue-600 text-white shadow-xs' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        }">
        <span class="leading-tight truncate max-w-full">${shortDayName}</span>
        <span class="text-3xs font-medium opacity-80 mt-0.5">${day.stops ? day.stops.length : 0} จุดหมาย</span>
      </button>
    `;
  }).join('');

  lucide.createIcons();
}

function switchDay(index) {
  activeDayIndex = index;
  allExpanded = false;
  btnToggleAllText.textContent = 'ขยายทุกจุด';
  renderDaysTabs();
  renderCurrentDay();
}

// Render Current Day Details & Stops
function renderCurrentDay() {
  if (!itineraryData || !itineraryData.days || !itineraryData.days[activeDayIndex]) return;
  const currentDay = itineraryData.days[activeDayIndex];

  currentDayTitleEl.textContent = currentDay.dayName;
  currentDayRouteEl.innerHTML = `
    <i data-lucide="navigation" class="w-2.5 h-2.5 mr-1 shrink-0 text-sky-300"></i>
    <span class="truncate">${currentDay.route || '-'}</span>
  `;
  if (currentDayStartTimeEl) currentDayStartTimeEl.textContent = currentDay.startTime || '08:30';

  renderStopsList(currentDay.stops || []);
}

// Filter and render compact stops
function renderStopsList(stops) {
  let filtered = stops;
  if (activeCategory !== 'all') {
    filtered = filtered.filter(s => s.category === activeCategory);
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(s => 
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.location && s.location.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.highlights && s.highlights.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    stopsTimelineEl.innerHTML = `
      <div class="bg-white rounded-xl p-6 text-center text-slate-400 border border-slate-200 text-xs space-y-1">
        <i data-lucide="search-x" class="w-6 h-6 mx-auto text-slate-300"></i>
        <p class="font-medium text-slate-600">ไม่พบกิจกรรมที่ค้นหา</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  stopsTimelineEl.innerHTML = filtered.map((stop, index) => {
    const cat = getCategoryInfo(stop.category);
    const googleMapUrl = stop.mapUrl && stop.mapUrl.trim() !== '' 
      ? stop.mapUrl 
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.location || stop.title)}`;
    
    const cleanPhone = (stop.coordinatorPhone || '').replace(/[^0-9+]/g, '');

    return `
      <div class="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition hover:border-slate-300">
        
        <!-- Compact Stop Main Card -->
        <div class="p-3 cursor-pointer select-none" onclick="toggleDetails('${stop.id}')">
          
          <!-- Top Row: Time, Category & Duration -->
          <div class="flex items-center justify-between gap-1 mb-1.5">
            <div class="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <!-- Time Badge -->
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-900 text-white tracking-tight">
                ${stop.timeStart} – ${stop.timeEnd} น.
              </span>
              <!-- Category Badge -->
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-3xs font-semibold ${cat.color}">
                ${stop.categoryName || cat.label}
              </span>
            </div>

            <div class="flex items-center space-x-1 shrink-0 text-3xs text-slate-500 font-medium">
              <span>⏱️ ${stop.durationMinutes}น.</span>
              ${stop.travelMinutes > 0 ? `
                <span class="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                  🚗 ~${stop.travelMinutes}น.
                </span>
              ` : ''}
            </div>
          </div>

          <!-- Title -->
          <h4 class="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
            ${stop.title}
          </h4>

          <!-- Location preview -->
          <div class="text-2xs text-slate-500 flex items-center gap-1 mt-1">
            <i data-lucide="map-pin" class="w-3 h-3 text-rose-500 shrink-0"></i>
            <span class="truncate">${stop.location || 'ตามกำหนดการ'}</span>
          </div>

          <!-- Quick Action Buttons Strip -->
          <div class="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 gap-1.5" onclick="event.stopPropagation()">
            <div class="flex items-center space-x-1.5 min-w-0">
              <!-- Google Maps Button -->
              <a href="${googleMapUrl}" target="_blank" rel="noopener noreferrer"
                class="action-tap inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-2xs font-semibold border border-blue-200 transition">
                <i data-lucide="navigation" class="w-3 h-3 mr-1 text-blue-600"></i>
                <span>แผนที่</span>
              </a>

              <!-- Call Button -->
              ${stop.coordinatorPhone ? `
                <a href="tel:${cleanPhone}" 
                  class="action-tap inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-2xs font-semibold border border-emerald-200 transition">
                  <i data-lucide="phone" class="w-3 h-3 mr-1 text-emerald-600"></i>
                  <span>โทร</span>
                </a>
              ` : ''}
            </div>

            <!-- Details toggle button -->
            <button onclick="toggleDetails('${stop.id}')"
              class="text-2xs text-slate-500 hover:text-slate-800 flex items-center space-x-0.5 font-medium px-1.5 py-1 rounded transition">
              <span>รายละเอียด</span>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 transition-transform duration-200" id="chevron-${stop.id}"></i>
            </button>
          </div>

        </div>

        <!-- Compact Expandable Details Section -->
        <div id="details-${stop.id}" class="card-details ${allExpanded ? 'open' : ''} border-t border-slate-100 bg-slate-50/80">
          <div class="p-3 space-y-2 text-2xs sm:text-xs">
            
            <!-- Description -->
            ${stop.description ? `
              <div class="bg-white p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                <div class="font-bold text-slate-700 flex items-center text-3xs uppercase tracking-wider">
                  <i data-lucide="check-circle" class="w-3 h-3 mr-1 text-blue-600"></i>
                  กิจกรรมและภารกิจ
                </div>
                ${formatRichText(stop.description, 'blue')}
              </div>
            ` : ''}

            <!-- Highlights -->
            ${stop.highlights ? `
              <div class="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 space-y-0.5">
                <div class="font-bold text-amber-800 flex items-center text-3xs uppercase tracking-wider">
                  <i data-lucide="sparkles" class="w-3 h-3 mr-1 text-amber-600"></i>
                  ไฮไลต์สำคัญ (Highlights)
                </div>
                ${formatRichText(stop.highlights, 'amber')}
              </div>
            ` : ''}

            <!-- Coordinator Full Info -->
            ${(stop.coordinatorName || stop.coordinatorPhone) ? `
              <div class="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="text-3xs uppercase text-slate-400 font-bold">ผู้ประสานงานประจำจุด</div>
                  <div class="text-xs font-semibold text-slate-800 truncate">${stop.coordinatorName || '-'}</div>
                </div>
                ${stop.coordinatorPhone ? `
                  <a href="tel:${cleanPhone}" class="action-tap px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-2xs flex items-center shrink-0">
                    <i data-lucide="phone-call" class="w-3 h-3 mr-1"></i>
                    ${stop.coordinatorPhone}
                  </a>
                ` : ''}
              </div>
            ` : ''}

            <!-- Notes -->
            ${stop.notes ? `
              <div class="text-slate-600 bg-slate-100 p-2 rounded-lg text-3xs leading-relaxed flex items-start space-x-1">
                <i data-lucide="info" class="w-3 h-3 text-slate-400 shrink-0 mt-0.5"></i>
                <div><strong class="text-slate-700">หมายเหตุ:</strong> ${stop.notes}</div>
              </div>
            ` : ''}

          </div>
        </div>

      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// Toggle individual stop details accordion
function toggleDetails(stopId) {
  const detailsEl = document.getElementById(`details-${stopId}`);
  const chevronEl = document.getElementById(`chevron-${stopId}`);
  if (!detailsEl) return;

  const isOpen = detailsEl.classList.contains('open');
  if (isOpen) {
    detailsEl.classList.remove('open');
    if (chevronEl) chevronEl.style.transform = 'rotate(0deg)';
  } else {
    detailsEl.classList.add('open');
    if (chevronEl) chevronEl.style.transform = 'rotate(180deg)';
  }
}

// Toggle all details open/close
btnToggleAll.addEventListener('click', () => {
  allExpanded = !allExpanded;
  const detailPanels = document.querySelectorAll('.card-details');
  const chevrons = document.querySelectorAll('[id^="chevron-"]');

  detailPanels.forEach(p => {
    if (allExpanded) p.classList.add('open');
    else p.classList.remove('open');
  });

  chevrons.forEach(c => {
    c.style.transform = allExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
  });

  btnToggleAllText.textContent = allExpanded ? 'ย่อทุกจุด' : 'ขยายทุกจุด';
});

// Category filter button clicks
categoryFilterContainer.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;

  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('bg-blue-600', 'text-white', 'shadow-2xs');
    b.classList.add('bg-white', 'text-slate-700', 'border', 'border-slate-200');
  });

  btn.classList.add('bg-blue-600', 'text-white', 'shadow-2xs');
  btn.classList.remove('bg-white', 'text-slate-700', 'border');

  activeCategory = btn.dataset.category;
  renderCurrentDay();
});

// Search input handling
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderCurrentDay();
});

// Share / Copy Link
btnShare.addEventListener('click', async () => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: itineraryData?.event?.title || 'กำหนดการเดินทาง สจด.',
        text: 'ดูกำหนดการเดินทางตรวจราชการ สจด.',
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast('คัดลอกลิงก์เรียบร้อยแล้ว');
    }
  } catch (err) {
    showToast('คัดลอกลิงก์เรียบร้อยแล้ว');
  }
});

// Print
btnPrint.addEventListener('click', () => {
  document.querySelectorAll('.card-details').forEach(p => p.classList.add('open'));
  setTimeout(() => {
    window.print();
  }, 100);
});

// Initial boot
document.addEventListener('DOMContentLoaded', () => {
  loadItinerary();
});
