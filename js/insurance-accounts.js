(function () {
  var BANKS = {
    bbl: { name: 'กรุงเทพ', logo: 'bbl.png' },
    kbank: { name: 'กสิกร', logo: 'kbank.png' },
    scb: { name: 'ไทยพาณิชย์', logo: 'scb.png' },
    ktb: { name: 'กรุงไทย', logo: 'ktb.png' },
    bay: { name: 'กรุงศรีอยุธยา', logo: 'bay.png' },
    ttb: { name: 'ทหารไทยธนชาต', logo: 'ttb.png' }
  };

  var ACCOUNTS = [
    { logo: 'viriyah.jpg', company: 'วิริยะ (สุขสวัสดิ์)', bank: 'bbl', accountName: 'บมจ. วิริยะประกันภัย', accountNo: '125-4-77727-7' },
    { logo: 'bangkok-insurance.jpg', company: 'กรุงเทพ', bank: 'bbl', accountName: 'บริษัท กรุงเทพประกันภัย จำกัด (มหาชน)', accountNo: '042-0-13589-9' },
    { logo: 'muang-thai.jpg', company: 'เมืองไทย', bank: 'kbank', accountName: 'บริษัท เมืองไทยประกันภัย จำกัด (มหาชน)', accountNo: '050-2-98782-8' },
    { logo: 'tokyo-marine.jpg', company: 'คุ้มภัยโตเกียวมารีน', bank: 'scb', accountName: 'บริษัท คุ้มภัยโตเกียวมารีนประกันภัย (ประเทศไทย) จำกัด (มหาชน)', accountNo: '001-3-49835-7' },
    { logo: 'allianz.jpg', company: 'อลิอันซ์ อยุธยา', bank: 'kbank', accountName: 'บมจ. อลิอันซ์ อยุธยา ประกันภัย', accountNo: '001-2-38200-8' },
    { logo: 'ergo.jpg', company: 'เออร์โกประกันภัย', bank: 'kbank', accountName: 'บริษัท เออร์โกประกันภัย (ประเทศไทย) จำกัด (มหาชน)', accountNo: '038-2-50941-2' },
    { logo: 'dhipaya.jpg', company: 'ทิพยประกันภัย', bank: 'ktb', accountName: 'บมจ.ทิพยประกันภัย', accountNo: '056-1-05949-7' },
    { logo: 'axa.jpg', company: 'แอกซ่า (AXA)', bank: 'bbl', accountName: 'บริษัท แอกซ่าประกันภัย จำกัด (มหาชน)', accountNo: '124-3-08399-3' },
    { logo: 'thaivivat.jpg', company: 'ไทยวิวัฒน์', bank: 'kbank', accountName: 'บมจ. ประกันภัยไทยวิวัฒน์', accountNo: '052-2-84337-7' },
    { logo: 'thanachart.jpg', company: 'ธนชาต', bank: 'ttb', accountName: 'บมจ. ธนชาตประกันภัย', accountNo: '124-1-06123-1' },
    { logo: 'msig.jpg', company: 'MSIG', bank: 'bbl', accountName: 'บริษัท เอ็ม เอส ไอ จี ประกันภัย (ประเทศไทย) จำกัด (มหาชน)', accountNo: '220-3-01949-8' },
    { logo: 'chubb.jpg', company: 'ชับบ์สามัคคี', bank: 'scb', accountName: 'บริษัท ชับบ์สามัคคีประกันภัย จำกัด (มหาชน) สำนักงานใหญ่', accountNo: '319-2-64200-9' },
    { logo: 'aig.jpg', company: 'AIG', bank: 'bay', accountName: 'บมจ.เอไอจี ประกันภัย (ประเทศไทย)', accountNo: '125-1-73902-7' },
    { logo: 'kpi.jpg', company: 'กรุงไทยพานิช (KPI)', bank: 'kbank', accountName: 'บมจ. กรุงไทยพานิชประกันภัย', accountNo: '709-2-31271-7' },
    { logo: 'tsi.jpg', company: 'ไทยเศรษฐกิจ (TSI)', bank: 'bbl', accountName: 'บมจ. ไทยเศรษฐกิจประกันภัย', accountNo: '142-0-95775-3' },
    { logo: 'aioi.jpg', company: 'ไอโออิกรุงเทพ', bank: 'kbank', accountName: 'บมจ. ไอโออิ กรุงเทพ ประกันภัย', accountNo: '064-1-06296-0' },
    { logo: 'deves.jpg', company: 'เทเวศ', bank: 'scb', accountName: 'บริษัท เทเวศประกันภัย จำกัด (มหาชน)', accountNo: '003-4-14726-4' },
    { logo: 'indara.jpg', company: 'อินทร (สนญ.)', bank: 'kbank', accountName: 'บมจ. อินทรประกันภัย', accountNo: '052-2-45665-9' },
    { logo: 'navakij.jpg', company: 'นวกิจ', bank: 'bbl', accountName: 'บริษัท นวกิจประกันภัย จำกัด (มหาชน)', accountNo: '101-3-22025-4' },
    { logo: 'bangkok-union.jpg', company: 'บางกอกสห', bank: 'bay', accountName: 'บริษัท บางกอกสหประกันภัย จำกัด (มหาชน)', accountNo: '125-1-41793-6' },
    { logo: 'falcon.png', company: 'ฟอลคอน', bank: 'bbl', accountName: 'บมจ. ฟอลคอนประกันภัย', accountNo: '002-8-01210-2' },
    {
      logo: 'roojai.png',
      company: 'รู้ใจ',
      bank: 'online',
      accountName: 'ชำระผ่านช่องทางออนไลน์ของรู้ใจ (บัตรเครดิต/เดบิต, QR Code, Mobile Banking)',
      accountNo: '—',
      onlineOnly: true
    }
  ];

  var copyIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';

  function bankBadge(bankKey) {
    if (bankKey === 'online') {
      return '<span class="insAcctBankBadge insAcctBankBadge--online" aria-hidden="true">ON</span>';
    }
    var bank = BANKS[bankKey];
    return '<span class="insAcctBankBadge"><img src="images/banks/' + bank.logo + '" alt="' + bank.name + '" width="40" height="40" loading="lazy"></span>';
  }

  function renderRow(item) {
    var bank = item.bank === 'online' ? { name: 'ชำระออนไลน์' } : BANKS[item.bank];
    var copyBtn = item.onlineOnly
      ? ''
      : '<button type="button" class="insAcctCopy" data-copy="' + item.accountNo + '" aria-label="คัดลอกเลขบัญชี ' + item.accountNo + '">' + copyIcon + '<span>คัดลอก</span></button>';
    var actionBtn = item.onlineOnly
      ? '<a class="insAcctQrBtn" href="https://www.roojai.com/payment/" target="_blank" rel="noopener noreferrer">ชำระออนไลน์</a>'
      : '<a class="insAcctQrBtn" href="contact">สแกน QR Code</a>';

    return (
      '<li class="insAcctRow' + (item.onlineOnly ? ' insAcctRow--online' : '') + '">' +
        '<div class="insAcctRow__company">' +
          '<span class="insAcctRow__logo"><img src="images/partners/' + item.logo + '" alt="" width="48" height="48" loading="lazy"></span>' +
          '<span class="insAcctRow__name">' + item.company + '</span>' +
        '</div>' +
        '<div class="insAcctRow__bank">' +
          bankBadge(item.bank) +
          '<div class="insAcctRow__bankText">' +
            '<strong class="insAcctRow__bankName">' + bank.name + '</strong>' +
            '<span class="insAcctRow__acctName">ชื่อบัญชี ' + item.accountName + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="insAcctRow__account">' +
          '<div class="insAcctRow__acctNoWrap">' +
            '<span class="insAcctRow__acctNo">' + item.accountNo + '</span>' +
            copyBtn +
          '</div>' +
          actionBtn +
        '</div>' +
      '</li>'
    );
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        resolve();
      } catch (err) {
        reject(err);
      }
      document.body.removeChild(ta);
    });
  }

  function renderList(list, filter) {
    var items = ACCOUNTS.filter(function (item) {
      if (filter === 'nonlife') return !item.onlineOnly;
      return true;
    });
    list.innerHTML = items.map(renderRow).join('');
  }

  function initTabs(list) {
    var tabs = document.querySelectorAll('.insAcct__tab[data-filter]');
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var filter = tab.getAttribute('data-filter') || 'all';
        tabs.forEach(function (t) {
          var active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        renderList(list, filter);
      });
    });
  }

  function initCopyButtons(root) {
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('.insAcctCopy');
      if (!btn) return;
      var value = btn.getAttribute('data-copy');
      if (!value) return;
      copyText(value).then(function () {
        var label = btn.querySelector('span');
        if (!label) return;
        var original = label.textContent;
        label.textContent = 'คัดลอกแล้ว';
        btn.classList.add('is-copied');
        window.setTimeout(function () {
          label.textContent = original;
          btn.classList.remove('is-copied');
        }, 1600);
      });
    });
  }

  function init() {
    var list = document.getElementById('insAcctList');
    if (!list) return;
    renderList(list, 'all');
    initCopyButtons(list);
    initTabs(list);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
