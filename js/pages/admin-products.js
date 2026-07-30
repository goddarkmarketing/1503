(function () {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  const labels = {
    ergo: 'เออร์โกประกันภัย',
    axa: 'AXA',
    bki: 'BKI กรุงเทพประกันภัย',
    chubb: 'CHUBB',
    indara: 'อินทรประกันภัย'
  };

  async function load() {
    App.TableUI.showLoading(tbody, 5);
    const settings = await App.ProductService.getSettings();
    const codes = Object.keys(labels);
    tbody.innerHTML = codes.map((code) => {
      const s = settings[code] || { prb: false, voluntary: false, accident: false, travel: false };
      return `
        <tr data-code="${code}">
          <td>${labels[code] || code}</td>
          <td><label class="toggle-switch"><input type="checkbox" class="toggle-prb" ${s.prb ? 'checked' : ''}><span class="toggle-slider"></span></label></td>
          <td><label class="toggle-switch"><input type="checkbox" class="toggle-vol" ${s.voluntary ? 'checked' : ''}><span class="toggle-slider"></span></label></td>
          <td><label class="toggle-switch"><input type="checkbox" class="toggle-pa" ${s.accident ? 'checked' : ''}><span class="toggle-slider"></span></label></td>
          <td><label class="toggle-switch"><input type="checkbox" class="toggle-travel" ${s.travel ? 'checked' : ''}><span class="toggle-slider"></span></label></td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('tr').forEach((row) => {
      const code = row.dataset.code;
      const save = async () => {
        await App.ProductService.updateSettings(code, {
          prb: row.querySelector('.toggle-prb').checked,
          voluntary: row.querySelector('.toggle-vol').checked,
          accident: row.querySelector('.toggle-pa').checked,
          travel: row.querySelector('.toggle-travel').checked
        });
      };
      row.querySelectorAll('input[type="checkbox"]').forEach((input) => {
        input.addEventListener('change', save);
      });
    });
  }

  load();
})();
