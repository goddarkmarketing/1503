/**
 * GeoTH — Static API จังหวัด อำเภอ ตำบล รหัสไปรษณีย์
 * https://github.com/mrthiti/geoth
 * https://geoth.thiti.dev
 */
const GeoTH = (() => {
  const BASE = 'https://geoth.thiti.dev/api';
  let provincesCache = null;

  async function fetchJson(path) {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`GeoTH API error: ${res.status}`);
    return res.json();
  }

  async function getProvinces() {
    if (!provincesCache) {
      provincesCache = await fetchJson('/provinces/all');
    }
    return provincesCache;
  }

  async function getDistricts(provinceId) {
    const data = await fetchJson(`/provinces-with-districts/${provinceId}`);
    return data.districts || [];
  }

  async function getSubdistricts(districtId) {
    const data = await fetchJson(`/districts-with-subdistricts/${districtId}`);
    return data.subdistricts || [];
  }

  return { getProvinces, getDistricts, getSubdistricts };
})();
