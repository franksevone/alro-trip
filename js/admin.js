// State
let itineraryData = null;
let activeDayIndex = 0;
let isDirty = false;

// DOM Elements
const inputEventTitle = document.getElementById('inputEventTitle');
const inputEventSubtitle = document.getElementById('inputEventSubtitle');
const inputEventDressCode = document.getElementById('inputEventDressCode');
const inputEventNotes = document.getElementById('inputEventNotes');
const globalSettingsContent = document.getElementById('globalSettingsContent');
const chevronGlobal = document.getElementById('chevronGlobal');

const adminDayTabs = document.getElementById('adminDayTabs');
const inputDayName = document.getElementById('inputDayName');
const inputDayRoute = document.getElementById('inputDayRoute');
const inputDayDate = document.getElementById('inputDayDate');
const inputDayStartTime = document.getElementById('inputDayStartTime');
const chkAutoCalculate = document.getElementById('chkAutoCalculate');
const btnRecalculateNow = document.getElementById('btnRecalculateNow');

const stopsCountLabel = document.getElementById('stopsCountLabel');
const adminStopsList = document.getElementById('adminStopsList');
const btnAddDay = document.getElementById('btnAddDay');
const btnDeleteCurrentDay = document.getElementById('btnDeleteCurrentDay');
const btnAddStop = document.getElementById('btnAddStop');
const btnSaveAll = document.getElementById('btnSaveAll');
const btnSaveBottom = document.getElementById('btnSaveBottom');
const saveStatus = document.getElementById('saveStatus');

const btnExportJson = document.getElementById('btnExportJson');
const inputImportJson = document.getElementById('inputImportJson');
const btnResetDefault = document.getElementById('btnResetDefault');
const toastEl = document.getElementById('toast');
const toastMsgEl = document.getElementById('toastMsg');

// Toast notification helper
function showToast(msg, isSuccess = true) {
  toastMsgEl.textContent = msg;
  toastEl.className = `fixed bottom-5 right-5 z-50 transform transition-all duration-300 ${
    isSuccess ? 'bg-slate-900 text-white' : 'bg-red-900 text-white'
  } px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center space-x-2`;
  toastEl.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toastEl.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

function setDirty(dirty = true) {
  isDirty = dirty;
  if (isDirty) {
    saveStatus.textContent = '● มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก';
    saveStatus.className = 'text-xs text-amber-500 font-semibold';
  } else {
    saveStatus.textContent = '✓ บันทึกข้อมูลล่าสุดแล้ว';
    saveStatus.className = 'text-xs text-emerald-600 font-medium';
  }
}

// Time Helpers
function timeToMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return 8 * 60; // default 08:00
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function minutesToTime(totalMinutes) {
  const normalized = (totalMinutes % (24 * 60) + (24 * 60)) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Automatic Calculation Engine
function recalculateCurrentDayTimeline() {
  if (!itineraryData || !itineraryData.days || !itineraryData.days[activeDayIndex]) return;
  const day = itineraryData.days[activeDayIndex];
  if (!day.stops || day.stops.length === 0) return;

  const autoCalc = chkAutoCalculate.checked;
  if (!autoCalc) return;

  let currentMinutes = timeToMinutes(day.startTime || '08:30');

  day.stops.forEach((stop) => {
    const dur = parseInt(stop.durationMinutes, 10) || 30;
    const travel = parseInt(stop.travelMinutes, 10) || 0;

    if (stop.isFixedTime) {
      // Keep user's fixed start & end time
      currentMinutes = timeToMinutes(stop.timeEnd || stop.timeStart) + travel;
    } else {
      stop.timeStart = minutesToTime(currentMinutes);
      stop.timeEnd = minutesToTime(currentMinutes + dur);
      currentMinutes += dur + travel;
    }
  });

  setDirty(true);
}

// Load data
async function loadData() {
  try {
    let res = null;
    const candidatePaths = ['/api/itinerary', 'api/itinerary', './data/itinerary.json', 'data/itinerary.json', '/data/itinerary.json'];
    for (const p of candidatePaths) {
      try {
        const r = await fetch(p + '?t=' + Date.now());
        if (r && r.ok) {
          res = r;
          break;
        }
      } catch (e) {}
    }

    if (res && res.ok) {
      itineraryData = await res.json();
      try { localStorage.setItem('alro_itinerary_custom', JSON.stringify(itineraryData)); } catch (e) {}
    } else {
      // Fallback to localStorage if offline
      const localSaved = localStorage.getItem('alro_itinerary_custom');
      if (localSaved) {
        itineraryData = JSON.parse(localSaved);
      } else {
        throw new Error('ไม่สามารถโหลดข้อมูลกำหนดการได้');
      }
    }

    populateGlobalSettings();
    renderDayTabs();
    populateCurrentDay();
    setDirty(false);
  } catch (error) {
    showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message, false);
  }
}

// Save data
async function saveData() {
  try {
    // Collect global values
    updateGlobalSettingsFromInputs();
    updateCurrentDayFromInputs();

    // Recalculate if enabled
    if (chkAutoCalculate.checked) {
      recalculateCurrentDayTimeline();
    }

    // Always backup to localStorage
    try { localStorage.setItem('alro_itinerary_custom', JSON.stringify(itineraryData)); } catch(e) {}

    let backendSaved = false;
    let gitSyncMessage = '';
    const saveEndpoints = ['/api/itinerary', 'api/itinerary'];
    for (const ep of saveEndpoints) {
      try {
        const r = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itineraryData)
        });
        if (r && r.ok) {
          const resData = await r.json();
          backendSaved = true;
          if (resData.gitSync) {
            gitSyncMessage = ' และส่งขึ้น GitHub เรียบร้อยแล้ว! 🚀';
          }
          break;
        }
      } catch (e) {}
    }

    if (backendSaved) {
      showToast('บันทึกข้อมูล' + (gitSyncMessage || 'เรียบร้อยแล้ว'));
    } else {
      // Online mode: check if GitHub token is configured
      const token = localStorage.getItem('alro_github_token');
      if (token) {
        showToast('กำลังส่งข้อมูลขึ้น GitHub API...', true);
        const res = await saveToGitHubApi(token);
        if (res.success) {
          showToast('บันทึกและส่งขึ้น GitHub ผ่าน API เรียบร้อยแล้ว! 🚀');
        } else {
          showToast('บันทึกในเครื่องแล้ว (GitHub API: ' + res.error + ')', false);
        }
      } else {
        showToast('บันทึกในเครื่องเรียบร้อยแล้ว (หากเปิดผ่าน GitHub Pages ให้ใช้ปุ่มซิงค์หรือดาวน์โหลด JSON)');
      }
    }

    setDirty(false);
    renderStops();
    checkSyncEnvironment();
  } catch (error) {
    showToast('บันทึกไม่สำเร็จ: ' + error.message, false);
  }
}

