const metrics = {
  lcp: {
    name: "LCP",
    fullName: "Largest Contentful Paint",
    weight: 0.3,
    thresholds: { good: 2500, needsImprovement: 4000 },
    color: "var(--metric-lcp-color)",
    currentValue: 2500,
    tooltipContent:
      "LCP measures how long it takes for the largest content element in the viewport to render. Good: ≤2.5s, Needs Improvement: 2.5-4.0s, Poor: >4.0s. To improve: optimize server response times, eliminate render-blocking resources, and optimize images.",
  },
  inp: {
    name: "INP",
    fullName: "Interaction to Next Paint",
    weight: 0.3,
    thresholds: { good: 200, needsImprovement: 500 },
    color: "var(--metric-inp-color)",
    currentValue: 200,
    tooltipContent:
      "INP measures responsiveness to user interactions (clicks, taps, key presses). Good: ≤200ms, Needs Improvement: 200-500ms, Poor: >500ms. To improve: break up long tasks, optimize event handlers, and minimize render-blocking work.",
  },
  cls: {
    name: "CLS",
    fullName: "Cumulative Layout Shift",
    weight: 0.15,
    thresholds: { good: 0.1, needsImprovement: 0.25 },
    color: "var(--metric-cls-color)",
    currentValue: 0.1,
    tooltipContent:
      "CLS measures visual stability by summing unexpected layout shifts. Good: ≤0.1, Needs Improvement: 0.1-0.25, Poor: >0.25. To improve: specify size attributes for images and videos, avoid inserting content above existing content, and use stable font loading strategies.",
  },
  fcp: {
    name: "FCP",
    fullName: "First Contentful Paint",
    weight: 0.15,
    thresholds: { good: 1000, needsImprovement: 3000 },
    color: "var(--metric-fcp-color)",
    currentValue: 1000,
    tooltipContent:
      "FCP measures when the first content appears on screen. Good: ≤1.0s, Needs Improvement: 1.0-3.0s, Poor: >3.0s. To improve: reduce server latency, eliminate render-blocking resources, and optimize critical rendering path.",
  },
  ttfb: {
    name: "TTFB",
    fullName: "Time to First Byte",
    weight: 0.1,
    thresholds: { good: 100, needsImprovement: 600 },
    color: "var(--metric-ttfb-color)",
    currentValue: 100,
    tooltipContent:
      "TTFB measures time until the first byte of page content is received. Good: ≤100ms, Needs Improvement: 100-600ms, Poor: >600ms. To improve: optimize server performance, use a CDN, enable caching, and avoid multiple redirects.",
  },
};
const defaultMeasurements = {
  lcp: 4980,
  fcp: 2500,
  inp: 312,
  cls: 0,
  ttfb: 300,
};
let savedPresets = {};
let webVitalsChart;
function initChart() {
  const ctx = document.getElementById("webVitalsChart").getContext("2d");
  const chartData = prepareChartData();
  webVitalsChart = new Chart(ctx, {
    type: "doughnut",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "80%",
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              if (context.dataIndex % 2 === 0) {
                const metricKey = Object.keys(metrics)[Math.floor(context.dataIndex / 2)];
                const metric = metrics[metricKey];
                const score = calculateMetricScore(metricKey);
                return `${metric.name}: ${Math.round(score * 100)}%`;
              }
              return "";
            },
          },
        },
      },
      animation: {
        duration: 800,
        easing: "easeOutQuart",
      },
    },
  });
}
function prepareChartData() {
  const metricKeys = Object.keys(metrics);
  const data = [];
  const backgroundColor = [];
  const hoverBackgroundColor = [];
  const borderColor = [];
  const labels = [];
  for (const metricKey of metricKeys) {
    const metric = metrics[metricKey];
    const score = calculateMetricScore(metricKey);
    const filledValue = metric.weight * 100 * score;
    data.push(filledValue);
    const remainingValue = metric.weight * 100 * (1 - score);
    data.push(remainingValue);
    const baseColor = hexToRgb(metric.color);
    backgroundColor.push(`rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`);
    backgroundColor.push(`rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.2)`);
    const hoverColor = hexToRgb(createLighterColor(metric.color, 15));
    hoverBackgroundColor.push(`rgb(${hoverColor.r}, ${hoverColor.g}, ${hoverColor.b})`);
    hoverBackgroundColor.push(`rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.25)`);
    borderColor.push("rgba(255, 255, 255, 0.5)");
    borderColor.push("rgba(255, 255, 255, 0.1)");
    labels.push(metric.name);
    labels.push("");
  }
  return {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: backgroundColor,
        hoverBackgroundColor: hoverBackgroundColor,
        borderColor: borderColor,
        borderWidth: 1,
        borderRadius: 5,
        hoverOffset: 5,
      },
    ],
  };
}
function hexToRgb(colorValue) {
  let processedColor = colorValue;
  if (processedColor.startsWith("var(")) {
    const varName = processedColor.match(/var\((.*?)\)/)[1];
    processedColor = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }
  if (!processedColor.startsWith("#")) {
    const tempElement = document.createElement("div");
    tempElement.style.color = processedColor;
    document.body.appendChild(tempElement);
    processedColor = getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);
    const rgbValues = processedColor.match(/\d+/g);
    if (rgbValues && rgbValues.length >= 3) {
      return {
        r: Number.parseInt(rgbValues[0]),
        g: Number.parseInt(rgbValues[1]),
        b: Number.parseInt(rgbValues[2]),
      };
    }
    return { r: 0, g: 0, b: 0 };
  }
  const hexColor = processedColor.replace("#", "");
  const r = Number.parseInt(hexColor.substring(0, 2), 16);
  const g = Number.parseInt(hexColor.substring(2, 4), 16);
  const b = Number.parseInt(hexColor.substring(4, 6), 16);
  return { r, g, b };
}
function createLighterColor(color, percent) {
  const { r, g, b } = hexToRgb(color);
  const rLighter = Math.min(255, Math.floor((r * (100 + percent)) / 100));
  const gLighter = Math.min(255, Math.floor((g * (100 + percent)) / 100));
  const bLighter = Math.min(255, Math.floor((b * (100 + percent)) / 100));
  return `#${rLighter.toString(16).padStart(2, "0")}${gLighter.toString(16).padStart(2, "0")}${bLighter.toString(16).padStart(2, "0")}`;
}
function calculateMetricScore(metricKey) {
  const metric = metrics[metricKey];
  const value = metric.currentValue;
  function interpolate(value, pointsArray) {
    const sortedPoints = [...pointsArray].sort((a, b) => a[0] - b[0]);
    if (value <= sortedPoints[0][0]) return sortedPoints[0][1];
    if (value >= sortedPoints[sortedPoints.length - 1][0])
      return sortedPoints[sortedPoints.length - 1][1];
    let i = 0;
    while (i < sortedPoints.length - 1 && value > sortedPoints[i + 1][0]) i++;
    const [x0, y0] = sortedPoints[i];
    const [x1, y1] = sortedPoints[i + 1];
    return y0 + ((y1 - y0) * (value - x0)) / (x1 - x0);
  }
  if (metricKey === "cls") {
    if (value === 0) return 0.99;
    if (value === 0.01) return 1.0;
    if (value <= 0.1) return 0.99;
    if (value >= 0.25) return 0;
    return 0.99 * (1 - (value - 0.1) / 0.15);
  }
  if (metricKey === "inp") {
    const calibrationPoints = [
      [0, 1.0],
      [74, 1.0],
      [136, 0.92],
      [160, 0.96],
      [200, 0.9],
      [328, 0.81],
      [500, 0.7],
      [832, 0.64],
      [1000, 0.4],
      [1500, 0.15],
      [2000, 0],
    ];
    if (Math.abs(value - 160) < 1) return 0.96;
    return interpolate(value, calibrationPoints);
  }
  if (metricKey === "ttfb") {
    const calibrationPoints = [
      [0, 1.0],
      [200, 1.0],
      [300, 0.85],
      [367, 0.68],
      [468, 0.36],
      [700, 0.39],
      [936, 0.42],
      [959, 0.42],
      [993, 0.3],
      [1040, 0.21],
      [1500, 0],
    ];
    return interpolate(value, calibrationPoints);
  }
  if (metricKey === "lcp") {
    const calibrationPoints = [
      [0, 1.0],
      [860, 0.97],
      [1200, 0.93],
      [1410, 0.89],
      [2400, 0.7],
      [2880, 0.62],
      [4000, 0.45],
      [4840, 0.39],
      [4880, 0.38],
      [6000, 0.3],
      [8100, 0.22],
      [10000, 0],
    ];
    return interpolate(value, calibrationPoints);
  }
  if (metricKey === "fcp") {
    const calibrationPoints = [
      [0, 1.0],
      [860, 0.92],
      [1000, 0.85],
      [1230, 0.81],
      [1500, 0.7],
      [1790, 0.57],
      [2500, 0.45],
      [3250, 0.38],
      [3850, 0.28],
      [5000, 0],
    ];
    return interpolate(value, calibrationPoints);
  }
  if (value <= metric.thresholds.good) return 1;
  if (value >= metric.thresholds.needsImprovement) return 0;
  const range = metric.thresholds.needsImprovement - metric.thresholds.good;
  return 1 - (value - metric.thresholds.good) / range;
}
function calculateOverallScore() {
  const weights = {
    lcp: 0.3,
    inp: 0.3,
    cls: 0.15,
    fcp: 0.15,
    ttfb: 0.1,
  };
  let weightedTotal = 0;
  let totalWeight = 0;
  for (const key of Object.keys(weights)) {
    const score = calculateMetricScore(key);
    if (score !== undefined && !Number.isNaN(score)) {
      weightedTotal += score * weights[key];
      totalWeight += weights[key];
    }
  }
  if (totalWeight > 0) {
    weightedTotal = weightedTotal / totalWeight;
  }
  const finalScore = Math.round(weightedTotal * 100);
  return finalScore;
}
function updateScoreColor() {
  const score = calculateOverallScore();
  const overallScoreElement = document.getElementById("overallScore");
  overallScoreElement.classList.remove("text-danger", "text-warning", "text-success");
  if (score >= 90) {
    overallScoreElement.style.color = "var(--status-good)";
  } else if (score >= 50) {
    overallScoreElement.style.color = "var(--status-needs-improvement)";
  } else {
    overallScoreElement.style.color = "var(--status-poor)";
  }
}
function saveToLocalStorage() {
  const currentValues = {};
  for (const metricKey of Object.keys(metrics)) {
    currentValues[metricKey] = metrics[metricKey].currentValue;
  }
  localStorage.setItem("webVitalsLastValues", JSON.stringify(currentValues));
}
function loadFromLocalStorage() {
  try {
    const savedValues = localStorage.getItem("webVitalsLastValues");
    if (savedValues) {
      const parsedValues = JSON.parse(savedValues);
      for (const metricKey of Object.keys(parsedValues)) {
        if (metrics[metricKey]) {
          metrics[metricKey].currentValue = parsedValues[metricKey];
        }
      }
      return true;
    }
  } catch (error) {
    console.error("Error loading saved values:", error);
  }
  return false;
}
function applyDefaultMeasurements() {
  for (const metricKey of Object.keys(defaultMeasurements)) {
    if (metrics[metricKey]) {
      metrics[metricKey].currentValue = defaultMeasurements[metricKey];
    }
  }
  updateUI();
}
function loadSavedPresets() {
  try {
    const savedPresetsJson = localStorage.getItem("webVitalsPresets");
    if (savedPresetsJson) {
      savedPresets = JSON.parse(savedPresetsJson);
    } else {
      savedPresets = {};
      savedPresets["Real-world Example"] = {
        values: defaultMeasurements,
        score: 60,
        timestamp: new Date().toISOString(),
      };
      savePresetsToLocalStorage();
    }
    updatePresetsDropdown();
  } catch (error) {
    console.error("Error loading saved presets:", error);
    savedPresets = {};
    updatePresetsDropdown();
  }
}
function savePresetsToLocalStorage() {
  try {
    localStorage.setItem("webVitalsPresets", JSON.stringify(savedPresets));
  } catch (error) {
    console.error("Error saving presets:", error);
  }
}
function updatePresetsDropdown() {
  const presetsDropdown = document.getElementById("presetsDropdown");
  const deletePresetBtn = document.getElementById("deletePresetBtn");
  const presetsContainer = document.getElementById("presetsContainer");
  const noPresetsMessage = document.getElementById("noPresetsMessage");
  if (!presetsDropdown || !deletePresetBtn || !presetsContainer) return;
  const hasPresets = Object.keys(savedPresets).length > 0;
  if (hasPresets) {
    presetsContainer.classList.remove("d-none");
    if (noPresetsMessage) noPresetsMessage.classList.add("d-none");
  } else {
    presetsContainer.classList.add("d-none");
    if (noPresetsMessage) noPresetsMessage.classList.remove("d-none");
    return;
  }
  presetsDropdown.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Select a preset...";
  presetsDropdown.appendChild(defaultOption);
  for (const presetName of Object.keys(savedPresets)) {
    const option = document.createElement("option");
    option.value = presetName;
    option.text = presetName;
    presetsDropdown.appendChild(option);
  }
}
function savePreset(presetName) {
  if (!presetName || presetName.trim() === "") return false;
  const trimmedName = presetName.trim();
  const presetValues = {};
  for (const metricKey of Object.keys(metrics)) {
    presetValues[metricKey] = metrics[metricKey].currentValue;
  }
  const score = calculateOverallScore();
  savedPresets[trimmedName] = {
    values: presetValues,
    score: Math.round(score * 100),
    timestamp: new Date().toISOString(),
  };
  savePresetsToLocalStorage();
  updatePresetsDropdown();
  return true;
}
function loadPreset(presetName) {
  if (!savedPresets[presetName]) return false;
  const preset = savedPresets[presetName];
  for (const metricKey of Object.keys(preset.values)) {
    if (metrics[metricKey]) {
      metrics[metricKey].currentValue = preset.values[metricKey];
    }
  }
  updateUI();
  return true;
}
function deletePreset(presetName) {
  if (!savedPresets[presetName]) return false;
  delete savedPresets[presetName];
  savePresetsToLocalStorage();
  updatePresetsDropdown();
  return true;
}
function updateUI() {
  document.getElementById("lcpInput").value = metrics.lcp.currentValue;
  document.getElementById("clsInput").value = metrics.cls.currentValue;
  document.getElementById("fcpInput").value = metrics.fcp.currentValue;
  document.getElementById("ttfbInput").value = metrics.ttfb.currentValue;
  document.getElementById("inpInput").value = metrics.inp.currentValue;
  document.getElementById("lcpSlider").value = metrics.lcp.currentValue;
  document.getElementById("clsSlider").value = metrics.cls.currentValue;
  document.getElementById("fcpSlider").value = metrics.fcp.currentValue;
  document.getElementById("ttfbSlider").value = metrics.ttfb.currentValue;
  document.getElementById("inpSlider").value = metrics.inp.currentValue;
  updateInputFieldStyles();
  animateValue("overallScore", calculateOverallScore());
  updateScoreColor();
  updateMetricIndicators();
  updateScoreContainer();
  if (webVitalsChart) {
    updateChart();
  }
  saveToLocalStorage();
}
function updateInputFieldStyles() {
  for (const metricKey of Object.keys(metrics)) {
    const _metric = metrics[metricKey];
    const score = calculateMetricScore(metricKey);
    const inputField = document.getElementById(`${metricKey}Input`);
    if (inputField) {
      inputField.classList.remove("input-good", "input-warning", "input-poor");
      if (score >= 0.9) {
        inputField.classList.add("input-good");
      } else if (score >= 0.5) {
        inputField.classList.add("input-warning");
      } else {
        inputField.classList.add("input-poor");
      }
    }
  }
}
function validateInputValue(value, min, max) {
  const numValue = Number.parseFloat(value);
  if (Number.isNaN(numValue)) {
    return min;
  }
  return Math.min(Math.max(numValue, min), max);
}
function animateValue(elementId, newScore) {
  const element = document.getElementById(elementId);
  const currentScore = Number.parseInt(element.textContent);
  const targetScore = Math.round(newScore);
  if (currentScore === targetScore) return;
  let startTimestamp;
  const duration = 500;
  function step(timestamp) {
    if (!startTimestamp) startTimestamp = timestamp;
    const elapsed = timestamp - startTimestamp;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = progress === 1 ? 1 : 1 - 2 ** (-10 * progress);
    const currentValue = Math.round(currentScore + (targetScore - currentScore) * easeProgress);
    element.textContent = currentValue;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  }
  window.requestAnimationFrame(step);
}
function updateChart() {
  Object.keys(metrics).forEach((metricKey, index) => {
    const metric = metrics[metricKey];
    const score = calculateMetricScore(metricKey);
    const filledValue = metric.weight * 100 * score;
    webVitalsChart.data.datasets[0].data[index * 2] = filledValue;
    const remainingValue = metric.weight * 100 * (1 - score);
    webVitalsChart.data.datasets[0].data[index * 2 + 1] = remainingValue;
    const baseColor = hexToRgb(metric.color);
    webVitalsChart.data.datasets[0].backgroundColor[index * 2] =
      `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
    webVitalsChart.data.datasets[0].backgroundColor[index * 2 + 1] =
      `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.2)`;
    const hoverColor = hexToRgb(createLighterColor(metric.color, 15));
    webVitalsChart.data.datasets[0].hoverBackgroundColor[index * 2] =
      `rgb(${hoverColor.r}, ${hoverColor.g}, ${hoverColor.b})`;
    webVitalsChart.data.datasets[0].hoverBackgroundColor[index * 2 + 1] =
      `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.25)`;
  });
  webVitalsChart.update({
    duration: 400,
    easing: "easeOutQuad",
  });
}
function updateMetricIndicators() {
  for (const metricKey of Object.keys(metrics)) {
    const _metric = metrics[metricKey];
    const score = calculateMetricScore(metricKey);
    const scoreElement = document.querySelector(`.metric-${metricKey.toLowerCase()}`);
    if (scoreElement) {
      for (const cls of ["score-good", "score-needs-improvement", "score-poor"]) {
        scoreElement.classList.remove(cls);
      }
      if (score >= 0.9) {
        scoreElement.classList.add("score-good");
      } else if (score >= 0.5) {
        scoreElement.classList.add("score-needs-improvement");
      } else {
        scoreElement.classList.add("score-poor");
      }
    }
  }
}
function updateScoreContainer() {
  const overallScoreElement = document.querySelector(".overall-score");
  if (!overallScoreElement) return;
  const isDarkMode = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDarkMode) {
    overallScoreElement.style.backgroundColor = "rgba(30, 30, 30, 0.9)";
    overallScoreElement.style.boxShadow = "0 0 15px rgba(0, 0, 0, 0.5)";
  } else {
    overallScoreElement.style.backgroundColor = "rgba(255, 255, 255, 0.85)";
    overallScoreElement.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.05)";
  }
}
document.addEventListener("DOMContentLoaded", () => {
  initChart();
  loadSavedPresets();
  if (!loadFromLocalStorage()) {
    applyDefaultMeasurements();
  }
  initializeTheme();
  document.getElementById("themeToggle").addEventListener("click", () => {
    toggleTheme();
  });
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  const _tooltipList = tooltipTriggerList.map(
    (tooltipTriggerEl) =>
      new bootstrap.Tooltip(tooltipTriggerEl, {
        trigger: "hover focus",
        html: true,
        delay: { show: 50, hide: 100 },
        container: "body",
      })
  );
  document.getElementById("lcpSlider").addEventListener("input", (e) => {
    metrics.lcp.currentValue = Number.parseInt(e.target.value);
    updateUI();
  });
  document.getElementById("lcpInput").addEventListener("change", (e) => {
    const value = validateInputValue(e.target.value, 500, 8000);
    metrics.lcp.currentValue = value;
    document.getElementById("lcpSlider").value = value;
    updateUI();
  });
  document.getElementById("clsSlider").addEventListener("input", (e) => {
    metrics.cls.currentValue = Number.parseFloat(e.target.value);
    updateUI();
  });
  document.getElementById("clsInput").addEventListener("change", (e) => {
    const value = validateInputValue(e.target.value, 0, 0.5);
    metrics.cls.currentValue = value;
    document.getElementById("clsSlider").value = value;
    updateUI();
  });
  document.getElementById("fcpSlider").addEventListener("input", (e) => {
    metrics.fcp.currentValue = Number.parseInt(e.target.value);
    updateUI();
  });
  document.getElementById("fcpInput").addEventListener("change", (e) => {
    const value = validateInputValue(e.target.value, 0, 5000);
    metrics.fcp.currentValue = value;
    document.getElementById("fcpSlider").value = value;
    updateUI();
  });
  document.getElementById("ttfbSlider").addEventListener("input", (e) => {
    metrics.ttfb.currentValue = Number.parseInt(e.target.value);
    updateUI();
  });
  document.getElementById("ttfbInput").addEventListener("change", (e) => {
    const value = validateInputValue(e.target.value, 0, 1500);
    metrics.ttfb.currentValue = value;
    document.getElementById("ttfbSlider").value = value;
    updateUI();
  });
  document.getElementById("inpSlider").addEventListener("input", (e) => {
    metrics.inp.currentValue = Number.parseInt(e.target.value);
    updateUI();
  });
  document.getElementById("inpInput").addEventListener("change", (e) => {
    const value = validateInputValue(e.target.value, 0, 1500);
    metrics.inp.currentValue = value;
    document.getElementById("inpSlider").value = value;
    updateUI();
  });
  const savePresetForm = document.getElementById("savePresetForm");
  if (savePresetForm) {
    savePresetForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const presetNameInput = document.getElementById("presetName");
      const presetName = presetNameInput.value.trim();
      if (presetName) {
        if (savePreset(presetName)) {
          presetNameInput.value = "";
          showToast("Preset saved successfully");
        }
      }
    });
  }
  const presetsDropdown = document.getElementById("presetsDropdown");
  if (presetsDropdown) {
    presetsDropdown.addEventListener("change", (e) => {
      const selectedPreset = e.target.value;
      if (selectedPreset) {
        if (loadPreset(selectedPreset)) {
          showToast(`Loaded preset: ${selectedPreset}`);
        }
      }
    });
  }
  const deletePresetBtn = document.getElementById("deletePresetBtn");
  if (deletePresetBtn) {
    deletePresetBtn.addEventListener("click", () => {
      const presetsDropdown = document.getElementById("presetsDropdown");
      const selectedPreset = presetsDropdown.value;
      if (selectedPreset) {
        if (confirm(`Are you sure you want to delete the preset "${selectedPreset}"?`)) {
          if (deletePreset(selectedPreset)) {
            showToast(`Deleted preset: ${selectedPreset}`);
          }
        }
      }
    });
  }
  updateUI();
});
function showToast(message) {
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3";
    document.body.appendChild(toastContainer);
  }
  const toastId = `toast-${Date.now()}`;
  const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">Web Vitals Simulator</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
  toastContainer.innerHTML += toastHtml;
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
  toast.show();
  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });
}
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
    updateThemeToggleButton("light");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    updateThemeToggleButton("dark");
  }
  if (webVitalsChart) {
    updateChart();
  }
}
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeToggleButton(newTheme === "light" ? "dark" : "light");
  if (webVitalsChart) {
    updateChart();
  }
  updateScoreColor();
  updateScoreContainer();
  updateMetricIndicators();
}
function updateThemeToggleButton(mode) {
  const button = document.getElementById("themeToggle");
  if (!button) return;
  const iconContainer = button.querySelector("svg");
  const textSpan = button.querySelector("span");
  if (mode === "dark") {
    iconContainer.innerHTML =
      '<path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>';
    textSpan.textContent = "Dark Mode";
  } else {
    iconContainer.innerHTML =
      '<path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>';
    textSpan.textContent = "Light Mode";
  }
}
