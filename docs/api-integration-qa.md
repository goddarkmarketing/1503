# เอกสาร Q&A สำหรับทีม API — ระบบ Kladee Broker Portal

| รายการ | รายละเอียด |
|--------|------------|
| **เวอร์ชัน** | 1.0 |
| **วันที่จัดทำ** | 21 กรกฎาคม 2026 |
| **ผู้จัดทำ** | ทีมพัฒนา Frontend (Kladee Broker) |
| **สถานะ Frontend** | พร้อมเชื่อม API — ใช้ Mock อยู่ (`USE_MOCK_API: true`) |
| **Base URL ที่ Frontend คาดหวัง** | `/api/v1` |

---

## วิธีใช้เอกสารนี้

- ใช้ **ซ้อมตอบคำถาม** ก่อนประชุมกับทีม API
- ส่งให้ทีม API อ่านล่วงหน้า เพื่อลดรอบถาม-ตอบ
- ข้อที่มีเครื่องหมาย **[ยืนยัน]** ต้องให้ฝ่ายธุรกิจ/เจ้าของระบบยืนยันก่อนตอบเป็นที่สิ้นสุด
- รูปแบบ JSON และรายการ Endpoint อ้างอิงจากโค้ดจริงในโปรเจกต์

---

## 1. ภาพรวมระบบ

### Q1.1 ระบบนี้คืออะไร มีกี่ส่วน?

**คำตอบ:** ระบบโบรคเกอร์ประกันภัย **Kladee Broker** ประกอบด้วย:

| ส่วน | ผู้ใช้ | หน้าที่หลัก |
|------|--------|-------------|
| เว็บไซต์หน้าบ้าน | ลูกค้าทั่วไป | โปรโมตผลิตภัณฑ์, ข้อมูลบริษัท |
| พอร์ทัลนายหน้า (`/agent/`) | ตัวแทนประกัน | ออกกรมธรรม์, ดูรายงาน, ขอเติมวงเงิน, ค่าคอม |
| แอดมิน (`/admin/`) | ผู้ดูแลระบบ | จัดการนายหน้า, อนุมัติเติมเงิน, คอมมิชชัน, รายงาน |

Frontend พร้อมแล้ว — **รอ Backend API จริง** แล้วสลับ config เป็น `USE_MOCK_API: false`

---

### Q1.2 มีระบบเดิมอยู่แล้วหรือสร้างใหม่?

**คำตอบ:** Frontend สร้างใหม่ทั้งหมด ออกแบบให้เชื่อม REST API กลาง  
**[ยืนยัน]** มีระบบ/ฐานข้อมูลเดิมที่ต้อง migrate หรือไม่?

---

### Q1.3 เป้าหมาย Go-live / UAT?

**คำตอบ:** **[ยืนยัน]** ระบุวันที่ UAT และ Production ที่ต้องการ  
Frontend พร้อมทดสอบได้ทันทีเมื่อมี UAT URL + บัญชีทดสอบ

---

## 2. Authentication & ความปลอดภัย

### Q2.1 Login ใช้อะไร?

**คำตอบ:**

- **Username:** รหัสนายหน้า (เช่น `Ck1-039`) หรือ `admin` สำหรับแอดมิน
- **Password:** รหัสผ่าน
- **Endpoint:** `POST /api/v1/auth/login`
- **Request body:**
  ```json
  { "username": "Ck1-039", "password": "demo" }
  ```
- **Response ที่ Frontend คาดหวัง:**
  ```json
  {
    "user": {
      "id": "agent-001",
      "username": "Ck1-039",
      "role": "agent",
      "name": "สมชาย ใจดี",
      "agentCode": "Ck1-039",
      "email": "ck1039@example.com",
      "phone": "081-234-5678",
      "balance": 34531.73,
      "featurePermissions": { "compulsory-indara": true, "credit": true }
    },
    "token": "eyJhbG..."
  }
  ```

---

### Q2.2 Token แบบไหน?

**คำตอบ:** Frontend ส่ง `Authorization: Bearer {token}` ทุก request  
**[ยืนยัน]** JWT หมดอายุกี่นาที/ชั่วโมง? มี refresh token หรือไม่?

---

### Q2.3 แยก Role อย่างไร?

**คำตอบ:**

| Role | คำอธิบาย | เข้าถึง |
|------|----------|---------|
| `agent` | นายหน้า | `/agent/*` |
| `admin` | ผู้ดูแลระบบ | `/admin/*` |