// Reset to default
async function resetDefault() {
  if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการคืนค่ากำหนดการเริ่มต้น? การแก้ไขที่ยังไม่ได้บันทึกจะสูญหาย')) return;
  try {
    localStorage.removeItem('alro_itinerary_custom');
    let res = null;
    const candidatePaths = ['api/itinerary/reset', './data/itinerary.json', 'data/itinerary.json'];
    for (const p of candidatePaths) {
      try {
        const r = await fetch(p, { method: p.includes('reset') ? 'POST' : 'GET' });
        if (r && r.ok) {
          const d = await r.json();
          itineraryData = d.data || d;
          res = r;
          break;
        }
      } catch (e) {}
    }
    if (!itineraryData) throw new Error('คืนค่าไม่สำเร็จ');
    activeDayIndex = 0;
    populateGlobalSettings();
    renderDayTabs();
    populateCurrentDay();
    showToast('คืนค่าข้อมูลเริ่มต้นเรียบร้อยแล้ว');
    setDirty(false);
  } catch (error) {
    showToast('เกิดข้อผิดพลาด: ' + error.message, false);
  }
}

// Global settings toggle
function toggleGlobalSettings() {
  const isHidden = globalSettingsContent.classList.contains('hidden');
  if (isHidden) {
    globalSettingsContent.classList.remove('hidden');
    chevronGlobal.style.transform = 'rotate(180deg)';
  } else {
    globalSettingsContent.classList.add('hidden');
    chevronGlobal.style.transform = 'rotate(0deg)';
  }
}

function populateGlobalSettings() {
  if (!itineraryData || !itineraryData.event) return;
  const evt = itineraryData.event;
  inputEventTitle.value = evt.title || '';
  inputEventSubtitle.value = evt.subtitle || '';
  inputEventDressCode.value = evt.dressCode || '';
  inputEventNotes.value = evt.generalNotes || '';
}

function updateGlobalSettingsFromInputs() {
  if (!itineraryData) return;
  if (!itineraryData.event) itineraryData.event = {};
  itineraryData.event.title = inputEventTitle.value;
  itineraryData.event.subtitle = inputEventSubtitle.value;
  itineraryData.event.dressCode = inputEventDressCode.value;
  itineraryData.event.generalNotes = inputEventNotes.value;
}

// Day Tabs Rendering
function renderDayTabs() {
  if (!itineraryData || !itineraryData.days) return;
  adminDayTabs.innerHTML = itineraryData.days.map((day, idx) => {
    const isActive = idx === activeDayIndex;
    return `
      <button onclick="switchAdminDay(${idx})" class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
        isActive
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
      }">
        <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
        <span>วันที่ ${idx + 1} (${day.stops ? day.stops.length : 0} จุด)</span>
      </button>
    `;
  }).join('');
  lucide.createIcons();
}

