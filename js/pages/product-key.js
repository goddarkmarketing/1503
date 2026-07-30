/**
 * Shared product key-in page controller (form + brochure layout A).
 */
(function () {
  const base = document.body?.dataset?.basePath || '../';
  const productId = document.body?.dataset?.product;
  const catalog = window.App?.ProductCatalog;
  const product = catalog?.get(productId);

  if (!product) {
    console.warn('[product-key] unknown product', productId);
    return;
  }

  function money(n) {
    if (n == null || Number.isNaN(n)) return '—';
    return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function abs(path) {
    return `${base}${path}`;
  }

  function buildFields(kind) {
    if (kind === 'pa-indara') {
      return `
        <div class="product-key__grid">
          <div class="form-field-h">
            <label class="form-label" for="plan">แผน</label>
            <select id="plan" name="plan" class="form-input" required>
              <option value="1">แผน 1 (ทุนชีวิต 100,000)</option>
              <option value="2">แผน 2 (ทุนชีวิต 300,000)</option>
              <option value="3">แผน 3 (ทุนชีวิต 500,000)</option>
              <option value="4">แผน 4 (ทุนชีวิต 1,000,000)</option>
            </select>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="age">อายุผู้เอาประกัน</label>
            <input type="number" id="age" name="age" class="form-input" min="15" max="70" value="35" required>
          </div>
          <div class="form-field-h form-field-h--full">
            <label class="form-label" for="insuredName">ชื่อ-นามสกุล ผู้เอาประกัน</label>
            <input type="text" id="insuredName" name="insuredName" class="form-input" required>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="nationalId">เลขบัตรประชาชน</label>
            <input type="text" id="nationalId" name="nationalId" class="form-input" maxlength="13" inputmode="numeric">
          </div>
          <div class="form-field-h">
            <label class="form-label" for="phone">เบอร์โทร</label>
            <input type="tel" id="phone" name="phone" class="form-input" required>
          </div>
        </div>`;
    }

    if (kind === 'pa-axa') {
      return `
        <div class="product-key__grid">
          <div class="form-field-h">
            <label class="form-label" for="plan">แผน Happy Med</label>
            <select id="plan" name="plan" class="form-input" required>
              <option value="1">แฮปปี้ เมด 1</option>
              <option value="2">แฮปปี้ เมด 2</option>
              <option value="3">แฮปปี้ เมด 3</option>
            </select>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="age">อายุผู้เอาประกัน</label>
            <input type="number" id="age" name="age" class="form-input" min="1" max="70" value="35" required>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="occupationClass">ชั้นอาชีพ</label>
            <select id="occupationClass" name="occupationClass" class="form-input" required>
              <option value="1">ชั้น 1</option>
              <option value="2">ชั้น 2</option>
              <option value="3">ชั้น 3</option>
            </select>
          </div>
          <div class="form-field-h form-field-h--full">
            <label class="form-label" for="insuredName">ชื่อ-นามสกุล ผู้เอาประกัน</label>
            <input type="text" id="insuredName" name="insuredName" class="form-input" required>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="phone">เบอร์โทร</label>
            <input type="tel" id="phone" name="phone" class="form-input" required>
          </div>
        </div>`;
    }

    if (kind === 'pa-bki') {
      return `
        <div class="product-key__grid">
          <div class="form-field-h">
            <label class="form-label" for="planType">แบบแผน</label>
            <select id="planType" name="planType" class="form-input" required>
              <option value="A">แบบ A — ไม่มีค่ารักษาพยาบาล</option>
              <option value="B">แบบ B — มีค่ารักษาพยาบาล</option>
            </select>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="sumInsured">ทุนประกันภัย</label>
            <select id="sumInsured" name="sumInsured" class="form-input" required>
              <option value="500000">500,000</option>
              <option value="600000">600,000</option>
              <option value="700000">700,000</option>
              <option value="800000">800,000</option>
              <option value="900000">900,000</option>
              <option value="1000000" selected>1,000,000</option>
              <option value="1500000">1,500,000</option>
              <option value="2000000">2,000,000</option>
              <option value="2500000">2,500,000</option>
              <option value="3000000">3,000,000</option>
            </select>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="age">อายุผู้เอาประกัน</label>
            <input type="number" id="age" name="age" class="form-input" min="16" max="65" value="35" required>
          </div>
          <div class="form-field-h form-field-h--full">
            <label class="form-label" for="insuredName">ชื่อ-นามสกุล ผู้เอาประกัน</label>
            <input type="text" id="insuredName" name="insuredName" class="form-input" required>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="phone">เบอร์โทร</label>
            <input type="tel" id="phone" name="phone" class="form-input" required>
          </div>
        </div>`;
    }

    if (kind === 'voluntary-axa') {
      const user = window.App?.AuthService?.getCurrentUser?.() || window.App?.Session?.getUser?.();
      if (App.VoluntaryAxaQuote?.buildFields) {
        return App.VoluntaryAxaQuote.buildFields(user);
      }
      return '<p class="product-key__hint">ไม่สามารถโหลดฟอร์ม AXA ได้ กรุณารีเฟรชหน้า</p>';
    }

    if (kind === 'voluntary-indara') {
      return `
        <div class="product-key__grid">
          <div class="form-field-h">
            <label class="form-label" for="coverType">ประเภท</label>
            <select id="coverType" name="coverType" class="form-input" required>
              <option value="3plus">อินชัวร์ 3+ แฮปปี้</option>
              <option value="2plus">อินชัวร์ 2+ แฮปปี้</option>
            </select>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="plan">แผน</label>
            <select id="plan" name="plan" class="form-input" required>
              <option value="1">แผน 1</option>
              <option value="2">แผน 2 (พลิกคว่ำ/ตกข้างทาง)</option>
            </select>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="sumInsured">ทุนประกัน</label>
            <select id="sumInsured" name="sumInsured" class="form-input" required>
              <option value="50000" selected>50,000</option>
              <option value="100000">100,000</option>
              <option value="200000">200,000</option>
              <option value="300000">300,000</option>
            </select>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="vehicleType">ประเภทรถ</label>
            <select id="vehicleType" name="vehicleType" class="form-input" required>
              <option value="110">รถเก๋ง ส่วนบุคคล (110)</option>
              <option value="320">รถกระบะ ส่วนบุคคล (320)</option>
            </select>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="licensePlate">ทะเบียนรถ</label>
            <input type="text" id="licensePlate" name="licensePlate" class="form-input" required>
          </div>
          <div class="form-field-h form-field-h--full">
            <label class="form-label" for="insuredName">ชื่อ-นามสกุล ผู้เอาประกัน</label>
            <input type="text" id="insuredName" name="insuredName" class="form-input" required>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="phone">เบอร์โทร</label>
            <input type="tel" id="phone" name="phone" class="form-input" required>
          </div>
        </div>`;
    }

    if (kind === 'travel-indara') {
      return `
        <div class="product-key__grid">
          <div class="form-field-h">
            <label class="form-label" for="tripType">ประเภทกรมธรรม์</label>
            <select id="tripType" name="tripType" class="form-input" required>
              <option value="single">รายเที่ยว (Single Trip)</option>
              <option value="annual">รายปี (Annual Multi-Trip)</option>
            </select>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="plan">แผน</label>
            <select id="plan" name="plan" class="form-input" required>
              <option value="1">แผน 1</option>
              <option value="2">แผน 2</option>
              <option value="3" selected>แผน 3</option>
              <option value="4">แผน 4</option>
              <option value="5">แผน 5</option>
            </select>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="region">พื้นที่คุ้มครอง</label>
            <select id="region" name="region" class="form-input" required>
              <option value="asia">Asia</option>
              <option value="worldwide">Worldwide</option>
            </select>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="duration">ระยะเวลาเดินทาง</label>
            <select id="duration" name="duration" class="form-input" required>
              <option value="1-4">1–4 วัน</option>
              <option value="5-6">5–6 วัน</option>
              <option value="7-8">7–8 วัน</option>
              <option value="9-10">9–10 วัน</option>
              <option value="11-14">11–14 วัน</option>
              <option value="15-21">15–21 วัน</option>
              <option value="22-31">22–31 วัน</option>
              <option value="32-60">32–60 วัน</option>
              <option value="61-90">61–90 วัน</option>
            </select>
          </div>
          <div class="form-field-h form-field-h--full">
            <label class="form-label" for="insuredName">ชื่อ-นามสกุล ผู้เอาประกัน</label>
            <input type="text" id="insuredName" name="insuredName" class="form-input" required>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="age">อายุ</label>
            <input type="number" id="age" name="age" class="form-input" min="1" max="80" value="35" required>
          </div>
          <div class="form-field-h">
            <label class="form-label" for="phone">เบอร์โทร</label>
            <input type="tel" id="phone" name="phone" class="form-input" required>
          </div>
        </div>`;
    }

    return '<p>ยังไม่รองรับฟอร์มนี้</p>';
  }

  function readValues(form) {
    const fd = new FormData(form);
    const values = {};
    fd.forEach((val, key) => {
      values[key] = val;
    });
    return values;
  }

  function updatePremium(form, premiumEl) {
    const values = readValues(form);
    const premium = catalog.calcPremium(product.formKind, values);
    premiumEl.dataset.premium = premium != null ? String(premium) : '';
    premiumEl.innerHTML = premium != null
      ? `${money(premium)}<span>${product.type === 'travel' ? 'บาท' : 'บาท/ปี'}</span>`
      : '—<span>เลือกข้อมูลให้ครบ</span>';
    return premium;
  }

  function toast(msg, type) {
    if (window.App?.TableUI?.showToast) App.TableUI.showToast(msg, type || 'success');
    else alert(msg);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('productKeyHeader');
    const fieldsHost = document.getElementById('productKeyFields');
    const form = document.getElementById('productKeyForm');
    const premiumEl = document.getElementById('productKeyPremium');
    const hintEl = document.getElementById('productKeyHint');
    const brochureRoot = document.getElementById('brochurePanel');
    const titleEl = document.getElementById('productKeyPageTitle');

    if (titleEl) titleEl.textContent = `${product.typeLabel} — ${product.insurer}`;

    if (header) {
      header.innerHTML = `
        <h2 class="product-key-card__title">${product.typeLabel} : ${product.productName}</h2>
        <img src="${abs(product.logo)}" alt="${product.insurer}" class="product-key-card__logo">`;
    }

    if (fieldsHost) fieldsHost.innerHTML = buildFields(product.formKind);
    if (hintEl) {
      if (product.formKind === 'voluntary-axa') {
        hintEl.hidden = true;
        hintEl.textContent = '';
      } else {
        hintEl.textContent = product.notes || '';
      }
    }

    if (product.formKind === 'voluntary-axa') {
      form?.classList.add('product-key__card--quote-only');
      document.querySelector('.product-key')?.classList.add('product-key--axa-quote');
    }

    const pagesByTab = {};
    Object.keys(product.brochures || {}).forEach((tab) => {
      pagesByTab[tab] = (product.brochures[tab] || []).map((p) => ({
        ...p,
        src: abs(p.src)
      }));
    });

    const brochureApi = App.BrochurePanel.mount(brochureRoot, {
      title: product.brochureTitle || 'โบรชัวร์',
      tabs: product.brochureTabs,
      pagesByTab,
      initialTab: product.brochureTabs?.[0]?.id || Object.keys(pagesByTab)[0],
      collapsible: product.formKind === 'voluntary-axa',
      collapsed: product.formKind === 'voluntary-axa',
      layoutRoot: document.querySelector('.product-key'),
      onTabChange(tabId) {
        const cover = form?.querySelector('#coverType');
        if (cover && (tabId === '2plus' || tabId === '3plus')) {
          cover.value = tabId;
          updatePremium(form, premiumEl);
        }
      }
    });

    if (form && premiumEl) {
      const sync = () => updatePremium(form, premiumEl);
      form.addEventListener('input', sync);
      form.addEventListener('change', (e) => {
        if (e.target?.id === 'coverType' && brochureApi) {
          brochureApi.setTab(e.target.value);
        }
        sync();
      });

      if (product.formKind === 'voluntary-axa' && App.VoluntaryAxaQuote?.bind) {
        App.VoluntaryAxaQuote.bind(form, {
          onPremiumSync: sync,
          onBrochureTab: (tabId) => brochureApi?.setTab?.(tabId),
          toast
        });
      }

      sync();

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (product.formKind === 'voluntary-axa') {
          // Quote-only screen for now — use ตรวจสอบราคา instead of issuing policy.
          form.querySelector('#btnCheckPrice')?.click();
          return;
        }
        if (!form.reportValidity()) return;
        const values = readValues(form);
        const premium = updatePremium(form, premiumEl);
        if (premium == null) {
          toast('ไม่สามารถคำนวณเบี้ยจากข้อมูลที่เลือกได้', 'error');
          return;
        }

        const nameParts = String(values.insuredName || '').trim().split(/\s+/);
        const payload = {
          insurer: product.insurer,
          insurerCode: product.insurerCode,
          productId: product.id,
          productName: product.productName,
          type: product.type,
          typeLabel: product.typeLabel,
          premiumTotal: premium,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          phone: values.phone || '',
          licensePlate: values.licensePlate || '-',
          carBrand: values.carBrand || '',
          ...values
        };

        const btn = form.querySelector('[type="submit"]');
        if (btn) btn.disabled = true;
        try {
          if (window.App?.PolicyService?.createPolicy) {
            const policy = await App.PolicyService.createPolicy(payload);
            toast(`ออกกรมธรรม์สำเร็จ ${policy?.id || ''}`.trim());
            form.reset();
            if (values.coverType) {
              const cover = form.querySelector('#coverType');
              if (cover) cover.value = values.coverType;
            }
            sync();
            if (window.App?.BalanceService?.refresh || window.refreshBalance) {
              window.refreshBalance?.();
            }
          } else {
            toast(`บันทึกแบบทดลองแล้ว — เบี้ย ${money(premium)} บาท`);
          }
        } catch (err) {
          toast(err?.message || 'บันทึกไม่สำเร็จ', 'error');
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    }

    if (window.lucide?.createIcons) lucide.createIcons();
  });
})();