- Endpoint ฝั่งแอดมินใช้ prefix `/admin/...`
- นายหน้าเรียกได้เฉพาะข้อมูลของตัวเอง (ยกเว้น admin)

**[ยืนยัน]** มี sub-role แอดมินเพิ่ม (เช่น super_admin, ops อ่านอย่างเดียว) หรือไม่?

---

### Q2.4 Domain / CORS

**คำตอบ:** **[ยืนยัน]** ระบุ domain UAT และ Production  
ตัวอย่าง: `https://portal.kladee.com`  
Frontend เรียก API จาก origin เดียวกัน (relative `/api/v1`) หรือ cross-origin — ต้องเปิด CORS ให้ domain ที่ deploy จริง

---

### Q2.5 HTTPS

**คำตอบ:** บังคับ HTTPS ทั้ง UAT และ Production

---

## 3. ข้อมูลหลัก (Master Data)

### Q3.1 รหัสนายหน้า (Agent Code)

**คำตอบ:** ใช้เป็น **username** ในการ login และแสดงในรายงาน  
ตัวอย่าง: `Ck1-039`, `Ag2-112`

---

### Q3.2 ข้อมูลนายหน้ามีอะไรบ้าง?

**คำตอบ:**

| ฟิลด์ | คำอธิบาย |
|-------|----------|
| `id` | รหัสภายในระบบ |
| `code` | รหัสนายหน้า |
| `name` | ชื่อ-นามสกุล |
| `email`, `phone` | ติดต่อ |
| `balance` | วงเงินคงเหลือ (บาท) |
| `creditLimit` | วงเงินสูงสุดที่อนุญาต |
| `status` | `active` / `suspended` |
| `featurePermissions` | สิทธิ์เมนูต่อนายหน้า (object boolean) |
| `commissionRates` | % คอมมิชชันต่อผลิตภัณฑ์ |
| `createdAt` | วันที่สร้างบัญชี |

---

### Q3.3 บริษัทประกัน (Insurers)

**คำตอบ:** รองรับในระบบ (ตามผลิตภัณฑ์ที่เปิดใช้):

| Code | ชื่อ |
|------|------|
| `indara` | อินทรประกันภัย |
| `axa` | AXA |
| `bki` | BKI กรุงเทพประกันภัย |
| `chubb` | CHUBB |
| `ergo` | เออร์โกประกันภัย |

**[ยืนยัน]** รายชื่อบริษัทที่ต้องเชื่อม API จริงในเฟสแรก

---

### Q3.4 ประเภทผลิตภัณฑ์

**คำตอบ:**

| หมวด | Code | ตัวอย่าง |
|------|------|----------|
| พ.ร.บ. | `compulsory` / `prb` | compulsory-indara, compulsory-axa |
| 2+/3+ | `voluntary` | voluntary-indara, voluntary-axa |
| อุบัติเหตุ (PA) | `pa` | pa-axa, pa-bki |
| เดินทาง | `travel` | travel-axa, travel-bki |

Product key รูปแบบ: `{category}-{insurer}` เช่น `compulsory-indara`

---

## 4. วงเงิน & การเติมเงิน (ถามบ่อยมาก)

### Q4.1 balance กับ creditLimit ต่างกันอย่างไร?

**คำตอบ:**

- **`balance`** = เงินคงเหลือที่ใช้ออกกรมธรรม์ได้ **ตอนนี้**
- **`creditLimit`** = วงเงินสูงสุดที่อนุญาตให้นายหน้ารายนี้มี (ตั้งโดยแอดมินตอนสร้าง/แก้ไขนายหน้า)

**[ยืนยัน]** กฎธุรกิจ: balance ต้องไม่เกิน creditLimit หรือไม่?

---

### Q4.2 Flow ขอเติมวงเงิน

**คำตอบ:**

```
นายหน้าโอนเงิน → กรอกฟอร์ม + แนบสลิป → สถานะ pending
    → แอดมินอนุมัติ (approve) → balance เพิ่ม + บันทึก ledger
    → หรือแอดมินปฏิเสธ (reject) → ไม่เพิ่ม balance
```

---

### Q4.3 จำนวนเงินขั้นต่ำ/สูงสุดต่อครั้ง?

**คำตอบ (ตาม Frontend ปัจจุบัน):**

- **ขั้นต่ำ:** 1,000 บาท
- **สูงสุด:** 50,000 บาท

