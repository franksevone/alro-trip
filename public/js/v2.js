// Version 2: Infographic Style matching 28 บ่าย.jpg & 28 เช้า.jpg
let itineraryData = null;
let activeDayIndex = 0;

const v2DaysTabs = document.getElementById('v2DaysTabs');
const v2CurrentDayTitle = document.getElementById('v2CurrentDayTitle');
const v2StartTime = document.getElementById('v2StartTime');
const v2TimelineFeed = document.getElementById('v2TimelineFeed');

// Node icon helper based on category/keywords
function getNodeStyle(category, title = '') {
  const t = title.toLowerCase();
  if (category === 'travel' || t.includes('ออกเดินทาง') || t.includes('เดินทาง')) {
    return { icon: 'car', bg: 'bg-[#0284c7] text-white', label: 'เดินทาง' };
  }
  if (category === 'inspection' || t.includes('ตรวจงาน') || t.includes('ก่อสร้าง')) {
    return { icon: 'hard-hat', bg: 'bg-[#15803d] text-white', label: 'ตรวจงาน' };
  }
  if (category === 'meeting' || t.includes('ประชุม') || t.includes('บรรยาย')) {
    return { icon: 'users', bg: 'bg-[#1e3a8a] text-white', label: 'ประชุม' };
  }
  if (category === 'meal' || t.includes('อาหาร') || t.includes('รับประทาน')) {
    return { icon: 'utensils', bg: 'bg-[#d97706] text-white', label: 'อาหาร' };
  }
  if (category === 'sightseeing' || t.includes('สักการะ') || t.includes('วัด') || t.includes('หลวงพ่อ')) {
    return { icon: 'sparkles', bg: 'bg-[#7e22ce] text-white', label: 'สิริมงคล' };
  }
  if (category === 'visit' || t.includes('ตรวจเยี่ยม') || t.includes('สจจ')) {
    return { icon: 'building-2', bg: 'bg-[#0f766e] text-white', label: 'ตรวจเยี่ยม' };
  }
  return { icon: 'map-pin', bg: 'bg-[#0369a1] text-white', label: 'จุดหมาย' };
}

// Load data
async function loadV2Data() {
  try {
    const res = await fetch('/api/itinerary');
    if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลได้');
    itineraryData = await res.json();
    renderV2Tabs();
    renderV2CurrentDay();
  } catch (error) {
    v2TimelineFeed.innerHTML = `
      <div class="text-center p-6 text-red-600 text-xs">
        <p>เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}</p>
      </div>
    `;
  }
}

// Render Tabs
function renderV2Tabs() {
  if (!itineraryData || !itineraryData.days) return;
  v2DaysTabs.innerHTML = itineraryData.days.map((day, idx) => {
    const isActive = idx === activeDayIndex;
    const shortName = day.dayName ? day.dayName.replace('วันพุธที่', 'พ.').replace('วันอังคารที่', 'อ.').replace('วันพฤหัสบดีที่', 'พฤ.') : `วันที่ ${idx + 1}`;
    return `
      <button onclick="switchV2Day(${idx})" 
        class="py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
          isActive 
            ? 'bg-[#0a2350] text-amber-300 shadow-md ring-2 ring-amber-400' 
            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
        }">
        <i data-lucide="calendar" class="w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}"></i>
        <span>${shortName}</span>
      </button>
    `;
  }).join('');
  lucide.createIcons();
}

function switchV2Day(index) {
  activeDayIndex = index;
  renderV2Tabs();
  renderV2CurrentDay();
}

