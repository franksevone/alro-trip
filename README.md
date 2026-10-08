# 🗺️ ระบบ Web App กำหนดการเดินทางตรวจราชการ (สจด.)

เว็บแอปพลิเคชันกำหนดการเดินทางตรวจราชการ ผส.จด. (สำนักงานจัดรูปที่ดินกลาง กรมชลประทาน)  
ระหว่างวันที่ **27 – 28 ตุลาคม 2569** (สุพรรณบุรี • ชัยนาท • สิงห์บุรี • อ่างทอง)

---

## 🔗 ลิงก์เข้าใช้งานออนไลน์ (เข้าดูได้จากทุกที่ทั่วโลก ไม่ติด Error 403)

| รูปแบบการแสดงผล | ลิงก์ออนไลน์ (Vercel) | ลิงก์สำรอง (GitHub Pages) |
| :--- | :--- | :--- |
| 🗺️ **แผนที่การเดินทาง (การ์ตูน แตะดูจุด/นำทาง)** | [https://alro-trip.vercel.app/map](https://alro-trip.vercel.app/map) | [https://franksevone.github.io/alro-trip/map.html](https://franksevone.github.io/alro-trip/map.html) |
| 📱 **แบบรายการกระชับ (Mobile-First)** | [https://alro-trip.vercel.app](https://alro-trip.vercel.app) | [https://franksevone.github.io/alro-trip/](https://franksevone.github.io/alro-trip/) |
| 🔒 **ระบบจัดการหลังบ้าน (PIN: `7589`)** | [https://alro-trip.vercel.app/admin](https://alro-trip.vercel.app/admin) | [https://franksevone.github.io/alro-trip/admin.html](https://franksevone.github.io/alro-trip/admin.html) |

---

## 🌟 ฟังก์ชันเด่น

* **หน้าแผนที่การเดินทาง (`/map`):**
  * ดีไซน์ Infographic การ์ตูนน่ารัก สีสันสดใสตามประเภทกิจกรรม
  * แตะที่แต่ละจุดเพื่อเปิด Pop-up ดูรายละเอียดภารกิจ ไฮไลต์ และสถานที่
  * ปุ่มโทรด่วนหาผู้ประสานงานประจำจุด
  * ปุ่มนำทางเปิดในแอป **Google Maps** ทันที
* **หน้าแบบกระชับ (`/`):**
  * ตรวจดูไทม์ไลน์โดยรวมแบบรวดเร็ว มีตัวกรองหมวดหมู่ และช่องค้นหา
* **ระบบหลังบ้าน (`/admin`):**
  * ป้องกันด้วยรหัส PIN แป้นโทรศัพท์ **`7589`**
  * ปรับแก้เวลา, กิจกรรม, เบอร์โทรศัพท์, แนบลิงก์ Google Maps
  * คำนวณเวลาการเดินทางและกิจกรรมอัตโนมัติ

---

## 🚀 การเปิดใช้งานในเครื่องคอมพิวเตอร์ (Local)
ดับเบิลคลิกไฟล์ `start-app.bat` หรือรัน:
```bash
npm start
```
เปิดใช้งานผ่านเบราว์เซอร์: `http://localhost:3000`

---

## 🎨 กำหนดการ 3D Infographic & ชุดคำสั่ง AI (Prompts)
* รวมคู่มือและชุดคำสั่ง (Prompt) สำหรับสั่ง AI (Midjourney / DALL-E / Gemini) เจนภาพ 3D Lemon8 Timeline Infographic
* อ่านคู่มือฉบับเต็มได้ที่: [คู่มือ_Prompt_กำหนดการ_3D.md](./คู่มือ_Prompt_กำหนดการ_3D.md)
* ภาพตัวอย่างในโฟลเดอร์: `public/images/3d/`

---

*ดูเอกสารสรุปฉบับเต็มได้ที่ไฟล์ [สรุปโปรเจกต์_กำหนดการเดินทาง.md](./สรุปโปรเจกต์_กำหนดการเดินทาง.md)*
