// Interactive 3D Cartoon Journey Map (Lemon8 Style)
let itineraryData = null;

const day1Track = document.getElementById('day1Track');
const day2Track = document.getElementById('day2Track');

// Modal Elements
const stopModal = document.getElementById('stopModal');
const modalIconBox = document.getElementById('modalIconBox');
const modalTimeBadge = document.getElementById('modalTimeBadge');
const modalTitle = document.getElementById('modalTitle');
const modalLocation = document.getElementById('modalLocation');
const modalDescription = document.getElementById('modalDescription');
const modalHighlights = document.getElementById('modalHighlights');
const modalHighlightsBox = document.getElementById('modalHighlightsBox');
const modalCoordinator = document.getElementById('modalCoordinator');
const modalContactBox = document.getElementById('modalContactBox');
const modalCallBtn = document.getElementById('modalCallBtn');
const modalNotes = document.getElementById('modalNotes');
const modalNotesBox = document.getElementById('modalNotesBox');
const modalMapBtn = document.getElementById('modalMapBtn');

// Cartoon theme mapping for each stop
const cartoonThemeMap = {
  // Day 1
  'stop-1-1': { icon: '🏛️', bg: 'from-blue-100 to-sky-200', shortTitle: 'เดินทางถึง สจจ.26' },
  'stop-1-2': { icon: '👥', bg: 'from-indigo-100 to-blue-200', shortTitle: 'ประชุมสรุปผลงาน' },
  'stop-1-3': { icon: '🌾', bg: 'from-emerald-100 to-teal-200', shortTitle: 'ตรวจแปลงนาสามชุก' },
  'stop-1-4': { icon: '🚐', bg: 'from-sky-100 to-blue-200', shortTitle: 'เดินทางไปร้านอาหาร' },
  'stop-1-5': { icon: '🦐', bg: 'from-amber-100 to-orange-200', shortTitle: 'ทานกุ้งเป็น สามชุก' },
  'stop-1-6': { icon: '🚗', bg: 'from-sky-100 to-blue-200', shortTitle: 'เดินทางไปวัดฝาโถ' },
  'stop-1-7': { icon: '🛕', bg: 'from-yellow-100 to-amber-200', shortTitle: 'สักการะวัดฝาโถ' },
  'stop-1-8': { icon: '🚗', bg: 'from-teal-100 to-emerald-200', shortTitle: 'เดินทาง (12 กม.)' },
  'stop-1-9': { icon: '🦌', bg: 'from-emerald-100 to-green-200', shortTitle: 'วัดไกลกังวล & ฝูงกวาง' },
  'stop-1-10': { icon: '🚐', bg: 'from-sky-100 to-blue-200', shortTitle: 'เดินทางสู่ชัยนาท (40 กม.)' },
  'stop-1-11': { icon: '👥', bg: 'from-indigo-100 to-blue-200', shortTitle: 'ประชุม สจจ.23' },
  'stop-1-12': { icon: '🌾', bg: 'from-green-100 to-emerald-200', shortTitle: 'ตรวจโครงการบรมธาตุ' },
  'stop-1-13': { icon: '🏨', bg: 'from-purple-100 to-indigo-200', shortTitle: 'รร.ชัยนาท แกรนด์' },
  'stop-1-14': { icon: '🍲', bg: 'from-orange-100 to-amber-200', shortTitle: 'อาหารเย็น ร้านลาบเป็ด' },

  // Day 2
  'stop-2-1': { icon: '🚗', bg: 'from-sky-100 to-blue-200', shortTitle: 'ออกเดินทางจากชัยนาท' },
  'stop-2-2': { icon: '🙏', bg: 'from-amber-100 to-yellow-200', shortTitle: 'ไหว้หลวงพ่อกวย' },
  'stop-2-3': { icon: '🏛️', bg: 'from-teal-100 to-emerald-200', shortTitle: 'บรรยายสรุป สจจ.24' },
  'stop-2-4': { icon: '🌾', bg: 'from-emerald-100 to-green-200', shortTitle: 'ตรวจแปลงนาชันสูตร' },
  'stop-2-5': { icon: '🐟', bg: 'from-orange-100 to-amber-200', shortTitle: 'ร้านบ้านสวนแม่ลา' },
  'stop-2-6': { icon: '🚗', bg: 'from-sky-100 to-blue-200', shortTitle: 'เดินทางสู่ จ.อ่างทอง' },
  'stop-2-7': { icon: '🚜', bg: 'from-cyan-100 to-blue-200', shortTitle: 'ตรวจงาน ต.คำหยาด' },
  'stop-2-8': { icon: '🚐', bg: 'from-sky-100 to-blue-200', shortTitle: 'เดินทางสู่ สจจ.25' },
  'stop-2-9': { icon: '🏢', bg: 'from-indigo-100 to-blue-200', shortTitle: 'ประชุมสรุปงาน สจจ.25' },
  'stop-2-10': { icon: '🏡', bg: 'from-emerald-100 to-teal-200', shortTitle: 'เดินทางกลับโดยสวัสดิภาพ' }
};