**[ยืนยัน]** ตัวเลขนี้เป็นข้อตกลงธุรกิจสุดท้ายหรือไม่?

---

### Q4.4 ฟิลด์ที่ต้องส่งตอนขอเติมเงิน

**คำตอบ:** `POST /api/v1/agents/{agentId}/credit-requests`

```json
{
  "amount": 10000,
  "note": "ขอเติมวงเงินสำหรับยอดขายสัปดาห์นี้",
  "bankAccountId": "bank-kbank",
  "transferDate": "2026-07-12",
  "transferTime": "10:25",
  "slipDataUrl": "data:image/jpeg;base64,...",
  "slipFileName": "slip.jpg"
}
```

**[ยืนยัน]** Production ควรใช้ **multipart upload** แทน base64 หรือไม่? (แนะนำ multipart + URL กลับ)

---

### Q4.5 บัญชีธนาคารรับโอน

**คำตอบ:** `GET /api/v1/credit/bank-accounts`  
คืนรายการบัญชีบริษัท (KBANK, SCB, BBL ฯลฯ) ให้นายหน้าเลือกปลายทางโอน

---

### Q4.6 สถานะคำขอเติมเงิน

**คำตอบ:**

| Status | ความหมาย |
|--------|----------|
| `pending` | รอแอดมินพิจารณา |
| `approved` | อนุมัติแล้ว — balance เพิ่มแล้ว |
| `rejected` | ปฏิเสธ — balance ไม่เปลี่ยน |

**Admin actions:** `POST /admin/credit-requests/{id}/approve` หรือ `/reject`

---

### Q4.7 ประวัติ ledger

**คำตอบ:** ต้องมีบันทึกทุกการเปลี่ยน balance (เติมเงิน, หักออกกรมธรรม์, แอดมินปรับมือ)  
Endpoint: `GET /agents/{agentId}/credit-ledger`

---

## 5. การออกกรมธรรม์

### Q5.1 ออกกรมธรรม์เรียก API ใคร?

**คำตอบ:** Frontend เรียก **API กลางของเรา** (`POST /policies`)  
**[ยืนยัน]** Backend เป็นคนยิงต่อไป API บริษัทประกัน หรือ Frontend ยิงตรง?

---

### Q5.2 หักวงเงินเมื่อไหร่?

**คำตอบ (ตาม Mock ปัจจุบัน):** หัก `balance` **ทันทีเมื่อออกกรมธรรม์สำเร็จ** ตาม `premium`  
**[ยืนยัน]** ถ้าออกกรมธรรม์ล้มเหลว ต้องคืน balance อัตโนมัติหรือไม่?

---

### Q5.3 สถานะกรมธรรม์

**คำตอบ:**

| Status | ความหมาย |
|--------|----------|
| `active` | ออกสำเร็จ |
| `pending` | รอดำเนินการ / ค้าง |
| `failed` | ล้มเหลว — มีปุ่ม retry |

**Actions:** `POST /policies/{id}/retry`, `POST /policies/{id}/cancel`

---

### Q5.4 ฟิลด์กรมธรรม์หลัก

**คำตอบ:**

```json
{
  "id": "POL-2026-001",
  "agentId": "agent-001",
  "agentCode": "Ck1-039",
  "type": "prb",
  "typeLabel": "พ.ร.บ.",
  "insurer": "อินทรประกันภัย",
  "insurerCode": "indara",
  "plate": "กข 1234",
  "premium": 645.21,
  "status": "active",
  "issuedAt": "2026-06-01",
  "expiresAt": "2027-06-01",
  "insuredName": "นายสมชาย ใจดี"
}
```

---

### Q5.5 ต่ออายุ (Renew)

**คำตอบ:** มี flow ต่ออายุ — `GET /agents/{agentId}/renewals`  
**[ยืนยัน]** กฎการต่ออายุ (ก่อนหมดอายุกี่วัน, หัก balance เหมือนออกใหม่หรือไม่)

---

## 6. ค่าคอมมิชชัน

### Q6.1 คำนวณคอมมิชชันอย่างไร?

**คำตอบ:**

```
commission amount = premium × (rate / 100)
```

- **`rate`** มาจาก `commissionRates.products['{category}-{insurer}']` ของนายหน้าแต่ละคน
- ตั้งค่าโดยแอดมินตอนเพิ่ม/แก้ไขนายหน้า

