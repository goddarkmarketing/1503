/**
 * SearchableSelect — พิมพ์ค้นหาใน dropdown
 */
class SearchableSelect {
  constructor(select, options = {}) {
    this.select = select;
    this.placeholder = options.placeholder || 'เลือก...';
    this.onChange = options.onChange || null;
    this.isOpen = false;
    this.highlightIndex = -1;

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'search-select';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'search-select-input form-input';
    this.input.placeholder = this.placeholder;
    this.input.autocomplete = 'off';

    this.chevron = document.createElement('span');
    this.chevron.className = 'search-select-chevron';
    this.chevron.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

    this.dropdown = document.createElement('ul');
    this.dropdown.className = 'search-select-dropdown';
    this.dropdown.setAttribute('role', 'listbox');

    this.select.classList.add('search-select-native');
    this.select.tabIndex = -1;

    select.parentNode.insertBefore(this.wrapper, select);
    this.wrapper.appendChild(this.input);
    this.wrapper.appendChild(this.chevron);
    this.wrapper.appendChild(this.dropdown);
    this.wrapper.appendChild(this.select);

    this.bindEvents();
    this.syncInputFromSelect();
  }

  static create(select, options) {
    if (!select) return null;
    if (select._searchableSelect) return select._searchableSelect;
    const instance = new SearchableSelect(select, options);
    select._searchableSelect = instance;
    return instance;
  }

  bindEvents() {
    this.input.addEventListener('focus', () => this.open());
    this.input.addEventListener('input', () => {
      this.open();
      this.renderDropdown(this.input.value);
    });
    this.input.addEventListener('keydown', (e) => this.onKeydown(e));
    this.input.addEventListener('blur', () => {
      setTimeout(() => this.syncOnBlur(), 150);
    });
    this.chevron.addEventListener('click', () => {
      if (this.isDisabled()) return;
      this.isOpen ? this.close() : (this.input.focus(), this.open());
    });

    document.addEventListener('click', (e) => {
      if (!this.wrapper.contains(e.target)) this.close();
    });

    this.select.addEventListener('change', () => this.syncInputFromSelect());
  }

  onKeydown(e) {
    const items = [...this.dropdown.querySelectorAll('.search-select-item:not(.empty)')];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.highlightIndex = Math.min(this.highlightIndex + 1, items.length - 1);
      this.updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.highlightIndex = Math.max(this.highlightIndex - 1, 0);
      this.updateHighlight(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.highlightIndex >= 0 && items[this.highlightIndex]) {
        this.pickItem(items[this.highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      this.close();
      this.syncInputFromSelect();
    }
  }

  updateHighlight(items) {
    items.forEach((el, i) => el.classList.toggle('highlighted', i === this.highlightIndex));
    items[this.highlightIndex]?.scrollIntoView({ block: 'nearest' });
  }

  open() {
    if (this.isDisabled()) return;
    this.isOpen = true;
    this.wrapper.classList.add('open');
    this.renderDropdown(this.input.value);
  }

  close() {
    this.isOpen = false;
    this.highlightIndex = -1;
    this.wrapper.classList.remove('open');
    this.dropdown.innerHTML = '';
  }

  renderDropdown(query = '') {
    const q = query.trim().toLowerCase();
    const options = [...this.select.options].filter(o => o.value !== '');
    const filtered = q
      ? options.filter(o => o.textContent.toLowerCase().includes(q))
      : options;

    this.dropdown.innerHTML = '';

    if (!filtered.length) {
      const li = document.createElement('li');
      li.className = 'search-select-item empty';
      li.textContent = 'ไม่พบข้อมูล';
      this.dropdown.appendChild(li);
      return;
    }

    filtered.slice(0, 100).forEach((opt, i) => {
      const li = document.createElement('li');
      li.className = 'search-select-item';
      li.textContent = opt.textContent;
      li.dataset.value = opt.value;
      li.setAttribute('role', 'option');
      if (i === this.highlightIndex) li.classList.add('highlighted');

      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.pickItem(li);
      });

      this.dropdown.appendChild(li);
    });

    if (filtered.length > 100) {
      const more = document.createElement('li');
      more.className = 'search-select-item empty';
      more.textContent = `แสดง 100 จาก ${filtered.length} รายการ — พิมพ์เพื่อค้นหา`;
      this.dropdown.appendChild(more);
    }
  }

  pickItem(li) {
    const value = li.dataset.value;
    const opt = [...this.select.options].find(o => o.value === value);
    if (!opt) return;

    this.select.value = value;
    this.input.value = opt.textContent;
    this.close();
    this.select.dispatchEvent(new Event('change', { bubbles: true }));

    if (this.onChange) {
      this.onChange(value, opt);
    }
  }

  syncInputFromSelect() {
    const opt = this.select.selectedOptions[0];
    this.input.value = opt?.value ? opt.textContent : '';
  }

  syncOnBlur() {
    if (this.isOpen) return;
    const text = this.input.value.trim();
    if (!text) {
      this.select.value = '';
      return;
    }
    const match = [...this.select.options].find(o => o.value && o.textContent === text);
    if (match) {
      this.select.value = match.value;
    } else {
      this.syncInputFromSelect();
    }
  }

  setOptions(items, placeholder) {
    this.placeholder = placeholder || this.placeholder;
    this.input.placeholder = this.placeholder;

    this.select.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.value ?? item.nameTh;
      opt.textContent = item.label ?? item.nameTh;
      if (item.id != null) opt.dataset.id = item.id;
      if (item.zip != null) opt.dataset.zip = item.zip;
      this.select.appendChild(opt);
    });

    this.input.value = '';
    this.select.value = '';
    this.enable();
    this.close();
  }

  setLoading(text) {
    this.disable(text || '--กำลังโหลด--');
  }

  setError(text) {
    this.disable(text || '--โหลดข้อมูลไม่สำเร็จ--');
  }

  reset(placeholder) {
    this.select.innerHTML = `<option value="">${placeholder}</option>`;
    this.select.value = '';
    this.input.value = '';
    this.input.placeholder = placeholder;
    this.disable(placeholder);
    this.close();
  }

  enable() {
    this.select.disabled = false;
    this.select.classList.remove('loading');
    this.input.disabled = false;
    this.input.placeholder = this.placeholder;
    this.wrapper.classList.remove('disabled');
  }

  disable(placeholder) {
    this.select.disabled = true;
    this.input.disabled = true;
    this.input.value = '';
    if (placeholder) this.input.placeholder = placeholder;
    this.wrapper.classList.add('disabled');
    this.close();
  }

  isDisabled() {
    return this.input.disabled;
  }

  getSelectedOption() {
    return this.select.selectedOptions[0] || null;
  }

  getSelectedId() {
    return this.getSelectedOption()?.dataset.id || null;
  }

  getSelectedZip() {
    return this.getSelectedOption()?.dataset.zip || '';
  }
}