function getCartoonInfo(stopId, category, title = '') {
  if (cartoonThemeMap[stopId]) return cartoonThemeMap[stopId];
  
  const t = title.toLowerCase();
  if (category === 'travel' || t.includes('เดินทาง')) {
    return { icon: '🚗', bg: 'from-sky-100 to-blue-200', shortTitle: 'เดินทาง' };
  }
  if (category === 'meal' || t.includes('อาหาร') || t.includes('ร้าน')) {
    return { icon: '🍲', bg: 'from-amber-100 to-orange-200', shortTitle: 'รับประทานอาหาร' };
  }
  if (category === 'sightseeing' || t.includes('วัด') || t.includes('หลวงพ่อ')) {
    return { icon: '🛕', bg: 'from-yellow-100 to-amber-200', shortTitle: 'ไหว้พระสักการะ' };
  }
  if (category === 'inspection' || t.includes('ตรวจงาน') || t.includes('โครงการ')) {
    return { icon: '🌾', bg: 'from-emerald-100 to-green-200', shortTitle: 'ลงพื้นที่ตรวจงาน' };
  }
  if (category === 'meeting' || t.includes('ประชุม') || t.includes('บรรยาย')) {
    return { icon: '👥', bg: 'from-indigo-100 to-blue-200', shortTitle: 'การประชุม' };
  }
  if (t.includes('โรงแรม') || t.includes('ที่พัก')) {
    return { icon: '🏨', bg: 'from-purple-100 to-indigo-200', shortTitle: 'เข้าที่พัก' };
  }
  return { icon: '📍', bg: 'from-slate-100 to-blue-100', shortTitle: title };
}