**โครงสร้าง commissionRates:**

```json
{
  "categories": {
    "compulsory": 15,
    "voluntary": 12,
    "pa": 10,
    "travel": 10
  },
  "products": {
    "compulsory-indara": 15,
    "compulsory-axa": 12,
    "voluntary-indara": 12,
    "pa-axa": 10,
    "travel-bki": 10
  }
}
```

> หมายเหตุ: ค่าใน `categories` เป็นค่า default อ้างอิง — **อัตราที่ใช้คำนวณจริงคือ `products`**

---

### Q6.2 สถานะคอมมิชชัน

**คำตอบ:**

| Status | ความหมาย |
|--------|----------|
| `pending` | ค้างจ่าย |
| `paid` | จ่ายแล้ว |

แอดมินอัปเดต: `PATCH /admin/commissions/{id}` body `{ "status": "paid" }`

---

### Q6.3 "ค่าคอมเดือนนี้" นับจากอะไร?

**คำตอบ (ตาม Mock):** นับจากฟิลด์ `period` (YYYY-MM) และ `earnedAt` (วันที่ออกกรมธรรม์)  
**[ยืนยัน]** ใช้ earned date หรือ paid date เป็นหลัก?

---

### Q6.4 ตัวอย่างรายการคอม

```json
{
  "id": "COM-001",
  "policyNo": "POL-2026-001",
  "policyType": "prb",
  "policyTypeLabel": "พ.ร.บ.",
  "insurer": "อินทรประกันภัย",
  "plate": "กข 1234",
  "premium": 645.21,
  "rate": 15,
  "amount": 96.78,
  "status": "paid",
  "period": "2026-06",
  "earnedAt": "2026-06-01",
  "paidAt": "2026-06-15"
}
```

---

## 7. สิทธิ์เมนูนายหน้า (Feature Permissions)

### Q7.1 นายหน้าแต่ละคนเห็นเมนูไม่เหมือนกันได้ไหม?

**คำตอบ:** **ได้** — แอดมินตั้ง `featurePermissions` ต่อนายหน้า  
ค่า `false` = ซ่อนเมนูและบล็อกเข้าหน้านั้น

**กลุ่มเมนูหลัก:**

| กลุ่ม | ตัวอย่าง key |
|-------|-------------|
| ออกกรมธรรม์ | `compulsory-indara`, `voluntary-axa`, `pa-bki`, `travel-axa`, `renew` |
| รายงาน | `reports-daily-policies`, `reports-monthly`, `inquiry` |
| การเงิน | `commission`, `credit`, `credit-history` |
| ใบเสร็จ | `receipt-issue`, `receipt-inquiry`, `receipt-summary` |
| ทีม | `team` |

---

### Q7.2 ระงับบัญชี (suspend) แล้วทำอย่างไร?

**คำตอบ:** `PATCH /agents/{id}/status` body `{ "status": "suspended" }`  
**[ยืนยัน]** login ไม่ได้เลย หรือ login ได้แต่ใช้งานไม่ได้?

---

## 8. รายงาน & แจ้งเตือน

### Q8.1 รายงานมีอะไรบ้าง?

**คำตอบ:**

| รายงาน | Endpoint (Agent) | Endpoint (Admin) |
|--------|------------------|------------------|
| ขายประจำวัน | `/agents/{id}/reports/daily` | — |
| รายเดือน | `/agents/{id}/reports/monthly-sales` | `/admin/reports/monthly-sales` |
| ลูกทีม | `/agents/{id}/reports/team-sales` | `/admin/reports/team-sales` |
| เปรียบเทียบนายหน้า | — | `/admin/reports/agent-comparison` |

---

### Q8.2 แจ้งเตือน (Notification bell)

**คำตอบ:**

- Agent: `GET /notifications`, `POST /notifications/{id}/read`
- Admin badge counts: `GET /admin/nav-badge-counts` (เช่น จำนวน credit request รออนุมัติ)

---

## 9. ใบเสร็จ

### Q9.1 มี module ใบเสร็จไหม?

**คำตอบ:** มี — ออกใบเสร็จ, สอบถาม, สรุปรายวัน, ตั้งค่ากระดาษ  
Endpoints: `/receipts`, `/receipts/paper-settings`

**[ยืนยัน]** ใบเสร็จต้อง sync กับระบบบัญชี/ERP หรือไม่?

---

## 10. ข้อกำหนดทางเทคนิค

