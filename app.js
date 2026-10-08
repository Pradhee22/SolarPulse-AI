/**
 * SolarPulse AI - Industrial IoT Solar Monitoring Dashboard
 * Clean, Modular, Single-Event Architecture
 * 
 * 1. Configuration
 * 2. Demo Data & State Store
 * 3. UI Update Functions
 * 4. Navigation Engine (Single Centralized Dispatcher)
 * 5. Charts Management (Chart.js Singletons)
 * 6. AI Thermal Scan Module
 * 7. Alerts Management
 * 8. Maintenance Operations
 * 9. Settings & Theme
 * 10. Initialization
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURATION
  // ==========================================================================
  const CONFIG = {
    appName: 'SolarPulse AI',
    defaultIntervalMs: 2500,
    historyCapacity: 12,
    thresholds: {
      minPower: 80,
      minEfficiency: 12.0,
      maxTemperature: 65.0
    },
    weatherProfiles: {
      clear: { irr: 1048, irrJitter: 25, temp: 32.4, tempJitter: 0.5, hum: 58, volt: 38.6, curr: 5.64 },
      partly_cloudy: { irr: 780, irrJitter: 55, temp: 29.5, tempJitter: 0.8, hum: 64, volt: 37.8, curr: 4.25 },
      overcast: { irr: 390, irrJitter: 30, temp: 24.2, tempJitter: 0.4, hum: 78, volt: 36.2, curr: 2.15 },
      peak_summer: { irr: 1140, irrJitter: 20, temp: 44.6, tempJitter: 0.6, hum: 42, volt: 39.2, curr: 6.05 },
      monsoon: { irr: 280, irrJitter: 40, temp: 22.8, tempJitter: 0.5, hum: 88, volt: 35.4, curr: 1.55 }
    }
  };

  // ==========================================================================
  // 2. DEMO DATA & STATE STORE
  // ==========================================================================
  const state = {
    activeSection: 'dashboard',
    selectedPanel: 'SP-A104',
    weatherPreset: 'clear',
    demoModeActive: true,
    updateIntervalMs: 2500,
    theme: 'dark',
    timerId: null,
    
    // Telemetry current reading
    telemetry: {
      voltage: 38.6,
      current: 5.64,
      power: 217.7,
      efficiency: 19.5,
      irradiance: 1048,
      temperature: 32.4,
      humidity: 58,
      pressure: 1008
    },

    // Rolling history for charts and table
    history: [],

    // Alerts collection
    alerts: [
      {
        id: 'alt-1',
        severity: 'HIGH',
        panelId: 'SP-A104',
        timestamp: 'Today, 14:32:01',
        title: 'Hotspot detected on Panel SP-A104',
        description: 'Localized thermal shunting anomaly on Cell 14B exceeding threshold (67.8°C).'
      },
      {
        id: 'alt-2',
        severity: 'MEDIUM',
        panelId: 'SP-A102',
        timestamp: 'Today, 09:15:20',
        title: 'Panel efficiency below expected range',
        description: 'Measured efficiency drop of 3.2% vs STC baseline due to surface particulate accumulation.'
      },
      {
        id: 'alt-3',
        severity: 'LOW',
        panelId: 'SP-B201',
        timestamp: 'Yesterday, 17:00:00',
        title: 'Scheduled thermal inspection approaching',
        description: 'Bi-weekly drone radiometric thermography pass queued for Sub-Array B.'
      }
    ],

    // Maintenance tasks
    maintenance: [
      {
        id: 1,
        title: 'HOTSPOT DETECTED',
        panelId: 'SP-A104',
        priority: 'HIGH',
        status: 'Pending',
        recommendation: 'Inspect affected panel and electrical connections. Check bypass diode and thermal hotspot on Cell 14B.',
        reported: 'Oct 26, 14:32'
      },
      {
        id: 2,
        title: 'DUST ACCUMULATION',
        panelId: 'SP-A102',
        priority: 'MEDIUM',
        status: 'Recommended',
        recommendation: 'Schedule panel cleaning. Soiling index calculated at 6.4% output attenuation across northern string.',
        reported: 'Oct 26, 09:15'
      },
      {
        id: 3,
        title: 'INVERTER CALIBRATION',
        panelId: 'SP-B201',
        priority: 'LOW',
        status: 'Scheduled',
        recommendation: 'Run micro-inverter MPPT loop calibration routine during overnight low-voltage standby window.',
        reported: 'Yesterday'
      }
    ]
  };

  // Helper to generate formatted time string (HH:MM:SS)
  function formatCurrentTime(dateObj = new Date()) {
    return dateObj.toTimeString().split(' ')[0];
  }

  // Generate realistic sensor data step
  function generateTelemetryStep() {
    const profile = CONFIG.weatherProfiles[state.weatherPreset] || CONFIG.weatherProfiles.clear;
    
    // Natural jitter
    const vJitter = (Math.random() - 0.5) * 0.4;
    const iJitter = (Math.random() - 0.5) * 0.15;
    const irrJitter = (Math.random() - 0.5) * (profile.irrJitter || 20);
    const tJitter = (Math.random() - 0.5) * (profile.tempJitter || 0.4);
    const hJitter = Math.floor((Math.random() - 0.5) * 2);
    const pJitter = Math.floor((Math.random() - 0.5) * 2);

    const voltage = parseFloat(Math.max(30.0, profile.volt + vJitter).toFixed(2));
    const current = parseFloat(Math.max(0.2, profile.curr + iJitter).toFixed(2));
    
    // Physical law: Power = Voltage * Current
    const power = parseFloat((voltage * current).toFixed(1));

    const irradiance = Math.round(Math.max(100, profile.irr + irrJitter));
    
    // Solar efficiency empirical calculation: (Power / (Irradiance * Area * STC_Factor))
    // Approximate typical panel surface area ~1.05m²
    const rawEff = (power / (irradiance * 1.06)) * 100;
    const efficiency = parseFloat(Math.min(22.5, Math.max(8.0, rawEff)).toFixed(1));

    const temperature = parseFloat((profile.temp + tJitter).toFixed(1));
    const humidity = Math.min(100, Math.max(20, profile.hum + hJitter));
    const pressure = 1008 + pJitter;

    const timeStr = formatCurrentTime();

    state.telemetry = {
      time: timeStr,
      voltage,
      current,
      power,
      efficiency,
      irradiance,
      temperature,
      humidity,
      pressure
    };

    // Push into rolling history
    state.history.push({ ...state.telemetry });
    if (state.history.length > CONFIG.historyCapacity) {
      state.history.shift();
    }
  }

  // Pre-fill initial history so charts have immediate real trajectories
  function seedHistory() {
    state.history = [];
    const now = new Date();
    for (let i = 10; i >= 0; i--) {
      const past = new Date(now.getTime() - i * state.updateIntervalMs);
      const timeStr = formatCurrentTime(past);
      const profile = CONFIG.weatherProfiles[state.weatherPreset] || CONFIG.weatherProfiles.clear;
      const v = parseFloat((profile.volt + (Math.random() - 0.5) * 0.3).toFixed(2));
      const c = parseFloat((profile.curr + (Math.random() - 0.5) * 0.12).toFixed(2));
      const p = parseFloat((v * c).toFixed(1));
      const irr = Math.round(profile.irr + (Math.random() - 0.5) * 25);
      const eff = parseFloat(((p / (irr * 1.06)) * 100).toFixed(1));
      const t = parseFloat((profile.temp + (Math.random() - 0.5) * 0.3).toFixed(1));

      state.history.push({
        time: timeStr,
        voltage: v,
        current: c,
        power: p,
        efficiency: eff,
        irradiance: irr,
        temperature: t,
        humidity: profile.hum,
        pressure: 1008
      });
    }
    // Latest reading matches last history item
    state.telemetry = { ...state.history[state.history.length - 1] };
  }

  // ==========================================================================
  // 3. UI UPDATE FUNCTIONS
  // ==========================================================================
  function updateDashboardUI() {
    const t = state.telemetry;

    // Time
    const timeEl = document.getElementById('liveTimestamp');
    if (timeEl) timeEl.textContent = t.time || formatCurrentTime();

    // 8 KPI Values
    setTextContent('kpi-voltage', t.voltage.toFixed(2));
    setTextContent('kpi-current', t.current.toFixed(2));
    setTextContent('kpi-power', t.power.toFixed(1));
    setTextContent('kpi-efficiency', t.efficiency.toFixed(1));
    setTextContent('kpi-irradiance', t.irradiance);
    setTextContent('kpi-temperature', t.temperature.toFixed(1));
    setTextContent('kpi-humidity', t.humidity);
    setTextContent('kpi-pressure', t.pressure);

    // Array Health
    setTextContent('healthOutputDisplay', `${t.power.toFixed(1)} W`);
    setTextContent('healthEffDisplay', `${t.efficiency.toFixed(1)}%`);

    // Live Telemetry Table
    updateTelemetryTable();

    // Update Dashboard charts
    updateDashboardCharts();
  }

  function setTextContent(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = text;
  }

  function updateTelemetryTable() {
    const tbody = document.getElementById('telemetryTableBody');
    if (!tbody) return;

    // Display the most recent 6 items, reverse chronological
    const recent = [...state.history].reverse().slice(0, 7);

    tbody.innerHTML = recent.map((row, index) => {
      const isNewest = index === 0 ? 'table-row-new' : '';
      return `
        <tr class="${isNewest}">
          <td><span class="text-emerald font-semibold">${row.time}</span></td>
          <td>${row.voltage.toFixed(2)}</td>
          <td>${row.current.toFixed(2)}</td>
          <td><strong class="text-emerald">${row.power.toFixed(1)}</strong></td>
          <td>${row.efficiency.toFixed(1)}%</td>
          <td>${row.irradiance}</td>
          <td>${row.temperature.toFixed(1)}</td>
        </tr>
      `;
    }).join('');
  }

  // ==========================================================================
  // 4. NAVIGATION ENGINE (Single Centralized Event System)
  // ==========================================================================
  /**
   * CRITICAL NAVIGATION REQUIREMENT:
   * 1. Single centralized event delegator.
   * 2. Prevent default link behavior.
   * 3. Remove "active" from every page section.
   * 4. Add "active" to the selected page.
   * 5. Remove "active" from every sidebar and mobile nav item.
   * 6. Add "active" to the selected item.
   * 7. Resize/render charts if needed on view change.
   */
  function navigateToSection(targetSectionId) {
    if (!targetSectionId) return;

    // Normalize (strip any leading hash or 'section-')
    const sectionName = targetSectionId.replace(/^#/, '').replace(/^section-/, '');
    const fullTargetId = `section-${sectionName}`;
    const targetElement = document.getElementById(fullTargetId);

    if (!targetElement) {
      console.warn(`[Navigation] Target section #${fullTargetId} not found.`);
      return;
    }

    // 1. Remove "active" from every page section
    const allSections = document.querySelectorAll('.page-section');
    allSections.forEach(sec => sec.classList.remove('active'));

    // 2. Add "active" to the selected page
    targetElement.classList.add('active');

    // 3. Remove "active" from every navigation item (sidebar, mobile nav, header)
    const allNavLinks = document.querySelectorAll('[data-section]');
    allNavLinks.forEach(link => {
      if (link.getAttribute('data-section') === sectionName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update state
    state.activeSection = sectionName;

    // Trigger Chart.js resize if moving into an analytics or dashboard section
    if (sectionName === 'analytics') {
      initOrResizeAnalyticsCharts();
    } else if (sectionName === 'dashboard') {
      resizeDashboardCharts();
    }

    // Scroll to top of content smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupUnifiedNavigation() {
    // Single global click event listener capturing all navigation requests
    document.addEventListener('click', function (event) {
      // Find closest element with data-section attribute
      const navTrigger = event.target.closest('[data-section]');
      if (!navTrigger) return;

      const targetSection = navTrigger.getAttribute('data-section');
      if (targetSection) {
        event.preventDefault();
        navigateToSection(targetSection);
      }
    });
  }

  // ==========================================================================
  // 5. CHARTS MANAGEMENT (Chart.js Singletons)
  // ==========================================================================
  const charts = {
    dashPower: null,
    dashEnv: null,
    analyticsPower: null,
    analyticsVoltage: null,
    analyticsCurrent: null,
    analyticsEfficiency: null,
    analyticsTemp: null,
    analyticsIrradiance: null
  };

  // Base Chart.js dark/industrial theme styling
  function getChartThemeConfig() {
    const isDark = document.body.classList.contains('theme-dark') || !document.body.classList.contains('theme-light');
    return {
      gridColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      tickColor: isDark ? '#64748b' : '#94a3b8',
      fontFamily: "'JetBrains Mono', 'Inter', monospace"
    };
  }

  function initDashboardCharts() {
    const theme = getChartThemeConfig();

    // 1. Real-Time Power Output Chart
    const powerCanvas = document.getElementById('dashPowerChart');
    if (powerCanvas) {
      const labels = state.history.map(h => h.time);
      const data = state.history.map(h => h.power);

      charts.dashPower = new Chart(powerCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Power (W)',
            data: data,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#10b981',
            pointHoverRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0a1020',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              borderWidth: 1,
              titleFont: { family: theme.fontFamily },
              bodyFont: { family: theme.fontFamily }
            }
          },
          scales: {
            x: {
              grid: { color: theme.gridColor },
              ticks: { color: theme.tickColor, font: { family: theme.fontFamily, size: 10 } }
            },
            y: {
              grid: { color: theme.gridColor },
              ticks: { color: theme.tickColor, font: { family: theme.fontFamily, size: 10 } },
              suggestedMin: 150,
              suggestedMax: 260
            }
          }
        }
      });
    }

    // 2. Environmental Telemetry Chart
    const envCanvas = document.getElementById('dashEnvChart');
    if (envCanvas) {
      const labels = state.history.map(h => h.time);
      const tempData = state.history.map(h => h.temperature);
      const humData = state.history.map(h => h.humidity);
      const irrData = state.history.map(h => h.irradiance / 20); // Normalized scale

      charts.dashEnv = new Chart(envCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Temp (°C)',
              data: tempData,
              borderColor: '#ef4444',
              backgroundColor: 'transparent',
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 2
            },
            {
              label: 'Humidity (%)',
              data: humData,
              borderColor: '#3b82f6',
              backgroundColor: 'transparent',
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 2
            },
            {
              label: 'Irradiance / 20',
              data: irrData,
              borderColor: '#f59e0b',
              backgroundColor: 'transparent',
              borderDash: [4, 4],
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: theme.tickColor,
                font: { family: theme.fontFamily, size: 11 },
                boxWidth: 12
              }
            },
            tooltip: {
              backgroundColor: '#0a1020',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              titleFont: { family: theme.fontFamily },
              bodyFont: { family: theme.fontFamily }
            }
          },
          scales: {
            x: {
              grid: { color: theme.gridColor },
              ticks: { color: theme.tickColor, font: { family: theme.fontFamily, size: 10 } }
            },
            y: {
              grid: { color: theme.gridColor },
              ticks: { color: theme.tickColor, font: { family: theme.fontFamily, size: 10 } }
            }
          }
        }
      });
    }
  }

  function updateDashboardCharts() {
    const labels = state.history.map(h => h.time);

    if (charts.dashPower) {
      charts.dashPower.data.labels = labels;
      charts.dashPower.data.datasets[0].data = state.history.map(h => h.power);
      charts.dashPower.update('none'); // silent update for smoothness
    }

    if (charts.dashEnv) {
      charts.dashEnv.data.labels = labels;
      charts.dashEnv.data.datasets[0].data = state.history.map(h => h.temperature);
      charts.dashEnv.data.datasets[1].data = state.history.map(h => h.humidity);
      charts.dashEnv.data.datasets[2].data = state.history.map(h => h.irradiance / 20);
      charts.dashEnv.update('none');
    }

    // Update Analytics charts if active
    if (state.activeSection === 'analytics') {
      updateAnalyticsCharts();
    }
  }

  function resizeDashboardCharts() {
    if (charts.dashPower) charts.dashPower.resize();
    if (charts.dashEnv) charts.dashEnv.resize();
  }

  // Analytics 6 Charts initialization
  function initOrResizeAnalyticsCharts() {
    const theme = getChartThemeConfig();
    const labels = state.history.map(h => h.time);

    const helperInit = (canvasId, chartKey, label, color, extractData, suggestedMin, suggestedMax) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      if (charts[chartKey]) {
        charts[chartKey].resize();
        charts[chartKey].data.labels = labels;
        charts[chartKey].data.datasets[0].data = state.history.map(extractData);
        charts[chartKey].update('none');
        return;
      }

      charts[chartKey] = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: label,
            data: state.history.map(extractData),
            borderColor: color,
            backgroundColor: color.replace(')', ', 0.12)').replace('rgb', 'rgba'),
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 2.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0a1020',
              borderColor: color,
              borderWidth: 1,
              titleFont: { family: theme.fontFamily },
              bodyFont: { family: theme.fontFamily }
            }
          },
          scales: {
            x: {
              grid: { color: theme.gridColor },
              ticks: { color: theme.tickColor, font: { family: theme.fontFamily, size: 10 } }
            },
            y: {
              grid: { color: theme.gridColor },
              ticks: { color: theme.tickColor, font: { family: theme.fontFamily, size: 10 } },
              suggestedMin,
              suggestedMax
            }
          }
        }
      });
    };

    helperInit('analyticsPowerChart', 'analyticsPower', 'Power (W)', 'rgb(16, 185, 129)', h => h.power, 150, 260);
    helperInit('analyticsVoltageChart', 'analyticsVoltage', 'Voltage (V)', 'rgb(59, 130, 246)', h => h.voltage, 32, 45);
    helperInit('analyticsCurrentChart', 'analyticsCurrent', 'Current (A)', 'rgb(245, 158, 11)', h => h.current, 1, 8);
    helperInit('analyticsEfficiencyChart', 'analyticsEfficiency', 'Efficiency (%)', 'rgb(16, 185, 129)', h => h.efficiency, 10, 24);
    helperInit('analyticsTempChart', 'analyticsTemp', 'Temperature (°C)', 'rgb(239, 68, 68)', h => h.temperature, 20, 60);
    helperInit('analyticsIrradianceChart', 'analyticsIrradiance', 'Irradiance (W/m²)', 'rgb(245, 158, 11)', h => h.irradiance, 200, 1200);
  }

  function updateAnalyticsCharts() {
    const labels = state.history.map(h => h.time);
    const updateHelper = (chartKey, extractData) => {
      if (charts[chartKey]) {
        charts[chartKey].data.labels = labels;
        charts[chartKey].data.datasets[0].data = state.history.map(extractData);
        charts[chartKey].update('none');
      }
    };

    updateHelper('analyticsPower', h => h.power);
    updateHelper('analyticsVoltage', h => h.voltage);
    updateHelper('analyticsCurrent', h => h.current);
    updateHelper('analyticsEfficiency', h => h.efficiency);
    updateHelper('analyticsTemp', h => h.temperature);
    updateHelper('analyticsIrradiance', h => h.irradiance);
  }

  // ==========================================================================
  // 6. AI THERMAL SCAN MODULE
  // ==========================================================================
  /**
   * Requirements:
   * 1. Display Panel ID: SP-A104, Last Scan: Today, AI Classification: Hotspot Detected, Confidence: 97%, Risk: HIGH.
   * 2. When 'Run AI Thermal Scan' clicked:
   *    - Show "Scanning..." for ~2 seconds.
   *    - Show loading animation / scanner laser line.
   *    - Then show: Hotspot Detected, 97% Confidence, High Risk.
   *    - Update last scan time.
   * 3. Upload Thermal Image: allow user to select local file and preview it.
   */
  function setupAiThermalScan() {
    const btnRunScan = document.getElementById('btnRunAiScan');
    const dashQuickScanBtn = document.getElementById('dashQuickScanBtn');
    const btnRunScanText = document.getElementById('btnRunAiScanText');
    const laserLine = document.getElementById('scannerLaserLine');
    const overlayState = document.getElementById('scanOverlayState');
    const hotspotBox = document.getElementById('aiHotspotBox');
    const uploadInput = document.getElementById('thermalImageUpload');
    const btnTriggerUpload = document.getElementById('btnTriggerUpload');
    const mainThermalImg = document.getElementById('thermalMainImage');
    const dashThermalThumb = document.getElementById('dashThermalThumb');

    function executeScanRoutine() {
      if (btnRunScan) btnRunScan.disabled = true;
      if (btnRunScanText) btnRunScanText.textContent = 'Scanning...';

      // Activate scan animations
      if (laserLine) laserLine.classList.add('scanning');
      if (overlayState) overlayState.classList.add('active');
      if (hotspotBox) hotspotBox.style.opacity = '0.2';

      // 2-second simulated ML inference pipeline
      setTimeout(() => {
        // Complete scan
        if (laserLine) laserLine.classList.remove('scanning');
        if (overlayState) overlayState.classList.remove('active');
        if (hotspotBox) hotspotBox.style.opacity = '1';

        const nowFormatted = `Today, ${formatCurrentTime()}`;

        // Update fields
        setTextContent('aiLastScanDisplay', nowFormatted);
        setTextContent('dashThermalTime', nowFormatted);
        setTextContent('aiClassificationDisplay', 'Hotspot Detected');
        setTextContent('aiConfidenceDisplay', '97%');
        setTextContent('dashThermalConf', '97%');
        setTextContent('aiMaxTempDisplay', '67.8 °C');

        const riskPill = document.getElementById('aiRiskPill');
        if (riskPill) {
          riskPill.className = 'badge badge-red-pill';
          riskPill.textContent = 'HIGH RISK';
        }

        const dashRisk = document.getElementById('dashThermalRisk');
        if (dashRisk) {
          dashRisk.className = 'badge badge-red';
          dashRisk.textContent = 'HIGH';
        }

        if (btnRunScan) btnRunScan.disabled = false;
        if (btnRunScanText) btnRunScanText.textContent = 'Run AI Thermal Scan';

        showToast('AI Thermal Scan Complete: Hotspot verified (97% Conf, High Risk)', 'error');
      }, 2000);
    }

    if (btnRunScan) {
      btnRunScan.addEventListener('click', executeScanRoutine);
    }

    if (dashQuickScanBtn) {
      dashQuickScanBtn.addEventListener('click', () => {
        navigateToSection('aiscan');
        setTimeout(executeScanRoutine, 300);
      });
    }

    // Local image upload handler
    if (btnTriggerUpload && uploadInput) {
      btnTriggerUpload.addEventListener('click', () => uploadInput.click());

      uploadInput.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (event) {
            const uploadedUrl = event.target.result;
            if (mainThermalImg) mainThermalImg.src = uploadedUrl;
            if (dashThermalThumb) dashThermalThumb.src = uploadedUrl;
            showToast(`Uploaded ${file.name}: Ready for AI diagnosis`, 'info');
            // Trigger auto-scan on new upload
            setTimeout(executeScanRoutine, 500);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  // ==========================================================================
  // 7. ALERTS MANAGEMENT
  // ==========================================================================
  function updateAlertsBadge() {
    const count = state.alerts.length;
    const headerBadge = document.getElementById('headerAlertBadge');
    const sidebarBadge = document.getElementById('sidebarAlertsBadge');

    if (headerBadge) {
      headerBadge.textContent = count;
      headerBadge.style.display = count > 0 ? 'flex' : 'none';
    }
    if (sidebarBadge) {
      sidebarBadge.textContent = count;
      sidebarBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }

  function renderAlertsFeed() {
    const container = document.getElementById('alertsFeedContainer');
    if (!container) return;

    if (state.alerts.length === 0) {
      container.innerHTML = `
        <div class="empty-alerts-state">
          <span class="material-symbols-outlined">check_circle</span>
          <h3 class="font-semibold text-main">All Array Systems Normal</h3>
          <p class="text-muted text-sm mt-1">No active critical alerts or telemetry threshold exceptions reported.</p>
        </div>
      `;
      updateAlertsBadge();
      return;
    }

    container.innerHTML = state.alerts.map(alert => {
      const severityClass = alert.severity === 'HIGH' ? 'alert-high' : alert.severity === 'MEDIUM' ? 'alert-med' : 'alert-low';
      const badgeClass = alert.severity === 'HIGH' ? 'badge-red' : alert.severity === 'MEDIUM' ? 'badge-amber' : 'badge-blue';
      const icon = alert.severity === 'HIGH' ? 'local_fire_department' : alert.severity === 'MEDIUM' ? 'warning' : 'info';

      return `
        <div class="alert-item-card ${severityClass}" id="alertCard-${alert.id}">
          <div class="alert-content-left">
            <div class="alert-icon-wrapper">
              <span class="material-symbols-outlined">${icon}</span>
            </div>
            <div class="alert-text-block">
              <div class="alert-top-meta">
                <span class="badge ${badgeClass}">${alert.severity} ALERT</span>
                <span class="font-mono text-emerald text-xs">${alert.panelId}</span>
                <span class="text-muted text-xs font-mono">• ${alert.timestamp}</span>
              </div>
              <div class="alert-title-text">${alert.title}</div>
              <div class="alert-desc-text">${alert.description}</div>
            </div>
          </div>
          <div class="alert-actions-right">
            <button class="btn btn-secondary btn-sm" data-action="resolve-alert" data-alert-id="${alert.id}" type="button">
              <span class="material-symbols-outlined icon-xs">done</span>
              <span>Mark Resolved</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    updateAlertsBadge();
  }

  function setupAlertsHandlers() {
    const container = document.getElementById('alertsFeedContainer');
    if (container) {
      container.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-action="resolve-alert"]');
        if (btn) {
          const alertId = btn.getAttribute('data-alert-id');
          resolveAlert(alertId);
        }
      });
    }

    const btnClearAll = document.getElementById('btnClearAllAlerts');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', function () {
        if (state.alerts.length === 0) return;
        state.alerts = [];
        renderAlertsFeed();
        showToast('All alerts cleared successfully', 'success');
      });
    }
  }

  function resolveAlert(alertId) {
    state.alerts = state.alerts.filter(a => a.id !== alertId);
    renderAlertsFeed();
    showToast(`Alert ${alertId} resolved and archived`, 'success');
  }

  // ==========================================================================
  // 8. MAINTENANCE OPERATIONS
  // ==========================================================================
  function setupMaintenanceHandlers() {
    const container = document.getElementById('maintenanceCardsContainer');
    if (!container) return;

    container.addEventListener('click', function (e) {
      const completeBtn = e.target.closest('[data-action="complete-maint"]') || e.target.closest('.maint-actions button:last-child');
      const scheduleBtn = e.target.closest('[data-action="schedule-maint"]') || e.target.closest('.maint-actions button:first-child');
      const card = e.target.closest('.maint-card');

      if (!card) return;

      if (completeBtn) {
        const statusBadge = card.querySelector('.maint-status-badge');
        if (statusBadge) {
          statusBadge.className = 'badge badge-emerald maint-status-badge';
          statusBadge.textContent = 'Completed';
        }
        completeBtn.disabled = true;
        completeBtn.style.opacity = '0.5';
        completeBtn.style.pointerEvents = 'none';
        showToast('Work order marked as COMPLETED', 'success');
        updateMaintBadge();
      } else if (scheduleBtn) {
        const statusBadge = card.querySelector('.maint-status-badge');
        if (statusBadge) {
          statusBadge.className = 'badge badge-blue maint-status-badge';
          statusBadge.textContent = 'Scheduled';
        }
        showToast('Maintenance technician dispatched / scheduled', 'info');
      }
    });

    const btnNewOrder = document.getElementById('btnNewWorkOrder');
    if (btnNewOrder) {
      btnNewOrder.addEventListener('click', () => {
        showToast('Work order dispatch dialog initialized', 'info');
      });
    }
  }

  function updateMaintBadge() {
    const sidebarBadge = document.getElementById('sidebarMaintBadge');
    if (sidebarBadge) {
      const activePending = document.querySelectorAll('.maint-status-badge:not(.badge-emerald)').length;
      sidebarBadge.textContent = activePending;
    }
  }

  // Global methods for maintenance buttons if triggered externally
  window.app = {
    scheduleMaint: function (id) {
      const badge = document.getElementById(`maintStatus-${id}`);
      if (badge) {
        badge.className = 'badge badge-blue maint-status-badge';
        badge.textContent = 'Scheduled';
      }
      showToast(`Work order #${id} successfully scheduled`, 'info');
    },
    completeMaint: function (id) {
      const badge = document.getElementById(`maintStatus-${id}`);
      if (badge) {
        badge.className = 'badge badge-emerald maint-status-badge';
        badge.textContent = 'Completed';
      }
      showToast(`Work order #${id} marked COMPLETE`, 'success');
      updateMaintBadge();
    }
  };

  // ==========================================================================
  // 9. SETTINGS & THEME
  // ==========================================================================
  function setupSettings() {
    // Theme toggle in header & settings page
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeToggleIcon');
    const btnDark = document.getElementById('btnThemeDark');
    const btnLight = document.getElementById('btnThemeLight');

    function applyTheme(isDark) {
      if (isDark) {
        document.body.classList.remove('theme-light');
        document.body.classList.add('theme-dark');
        state.theme = 'dark';
        if (themeIcon) themeIcon.textContent = 'light_mode';
        if (btnDark) btnDark.classList.add('active');
        if (btnLight) btnLight.classList.remove('active');
      } else {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
        state.theme = 'light';
        if (themeIcon) themeIcon.textContent = 'dark_mode';
        if (btnDark) btnDark.classList.remove('active');
        if (btnLight) btnLight.classList.add('active');
      }
      // Re-render chart grids with new theme colors
      if (charts.dashPower) charts.dashPower.update();
      if (charts.dashEnv) charts.dashEnv.update();
      if (state.activeSection === 'analytics') {
        initOrResizeAnalyticsCharts();
      }
    }

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        applyTheme(state.theme !== 'dark');
      });
    }

    if (btnDark) btnDark.addEventListener('click', () => applyTheme(true));
    if (btnLight) btnLight.addEventListener('click', () => applyTheme(false));

    // Demo Mode toggle
    const demoToggle = document.getElementById('demoModeToggle');
    const livePill = document.getElementById('liveStatusPill');
    const liveText = document.getElementById('liveStatusText');

    if (demoToggle) {
      demoToggle.addEventListener('change', function () {
        state.demoModeActive = this.checked;
        if (state.demoModeActive) {
          if (livePill) {
            livePill.className = 'status-pill status-demo';
            liveText.textContent = 'Demo Mode';
          }
          startTelemetryLoop();
          showToast('Demo Simulation Mode Activated', 'info');
        } else {
          if (livePill) {
            livePill.className = 'status-pill status-live';
            liveText.textContent = 'ESP32 Live';
          }
          stopTelemetryLoop();
          showToast('Switched to ESP32 Live Hardware Gateway Mode', 'success');
        }
      });
    }

    // Telemetry update interval
    const intervalSelect = document.getElementById('updateIntervalSelect');
    const intervalDisplay = document.getElementById('sidebarIntervalDisplay');

    if (intervalSelect) {
      intervalSelect.addEventListener('change', function () {
        const newInterval = parseInt(this.value, 10);
        state.updateIntervalMs = newInterval;
        if (intervalDisplay) {
          intervalDisplay.textContent = `${(newInterval / 1000).toFixed(1)}s`;
        }
        if (state.demoModeActive) {
          stopTelemetryLoop();
          startTelemetryLoop();
        }
        showToast(`Sampling interval updated to ${(newInterval / 1000).toFixed(1)}s`, 'info');
      });
    }

    // Save Alert Thresholds
    const btnSaveThresh = document.getElementById('btnSaveThresholds');
    if (btnSaveThresh) {
      btnSaveThresh.addEventListener('click', () => {
        const minP = parseFloat(document.getElementById('threshMinPower')?.value || '80');
        const minE = parseFloat(document.getElementById('threshMinEfficiency')?.value || '12');
        const maxT = parseFloat(document.getElementById('threshMaxTemp')?.value || '65');

        CONFIG.thresholds = { minPower: minP, minEfficiency: minE, maxTemperature: maxT };
        showToast('Sensor threshold configuration saved to EEPROM / Local', 'success');
      });
    }

    // Panel Selector (Header)
    const panelSelect = document.getElementById('panelSelect');
    if (panelSelect) {
      panelSelect.addEventListener('change', function () {
        state.selectedPanel = this.value;
        setTextContent('aiPanelIdDisplay', state.selectedPanel);
        setTextContent('scanPanelBadge', `Array Target: ${state.selectedPanel}`);
        showToast(`Array telemetry switched to target: ${state.selectedPanel}`, 'info');
      });
    }

    // Weather Preset Selector (Header)
    const weatherSelect = document.getElementById('weatherPreset');
    if (weatherSelect) {
      weatherSelect.addEventListener('change', function () {
        state.weatherPreset = this.value;
        generateTelemetryStep();
        updateDashboardUI();
        showToast(`Atmospheric preset loaded: ${this.options[this.selectedIndex].text}`, 'info');
      });
    }

    // Manual Sync Button
    const btnRefresh = document.getElementById('btnRefreshData');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        generateTelemetryStep();
        updateDashboardUI();
        showToast('Telemetry synchronized with hardware node', 'success');
      });
    }
  }

  // ==========================================================================
  // TOAST NOTIFICATION UTILITY
  // ==========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

    toast.innerHTML = `
      <span class="material-symbols-outlined icon-sm text-${type === 'success' ? 'emerald' : type === 'error' ? 'red' : 'blue'}">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // ==========================================================================
  // TELEMETRY LOOP CONTROLS
  // ==========================================================================
  function startTelemetryLoop() {
    stopTelemetryLoop();
    state.timerId = setInterval(() => {
      if (state.demoModeActive) {
        generateTelemetryStep();
        updateDashboardUI();
      }
    }, state.updateIntervalMs);
  }

  function stopTelemetryLoop() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  // ==========================================================================
  // 10. INITIALIZATION
  // ==========================================================================
  function initApp() {
    console.log(`[${CONFIG.appName}] Initializing Industrial Photovoltaic Monitoring Core...`);

    // 1. Seed initial telemetry trajectory
    seedHistory();

    // 2. Setup Centralized Navigation
    setupUnifiedNavigation();

    // 3. Setup Dashboard Charts
    initDashboardCharts();

    // 4. Render Initial Dashboard Telemetry
    updateDashboardUI();

    // 5. Setup AI Thermal Inspection
    setupAiThermalScan();

    // 6. Setup Alerts Feed
    renderAlertsFeed();
    setupAlertsHandlers();

    // 7. Setup Maintenance Operations
    setupMaintenanceHandlers();

    // 8. Setup Settings & Theme
    setupSettings();

    // 9. Start real-time telemetry generation loop (2.5s)
    startTelemetryLoop();

    console.log(`[${CONFIG.appName}] Core initialization complete. Navigation & Telemetry active.`);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