// Fetch itinerary
async function loadMapData() {
  try {
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
    if (!res || !res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
    itineraryData = await res.json();
    renderDay1();
    renderDay2();
  } catch (err) {
    console.error('Error loading itinerary:', err);
  }
}

// Render Day 1
function renderDay1() {
  if (!itineraryData || !itineraryData.days || !itineraryData.days[0]) return;
  const stops = itineraryData.days[0].stops || [];
  day1Track.innerHTML = stops.map((stop, idx) => renderTileHTML(stop, idx, 0)).join('');
  lucide.createIcons();
}

// Render Day 2
function renderDay2() {
  if (!itineraryData || !itineraryData.days || !itineraryData.days[1]) return;
  const stops = itineraryData.days[1].stops || [];
  day2Track.innerHTML = stops.map((stop, idx) => renderTileHTML(stop, idx, 1)).join('');
  lucide.createIcons();
}

// Tile HTML generator
function renderTileHTML(stop, idx, dayIdx = 0) {
  const cInfo = getCartoonInfo(stop.id, stop.category, stop.title);
  const stepNumber = idx + 1;

  return `
    <div class="relative flex flex-col items-center">
      
      <!-- Interactive 3D Isometric Tile -->
      <div onclick="window.openStopModal(${dayIdx}, ${idx})" 
        class="iso-tile w-full p-2 sm:p-2.5 flex flex-col items-center text-center relative overflow-hidden group">
        
        <!-- Step number badge -->
        <div class="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-slate-800 text-white text-3xs font-bold flex items-center justify-center shadow-xs">
          ${stepNumber}
        </div>

        <!-- Subtle gradient backdrop -->
        <div class="absolute inset-0 bg-gradient-to-br ${cInfo.bg} opacity-30 group-hover:opacity-50 transition pointer-events-none"></div>

        <!-- 3D Big Animated Emoji Icon Platform -->
        <div class="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white shadow-md flex items-center justify-center text-2xl sm:text-3xl border-2 border-white/80 transform group-hover:scale-110 transition duration-200 shrink-0 mb-1 mt-1">
          ${cInfo.icon}
        </div>

        <!-- Time Capsule Badge -->
        <span class="inline-block px-1.5 py-0.5 rounded-full bg-slate-900 text-white font-bold text-3xs shadow-2xs mb-0.5 whitespace-nowrap">
          ${stop.timeStart} น.
        </span>

        <!-- Short Title Label -->
        <h4 class="font-bold text-slate-800 text-3xs sm:text-2xs leading-tight line-clamp-2 px-0.5">
          ${cInfo.shortTitle || stop.title}
        </h4>

        <!-- Tap Hint -->
        <span class="text-3xs text-blue-600 font-bold mt-0.5">
          แตะดู ℹ️
        </span>
      </div>

    </div>
  `;
}

// Open Details Modal
function openStopModal(dayIndex, stopIndex) {
  if (!itineraryData || !itineraryData.days || !itineraryData.days[dayIndex]) return;
  const stop = itineraryData.days[dayIndex].stops[stopIndex];
  if (!stop) return;

  const cInfo = getCartoonInfo(stop.id, stop.category, stop.title);
  const cleanPhone = (stop.coordinatorPhone || '').replace(/[^0-9+]/g, '');
  const googleMapUrl = stop.mapUrl && stop.mapUrl.trim() !== '' 
    ? stop.mapUrl 
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.location || stop.title)}`;

  modalIconBox.textContent = cInfo.icon;
  modalTimeBadge.textContent = `${stop.timeStart} – ${stop.timeEnd} น. (⏱️ ${stop.durationMinutes} นาที)`;
  modalTitle.textContent = stop.title;
  modalLocation.textContent = stop.location || 'ตามกำหนดการ';

  modalDescription.textContent = stop.description || '-';

  if (stop.highlights && stop.highlights.trim() !== '') {
    modalHighlightsBox.classList.remove('hidden');
    modalHighlights.textContent = stop.highlights;
  } else {
    modalHighlightsBox.classList.add('hidden');
  }

  if (stop.coordinatorName || stop.coordinatorPhone) {
    modalContactBox.classList.remove('hidden');
    modalCoordinator.textContent = `${stop.coordinatorName || 'เจ้าหน้าที่'} ${stop.coordinatorPhone ? '(' + stop.coordinatorPhone + ')' : ''}`;
    if (stop.coordinatorPhone && stop.coordinatorPhone.trim() !== '' && !stop.coordinatorPhone.includes('XXX')) {
      modalCallBtn.classList.remove('hidden');
      modalCallBtn.href = `tel:${cleanPhone}`;
    } else {
      modalCallBtn.classList.remove('hidden');
      modalCallBtn.href = `tel:${cleanPhone}`;
    }
  } else {
    modalContactBox.classList.add('hidden');
  }

  if (stop.notes && stop.notes.trim() !== '') {
    modalNotesBox.classList.remove('hidden');
    modalNotes.textContent = stop.notes;
  } else {
    modalNotesBox.classList.add('hidden');
  }

  modalMapBtn.href = googleMapUrl;

  // Show modal with animation
  stopModal.classList.remove('opacity-0', 'pointer-events-none');
  const innerCard = stopModal.querySelector('div');
  innerCard.classList.remove('translate-y-12', 'sm:scale-95');
  innerCard.classList.add('translate-y-0', 'sm:scale-100');
  lucide.createIcons();
}

function closeModal() {
  const innerCard = stopModal.querySelector('div');
  innerCard.classList.add('translate-y-12', 'sm:scale-95');
  innerCard.classList.remove('translate-y-0', 'sm:scale-100');
  setTimeout(() => {
    stopModal.classList.add('opacity-0', 'pointer-events-none');
  }, 150);
}

// Click backdrop to close
stopModal.addEventListener('click', (e) => {
  if (e.target === stopModal) {
    closeModal();
  }
});

// ESC key to close
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// Explicit global exposure
window.openStopModal = openStopModal;
window.closeModal = closeModal;

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadMapData();
});