### Q10.1 รูปแบบวันที่/เวลา

**คำตอบ:** ISO 8601 — `2026-07-21T14:30:00` หรือ `2026-07-21`  
Timezone: **[ยืนยัน]** Asia/Bangkok (UTC+7)?

---

### Q10.2 เงิน

**คำตอบ:** สกุลเงิน THB, ทศนิยม **2 ตำแหน่ง**

---

### Q10.3 Error response

**คำตอบ:** Frontend อ่าน `message` (ภาษาไทย) และ `code` (optional)

```json
{
  "message": "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
  "code": "AUTH_FAILED"
}
```

HTTP status: 401 (auth), 403 (forbidden), 404, 422 (validation), 500

---

### Q10.4 Pagination

**คำตอบ:** **[ยืนยัน]** ตารางยาว (policies, commissions, credit requests) ควรรองรับ `?page=1&limit=20`  
Frontend รองรับ filter query string อยู่แล้ว

---

### Q10.5 File upload (สลิป)

**คำตอบ:** Mock ใช้ base64 ใน JSON  
**[ยืนยัน]** Production: multipart/form-data, ขนาดสูงสุด, นามสกุลที่อนุญาต (jpg, png, pdf)

---

## 11. สภาพแวดล้อม & การทดสอบ

### Q11.1 URL

**คำตอบ:** **[ยืนยัน]** กรอกเมื่อพร้อม

| สภาพแวดล้อม | URL |
|-------------|-----|
| UAT Frontend | |
| UAT API | |
| Production Frontend | |
| Production API | |

---

### Q11.2 บัญชีทดสอบ (Mock ปัจจุบัน)

| Role | Username | Password | หมายเหตุ |
|------|----------|----------|----------|
| Admin | `admin` | `demo` | เข้า /admin/ |
| Agent (เต็มสิทธิ์) | `Ck1-039` | `demo` | balance ~34,531 บาท |
| Agent (จำกัดสิทธิ์) | `Ag2-112` | `demo` | ทดสอบ permission |
| Agent (จำกัดบางเมนู) | `Ag3-205` | `demo` | ทดสอบ finance/receipt |

---

### Q11.3 Checklist UAT ที่แนะนำ

- [ ] Login / Logout (agent + admin)
- [ ] ดู balance ใน header
- [ ] ส่งคำขอเติมเงิน + อัปโหลดสลิป
- [ ] Admin อนุมัติ/ปฏิเสธ → balance เปลี่ยนถูกต้อง
- [ ] ออกกรมธรรม์ → balance หัก
- [ ] กรมธรรม์ pending/failed → retry
- [ ] ดูค่าคอม + admin mark paid
- [ ] สร้าง/แก้ไขนายหน้า + ตั้ง % คอม + สิทธิ์เมนู
- [ ] รายงานรายวัน/รายเดือน
- [ ] แจ้งเตือน + badge รออนุมัติ

---

## 12. รายการ Endpoint อ้างอิง (จาก Frontend)

Base: **`/api/v1`**

### Auth & Profile
| Method | Path | คำอธิบาย |
|--------|------|----------|
| POST | `/auth/login` | เข้าสู่ระบบ |
| GET | `/auth/me` | ข้อมูล user ปัจจุบัน |
| PATCH | `/profile` | แก้ไขโปรไฟล์ |
| POST | `/profile/password` | เปลี่ยนรหัสผ่าน |

### Agents
| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/agents` | รายชื่อนายหน้า (admin) |
| POST | `/agents` | สร้างนายหน้า |
| GET | `/agents/{id}` | รายละเอียดนายหน้า |
| PATCH | `/agents/{id}` | แก้ไขนายหน้า |
| PATCH | `/agents/{id}/status` | เปิด/ระงับ |
| GET | `/agents/{id}/balance` | ดู balance |
| POST | `/agents/{id}/balance` | ปรับ balance (admin) |
| POST | `/agents/{id}/balance/refresh` | refresh balance |

### Credit
| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/credit/bank-accounts` | บัญชีรับโอน |
| GET | `/agents/{id}/credit-requests` | คำขอของนายหน้า |
| POST | `/agents/{id}/credit-requests` | ส่งคำขอเติมเงิน |
| GET | `/agents/{id}/credit-ledger` | ประวัติ ledger |
| GET | `/admin/credit-requests` | คำขอทั้งหมด (admin) |
| POST | `/admin/credit-requests/{id}/approve` | อนุมัติ |
| POST | `/admin/credit-requests/{id}/reject` | ปฏิเสธ |

