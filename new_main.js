// ============================
// 1. Basemaps
// ============================
const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
});

const hillshade = L.tileLayer(
  'https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles © Esri — World Hillshade'
  }
);

// ============================
// 2. Map initialization
// ============================
const initialCenter = [29.2, 95.7];
const initialZoom = 8;
// 缩放到这个级别以上才显示 Historical Sites 的常驻标签
const labelZoomThreshold = 9;

const map = L.map('map', {
  center: initialCenter,
  zoom: initialZoom,
  layers: [hillshade]
});

// ============================
// 3. Hard-coded hydropower tunnel
// ============================
const pai = [29.5120889, 94.8461361];
const xirang = [29.182079, 95.027618];

const tunnelLine = L.polyline([pai, xirang], {
  color: '#d7301f',
  weight: 4,
  dashArray: '8 6',
  opacity: 0.95
}).bindPopup(`
Hydropower Tunnel (hard-coded)<br>
From Pai Town to Xirang Village<br>
Approx. length: 55 km<br>
Approx. elevation drop: 2000 m<br>
Represents the proposed diversion / outlet tunnel through the mountain Namcha Barwa.
`);

const paiMarker = L.circleMarker(pai, {
  radius: 6,
  color: '#7f0000',
  fillColor: '#d7301f',
  fillOpacity: 0.9,
  weight: 1
}).bindPopup(`
Pai Town<br>
Intake / dam-related point<br>
Western end of the hydropower tunnel.
`);

const xirangMarker = L.circleMarker(xirang, {
  radius: 6,
  color: '#7f0000',
  fillColor: '#fc8d59',
  fillOpacity: 0.9,
  weight: 1
}).bindPopup(`
Xirang Village<br>
Outlet / powerhouse-related point<br>
Eastern end of the hydropower tunnel.
`);

const hydropowerTunnelLayer = L.layerGroup([
  tunnelLine,
  paiMarker,
  xirangMarker
]).addTo(map);

// ============================
// 4. Layer control setup
// ============================
const baseMaps = {
  'OpenStreetMap': osm,
  'Terrain / Hillshade': hillshade
};

const overlayMaps = {
  'Hydropower Tunnel (hard-coded)': hydropowerTunnelLayer
};

const layerControl = L.control.layers(baseMaps, overlayMaps, {
  collapsed: false
}).addTo(map);

// ============================
// ============================
// 5. Popup helper
// 只显示：匹配中文名、藏文/藏语拉丁转写、英文别名、藏文意义
// ============================

// 防止属性内容里有 < > & 等符号导致 HTML 显示出错
function escapeHTML(value) {
  if (value === null || value === undefined) return '';

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// 判断字段是否真的有内容
function hasValue(value) {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ''
  );
}