function switchAdminDay(index) {
  updateCurrentDayFromInputs();
  activeDayIndex = index;
  renderDayTabs();
  populateCurrentDay();
}

function populateCurrentDay() {
  if (!itineraryData || !itineraryData.days || !itineraryData.days[activeDayIndex]) return;
  const day = itineraryData.days[activeDayIndex];

  inputDayName.value = day.dayName || '';
  inputDayRoute.value = day.route || '';
  inputDayDate.value = day.date || '';
  inputDayStartTime.value = day.startTime || '08:30';
  chkAutoCalculate.checked = day.autoCalculate !== false;

  renderStops();
}

function updateCurrentDayFromInputs() {
  if (!itineraryData || !itineraryData.days || !itineraryData.days[activeDayIndex]) return;
  const day = itineraryData.days[activeDayIndex];

  day.dayName = inputDayName.value;
  day.route = inputDayRoute.value;
  day.date = inputDayDate.value;
  day.startTime = inputDayStartTime.value;
  day.autoCalculate = chkAutoCalculate.checked;
}

// Add new day
btnAddDay.addEventListener('click', () => {
  updateCurrentDayFromInputs();
  const newIndex = itineraryData.days.length + 1;
  const newDay = {
    id: `day-${Date.now()}`,
    date: '2026-10-29',
    dayName: `วันที่ ${newIndex} (กำหนดชื่อวัน)`,
    route: 'กำหนดเส้นทาง',
    startTime: '08:30',
    autoCalculate: true,
    stops: [
      {
        id: `stop-${Date.now()}-1`,
        title: 'จุดนัดหมายแรก',
        category: 'visit',
        categoryName: 'ตรวจเยี่ยม',
        timeStart: '08:30',
        timeEnd: '09:00',
        durationMinutes: 30,
        travelMinutes: 15,
        isFixedTime: false,
        location: 'สถานที่นัดหมาย',
        mapUrl: '',
        description: 'รายละเอียดภารกิจ',
        highlights: 'สิ่งน่าสนใจ',
        coordinatorName: 'ผู้ประสานงาน',
        coordinatorPhone: '08X-XXX-XXXX',
        notes: ''
      }
    ]
  };

  itineraryData.days.push(newDay);
  activeDayIndex = itineraryData.days.length - 1;
  renderDayTabs();
  populateCurrentDay();
  setDirty(true);
  showToast(`เพิ่มวันที่ ${newIndex} เรียบร้อยแล้ว`);
});

// Delete current day
btnDeleteCurrentDay.addEventListener('click', () => {
  if (itineraryData.days.length <= 1) {
    alert('ต้องมีกำหนดการอย่างน้อย 1 วัน ไม่สามารถลบได้');
    return;
  }
  if (!confirm(`คุณต้องการลบ "วันที่ ${activeDayIndex + 1}: ${itineraryData.days[activeDayIndex].dayName}" หรือไม่?`)) return;

  itineraryData.days.splice(activeDayIndex, 1);
  activeDayIndex = Math.max(0, activeDayIndex - 1);
  renderDayTabs();
  populateCurrentDay();
  setDirty(true);
  showToast('ลบวันดังกล่าวเรียบร้อยแล้ว');
});