### Policies
| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/policies` | รายการกรมธรรม์ (filter ได้) |
| POST | `/policies` | ออกกรมธรรม์ |
| GET | `/policies/{id}` | รายละเอียด |
| POST | `/policies/{id}/retry` | ลองใหม่ |
| POST | `/policies/{id}/cancel` | ยกเลิก |
| GET | `/agents/{id}/renewals` | รายการต่ออายุ |

### Commissions
| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/agents/{id}/commissions` | รายการคอม (agent) |
| GET | `/agents/{id}/commissions/summary` | สรุปคอม |
| GET | `/admin/commissions` | รายการคอมทั้งหมด |
| PATCH | `/admin/commissions/{id}` | อัปเดตสถานะ |

### Reports & Admin
| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/admin/stats` | สถิติ dashboard |
| GET | `/admin/nav-badge-counts` | badge แจ้งเตือน |
| GET | `/admin/reports/monthly-sales` | ยอดขายรายเดือน |
| GET | `/admin/reports/team-sales` | ยอดขายทีม |
| GET | `/admin/reports/agent-comparison` | เปรียบเทียบนายหน้า |
| GET | `/admin/renewals` | ต่ออายุ (admin) |
| GET | `/admin/users` | ผู้ใช้แอดมิน |
| GET | `/admin/product-settings` | ตั้งค่าผลิตภัณฑ์ |
| GET | `/audit-logs` | audit log |

### Insurers, Team, Receipts, Notifications
| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/insurers` | รายการบริษัทประกัน |
| PATCH | `/insurers/{id}` | แก้ไข config |
| POST | `/insurers/{id}/test` | ทดสอบ connection |
| GET | `/team/members` | ลูกทีม |
| POST/PATCH | `/team/members` | จัดการลูกทีม |
| GET | `/receipts` | ใบเสร็จ |
| GET/PUT | `/receipts/paper-settings` | ตั้งค่ากระดาษ |
| GET | `/notifications` | แจ้งเตือน |
| POST | `/notifications/{id}/read` | อ่านแล้ว |

---

## 13. สิ่งที่ต้องส่งให้ทีม API (สรุป)

1. เอกสาร Q&A ฉบับนี้
2. ไฟล์อ้างอิง JSON shape: `js/mock/data.js`
3. รายการ service/endpoints: โฟลเดอร์ `js/services/`
4. บัญชีทดสอบ UAT (เมื่อพร้อม)
5. URL UAT / Production
6. รายการข้อ **[ยืนยัน]** ที่ตอบแล้วจากฝ่ายธุรกิจ

---

## 14. ประเด็นเปิด (Open Items) — รอตอบจากธุรกิจ

| # | ประเด็น | ผู้ตอบ | สถานะ |
|---|---------|--------|--------|
| 1 | วันที่ Go-live UAT / Production | | ⬜ รอ |
| 2 | balance ต้องไม่เกิน creditLimit หรือไม่ | | ⬜ รอ |
| 3 | กรมธรรม์ fail แล้วคืน balance อัตโนมัติหรือไม่ | | ⬜ รอ |
| 4 | Upload สลิป: multipart vs base64 | | ⬜ รอ |
| 5 | Token หมดอายุ / refresh token | | ⬜ รอ |
| 6 | บริษัทประกันที่เชื่อม API เฟส 1 | | ⬜ รอ |
| 7 | ค่าคอมนับจาก earned date หรือ paid date | | ⬜ รอ |
| 8 | Admin sub-role (super_admin / ops read-only) | | ⬜ รอ |
| 9 | ใบเสร็จ sync ERP หรือไม่ | | ⬜ รอ |
| 10 | ขั้นต่ำ/สูงสุดเติมเงิน 1,000 / 50,000 บาท | | ⬜ รอ |

---

## 15. ติดต่อ / หมายเหตุ

- เมื่อ Backend พร้อม: แก้ `js/config/app-config.js` → `USE_MOCK_API: false` และตั้ง `API_BASE_URL` ให้ตรง environment
- เอกสารนี้อ้างอิงจาก codebase ณ วันที่จัดทำ — หากมีการเปลี่ยน flow ใน Frontend ให้อัปเดตเวอร์ชันเอกสาร

---

*Kladee Broker — API Integration Q&A v1.0*