function buildPopup(feature, fallbackTitle) {
  const props = feature.properties || {};

  // popup 标题：优先使用 Name
  // 你现在的 GeoJSON 里 Name 已经是英文主名；
  // 如果某个点没有英文主名，Name 会保留原来的 GeoJSON 地名
  const title = hasValue(props.Name) ? props.Name : fallbackTitle;

  // 只保留你想展示的四类信息
  const popupFields = [
    {
      label: 'Matched Chinese Name',
      value: props.matched_chinese_name
    },
    {
      label: 'Tibetan / Tibetic Latin Transliteration',
      value: props.tibetan_latin_transliteration
    },
    {
      label: 'English Aliases',
      value: props.english_aliases
    },
    {
      label: 'Meaning of Tibetan Name',
      value: props.tibetan_meaning_en
    }
  ];

  let html = `
    <div class="custom-popup">
      <div class="popup-title">${escapeHTML(title)}</div>
  `;

  popupFields.forEach(field => {
    if (hasValue(field.value)) {
      html += `
        <div class="popup-row">
          <div class="popup-label">${escapeHTML(field.label)}</div>
          <div class="popup-value">${escapeHTML(field.value)}</div>
        </div>
      `;
    }
  });

  html += `</div>`;

  return html;
}
// 给 Roads / Tsangpo / Settlement 这种普通图层用的 popup
function buildBasicPopup(feature, fallbackTitle) {
  const props = feature.properties || {};

  const rawName = props.name || props.Name || '';
  const name = String(rawName).trim();

  const title = name !== '' ? name : fallbackTitle;

  let html = `
    <div class="custom-popup">
      <div class="popup-title">${escapeHTML(title)}</div>
  `;

  if (props.fclass && String(props.fclass).trim() !== '') {
    html += `
      <div class="popup-row">
        <div class="popup-label">Type</div>
        <div class="popup-value">${escapeHTML(props.fclass)}</div>
      </div>
    `;
  }

  if (props.population && Number(props.population) > 0) {
    html += `
      <div class="popup-row">
        <div class="popup-label">Population</div>
        <div class="popup-value">${escapeHTML(props.population)}</div>
      </div>
    `;
  }

  if (props.ref && String(props.ref).trim() !== '') {
    html += `
      <div class="popup-row">
        <div class="popup-label">Road Reference</div>
        <div class="popup-value">${escapeHTML(props.ref)}</div>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}
// ============================
// 6. Styles
// ============================
function riverStyle() {
  return {
    color: '#00bcd4',
    weight: 3,
    opacity: 0.95
  };
}

function riverCasingStyle() {
  return {
    color: '#ffffff',
    weight: 6,
    opacity: 0.9
  };
}

function arunachalStyle() {
  return {
    color: '#54278f',
    weight: 2,
    dashArray: '6 4',
    fillColor: '#bcbddc',
    fillOpacity: 0.15
  };
}

function paimoRoadStyle() {
  return {
    color: '#f16913',
    weight: 3,
    opacity: 0.95
  };
}

function zhamoRoadStyle() {
  return {
    color: '#31a354',
    weight: 3,
    opacity: 0.95
  };
}

function historicalSitePointStyle(feature, latlng) {
  return L.circleMarker(latlng, {
    radius: 5,
    color: '#222',
    weight: 1,
    fillColor: '#fdd835',
    fillOpacity: 0.9
  });
}
function tsangpoStyle() {
  return {
    color: '#08519c',
    weight: 5,
    opacity: 1
  };
}

function roadsStyle(feature) {
  const fclass = feature.properties?.fclass;

  // major roads 稍微粗一点，普通 path/track 细一点
  let weight = 1.2;
  let opacity = 0.65;

  if (
    fclass === 'primary' ||
    fclass === 'secondary' ||
    fclass === 'tertiary' ||
    fclass === 'trunk'
  ) {
    weight = 2.4;
    opacity = 0.85;
  }

  return {
    color: '#636363',
    weight: weight,
    opacity: opacity
  };
}

function settlementPointStyle(feature, latlng) {
  const fclass = feature.properties?.fclass;

  // Village 比 Hamlet 更大、更醒目
  if (fclass === 'village') {
    return L.circleMarker(latlng, {
      radius: 4.5,
      color: '#7f2704',
      weight: 1,
      fillColor: '#f16913',
      fillOpacity: 0.85
    });
  }

  // Hamlet
  return L.circleMarker(latlng, {
    radius: 3,
    color: '#54278f',
    weight: 1,
    fillColor: '#9e9ac8',
    fillOpacity: 0.8
  });
}
// ============================
// ============================
// 7. Legend control
// ============================
const legend = L.control({ position: 'bottomleft' });

legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'map-legend');
  div.innerHTML = `
    <div style="background: rgba(255,255,255,0.92); padding: 10px 12px; border-radius: 8px; box-shadow: 0 1px 6px rgba(0,0,0,0.18); font: 12px/1.4 Arial, sans-serif; color: #222; min-width: 190px;">
      <div style="font-weight: 700; margin-bottom: 6px;">Map Guide</div>

      <div>
        <span style="display:inline-block;width:18px;height:0;border-top:4px dashed #d7301f;vertical-align:middle;margin-right:8px;"></span>
        Hydropower tunnel
      </div>

      <div style="margin-top:4px;">
        <span style="display:inline-block;width:18px;height:0;border-top:4px solid #08519c;vertical-align:middle;margin-right:8px;"></span>
        Tsangpo / Yarlung Tsangpo
      </div>

      <div style="margin-top:4px;">
       <span style="display:inline-block;width:18px;height:0;border-top:3px solid #00bcd4;vertical-align:middle;margin-right:8px;background:white;"></span>
       Major rivers
      </div>

      <div style="margin-top:4px;">
        <span style="display:inline-block;width:18px;height:0;border-top:2px solid #636363;vertical-align:middle;margin-right:8px;"></span>
        Roads
      </div>

      <div style="margin-top:4px;">
        <span style="display:inline-block;width:18px;height:0;border-top:3px solid #f16913;vertical-align:middle;margin-right:8px;"></span>
        Paimo Road
      </div>

      <div style="margin-top:4px;">
        <span style="display:inline-block;width:18px;height:0;border-top:3px solid #31a354;vertical-align:middle;margin-right:8px;"></span>
        Zhamo Road
      </div>

      <div style="margin-top:4px;">
        <span style="display:inline-block;width:11px;height:11px;background:#f16913;border:1px solid #7f2704;border-radius:50%;vertical-align:middle;margin-right:8px;"></span>
        Village
      </div>

      <div style="margin-top:4px;">
        <span style="display:inline-block;width:8px;height:8px;background:#9e9ac8;border:1px solid #54278f;border-radius:50%;vertical-align:middle;margin-right:11px;"></span>
        Hamlet
      </div>

      <div style="margin-top:4px;">
        <span style="display:inline-block;width:12px;height:12px;background:#fdd835;border:1px solid #333;border-radius:50%;vertical-align:middle;margin-right:8px;"></span>
        Historical sites
      </div>

      <div style="margin-top:4px;">
        <span style="display:inline-block;width:18px;height:10px;border:2px dashed #54278f;background:rgba(188,189,220,0.15);vertical-align:middle;margin-right:8px;"></span>
        Sino-India disputed area
      </div>
    </div>
  `;
  L.DomEvent.disableClickPropagation(div);
  return div;
};

legend.addTo(map);
legend.addTo(map);

// ============================
// 8. Reset view control
// ============================
const ResetViewControl = L.Control.extend({
  options: { position: 'topleft' },

  onAdd: function () {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    const button = L.DomUtil.create('a', '', container);
    button.href = '#';
    button.title = 'Reset view';
    button.setAttribute('aria-label', 'Reset view');
    button.innerHTML = '⌂';
    button.style.fontSize = '18px';
    button.style.fontWeight = '700';
    button.style.lineHeight = '30px';
    button.style.textAlign = 'center';

    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(button, 'click', function (e) {
      L.DomEvent.preventDefault(e);
      map.setView(initialCenter, initialZoom);
    });

    return container;
  }
});

map.addControl(new ResetViewControl());

// ============================
// 9. Historical site labels by zoom
// ============================
let historicalSiteLayers = [];

function updateHistoricalLabels() {
  const showLabels = map.getZoom() >= labelZoomThreshold;
  historicalSiteLayers.forEach(layer => {
    const tooltip = layer.getTooltip && layer.getTooltip();
    if (!tooltip) return;
    if (showLabels) {
      layer.openTooltip();
    } else {
      layer.closeTooltip();
    }
  });
}

map.on('zoomend', updateHistoricalLabels);

// ============================
// 10. Load Historical Sites 
// ============================
fetch('Historical_Site.geojson')
  .then(response => response.json())
  .then(data => {
    const historicalSitesLayer = L.geoJSON(data, {
      pointToLayer: historicalSitePointStyle,
      onEachFeature: function (feature, layer) {
        const siteName = feature.properties?.Name || 'Historical Site';

        layer.bindPopup(buildPopup(feature, siteName));

        layer.bindTooltip(siteName, {
          permanent: true,
          direction: 'top',
          offset: [0, -8],
          className: 'site-label'
        });

        historicalSiteLayers.push(layer);
      }
    });

    layerControl.addOverlay(historicalSitesLayer, 'Historical Sites');
    updateHistoricalLabels();
  })
  .catch(error => console.error('Error loading Historical Site.geojson:', error));

// ============================
// 11C. Load Settlements: Hamlet + Village
// ============================
Promise.all([
  fetch('Hamlet.geojson').then(response => response.json()),
  fetch('Village.geojson').then(response => response.json())
])
  .then(([hamletData, villageData]) => {
    const settlementData = {
      type: 'FeatureCollection',
      features: [
        ...(hamletData.features || []),
        ...(villageData.features || [])
      ]
    };

    const settlementLayer = L.geoJSON(settlementData, {
      pointToLayer: settlementPointStyle,
      onEachFeature: function (feature, layer) {
        const fclass = feature.properties?.fclass;
        const fallbackTitle = fclass === 'village' ? 'Village' : 'Hamlet';

        layer.bindPopup(buildBasicPopup(feature, fallbackTitle));
      }
    });

    layerControl.addOverlay(settlementLayer, 'Settlements');
  })
  .catch(error => console.error('Error loading Hamlet.geojson or Village.geojson:', error));
// ============================
// ============================
// 11. Load Rivers

// ============================
fetch('Cang_Nan_He_Liu.geojson')
  .then(response => response.json())
  .then(data => {

    //  popup
    const riversCasingLayer = L.geoJSON(data, {
      style: riverCasingStyle,
      interactive: false
    });

    // popup
    const riversLineLayer = L.geoJSON(data, {
      style: riverStyle,
      onEachFeature: function (feature, layer) {
        layer.bindPopup(buildPopup(feature, 'Major River'));
      }
    });

    // Merge into one layer, Major Rivers
    const riversLayer = L.layerGroup([
      riversCasingLayer,
      riversLineLayer
    ]).addTo(map);

    layerControl.addOverlay(riversLayer, 'Major Rivers');
  })
  .catch(error => console.error('Error loading Cang_Nan_He_Liu.geojson:', error));
// ============================
// 11B. Load Tsangpo / Yarlung Tsangpo（open)
// ============================
fetch('Tsangpo.geojson')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {

    
    const tsangpoCasingLayer = L.geoJSON(data, {
      style: function () {
        return {
          color: '#ffffff',
          weight: 8,
          opacity: 0.95
        };
      },
      interactive: false
    });

   
    const tsangpoLineLayer = L.geoJSON(data, {
      style: tsangpoStyle,
      onEachFeature: function (feature, layer) {
        layer.bindPopup(buildBasicPopup(feature, 'Tsangpo / Yarlung Tsangpo'));
      }
    });

    const tsangpoLayer = L.layerGroup([
      tsangpoCasingLayer,
      tsangpoLineLayer
    ]).addTo(map);

    layerControl.addOverlay(tsangpoLayer, 'Tsangpo / Yarlung Tsangpo');
  })
  .catch(error => console.error('Error loading Tsangpo.geojson:', error));
// ============================

// ============================
// ============================
// 13. Load Arunachal Pradesh（默认关）
// 作为背景范围层，不阻挡河流和地点点击
// ============================
fetch('Arunachal-Pradesh.geojson')
  .then(response => response.json())
  .then(data => {
    const arunachalLayer = L.geoJSON(data, {
      style: arunachalStyle,

      // 关键：不让 disputed area polygon 抢走点击事件
      interactive: false,

      onEachFeature: function (feature, layer) {
        // 如果 interactive: false，这个 popup 基本不会被点击触发
        // 所以这里可以不绑定 popup
        // layer.bindPopup(buildPopup(feature, 'Sino-India Disputed Area'));
      }
    });

    layerControl.addOverlay(arunachalLayer, 'Sino-India Disputed Area');
  })
  .catch(error => console.error('Error loading Arunachal-Pradesh.geojson:', error));

// ============================
// 14. Load Paimo Road（默认开）
// ============================
fetch('paimo_road.geojson')
  .then(response => response.json())
  .then(data => {
    const paimoRoadLayer = L.geoJSON(data, {
      style: paimoRoadStyle,
      onEachFeature: function (feature, layer) {
        layer.bindPopup(buildPopup(feature, 'Paimo Road'));
      }
    }).addTo(map);

    layerControl.addOverlay(paimoRoadLayer, 'Paimo Road');
  })
  .catch(error => console.error('Error loading paimo_road.geojson:', error));

// ============================
// 11D. Load Roads（默认关）
// ============================
fetch('Roads.geojson')
  .then(response => response.json())
  .then(data => {
    const roadsLayer = L.geoJSON(data, {
      style: roadsStyle,
      onEachFeature: function (feature, layer) {
        layer.bindPopup(buildBasicPopup(feature, 'Road'));
      }
    });

    layerControl.addOverlay(roadsLayer, 'Roads');
  })
  .catch(error => console.error('Error loading Roads.geojson:', error));

// ============================
// 15. Load Zhamo Road（默认开）
// ============================
fetch('zhamo_road.geojson')
  .then(response => response.json())
  .then(data => {
    const zhamoRoadLayer = L.geoJSON(data, {
      style: zhamoRoadStyle,
      onEachFeature: function (feature, layer) {
        layer.bindPopup(buildPopup(feature, 'Zhamo Road'));
      }
    }).addTo(map);

    layerControl.addOverlay(zhamoRoadLayer, 'Zhamo Road');
  })
  .catch(error => console.error('Error loading zhamo_road.geojson:', error));