// Render Stops in Editor
function renderStops() {
  if (!itineraryData || !itineraryData.days || !itineraryData.days[activeDayIndex]) return;
  const day = itineraryData.days[activeDayIndex];
  const stops = day.stops || [];

  stopsCountLabel.textContent = stops.length;

  if (stops.length === 0) {
    adminStopsList.innerHTML = `
      <div class="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-200">
        <i data-lucide="map-pin-off" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
        <p class="font-medium">ยังไม่มีจุดหมายในวันนี้</p>
        <button onclick="addNewStop()" class="mt-3 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700">
          + เพิ่มจุดแรกของวันนี้
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  adminStopsList.innerHTML = stops.map((stop, index) => {
    return `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-slate-300" id="stop-card-${index}">
        
        <!-- Stop Top Bar -->
        <div class="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          
          <!-- Order & Time overview -->
          <div class="flex items-center space-x-2.5">
            <span class="w-7 h-7 rounded-lg bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
              ${index + 1}
            </span>
            <div class="flex items-center space-x-1.5">
              <span class="text-xs font-bold bg-blue-100 text-blue-900 px-2.5 py-1 rounded-lg border border-blue-200">
                ⏰ ${stop.timeStart} – ${stop.timeEnd} น.
              </span>
              ${stop.isFixedTime ? `
                <span class="text-xs font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">
                  📌 ล็อคเวลาคงที่
                </span>
              ` : `
                <span class="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                  ⚡ คำนวณอัตโนมัติ
                </span>
              `}
            </div>
          </div>

          <!-- Action buttons (Reorder, Duplicate, Delete) -->
          <div class="flex items-center space-x-1 text-slate-500">
            <button onclick="moveStop(${index}, -1)" ${index === 0 ? 'disabled class="opacity-30 p-1.5"' : 'class="p-1.5 hover:bg-slate-200 rounded-lg transition text-slate-700"'} title="เลื่อนขึ้น">
              <i data-lucide="arrow-up" class="w-4 h-4"></i>
            </button>
            <button onclick="moveStop(${index}, 1)" ${index === stops.length - 1 ? 'disabled class="opacity-30 p-1.5"' : 'class="p-1.5 hover:bg-slate-200 rounded-lg transition text-slate-700"'} title="เลื่อนลง">
              <i data-lucide="arrow-down" class="w-4 h-4"></i>
            </button>
            <span class="text-slate-300">|</span>
            <button onclick="duplicateStop(${index})" class="p-1.5 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition text-slate-600" title="คัดลอกจุดนี้">
              <i data-lucide="copy" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteStop(${index})" class="p-1.5 hover:bg-red-100 hover:text-red-600 rounded-lg transition text-slate-600" title="ลบจุดนี้">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Stop Form Fields -->
        <div class="p-4 sm:p-5 space-y-4">
          
          <!-- Row 1: Title & Category -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-700 mb-1">
                ชื่อจุดหมาย / กิจกรรมหลัก <span class="text-red-500">*</span>
              </label>
              <input type="text" value="${escapeHtml(stop.title || '')}" oninput="updateStopField(${index}, 'title', this.value)"
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่กิจกรรม</label>
              <select onchange="updateStopCategory(${index}, this.value)" 
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                <option value="meeting" ${stop.category === 'meeting' ? 'selected' : ''}>การประชุม (Meeting)</option>
                <option value="inspection" ${stop.category === 'inspection' ? 'selected' : ''}>ลงพื้นที่ตรวจงาน (Inspection)</option>
                <option value="visit" ${stop.category === 'visit' ? 'selected' : ''}>ตรวจเยี่ยม (Visit)</option>
                <option value="meal" ${stop.category === 'meal' ? 'selected' : ''}>รับประทานอาหาร (Meal)</option>
                <option value="sightseeing" ${stop.category === 'sightseeing' ? 'selected' : ''}>สิริมงคล / นำเที่ยว (Sightseeing)</option>
                <option value="policy" ${stop.category === 'policy' ? 'selected' : ''}>มอบนโยบาย (Policy)</option>
                <option value="travel" ${stop.category === 'travel' ? 'selected' : ''}>เดินทาง (Travel)</option>
              </select>
            </div>
          </div>

          <!-- Row 2: Automatic Duration & Time Calculation Controls -->
          <div class="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
            
            <div>
              <label class="block text-xs font-bold text-emerald-950 mb-1">
                ⏱️ ระยะเวลาทำกิจกรรม (นาที)
              </label>
              <input type="number" min="5" step="5" value="${stop.durationMinutes || 30}" 
                oninput="updateStopDuration(${index}, this.value)"
                class="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-200 bg-white text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-emerald-950 mb-1">
                🚗 เดินทางไปจุดถัดไป (นาที)
              </label>
              <input type="number" min="0" step="5" value="${stop.travelMinutes || 0}" 
                oninput="updateStopTravelTime(${index}, this.value)"
                class="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-200 bg-white text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">เวลาแสดงผล (เริ่ม - สิ้นสุด)</label>
              <div class="flex items-center space-x-1">
                <input type="time" value="${stop.timeStart || '08:30'}" ${stop.isFixedTime ? '' : 'readonly'}
                  oninput="updateStopTime(${index}, 'timeStart', this.value)"
                  class="w-1/2 px-2 py-1.5 text-xs rounded-lg border border-slate-200 ${stop.isFixedTime ? 'bg-white' : 'bg-slate-100 text-slate-500'} font-semibold">
                <span>-</span>
                <input type="time" value="${stop.timeEnd || '09:00'}" ${stop.isFixedTime ? '' : 'readonly'}
                  oninput="updateStopTime(${index}, 'timeEnd', this.value)"
                  class="w-1/2 px-2 py-1.5 text-xs rounded-lg border border-slate-200 ${stop.isFixedTime ? 'bg-white' : 'bg-slate-100 text-slate-500'} font-semibold">
              </div>
            </div>

            <div class="pt-4">
              <label class="flex items-center space-x-2 cursor-pointer select-none">
                <input type="checkbox" ${stop.isFixedTime ? 'checked' : ''} onchange="toggleFixedTime(${index}, this.checked)"
                  class="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500">
                <span class="text-xs font-bold text-slate-700">📌 ล็อคเวลาเอง (ไม่คิดต่อ)</span>
              </label>
            </div>

          </div>

          <!-- Row 3: Location & Google Maps -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">ชื่อสถานที่ตั้ง</label>
              <input type="text" id="loc-input-${index}" value="${escapeHtml(stop.location || '')}" 
                oninput="updateStopField(${index}, 'location', this.value)"
                placeholder="เช่น วัดฝาโถ ต.หัวนา อ.เดิมบางนางบวช จ.สุพรรณบุรี"
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-bold text-slate-700">ลิงก์ Google Maps</label>
                <button type="button" onclick="autoGenerateMapUrl(${index})" 
                  class="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1">
                  <i data-lucide="wand-2" class="w-3 h-3"></i>
                  <span>สร้างลิงก์อัตโนมัติจากสถานที่</span>
                </button>
              </div>
              <input type="url" id="map-input-${index}" value="${escapeHtml(stop.mapUrl || '')}" 
                oninput="updateStopField(${index}, 'mapUrl', this.value)"
                placeholder="https://www.google.com/maps/search/?api=1&query=..."
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
            </div>
          </div>

          <!-- Row 4: Coordinator Details -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">ผู้ประสานงานประจำจุด</label>
              <input type="text" value="${escapeHtml(stop.coordinatorName || '')}" 
                oninput="updateStopField(${index}, 'coordinatorName', this.value)"
                placeholder="ชื่อ-สกุล หรือหน่วยงานผู้ประสาน"
                class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ (คลิกโทรออกได้)</label>
              <input type="text" value="${escapeHtml(stop.coordinatorPhone || '')}" 
                oninput="updateStopField(${index}, 'coordinatorPhone', this.value)"
                placeholder="เช่น 035-591203 หรือ 081-234-5678"
                class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
            </div>
          </div>

          <!-- Row 5: Description & Highlights -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">กิจกรรมและภารกิจ (ไปทำอะไร)</label>
              <textarea rows="2" oninput="updateStopField(${index}, 'description', this.value)"
                placeholder="อธิบายกิจกรรม วัตถุประสงค์ หรือระเบียบวาระ..."
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">${escapeHtml(stop.description || '')}</textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-amber-900 mb-1">✨ สิ่งน่าสนใจ / ไฮไลต์ (Highlights)</label>
              <textarea rows="4" oninput="updateStopField(${index}, 'highlights', this.value)"
                placeholder="จุดเด่นสถานที่ ประวัติ โบราณวัตถุ หรือเมนูอาหารแนะนำ..."
                class="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-normal leading-relaxed">${escapeHtml(stop.highlights || '')}</textarea>
              <span class="text-3xs text-amber-700/80 mt-1 block">💡 <strong>วิธีทำหัวข้อย่อย:</strong> สามารถกด Enter ขึ้นบรรทัดใหม่ และใส่ขีด <code>-</code> หรือเลข <code>1. 2.</code> ข้างหน้า เช่น <code>- อุโบสถ: รายละเอียด</code> ระบบจะจัดเป็นหัวข้อย่อยสวยงามให้อัตโนมัติ</span>
            </div>
          </div>

          <!-- Row 6: Notes -->
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">หมายเหตุ / คำแนะนำเพิ่มเติม</label>
            <input type="text" value="${escapeHtml(stop.notes || '')}" oninput="updateStopField(${index}, 'notes', this.value)"
              placeholder="เช่น เตรียมแบบแปลน, สรุปสไลด์ไม่เกิน 15 นาที, ทางหลวง 340"
              class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
          </div>

        </div>

      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// Field Updaters
function updateStopField(index, field, value) {
  const stop = itineraryData.days[activeDayIndex].stops[index];
  if (!stop) return;
  stop[field] = value;
  setDirty(true);
}

function updateStopCategory(index, catKey) {
  const stop = itineraryData.days[activeDayIndex].stops[index];
  if (!stop) return;
  stop.category = catKey;
  const catNames = {
    meeting: 'การประชุม',
    inspection: 'ลงพื้นที่ตรวจงาน',
    visit: 'ตรวจเยี่ยม',
    meal: 'อาหารกลางวัน',
    sightseeing: 'สิริมงคล',
    policy: 'มอบนโยบาย',
    travel: 'เดินทาง'
  };
  stop.categoryName = catNames[catKey] || 'ทั่วไป';
  setDirty(true);
}

function updateStopDuration(index, val) {
  const stop = itineraryData.days[activeDayIndex].stops[index];
  if (!stop) return;
  stop.durationMinutes = parseInt(val, 10) || 0;
  if (chkAutoCalculate.checked) {
    recalculateCurrentDayTimeline();
    renderStops();
  } else {
    setDirty(true);
  }
}

function updateStopTravelTime(index, val) {
  const stop = itineraryData.days[activeDayIndex].stops[index];
  if (!stop) return;
  stop.travelMinutes = parseInt(val, 10) || 0;
  if (chkAutoCalculate.checked) {
    recalculateCurrentDayTimeline();
    renderStops();
  } else {
    setDirty(true);
  }
}

function updateStopTime(index, field, val) {
  const stop = itineraryData.days[activeDayIndex].stops[index];
  if (!stop) return;
  stop[field] = val;
  setDirty(true);
}

function toggleFixedTime(index, isChecked) {
  const stop = itineraryData.days[activeDayIndex].stops[index];
  if (!stop) return;
  stop.isFixedTime = isChecked;
  if (chkAutoCalculate.checked) {
    recalculateCurrentDayTimeline();
  }
  renderStops();
  setDirty(true);
}

// Auto generate Google Maps URL
function autoGenerateMapUrl(index) {
  const stop = itineraryData.days[activeDayIndex].stops[index];
  if (!stop) return;
  const query = stop.location || stop.title || '';
  if (!query) {
    alert('กรุณากรอกชื่อสถานที่หรือชื่อจุดหมายก่อนสร้างลิงก์');
    return;
  }
  const generatedUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  stop.mapUrl = generatedUrl;
  const inputEl = document.getElementById(`map-input-${index}`);
  if (inputEl) inputEl.value = generatedUrl;
  setDirty(true);
  showToast('สร้างลิงก์ Google Maps เรียบร้อยแล้ว');
}

// Reorder Stop
function moveStop(index, direction) {
  const stops = itineraryData.days[activeDayIndex].stops;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= stops.length) return;

  const temp = stops[index];
  stops[index] = stops[targetIndex];
  stops[targetIndex] = temp;

  if (chkAutoCalculate.checked) {
    recalculateCurrentDayTimeline();
  }
  renderStops();
  setDirty(true);
}

// Duplicate Stop
function duplicateStop(index) {
  const stops = itineraryData.days[activeDayIndex].stops;
  const original = stops[index];
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = `stop-${Date.now()}`;
  copy.title = `${copy.title} (สำเนา)`;

  stops.splice(index + 1, 0, copy);
  if (chkAutoCalculate.checked) {
    recalculateCurrentDayTimeline();
  }
  renderStops();
  setDirty(true);
  showToast('คัดลอกจุดกำหนดการเรียบร้อยแล้ว');
}

// Delete Stop
function deleteStop(index) {
  const stops = itineraryData.days[activeDayIndex].stops;
  if (!confirm(`คุณต้องการลบ "${stops[index].title || 'จุดหมายนี้'}" หรือไม่?`)) return;

  stops.splice(index, 1);
  if (chkAutoCalculate.checked) {
    recalculateCurrentDayTimeline();
  }
  renderStops();
  setDirty(true);
  showToast('ลบจุดหมายเรียบร้อยแล้ว');
}

// Add New Stop
function addNewStop() {
  const stops = itineraryData.days[activeDayIndex].stops;
  const newStop = {
    id: `stop-${Date.now()}`,
    title: 'จุดหมายใหม่',
    category: 'inspection',
    categoryName: 'ลงพื้นที่ตรวจงาน',
    timeStart: '10:00',
    timeEnd: '10:45',
    durationMinutes: 45,
    travelMinutes: 15,
    isFixedTime: false,
    location: '',
    mapUrl: '',
    description: '',
    highlights: '',
    coordinatorName: '',
    coordinatorPhone: '',
    notes: ''
  };

  stops.push(newStop);
  if (chkAutoCalculate.checked) {
    recalculateCurrentDayTimeline();
  }
  renderStops();
  setDirty(true);

  // Scroll to bottom
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
  });
  showToast('เพิ่มจุดกำหนดการใหม่แล้ว');
}