// Render Infographic Timeline Feed
function renderV2CurrentDay() {
  if (!itineraryData || !itineraryData.days || !itineraryData.days[activeDayIndex]) return;
  const day = itineraryData.days[activeDayIndex];

  v2CurrentDayTitle.textContent = day.dayName || 'กำหนดการ';
  v2StartTime.textContent = day.startTime || '08:30';

  const stops = day.stops || [];

  if (stops.length === 0) {
    v2TimelineFeed.innerHTML = `<p class="text-center text-slate-400 py-6 text-xs">ไม่มีรายการกำหนดการ</p>`;
    return;
  }

  v2TimelineFeed.innerHTML = `
    <div class="relative space-y-4">
      
      <!-- Continuous vertical connector stem -->
      <div class="absolute left-[84px] sm:left-[112px] top-6 bottom-6 line-stem -translate-x-1/2 z-0 hidden xs:block"></div>

      ${stops.map((stop, index) => {
        const node = getNodeStyle(stop.category, stop.title);
        const timeDisplay = `${stop.timeStart} – ${stop.timeEnd} น.`;
        const googleMapUrl = stop.mapUrl && stop.mapUrl.trim() !== '' 
          ? stop.mapUrl 
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.location || stop.title)}`;
        const cleanPhone = (stop.coordinatorPhone || '').replace(/[^0-9+]/g, '');

        return `
          <div class="relative z-10 flex flex-col xs:flex-row items-start gap-2.5 sm:gap-3.5 group">
            
            <!-- Left: Time Capsule Pill (Infographic style) -->
            <div class="shrink-0 w-full xs:w-[72px] sm:w-[94px] text-left xs:text-right pt-0.5">
              <span class="inline-block px-2 sm:px-2.5 py-1 rounded-full capsule-time text-2xs sm:text-xs font-bold tracking-tight text-center whitespace-nowrap">
                ${stop.timeStart} – ${stop.timeEnd} น.
              </span>
            </div>

            <!-- Center: Node Icon Badge -->
            <div class="hidden xs:flex shrink-0 w-8 h-8 rounded-full ${node.bg} node-circle items-center justify-center text-white z-10">
              <i data-lucide="${node.icon}" class="w-4 h-4"></i>
            </div>

            <!-- Right: Content Card (Styled matching 28 บ่าย.jpg and 28 เช้า.jpg) -->
            <div class="flex-1 bg-slate-50 hover:bg-slate-100/90 rounded-xl p-3 border border-slate-200 shadow-2xs transition-all w-full">
              
              <!-- Title with category dot -->
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  ${stop.title}
                </h3>
                <span class="text-3xs text-slate-400 shrink-0 font-medium pt-0.5">
                  ⏱️ ${stop.durationMinutes}น.
                </span>
              </div>

              <!-- Location line -->
              <div class="text-2xs text-slate-600 flex items-center space-x-1 mt-1">
                <i data-lucide="map-pin" class="w-3 h-3 text-rose-500 shrink-0"></i>
                <span class="line-clamp-1">${stop.location || 'สถานที่ตามกำหนดการ'}</span>
              </div>

              <!-- Sub-description bullets (like - ฟังบรรยายสรุป, - ตรวจงาน) -->
              ${stop.description ? `
                <div class="mt-1.5 text-2xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200/80 leading-relaxed">
                  ${stop.description}
                </div>
              ` : ''}

              <!-- Highlights if any -->
              ${stop.highlights ? `
                <div class="mt-1.5 text-2xs text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200 leading-relaxed flex items-start space-x-1">
                  <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5"></i>
                  <div><strong class="font-bold text-amber-950">ไฮไลต์:</strong> ${stop.highlights}</div>
                </div>
              ` : ''}

              <!-- Quick Action Toolbar -->
              <div class="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60 text-2xs">
                <div class="flex items-center space-x-2">
                  <a href="${googleMapUrl}" target="_blank" rel="noopener noreferrer" 
                    class="inline-flex items-center text-blue-700 hover:text-blue-900 font-bold bg-blue-100/80 hover:bg-blue-200 px-2 py-0.5 rounded-md transition">
                    <i data-lucide="navigation" class="w-3 h-3 mr-1 text-blue-600"></i>
                    แผนที่
                  </a>

                  ${stop.coordinatorPhone ? `
                    <a href="tel:${cleanPhone}" 
                      class="inline-flex items-center text-emerald-800 hover:text-emerald-950 font-bold bg-emerald-100/80 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition">
                      <i data-lucide="phone" class="w-3 h-3 mr-1 text-emerald-600"></i>
                      โทร ${stop.coordinatorPhone}
                    </a>
                  ` : ''}
                </div>

                ${stop.travelMinutes > 0 ? `
                  <span class="text-3xs text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                    🚗 ต่อไป ~${stop.travelMinutes}น.
                  </span>
                ` : ''}
              </div>

            </div>

          </div>
        `;
      }).join('')}

    </div>
  `;

  lucide.createIcons();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadV2Data();
});