btnAddStop.addEventListener('click', addNewStop);

// Manual Recalculate button
btnRecalculateNow.addEventListener('click', () => {
  updateCurrentDayFromInputs();
  recalculateCurrentDayTimeline();
  renderStops();
  showToast('คำนวณเวลาต่อเนื่องทุกจุดเรียบร้อยแล้ว');
});

// Auto-Calculate checkbox toggle
chkAutoCalculate.addEventListener('change', () => {
  updateCurrentDayFromInputs();
  if (chkAutoCalculate.checked) {
    recalculateCurrentDayTimeline();
    renderStops();
  }
  setDirty(true);
});

// Input Start Time change
inputDayStartTime.addEventListener('change', () => {
  updateCurrentDayFromInputs();
  if (chkAutoCalculate.checked) {
    recalculateCurrentDayTimeline();
    renderStops();
  }
  setDirty(true);
});

// JSON Export (Backup download)
btnExportJson.addEventListener('click', () => {
  updateGlobalSettingsFromInputs();
  updateCurrentDayFromInputs();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(itineraryData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `itinerary-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('ส่งออกไฟล์สำรอง JSON สำเร็จ');
});

// JSON Import
inputImportJson.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (!imported.days || !Array.isArray(imported.days)) {
        throw new Error('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
      }
      itineraryData = imported;
      activeDayIndex = 0;
      populateGlobalSettings();
      renderDayTabs();
      populateCurrentDay();
      setDirty(true);
      showToast('นำเข้าไฟล์ข้อมูลเรียบร้อยแล้ว (อย่าลืมกดบันทึก)');
    } catch (err) {
      alert('นำเข้าไฟล์ไม่สำเร็จ: ' + err.message);
    }
  };
  reader.readAsText(file);
});

// Reset Default
btnResetDefault.addEventListener('click', resetDefault);

// Save buttons
btnSaveAll.addEventListener('click', saveData);
btnSaveBottom.addEventListener('click', saveData);

// Prevent accidental navigation when unsaved
window.addEventListener('beforeunload', (e) => {
  if (isDirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Escape HTML helper
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// PIN Protection (Phone Keypad)
const CORRECT_PIN = '7589';
let enteredPin = '';
const pinLockScreen = document.getElementById('pinLockScreen');
const pinDotsContainer = document.getElementById('pinDotsContainer');

function checkAuthStatus() {
  const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
  if (isAuth && pinLockScreen) {
    pinLockScreen.classList.add('opacity-0', 'pointer-events-none');
  } else if (pinLockScreen) {
    pinLockScreen.classList.remove('opacity-0', 'pointer-events-none');
    clearPin();
  }
}

function updatePinDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`dot-${i}`);
    if (!dot) continue;
    if (i < enteredPin.length) {
      dot.className = 'w-4 h-4 rounded-full border-2 border-emerald-400 bg-emerald-400 transition-all scale-110 shadow-xs shadow-emerald-400/50';
    } else {
      dot.className = 'w-4 h-4 rounded-full border-2 border-slate-600 bg-transparent transition-all';
    }
  }
}

function pressPin(digit) {
  if (enteredPin.length >= 4) return;
  enteredPin += digit;
  updatePinDots();

  if (enteredPin.length === 4) {
    verifyPin();
  }
}

function backspacePin() {
  if (enteredPin.length > 0) {
    enteredPin = enteredPin.slice(0, -1);
    updatePinDots();
  }
}

function clearPin() {
  enteredPin = '';
  updatePinDots();
}

function verifyPin() {
  if (enteredPin === CORRECT_PIN) {
    // Success
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`dot-${i}`);
      if (dot) dot.className = 'w-4 h-4 rounded-full border-2 border-emerald-300 bg-emerald-400 shadow-md shadow-emerald-500/50';
    }
    sessionStorage.setItem('admin_authenticated', 'true');
    setTimeout(() => {
      if (pinLockScreen) pinLockScreen.classList.add('opacity-0', 'pointer-events-none');
      showToast('ปลดล็อคสำเร็จ ยินดีต้อนรับเข้าสู่ระบบหลังบ้าน');
    }, 200);
  } else {
    // Failed - Shake animation
    if (pinDotsContainer) pinDotsContainer.classList.add('shake');
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`dot-${i}`);
      if (dot) dot.className = 'w-4 h-4 rounded-full border-2 border-rose-500 bg-rose-500 transition-all';
    }
    showToast('รหัสผ่านไม่ถูกต้อง (กรุณาลองใหม่)', false);

    setTimeout(() => {
      if (pinDotsContainer) pinDotsContainer.classList.remove('shake');
      clearPin();
    }, 500);
  }
}

function lockAdmin() {
  sessionStorage.removeItem('admin_authenticated');
  clearPin();
  if (pinLockScreen) pinLockScreen.classList.remove('opacity-0', 'pointer-events-none');
}

// Physical keyboard support
window.addEventListener('keydown', (e) => {
  if (!pinLockScreen || pinLockScreen.classList.contains('pointer-events-none')) return;
  if (e.key >= '0' && e.key <= '9') {
    pressPin(e.key);
  } else if (e.key === 'Backspace') {
    backspacePin();
  } else if (e.key === 'Escape') {
    clearPin();
  }
});

// GitHub Sync Integration & Status
let isLocalServerAvailable = false;

async function checkSyncEnvironment() {
  const badge = document.getElementById('syncStatusBadge');
  const desc = document.getElementById('syncStatusDesc');
  const icon = document.getElementById('syncStatusIcon');
  if (!badge) return;

  try {
    const res = await fetch('/api/itinerary');
    if (res && res.ok) {
      isLocalServerAvailable = true;
      badge.className = 'px-2 py-0.5 rounded-full text-3xs font-bold uppercase bg-emerald-100 text-emerald-800';
      badge.textContent = '🟢 LOCAL SERVER (AUTO GIT PUSH)';
      desc.textContent = 'เชื่อมต่อ Local Server สำเร็จ — ทุกครั้งที่คุณกด "บันทึกข้อมูล" ระบบจะ Auto-Commit & Push ขึ้น GitHub อัตโนมัติทันที!';
      if (icon) icon.className = 'w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0';
      return;
    }
  } catch (e) {}

  isLocalServerAvailable = false;
  const token = localStorage.getItem('alro_github_token');
  if (token) {
    badge.className = 'px-2 py-0.5 rounded-full text-3xs font-bold uppercase bg-blue-100 text-blue-800';
    badge.textContent = '🟢 GITHUB API CONNECTED';
    desc.textContent = 'เชื่อมต่อ GitHub API เรียบร้อย — เมื่อคุณกดบันทึก ระบบจะ Commit & Push ตรงเข้า GitHub Cloud ทันที!';
    if (icon) icon.className = 'w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0';
  } else {
    badge.className = 'px-2 py-0.5 rounded-full text-3xs font-bold uppercase bg-amber-100 text-amber-800';
    badge.textContent = '⚠️ GITHUB PAGES (ONLINE STATIC)';
    desc.textContent = 'เปิดผ่าน GitHub Pages — กรุณาคลิก "ตั้งค่า Token" เพื่อบันทึกออนไลน์ หรือกด "ดาวน์โหลด JSON" ไปอัปเดต';
    if (icon) icon.className = 'w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0';
  }
}

function toggleGithubTokenBox() {
  const box = document.getElementById('githubTokenBox');
  if (box) {
    box.classList.toggle('hidden');
    const input = document.getElementById('inputGithubToken');
    if (input && !box.classList.contains('hidden')) {
      input.value = localStorage.getItem('alro_github_token') || '';
      input.focus();
    }
  }
}

function saveGithubToken() {
  const input = document.getElementById('inputGithubToken');
  if (!input) return;
  const token = input.value.trim();
  if (token) {
    localStorage.setItem('alro_github_token', token);
    showToast('บันทึก GitHub Token เรียบร้อยแล้ว! 🔑');
    toggleGithubTokenBox();
  } else {
    localStorage.removeItem('alro_github_token');
    showToast('ลบ GitHub Token เรียบร้อยแล้ว');
  }
  checkSyncEnvironment();
}

function downloadItineraryFile() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(itineraryData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "itinerary.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('ดาวน์โหลดไฟล์ itinerary.json เรียบร้อยแล้ว! 📥');
}

async function triggerGitSync() {
  if (isLocalServerAvailable) {
    showToast('กำลังสั่งซิงค์ขึ้น GitHub...', true);
    try {
      const res = await fetch('/api/git-sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'ซิงค์ขึ้น GitHub เรียบร้อยแล้ว! 🚀');
      } else {
        showToast('การซิงค์: ' + (data.message || data.error), false);
      }
    } catch (err) {
      showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Local ได้: ' + err.message, false);
    }
  } else {
    const token = localStorage.getItem('alro_github_token');
    if (token) {
      showToast('กำลังส่งข้อมูลขึ้น GitHub API...', true);
      const res = await saveToGitHubApi(token);
      if (res.success) {
        showToast('ซิงค์ขึ้น GitHub ผ่าน API เรียบร้อยแล้ว! 🚀');
      } else {
        showToast('GitHub API Error: ' + res.error, false);
      }
    } else {
      toggleGithubTokenBox();
      showToast('กรุณากรอก GitHub Token หรือเปิดผ่าน Local Server');
    }
  }
}

async function saveToGitHubApi(token) {
  const owner = 'franksevone';
  const repo = 'alro-trip';
  const filesToUpdate = ['data/itinerary.json', 'public/data/itinerary.json'];
  const jsonContent = JSON.stringify(itineraryData, null, 2);
  const b64Content = btoa(unescape(encodeURIComponent(jsonContent)));

  for (const filePath of filesToUpdate) {
    try {
      // 1. Get current file sha on main
      const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=main`;
      const getRes = await fetch(getUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      let sha = '';
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }

      // 2. Put file to main branch
      const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Update ${filePath} from Admin Web App`,
          content: b64Content,
          sha: sha || undefined,
          branch: 'main'
        })
      });

      if (!putRes.ok) {
        const err = await putRes.json();
        return { success: false, error: err.message || 'PUT failed' };
      }

      // 3. Also update gh-pages branch
      try {
        const getGhPages = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=gh-pages`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (getGhPages.ok) {
          const ghPagesData = await getGhPages.json();
          await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `Update ${filePath} from Admin Web App`,
              content: b64Content,
              sha: ghPagesData.sha,
              branch: 'gh-pages'
            })
          });
        }
      } catch (e) {}

    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: true };
}

// Explicit global exposure
window.pressPin = pressPin;
window.backspacePin = backspacePin;
window.clearPin = clearPin;
window.lockAdmin = lockAdmin;
window.toggleGithubTokenBox = toggleGithubTokenBox;
window.saveGithubToken = saveGithubToken;
window.downloadItineraryFile = downloadItineraryFile;
window.triggerGitSync = triggerGitSync;

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  loadData();
  checkSyncEnvironment();
});
