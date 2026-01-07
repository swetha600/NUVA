// ====================
// NUVA AI ASSISTANT - ENHANCED COMPLETE VERSION (CHROME EXTENSION FIXED)
// ====================

const API_KEY = 'YOUR_API_KEY_HERE';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

let hoverTimeout = null;
let currentTooltip = null;
let currentTheme = 'light';
let primaryColor = '#667eea';
let secondaryColor = '#764ba2';
let dyslexicMode = false;
let selectedText = '';
let selectionMode = false;

// FIXED: Check if extension is already loaded
if (!document.getElementById('nuva-root')) {
  loadSettings().then(() => {
    initNuva();
  }).catch(() => {
    initNuva();
  });
}

// FIXED: Use chrome.storage instead of localStorage
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get([
      'nuva-theme',
      'nuva-primary',
      'nuva-secondary',
      'nuva-dyslexic'
    ]);
    
    currentTheme = result['nuva-theme'] || 'light';
    primaryColor = result['nuva-primary'] || '#667eea';
    secondaryColor = result['nuva-secondary'] || '#764ba2';
    dyslexicMode = result['nuva-dyslexic'] === true;
  } catch (e) {
    console.log('Using default settings');
  }
}

// FIXED: Use chrome.storage instead of localStorage
async function saveSettings() {
  try {
    await chrome.storage.local.set({
      'nuva-theme': currentTheme,
      'nuva-primary': primaryColor,
      'nuva-secondary': secondaryColor,
      'nuva-dyslexic': dyslexicMode
    });
  } catch (e) {
    console.log('Could not save settings');
  }
}

function initNuva() {
  createFloatingButton();
  createInlinePanel();
  enableWordHover();
  enableTextSelection();
}

function enableTextSelection() {
  document.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text && text.length > 10) {
      selectedText = text;
      selectionMode = true;
      
      const root = document.getElementById('nuva-root');
      if (root && root.shadowRoot) {
        const panel = root.shadowRoot.querySelector('.nuva-panel');
        if (!panel.classList.contains('active')) {
          togglePanel();
        }
        updateSelectionUI(root.shadowRoot);
      }
    }
  });
}

function updateSelectionUI(shadow) {
  const selectionBanner = shadow.getElementById('selection-banner');
  const analyzeBtn = shadow.getElementById('analyze-btn');
  
  if (selectionMode && selectedText) {
    selectionBanner.style.display = 'block';
    selectionBanner.querySelector('.selection-text-preview').textContent = 
      selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText;
    analyzeBtn.innerHTML = `🚀 Analyze Selected Text`;
  } else {
    selectionBanner.style.display = 'none';
    analyzeBtn.innerHTML = `🚀 Analyze This Page`;
  }
}

function createFloatingButton() {
  const fab = document.createElement('div');
  fab.id = 'nuva-fab';
  fab.innerHTML = '✨';
  fab.title = 'Open Nuva AI';
  
  const fabStyle = document.createElement('style');
  fabStyle.textContent = `
    #nuva-fab {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 4px 20px ${primaryColor}66;
      z-index: 999998;
      transition: all 0.3s ease;
      animation: fabPulse 2s infinite;
    }
    
    #nuva-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 30px ${primaryColor}99;
    }
    
    @keyframes fabPulse {
      0%, 100% { box-shadow: 0 4px 20px ${primaryColor}66; }
      50% { box-shadow: 0 6px 30px ${primaryColor}99; }
    }
  `;
  
  document.head.appendChild(fabStyle);
  document.body.appendChild(fab);
  
  fab.addEventListener('click', togglePanel);
}

function createInlinePanel() {
  const container = document.createElement('div');
  container.id = 'nuva-root';
  document.body.appendChild(container);
  
  const shadow = container.attachShadow({ mode: 'open' });
  
  const style = document.createElement('style');
  style.textContent = getThemeStyles();
  
  const panel = document.createElement('div');
  panel.className = 'nuva-panel';
  panel.innerHTML = `
    <div class="nuva-header">
      <div class="nuva-title">
        <span>✨</span>
        <span>Nuva AI Assistant</span>
      </div>
      <div class="nuva-header-actions">
        <button class="nuva-icon-btn" id="settings-btn" title="Settings">⚙️</button>
        <button class="nuva-icon-btn" id="theme-btn" title="Toggle Theme">${currentTheme === 'dark' ? '☀️' : '🌙'}</button>
        <button class="nuva-close" id="close-btn">✕</button>
      </div>
    </div>
    
    <div class="nuva-content" id="main-content">
      <div class="selection-banner" id="selection-banner" style="display: none;">
        <div class="selection-info">
          <span class="selection-icon">📝</span>
          <div class="selection-details">
            <strong>Selected Text Active</strong>
            <p class="selection-text-preview"></p>
          </div>
          <button class="clear-selection-btn" id="clear-selection-btn">✕</button>
        </div>
      </div>

      <div class="nuva-tabs">
        <button class="nuva-tab active" data-tab="restructure">📝 restructure</button>
        <button class="nuva-tab" data-tab="simplify">🔤 Simplify</button>
        <button class="nuva-tab" data-tab="points">📋 Key Points</button>
        <button class="nuva-tab" data-tab="doubt">💬 Ask Doubt</button>
      </div>
      
      <div class="nuva-settings">
        <label class="nuva-label">
          <span>Detail Level:</span>
          <select id="intensity-select" class="nuva-select">
            <option value="short">Brief Overview</option>
            <option value="medium" selected>Standard Detail</option>
            <option value="detailed">Comprehensive Analysis</option>
          </select>
        </label>
      </div>
      
      <div class="doubt-section" id="doubt-section" style="display: none;">
        <div class="doubt-input-wrapper">
          <textarea id="doubt-input" class="doubt-input" placeholder="Type your doubt or question here..." rows="3"></textarea>
          <button class="nuva-analyze-btn" id="ask-doubt-btn">💬 Ask Doubt</button>
        </div>
      </div>
      
      <button class="nuva-analyze-btn" id="analyze-btn">🚀 Analyze This Page</button>
      
      <div class="nuva-result" id="result-area">
        <div class="nuva-placeholder">
          <div class="nuva-placeholder-icon">📄</div>
          <p>Click "Analyze This Page" to get started!</p>
          <p class="nuva-hint">
            💡 Tips:<br>
            • Hover over any word for 1 second to see its definition<br>
            • Select text on the page to analyze just that portion<br>
            • Works with PDFs, Google Docs, Slides, Sheets, Notion, and all web content
          </p>
        </div>
      </div>
      
      <div class="nuva-loading" id="loading-area" style="display: none;">
        <div class="nuva-spinner"></div>
        <p>Analyzing content with AI...</p>
      </div>
    </div>

    <div class="nuva-settings-panel" id="settings-panel" style="display: none;">
      <div class="settings-header">
        <h3>⚙️ Customization</h3>
        <button class="nuva-icon-btn" id="back-btn">←</button>
      </div>
      
      <div class="settings-content">
        <div class="setting-group">
          <label class="setting-label">Theme Mode</label>
          <div class="theme-toggle-wrapper">
            <div class="theme-toggle-container">
              <input type="checkbox" id="theme-toggle-checkbox" ${currentTheme === 'dark' ? 'checked' : ''}>
              <label for="theme-toggle-checkbox" class="theme-toggle-label">
                <span class="theme-toggle-inner">
                  <span class="theme-icon sun">☀️</span>
                  <span class="theme-icon moon">🌙</span>
                </span>
                <span class="theme-toggle-switch"></span>
              </label>
            </div>
            <span class="theme-toggle-text">${currentTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
        </div>

        <div class="setting-group">
          <label class="setting-label">Dyslexic Mode</label>
          <div class="theme-toggle-wrapper">
            <div class="theme-toggle-container dyslexic-toggle">
              <input type="checkbox" id="dyslexic-toggle-checkbox" ${dyslexicMode ? 'checked' : ''}>
              <label for="dyslexic-toggle-checkbox" class="theme-toggle-label">
                <span class="theme-toggle-inner">
                  <span class="toggle-text off">OFF</span>
                  <span class="toggle-text on">ON</span>
                </span>
                <span class="theme-toggle-switch"></span>
              </label>
            </div>
            <span class="theme-toggle-text">Larger fonts & spacing</span>
          </div>
        </div>

        <div class="setting-group">
          <label class="setting-label">Primary Color</label>
          <div class="color-picker">
            <div class="color-options">
              <button class="color-option primary" data-color="#667eea" style="background: #667eea"></button>
              <button class="color-option primary" data-color="#f093fb" style="background: #f093fb"></button>
              <button class="color-option primary" data-color="#4facfe" style="background: #4facfe"></button>
              <button class="color-option primary" data-color="#43e97b" style="background: #43e97b"></button>
              <button class="color-option primary" data-color="#fa709a" style="background: #fa709a"></button>
              <button class="color-option primary" data-color="#feca57" style="background: #feca57"></button>
              <button class="color-option primary" data-color="#ff6b6b" style="background: #ff6b6b"></button>
              <button class="color-option primary" data-color="#ee5a6f" style="background: #ee5a6f"></button>
            </div>
            <div class="custom-color-wrapper">
              <label for="custom-primary">Custom:</label>
              <input type="color" id="custom-primary" value="${primaryColor}">
            </div>
          </div>
        </div>

        <div class="setting-group">
          <label class="setting-label">Secondary Color</label>
          <div class="color-picker">
            <div class="color-options">
              <button class="color-option secondary" data-color="#764ba2" style="background: #764ba2"></button>
              <button class="color-option secondary" data-color="#4facfe" style="background: #4facfe"></button>
              <button class="color-option secondary" data-color="#00f2fe" style="background: #00f2fe"></button>
              <button class="color-option secondary" data-color="#38f9d7" style="background: #38f9d7"></button>
              <button class="color-option secondary" data-color="#fee140" style="background: #fee140"></button>
              <button class="color-option secondary" data-color="#ff6a88" style="background: #ff6a88"></button>
              <button class="color-option secondary" data-color="#c471f5" style="background: #c471f5"></button>
              <button class="color-option secondary" data-color="#fa709a" style="background: #fa709a"></button>
            </div>
            <div class="custom-color-wrapper">
              <label for="custom-secondary">Custom:</label>
              <input type="color" id="custom-secondary" value="${secondaryColor}">
            </div>
          </div>
        </div>

        <button class="nuva-analyze-btn" id="reset-settings">🔄 Reset to Defaults</button>
      </div>
    </div>
  `;
  
  const backdrop = document.createElement('div');
  backdrop.className = 'nuva-backdrop';
  
  shadow.appendChild(style);
  shadow.appendChild(backdrop);
  shadow.appendChild(panel);
  
  setupEventListeners(shadow);
}

function setupEventListeners(shadow) {
  let currentMode = 'restructure';
  
  shadow.getElementById('close-btn').addEventListener('click', togglePanel);
  shadow.querySelector('.nuva-backdrop').addEventListener('click', togglePanel);
  
  shadow.getElementById('clear-selection-btn').addEventListener('click', () => {
    selectedText = '';
    selectionMode = false;
    updateSelectionUI(shadow);
  });

  shadow.getElementById('theme-btn').addEventListener('click', async () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    await saveSettings();
    updateTheme(shadow);
  });

  shadow.getElementById('settings-btn').addEventListener('click', () => {
    shadow.getElementById('main-content').style.display = 'none';
    shadow.getElementById('settings-panel').style.display = 'block';
  });

  shadow.getElementById('back-btn').addEventListener('click', () => {
    shadow.getElementById('settings-panel').style.display = 'none';
    shadow.getElementById('main-content').style.display = 'block';
  });

  shadow.getElementById('theme-toggle-checkbox').addEventListener('change', async (e) => {
    currentTheme = e.target.checked ? 'dark' : 'light';
    await saveSettings();
    updateTheme(shadow);
    shadow.querySelector('.theme-toggle-text').textContent = currentTheme === 'dark' ? 'Dark Mode' : 'Light Mode';
  });

  shadow.getElementById('dyslexic-toggle-checkbox').addEventListener('change', async (e) => {
    dyslexicMode = e.target.checked;
    await saveSettings();
    updateTheme(shadow);
  });

  shadow.querySelectorAll('.color-option.primary').forEach(btn => {
    btn.addEventListener('click', async () => {
      primaryColor = btn.dataset.color;
      await saveSettings();
      updateTheme(shadow);
      updateFAB();
    });
  });

  shadow.querySelectorAll('.color-option.secondary').forEach(btn => {
    btn.addEventListener('click', async () => {
      secondaryColor = btn.dataset.color;
      await saveSettings();
      updateTheme(shadow);
      updateFAB();
    });
  });

  shadow.getElementById('custom-primary').addEventListener('change', async (e) => {
    primaryColor = e.target.value;
    await saveSettings();
    updateTheme(shadow);
    updateFAB();
  });

  shadow.getElementById('custom-secondary').addEventListener('change', async (e) => {
    secondaryColor = e.target.value;
    await saveSettings();
    updateTheme(shadow);
    updateFAB();
  });

  shadow.getElementById('reset-settings').addEventListener('click', async () => {
    currentTheme = 'light';
    primaryColor = '#667eea';
    secondaryColor = '#764ba2';
    dyslexicMode = false;
    await saveSettings();
    updateTheme(shadow);
    updateFAB();
    shadow.getElementById('theme-toggle-checkbox').checked = false;
    shadow.getElementById('dyslexic-toggle-checkbox').checked = false;
    shadow.querySelector('.theme-toggle-text').textContent = 'Light Mode';
  });
  
  shadow.querySelectorAll('.nuva-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      shadow.querySelectorAll('.nuva-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.dataset.tab;
      
      const doubtSection = shadow.getElementById('doubt-section');
      const analyzeBtn = shadow.getElementById('analyze-btn');
      
      if (currentMode === 'doubt') {
        doubtSection.style.display = 'block';
        analyzeBtn.style.display = 'none';
      } else {
        doubtSection.style.display = 'none';
        analyzeBtn.style.display = 'block';
      }
    });
  });
  
  shadow.getElementById('analyze-btn').addEventListener('click', async () => {
    const intensity = shadow.getElementById('intensity-select').value;
    const resultArea = shadow.getElementById('result-area');
    const loadingArea = shadow.getElementById('loading-area');
    
    resultArea.style.display = 'none';
    loadingArea.style.display = 'block';
    
    const content = selectionMode && selectedText ? selectedText : await extractPageContent();
    const result = await analyzeContent(content, currentMode, intensity);
    
    loadingArea.style.display = 'none';
    resultArea.style.display = 'block';
    resultArea.innerHTML = result;
  });

  shadow.getElementById('ask-doubt-btn').addEventListener('click', async () => {
    const doubtInput = shadow.getElementById('doubt-input');
    const doubt = doubtInput.value.trim();
    
    if (!doubt) {
      alert('Please enter your doubt or question');
      return;
    }
    
    const resultArea = shadow.getElementById('result-area');
    const loadingArea = shadow.getElementById('loading-area');
    
    resultArea.style.display = 'none';
    loadingArea.style.display = 'block';
    
    const content = selectionMode && selectedText ? selectedText : await extractPageContent();
    const result = await answerDoubt(doubt, content);
    
    loadingArea.style.display = 'none';
    resultArea.style.display = 'block';
    resultArea.innerHTML = result;
    
    doubtInput.value = '';
  });
}

function getThemeStyles() {
  const isDark = currentTheme === 'dark';
  const bgPrimary = isDark ? '#1a1a2e' : '#ffffff';
  const bgSecondary = isDark ? '#16213e' : '#f8f9fa';
  const bgTertiary = isDark ? '#0f1624' : '#f0f0f0';
  const textPrimary = isDark ? '#eee' : '#333';
  const textSecondary = isDark ? '#aaa' : '#666';
  const border = isDark ? '#2d3748' : '#e0e0e0';
  
  const baseFontSize = dyslexicMode ? '18px' : '14px';
  const baseLineHeight = dyslexicMode ? '2.2' : '1.8';
  const baseSpacing = dyslexicMode ? '28px' : '24px';
  const fontFamily = dyslexicMode ? 'OpenDyslexic, Comic Sans MS, sans-serif' : '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  
  return `
    @import url('https://fonts.cdnfonts.com/css/opendyslexic');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    .nuva-panel {
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      width: 90%; max-width: ${dyslexicMode ? '800px' : '700px'};
      max-height: 85vh; background: ${bgPrimary};
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, ${isDark ? '0.6' : '0.3'});
      z-index: 999999; opacity: 0; pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: ${fontFamily}; display: flex; flex-direction: column;
      color: ${textPrimary}; font-size: ${baseFontSize};
    }
    
    .nuva-panel.active { opacity: 1; pointer-events: all; transform: translate(-50%, -50%) scale(1); }
    
    .nuva-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, ${isDark ? '0.7' : '0.5'}); z-index: 999998;
      opacity: 0; pointer-events: none; transition: opacity 0.3s; backdrop-filter: blur(4px);
    }
    
    .nuva-backdrop.active { opacity: 1; pointer-events: all; }
    
    .nuva-header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      padding: ${baseSpacing}; border-radius: 20px 20px 0 0; color: white;
      display: flex; justify-content: space-between; align-items: center;
    }
    
    .nuva-title { display: flex; align-items: center; gap: 12px; font-size: ${dyslexicMode ? '26px' : '22px'}; font-weight: 700; }

    .nuva-header-actions { display: flex; gap: 8px; align-items: center; }

    .nuva-icon-btn {
      background: rgba(255, 255, 255, 0.2); border: none; color: white;
      width: ${dyslexicMode ? '42px' : '36px'}; height: ${dyslexicMode ? '42px' : '36px'};
      border-radius: 50%; cursor: pointer; font-size: ${dyslexicMode ? '22px' : '18px'};
      transition: all 0.3s; display: flex; align-items: center; justify-content: center;
    }

    .nuva-icon-btn:hover { background: rgba(255, 255, 255, 0.3); transform: scale(1.1); }
    
    .nuva-close {
      background: rgba(255, 255, 255, 0.2); border: none; color: white;
      width: ${dyslexicMode ? '42px' : '36px'}; height: ${dyslexicMode ? '42px' : '36px'};
      border-radius: 50%; cursor: pointer; font-size: ${dyslexicMode ? '24px' : '20px'}; transition: all 0.3s;
    }
    
    .nuva-close:hover { background: rgba(255, 255, 255, 0.3); transform: rotate(90deg); }
    
    .nuva-content { flex: 1; padding: ${baseSpacing}; overflow-y: auto; }

    .selection-banner {
      background: linear-gradient(135deg, ${primaryColor}22 0%, ${secondaryColor}22 100%);
      border: 2px solid ${primaryColor}; border-radius: 12px;
      padding: ${dyslexicMode ? '20px' : '16px'}; margin-bottom: ${dyslexicMode ? '24px' : '20px'};
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

    .selection-info { display: flex; align-items: flex-start; gap: ${dyslexicMode ? '16px' : '12px'}; }
    .selection-icon { font-size: ${dyslexicMode ? '28px' : '24px'}; flex-shrink: 0; }
    .selection-details { flex: 1; min-width: 0; }
    .selection-details strong {
      display: block; color: ${primaryColor}; margin-bottom: ${dyslexicMode ? '8px' : '6px'};
      font-size: ${dyslexicMode ? '18px' : '15px'};
    }
    .selection-text-preview {
      font-size: ${dyslexicMode ? '15px' : '13px'}; color: ${textSecondary}; margin: 0;
      line-height: 1.4; overflow: hidden; text-overflow: ellipsis;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    }
    .clear-selection-btn {
      background: ${bgTertiary}; border: none; color: ${textPrimary};
      width: ${dyslexicMode ? '32px' : '28px'}; height: ${dyslexicMode ? '32px' : '28px'};
      border-radius: 50%; cursor: pointer; font-size: ${dyslexicMode ? '20px' : '18px'};
      display: flex; align-items: center; justify-content: center; transition: all 0.3s; flex-shrink: 0;
    }
    .clear-selection-btn:hover { background: ${isDark ? '#2d3748' : '#e0e0e0'}; transform: rotate(90deg); }
    
    .nuva-tabs {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: ${dyslexicMode ? '14px' : '10px'}; margin-bottom: ${dyslexicMode ? '24px' : '20px'};
    }
    
    .nuva-tab {
      padding: ${dyslexicMode ? '18px' : '14px'}; background: ${bgTertiary};
      border: 2px solid transparent; border-radius: 12px; cursor: pointer;
      font-size: ${baseFontSize}; font-weight: 600; color: ${textSecondary};
      transition: all 0.3s; text-align: center;
    }
    
    .nuva-tab:hover { background: ${isDark ? '#2d3748' : '#e8e8e8'}; border-color: ${primaryColor}; }
    .nuva-tab.active {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      color: white; border-color: transparent;
    }
    
    .nuva-settings {
      background: ${bgSecondary}; padding: ${dyslexicMode ? '22px' : '18px'};
      border-radius: 12px; margin-bottom: ${dyslexicMode ? '22px' : '18px'}; border: 1px solid ${border};
    }
    
    .nuva-label {
      display: flex; justify-content: space-between; align-items: center;
      font-size: ${baseFontSize}; font-weight: 600; color: ${textPrimary};
    }
    
    .nuva-select {
      padding: ${dyslexicMode ? '14px 18px' : '10px 14px'}; border: 2px solid ${border};
      border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary};
      font-size: ${baseFontSize}; cursor: pointer; transition: border-color 0.3s; font-family: ${fontFamily};
    }
    
    .nuva-select:focus { outline: none; border-color: ${primaryColor}; }

    .doubt-section { margin-bottom: ${dyslexicMode ? '24px' : '20px'}; }
    .doubt-input-wrapper { display: flex; flex-direction: column; gap: ${dyslexicMode ? '16px' : '12px'}; }
    .doubt-input {
      width: 100%; padding: ${dyslexicMode ? '18px' : '14px'}; border: 2px solid ${border};
      border-radius: 12px; background: ${bgSecondary}; color: ${textPrimary};
      font-size: ${baseFontSize}; font-family: ${fontFamily}; line-height: ${baseLineHeight};
      resize: vertical; min-height: ${dyslexicMode ? '120px' : '90px'};
    }
    .doubt-input:focus { outline: none; border-color: ${primaryColor}; }
    .doubt-input::placeholder { color: ${textSecondary}; }
    
    .nuva-analyze-btn {
      width: 100%; padding: ${dyslexicMode ? '22px' : '18px'};
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      color: white; border: none; border-radius: 12px;
      font-size: ${dyslexicMode ? '18px' : '16px'}; font-weight: 700; cursor: pointer;
      transition: all 0.3s; margin-bottom: ${dyslexicMode ? '24px' : '20px'}; font-family: ${fontFamily};
    }
    
    .nuva-analyze-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px ${primaryColor}66; }
    
    .nuva-result {
      background: ${bgSecondary}; border-radius: 12px; padding: ${dyslexicMode ? '28px' : '20px'};
      min-height: 150px; line-height: ${baseLineHeight}; color: ${textPrimary};
      border: 1px solid ${border}; font-size: ${baseFontSize};
    }
    
    .nuva-placeholder { text-align: center; padding: 40px 20px; color: ${textSecondary}; }
    .nuva-placeholder-icon { font-size: ${dyslexicMode ? '68px' : '56px'}; margin-bottom: ${dyslexicMode ? '20px' : '16px'}; }
    .nuva-hint {
      font-size: ${dyslexicMode ? '16px' : '13px'}; color: ${textSecondary};
      margin-top: ${dyslexicMode ? '12px' : '8px'}; line-height: 1.6;
    }
    
    .nuva-loading { text-align: center; padding: 40px 20px; color: ${textSecondary}; }
    
    .nuva-spinner {
      width: ${dyslexicMode ? '48px' : '40px'}; height: ${dyslexicMode ? '48px' : '40px'};
      border: 4px solid ${border}; border-top: 4px solid ${primaryColor}; border-radius: 50%;
      animation: spin 1s linear infinite; margin: 0 auto ${dyslexicMode ? '20px' : '16px'};
    }
    
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    .nuva-success {
      background: ${isDark ? '#1a4d2e' : '#d4edda'}; border: 2px solid ${isDark ? '#2d6a4f' : '#c3e6cb'};
      border-radius: 8px; padding: ${dyslexicMode ? '16px' : '12px'};
      color: ${isDark ? '#95d5b2' : '#155724'}; margin-bottom: ${dyslexicMode ? '20px' : '15px'};
      font-size: ${baseFontSize};
    }
    
    .nuva-error {
      background: ${isDark ? '#4a1a1a' : '#f8d7da'}; border: 2px solid ${isDark ? '#721c24' : '#f5c6cb'};
      border-radius: 8px; padding: ${dyslexicMode ? '20px' : '15px'}; color: ${isDark ? '#f8a5a8' : '#721c24'};
    }

    .nuva-settings-panel { flex: 1; padding: ${baseSpacing}; overflow-y: auto; }

    .settings-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: ${baseSpacing}; padding-bottom: ${dyslexicMode ? '20px' : '16px'};
      border-bottom: 2px solid ${border};
    }

    .settings-header h3 { font-size: ${dyslexicMode ? '24px' : '20px'}; color: ${textPrimary}; }

    .settings-content { display: flex; flex-direction: column; gap: ${baseSpacing}; }

    .setting-group {
      background: ${bgSecondary}; padding: ${dyslexicMode ? '24px' : '20px'};
      border-radius: 12px; border: 1px solid ${border};
    }

    .setting-label {
      display: block; font-size: ${dyslexicMode ? '18px' : '15px'}; font-weight: 600;
      color: ${textPrimary}; margin-bottom: ${dyslexicMode ? '16px' : '12px'};
    }

    .theme-toggle-wrapper { display: flex; align-items: center; gap: ${dyslexicMode ? '20px' : '16px'}; }
    .theme-toggle-container { position: relative; display: inline-block; }
    .theme-toggle-container input[type="checkbox"] { display: none; }

    .theme-toggle-label {
      display: block; width: ${dyslexicMode ? '110px' : '90px'}; height: ${dyslexicMode ? '52px' : '42px'};
      background: ${bgTertiary}; border-radius: ${dyslexicMode ? '26px' : '21px'}; position: relative;
      cursor: pointer; transition: all 0.3s ease; border: 2px solid ${border}; overflow: hidden;
    }

    .theme-toggle-inner {
      display: flex; width: 200%; height: 100%; transition: margin-left 0.3s ease; margin-left: 0;
    }

    .theme-icon, .toggle-text {
      flex: 1; display: flex; align-items: center; justify-content: center;
      font-size: ${dyslexicMode ? '24px' : '20px'};
    }

    .toggle-text { font-weight: 700; font-size: ${dyslexicMode ? '16px' : '13px'}; }

    .theme-toggle-container input[type="checkbox"]:checked + .theme-toggle-label .theme-toggle-inner {
      margin-left: -100%;
    }

    .theme-toggle-switch {
      position: absolute; top: ${dyslexicMode ? '6px' : '5px'}; left: ${dyslexicMode ? '6px' : '5px'};
      width: ${dyslexicMode ? '40px' : '32px'}; height: ${dyslexicMode ? '40px' : '32px'};
      background: ${primaryColor}; border-radius: 50%; transition: transform 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .theme-toggle-container input[type="checkbox"]:checked + .theme-toggle-label .theme-toggle-switch {
      transform: translateX(${dyslexicMode ? '58px' : '48px'});
    }

    .theme-toggle-text { font-size: ${baseFontSize}; color: ${textPrimary}; font-weight: 500; }

    .color-picker { display: flex; flex-direction: column; gap: ${dyslexicMode ? '20px' : '16px'}; }

    .color-options {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: ${dyslexicMode ? '16px' : '12px'};
    }

    .color-option {
      width: 100%; aspect-ratio: 1; border: 3px solid ${border}; border-radius: 12px;
      cursor: pointer; transition: all 0.3s; position: relative;
    }

    .color-option:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); }

    .custom-color-wrapper {
      display: flex; align-items: center; gap: ${dyslexicMode ? '16px' : '12px'};
      padding: ${dyslexicMode ? '16px' : '12px'}; background: ${bgPrimary};
      border-radius: 8px; border: 1px solid ${border};
    }

    .custom-color-wrapper label { font-size: ${baseFontSize}; font-weight: 600; color: ${textPrimary}; }

    .custom-color-wrapper input[type="color"] {
      width: ${dyslexicMode ? '70px' : '60px'}; height: ${dyslexicMode ? '48px' : '40px'};
      border: 2px solid ${border}; border-radius: 8px; cursor: pointer;
    }
  `;
}

function updateTheme(shadow) {
  const styleElement = shadow.querySelector('style');
  styleElement.textContent = getThemeStyles();
  
  const themeBtn = shadow.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }
}

function updateFAB() {
  const fab = document.getElementById('nuva-fab');
  if (fab) {
    fab.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
    fab.style.boxShadow = `0 4px 20px ${primaryColor}66`;
  }
}

function enableWordHover() {
  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    
    if (target.nodeType === Node.TEXT_NODE || target.matches('p, span, div, li, td, th, a, h1, h2, h3, h4, h5, h6')) {
      clearTimeout(hoverTimeout);
      
      hoverTimeout = setTimeout(() => {
        const selection = window.getSelection();
        let word = selection.toString().trim();
        
        if (!word) {
          const range = document.caretRangeFromPoint(e.clientX, e.clientY);
          if (range) {
            const textNode = range.startContainer;
            if (textNode.nodeType === Node.TEXT_NODE) {
              const text = textNode.textContent;
              const offset = range.startOffset;
              
              let start = offset;
              let end = offset;
              
              while (start > 0 && /\w/.test(text[start - 1])) start--;
              while (end < text.length && /\w/.test(text[end])) end++;
              
              word = text.substring(start, end).trim();
            }
          }
        }
        
        if (word && word.length > 3 && /^[a-zA-Z]+$/.test(word)) {
          showTooltip(word, e.clientX, e.clientY);
        }
      }, 1000);
    }
  });
  
  document.addEventListener('mouseout', () => {
    clearTimeout(hoverTimeout);
  });
}

async function showTooltip(word, x, y) {
  if (currentTooltip) {
    currentTooltip.remove();
    currentTooltip = null;
  }
  
  const container = document.createElement('div');
  container.id = 'nuva-tooltip-root';
  document.body.appendChild(container);
  
  const shadow = container.attachShadow({ mode: 'open' });
  
  const isDark = currentTheme === 'dark';
  const bgPrimary = isDark ? '#1a1a2e' : '#ffffff';
  const bgSecondary = isDark ? '#16213e' : '#f8f9fa';
  const textPrimary = isDark ? '#eee' : '#333';
  const textSecondary = isDark ? '#aaa' : '#666';
  const baseFontSize = dyslexicMode ? '18px' : '14px';
  const fontFamily = dyslexicMode ? 'OpenDyslexic, Comic Sans MS, sans-serif' : '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.cdnfonts.com/css/opendyslexic');
    
    .tooltip {
      position: fixed; background: ${bgPrimary}; border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, ${isDark ? '0.6' : '0.2'});
      padding: ${dyslexicMode ? '20px' : '16px'}; max-width: ${dyslexicMode ? '380px' : '320px'};
      z-index: 9999999; animation: fadeIn 0.2s ease; font-family: ${fontFamily}; color: ${textPrimary};
    }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
    
    .tooltip-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: ${dyslexicMode ? '14px' : '10px'}; padding-bottom: ${dyslexicMode ? '14px' : '10px'};
      border-bottom: 2px solid ${isDark ? '#2d3748' : '#f0f0f0'};
    }
    
    .tooltip-word { font-size: ${dyslexicMode ? '22px' : '18px'}; font-weight: 700; color: ${primaryColor}; }
    
    .tooltip-close {
      background: none; border: none; font-size: ${dyslexicMode ? '28px' : '24px'}; cursor: pointer;
      color: ${textSecondary}; width: ${dyslexicMode ? '32px' : '28px'}; height: ${dyslexicMode ? '32px' : '28px'};
      display: flex; align-items: center; justify-content: center; border-radius: 50%;
      transition: all 0.2s; padding: 0; line-height: 1;
    }
    
    .tooltip-close:hover { background: ${bgSecondary}; color: ${textPrimary}; }
    
    .tooltip-loading {
      text-align: center; color: ${textSecondary}; font-size: ${baseFontSize};
      padding: ${dyslexicMode ? '14px' : '10px'};
    }
    
    .tooltip-definition {
      font-size: ${baseFontSize}; line-height: ${dyslexicMode ? '2.2' : '1.6'};
      color: ${textPrimary}; margin-bottom: ${dyslexicMode ? '16px' : '12px'};
    }
    
    .tooltip-example {
      background: ${bgSecondary}; padding: ${dyslexicMode ? '14px' : '10px'}; border-radius: 8px;
      font-size: ${baseFontSize}; color: ${textSecondary}; font-style: italic;
      border-left: 3px solid ${primaryColor}; line-height: ${dyslexicMode ? '2' : '1.5'};
    }
  `;
  
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.innerHTML = `
    <div class="tooltip-header">
      <div class="tooltip-word">${word}</div>
      <button class="tooltip-close" id="close-tooltip">×</button>
    </div>
    <div class="tooltip-loading">Loading definition...</div>
  `;
  
  const maxX = window.innerWidth - (dyslexicMode ? 400 : 340);
  const maxY = window.innerHeight - 200;
  tooltip.style.left = Math.min(x, maxX) + 'px';
  tooltip.style.top = Math.min(y + 20, maxY) + 'px';
  
  shadow.appendChild(style);
  shadow.appendChild(tooltip);
  currentTooltip = container;
  
  shadow.getElementById('close-tooltip').addEventListener('click', () => {
    container.remove();
    currentTooltip = null;
  });
  
  const definition = await getWordDefinition(word);
  const loadingDiv = shadow.querySelector('.tooltip-loading');
  loadingDiv.outerHTML = definition;
}

async function getWordDefinition(word) {
  try {
    const prompt = `Provide a clear definition and example for the word "${word}".

FORMATTING REQUIREMENTS:
- Use exactly this structure:
  Definition: [your definition here]
  Example: [your example sentence here]
- Include a blank line between Definition and Example
- Do not add any extra text, explanations, or commentary

CONTENT REQUIREMENTS:
Definition:
- Write one clear, concise sentence that fully explains the meaning
- Use simple, accessible language
- Cover the primary meaning of the word
- Make it complete - do not truncate or abbreviate

Example:
- Create ONE natural, realistic sentence that demonstrates the word's usage
- Make the context clear so the meaning is obvious
- Use everyday language and realistic scenarios
- Ensure the sentence is complete and grammatically correct
- The example should clearly illustrate the definition given

Word to define: "${word}"`;
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
      })
    });
    
    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '';
    
    const defMatch = text.match(/Definition:\s*(.+?)(?=Example:|$)/is);
    const exMatch = text.match(/Example:\s*(.+?)$/is);
    
    const definition = defMatch ? defMatch[1].trim() : text;
    const example = exMatch ? exMatch[1].trim() : '';
    
    return `
      <div class="tooltip-definition">${definition}</div>
      ${example ? `<div class="tooltip-example">${example}</div>` : ''}
    `;
  } catch (error) {
    return `<div class="tooltip-definition" style="color: #c00;">Failed to load definition. Try again later.</div>`;
  }
}

function togglePanel() {
  const root = document.getElementById('nuva-root');
  if (root && root.shadowRoot) {
    const panel = root.shadowRoot.querySelector('.nuva-panel');
    const backdrop = root.shadowRoot.querySelector('.nuva-backdrop');
    panel.classList.toggle('active');
    backdrop.classList.toggle('active');
  }
}

// ENHANCED: COMPREHENSIVE CONTENT EXTRACTION - WORKS WITH ALL MEDIA TYPES
async function extractPageContent() {
  let content = '';
  console.log('🔍 Extracting content from:', window.location.href);
  
  // WAIT for page to fully load
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // PDF extraction - ENHANCED with multiple methods
  if (window.location.href.includes('.pdf') || document.querySelector('embed[type="application/pdf"]') || document.querySelector('iframe[src*=".pdf"]')) {
    console.log('📄 Detected PDF');
    try {
      // Method 1: Text layers (PDF.js)
      const textLayers = document.querySelectorAll('.textLayer, .textLayer span, [class*="textLayer"]');
      if (textLayers.length > 0) {
        console.log('✅ Found textLayers:', textLayers.length);
        textLayers.forEach(layer => { content += layer.textContent + '\n'; });
      }
      
      // Method 2: Canvas-based PDF viewers
      if (!content) {
        const pdfSpans = document.querySelectorAll('[role="document"] span, .page span, [data-page-number] span');
        console.log('📝 Found PDF spans:', pdfSpans.length);
        pdfSpans.forEach(span => { content += span.textContent + ' '; });
      }
      
      // Method 3: PDF iframe content
      if (!content) {
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const iframeText = iframeDoc.body.innerText;
            if (iframeText) content += iframeText;
          } catch (e) { console.log('iframe access blocked'); }
        }
      }
    } catch (e) { console.log('PDF extraction error:', e); }
  }
  
  // Google Docs - ENHANCED comprehensive extraction
  if (window.location.href.includes('docs.google.com/document')) {
    console.log('📝 Detected Google Docs');
    try {
      // Method 1: Main content area
      const selectors = [
        '.kix-pagesection',
        '.kix-page-content-wrapper',
        '[role="document"]',
        '.kix-appview-editor'
      ];
      
      for (const selector of selectors) {
        const docsContent = document.querySelector(selector);
        if (docsContent && docsContent.innerText) {
          console.log('✅ Found content with:', selector);
          content = docsContent.innerText;
          break;
        }
      }
      
      // Method 2: Individual paragraphs
      if (!content) {
        const paragraphs = document.querySelectorAll('.kix-paragraphrenderer, .kix-lineview, .kix-lineview-text-block');
        console.log('📝 Found paragraphs:', paragraphs.length);
        paragraphs.forEach(p => { content += p.textContent + '\n'; });
      }
      
      // Method 3: All text spans
      if (!content) {
        const spans = document.querySelectorAll('.kix-wordhtmlgenerator-word-node, [role="textbox"]');
        console.log('📝 Found spans:', spans.length);
        spans.forEach(span => { content += span.textContent + ' '; });
      }
    } catch (e) { console.log('Google Docs error:', e); }
  }
  
  // Google Slides - ENHANCED extraction
  if (window.location.href.includes('docs.google.com/presentation')) {
    console.log('🎨 Detected Google Slides');
    try {
      // Method 1: Slide content
      const slideSelectors = [
        '.sketchy-text-content-wrapper',
        '.sketchy-text-content',
        '[role="textbox"]',
        '.punch-viewer-content'
      ];
      
      slideSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (el.textContent.trim()) content += el.textContent + '\n';
        });
      });
      
      // Method 2: SVG text elements
      document.querySelectorAll('svg text, g text').forEach(text => {
        if (text.textContent.trim()) content += text.textContent + ' ';
      });
      
      // Method 3: Speaker notes
      const notes = document.querySelector('.punch-viewer-speakernotes-page, [aria-label*="Speaker notes"]');
      if (notes) { content += '\n\n📝 Notes:\n' + notes.textContent; }
      
      console.log('✅ Slides content length:', content.length);
    } catch (e) { console.log('Google Slides error:', e); }
  }
  
  // Google Sheets - ENHANCED extraction
  if (window.location.href.includes('docs.google.com/spreadsheets')) {
    console.log('📊 Detected Google Sheets');
    try {
      const cells = document.querySelectorAll('.grid-container .s-cell-content, .cell-input, [role="gridcell"]');
      console.log('📊 Found cells:', cells.length);
      cells.forEach(cell => {
        if (cell.textContent.trim()) content += cell.textContent + '\t';
      });
    } catch (e) { console.log('Google Sheets error:', e); }
  }
  
  // Notion - ENHANCED extraction
  if (window.location.href.includes('notion.so') || window.location.href.includes('notion.site')) {
    console.log('📓 Detected Notion');
    try {
      const notionSelectors = [
        '[data-block-id]',
        '.notion-page-content',
        '[class*="notion"]',
        'article',
        'main'
      ];
      
      for (const selector of notionSelectors) {
        const notionContent = document.querySelector(selector);
        if (notionContent && notionContent.innerText) {
          console.log('✅ Found Notion content');
          content = notionContent.innerText;
          break;
        }
      }
    } catch (e) { console.log('Notion error:', e); }
  }
  
  // Microsoft Office Online - ENHANCED
  if (window.location.href.includes('office.com') || window.location.href.includes('officeapps.live.com') || window.location.href.includes('sharepoint.com')) {
    console.log('📄 Detected Microsoft Office');
    try {
      const officeSelectors = [
        '.Page',
        '.Slide',
        '[role="document"]',
        '#WACViewPanel',
        '.EmbedViewerWrapper'
      ];
      
      officeSelectors.forEach(selector => {
        document.querySelectorAll(`${selector} p, ${selector} span, ${selector} div`).forEach(el => {
          if (el.textContent.trim() && !el.querySelector('p, span, div')) {
            content += el.textContent + '\n';
          }
        });
      });
      console.log('✅ Office content length:', content.length);
    } catch (e) { console.log('Office error:', e); }
  }
  
  // Canva - ENHANCED extraction
  if (window.location.href.includes('canva.com')) {
    console.log('🎨 Detected Canva');
    try {
      const canvaSelectors = [
        '[data-text-node]',
        '.text-container',
        '[role="textbox"]',
        '[class*="text"]'
      ];
      
      canvaSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (el.textContent.trim()) content += el.textContent + '\n';
        });
      });
    } catch (e) { console.log('Canva error:', e); }
  }
  
  // Medium articles
  if (window.location.href.includes('medium.com') || document.querySelector('article[data-post-id]')) {
    console.log('📰 Detected Medium');
    try {
      const article = document.querySelector('article');
      if (article) { content = article.innerText; }
    } catch (e) { console.log('Medium error:', e); }
  }
  
  // Wikipedia
  if (window.location.href.includes('wikipedia.org')) {
    console.log('📚 Detected Wikipedia');
    try {
      const wikiContent = document.querySelector('#mw-content-text, .mw-parser-output');
      if (wikiContent) { content = wikiContent.innerText; }
    } catch (e) { console.log('Wikipedia error:', e); }
  }
  
  // YouTube transcripts
  if (window.location.href.includes('youtube.com')) {
    console.log('🎥 Detected YouTube');
    try {
      const description = document.querySelector('#description, ytd-video-secondary-info-renderer #description');
      if (description) { content = 'Video Description:\n' + description.innerText; }
    } catch (e) { console.log('YouTube error:', e); }
  }
  
  // Generic fallback for OTHER websites
  if (!content || content.length < 50) {
    console.log('🌐 Using generic extraction');
    
    // Try article tag first
    const article = document.querySelector('article');
    if (article && article.innerText && article.innerText.length > 100) {
      content = article.innerText;
      console.log('✅ Found article tag');
    } else {
      // Try main tag
      const main = document.querySelector('main');
      if (main && main.innerText && main.innerText.length > 100) {
        content = main.innerText;
        console.log('✅ Found main tag');
      } else {
        // Try common content containers
        const containers = document.querySelectorAll('[role="main"], .content, #content, .post, .article, .entry-content, .post-content, [class*="content"]');
        let maxContent = '';
        containers.forEach(el => {
          if (el.innerText && el.innerText.length > maxContent.length) {
            maxContent = el.innerText;
          }
        });
        
        if (maxContent.length > 100) {
          content = maxContent;
          console.log('✅ Found content container');
        } else {
          // Last resort: get all readable text
          console.log('⚠️ Last resort extraction');
          const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, pre, code');
          const seenText = new Set();
          textElements.forEach(el => {
            const text = el.innerText?.trim();
            if (text && text.length > 20 && !seenText.has(text)) {
              seenText.add(text);
              content += text + '\n';
            }
          });
        }
      }
    }
  }
  
  // Clean up content
  content = content
    .replace(/\s+/g, ' ')  // Replace multiple spaces
    .replace(/\n\s*\n\s*\n/g, '\n\n')  // Remove excessive line breaks
    .trim();
  
  console.log('📊 Final content length:', content.length);
  
  return content || 'No readable content found on this page. Try selecting specific text to analyze, or the page content may not be accessible yet.';
}

async function analyzeContent(content, mode, intensity) {
  try {
    const contentLength = content.length;
    const maxContentLength = contentLength > 15000 ? 15000 : contentLength;
    const truncatedContent = content.substring(0, maxContentLength);
    
    const prompts = {
  restructure: {
    short: `Summarize this text concisely in 3-4 well-structured paragraphs.

CRITICAL FORMATTING RULES:
- Each paragraph MUST be separated by TWO blank lines (press Enter twice)
- Each paragraph should contain 4-5 sentences ONLY
- After each paragraph, on a new line, add the citation in parentheses
- Citation format: (Source: Paragraph X - "first 5-6 words...")
- Do NOT run sentences together - use proper punctuation and spacing

STRUCTURE EXAMPLE:
First paragraph with 4-5 sentences about the main idea. Each sentence should be clear and complete. End with proper punctuation.

(Source: Paragraph 1 - "opening words of source paragraph...")

Second paragraph starting after blank lines with 4-5 more sentences. Continue with the next main point clearly separated from above.

(Source: Paragraph 2 - "opening words...")

CONTENT REQUIREMENTS:
- Focus on the main ideas and most critical information
- Do not truncate or omit key details
- Present information in logical order
- Use clear, direct language

Text to summarize:

${truncatedContent}`,

    medium: `Provide a comprehensive summary of this text covering all important points.

CRITICAL FORMATTING RULES:
- Structure your response in 5-7 clear paragraphs
- MANDATORY: Insert TWO blank lines between each paragraph
- Each paragraph = exactly 5-6 sentences, no more, no less
- After each paragraph, skip one line and add citation
- Citation format: (Source: Paragraphs X, Y - "opening words...")
- Use proper sentence spacing and punctuation throughout

PARAGRAPH STRUCTURE TEMPLATE:

Main Point 1: First sentence introduces the topic. Second sentence provides detail. Third sentence adds context. Fourth sentence elaborates. Fifth sentence concludes the point.

(Source: Paragraphs 1-2 - "opening words of source...")


Main Point 2: [New paragraph after two blank lines above]. Follow same 5-6 sentence structure. Ensure clear separation from previous paragraph.

(Source: Paragraphs 3-4 - "opening words...")

CONTENT REQUIREMENTS:
- Include ALL significant points and key details
- Do not truncate, abbreviate, or omit important information
- Maintain the logical flow of ideas
- Cover supporting details and context where relevant

Text to summarize:

${truncatedContent}`,

    detailed: `Create an exhaustive, highly detailed summary covering every significant aspect of this text.

CRITICAL FORMATTING RULES - FOLLOW EXACTLY:
- Organize into 8-12 well-structured paragraphs
- MANDATORY: Each paragraph MUST be followed by TWO blank lines before the next
- Strict limit: 5-7 sentences per paragraph
- Add citation after each paragraph on a new line
- Citation format: (Source: Paragraphs X, Y, Z - "first few words...")
- Ensure proper spacing: sentence space, line breaks, paragraph separation

REQUIRED STRUCTURE:

Topic Area 1:
Sentence one introduces the main concept. Sentence two provides foundational detail. Sentence three expands with examples or evidence. Sentence four adds nuance or context. Sentence five connects to broader themes. Sentence six concludes this point.

(Source: Paragraphs 1-3 - "opening text from source...")


Topic Area 2:
[Begin new paragraph here after blank lines]. Sentence structure continues with 5-7 complete sentences. Maintain clear separation from all other paragraphs.

(Source: Paragraphs 4-5 - "opening text...")


[Continue this pattern for all paragraphs]

CONTENT REQUIREMENTS:
- Cover ALL main points, supporting details, examples, and nuances
- Do not truncate or summarize too aggressively - be COMPREHENSIVE
- Include context, explanations, and elaborations
- Maintain relationships between ideas
- Preserve important examples and evidence

Text to summarize:

${truncatedContent}`
  },

  simplify: {
    short: `Rewrite this text in simple, everyday language that anyone can easily understand.

CRITICAL FORMATTING RULES:
- Break into 3-4 short paragraphs
- Insert TWO blank lines between each paragraph
- Keep paragraphs to 4-5 sentences each
- Add citation after each paragraph: (From: Paragraph X - "opening words...")
- Use clear spacing and punctuation

STRUCTURE EXAMPLE:

First main idea explained simply. Second sentence adds detail. Third sentence clarifies further. Fourth sentence completes the thought.

(From: Paragraph 1 - "opening words...")


Second main idea after blank lines. Continue with simple language. Keep sentences clear and short.

(From: Paragraph 2 - "opening words...")

CONTENT REQUIREMENTS:
- Use simple words and short sentences
- Avoid jargon and technical terms (or explain them simply)
- Keep all important information - do not leave anything out
- Make complex ideas accessible without losing meaning

Text to simplify:

${truncatedContent}`,

    medium: `Transform this text into clear, accessible language while preserving all important information.

CRITICAL FORMATTING RULES:
- Structure in 5-7 digestible paragraphs
- MANDATORY: Two blank lines between every paragraph
- Each paragraph = 5-6 sentences maximum
- Add citations after each paragraph: (From: Paragraphs X, Y - "first words...")
- Maintain proper spacing throughout

PARAGRAPH FORMAT:

Simplified Point 1: Start with clear, simple language. Break down complex ideas. Use everyday words. Provide context simply. Complete the explanation. End this thought clearly.

(From: Paragraphs 1-2 - "opening text...")


Simplified Point 2: [New paragraph after blank lines]. Continue with accessible language. Maintain simplicity throughout all sentences.

(From: Paragraphs 3-4 - "opening text...")

CONTENT REQUIREMENTS:
- Replace complex vocabulary with everyday words
- Break down complicated concepts into understandable parts
- Maintain completeness - do not truncate or omit details
- Use analogies or examples where helpful
- Keep the logical flow of the original

Text to simplify:

${truncatedContent}`,

    detailed: `Thoroughly rewrite this text in the simplest possible language with complete explanations.

CRITICAL FORMATTING RULES - MUST FOLLOW:
- Organize into 8-12 clear, focused paragraphs
- MANDATORY: TWO blank lines between each paragraph
- Strict limit: 5-7 sentences per paragraph
- Citations after each paragraph: (From: Paragraphs X, Y - "opening text...")
- Proper sentence and paragraph spacing throughout

REQUIRED FORMAT:

Simplified Topic 1:
First sentence introduces simply. Second sentence explains clearly. Third adds detail in easy terms. Fourth provides example or context. Fifth clarifies further. Sixth wraps up this point.

(From: Paragraphs 1-3 - "source opening...")


Simplified Topic 2:
[Start here after two blank lines]. Continue with simple explanations. Maintain 5-7 sentence structure per paragraph.

(From: Paragraphs 4-6 - "source opening...")

CONTENT REQUIREMENTS:
- Explain EVERY concept in plain, simple language
- Define or explain any necessary technical terms
- Add clarifying examples for complex ideas
- Do not truncate - include all information in simplified form
- Ensure anyone without background knowledge can understand
- Use analogies and real-world examples

Text to simplify:

${truncatedContent}`
  },

  points: {
    short: `Extract the 5-7 most crucial points from this text in note-making format.

CRITICAL FORMATTING RULES:
- Use hierarchical structure with Roman numerals and letters
- Format: I. Main Point
         A. Sub-point (indented with 3 spaces)
            1. Detail (indented with 6 spaces)
- Leave ONE blank line between major sections (I, II, III, etc.)
- Add citation after each major section: (Ref: Paragraph X - "opening words...")

STRUCTURE EXAMPLE:

I. First Major Point - brief description
   A. Supporting detail one
   B. Supporting detail two

(Ref: Paragraph 1 - "opening text...")

II. Second Major Point - brief description
   A. Supporting detail
      1. Specific example
      2. Additional detail

(Ref: Paragraphs 2-3 - "opening text...")

CONTENT REQUIREMENTS:
- Identify only the most important, high-level points
- Include brief context or explanation under each point
- Do not truncate essential information
- Prioritize key takeaways

Text to extract from:

${truncatedContent}`,

    medium: `Create comprehensive notes covering ALL important points from this text.

CRITICAL FORMATTING RULES:
- Use strict hierarchical structure:
  I., II., III. = Main topics
  A., B., C. = Sub-topics (indent 3 spaces)
  1., 2., 3. = Details (indent 6 spaces)
- Insert ONE blank line between major sections only
- Maintain consistent spacing and indentation
- Add citations after each major section: (Ref: Paragraphs X, Y - "first words...")

REQUIRED STRUCTURE:

I. Main Topic One
   A. First sub-topic with explanation
   B. Second sub-topic with context
      1. Supporting detail
      2. Additional information

(Ref: Paragraphs 1-2 - "source text...")

II. Main Topic Two
   A. Sub-topic explanation
   B. Related information
      1. Specific detail
      2. Example or evidence

(Ref: Paragraphs 3-5 - "source text...")

CONTENT REQUIREMENTS:
- Include ALL significant points, not just major ones
- Add brief explanations or context under each point
- Do not omit or truncate information
- Organize logically by theme or sequence
- Include important examples or evidence

Text to extract from:

${truncatedContent}`,

    detailed: `Create exhaustive, detailed notes capturing EVERY point and detail from this text.

CRITICAL FORMATTING RULES - FOLLOW PRECISELY:
- Use comprehensive hierarchical structure:
  I., II., III. = Main topics (no indent)
  A., B., C. = Major sub-topics (3 spaces indent)
  1., 2., 3. = Minor sub-topics (6 spaces indent)
  a., b., c. = Specific details (9 spaces indent)
- Insert ONE blank line between major sections (I, II, III) only
- Maintain absolutely consistent indentation throughout
- Add citations after each major section: (Ref: Paragraph X - "opening words...")

REQUIRED FORMAT:

I. First Major Topic Area
   A. Primary sub-topic with full explanation
      1. Supporting detail with context
      2. Additional detail or example
         a. Specific evidence
         b. Related information
   B. Second sub-topic with explanation
      1. Detail one
      2. Detail two

(Ref: Paragraphs 1-3 - "source opening...")

II. Second Major Topic Area
   A. Primary sub-topic
      1. Detail
         a. Specific point
         b. Related point
      2. Additional detail
   B. Secondary sub-topic

(Ref: Paragraphs 4-6 - "source opening...")

CONTENT REQUIREMENTS:
- Document EVERYTHING: main points, sub-points, examples, evidence, context
- Do not truncate or abbreviate - be thorough and complete
- Include explanations and elaborations
- Preserve relationships between ideas
- Capture nuances and qualifications
- Note important examples, data, or quotes

Text to extract from:

${truncatedContent}`
  }
};
    
    const prompt = prompts[mode][intensity];
    const maxTokens = intensity === 'detailed' ? 8192 : intensity === 'medium' ? 4096 : 2048;
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: maxTokens },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      })
    });
    
    if (!response.ok) throw new Error(`API Error ${response.status}`);
    
    const data = await response.json();
    
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const aiText = data.candidates[0].content.parts[0].text;
      
      return `
        <div class="nuva-success">
          <strong>✅ AI Analysis Complete (${intensity.toUpperCase()} detail level)</strong>
          ${selectionMode ? '<p style="margin-top: 8px; font-size: 13px;">Analysis of selected text</p>' : ''}
        </div>
        <div style="line-height: ${dyslexicMode ? '2.2' : '1.8'};">${formatText(aiText)}</div>
      `;
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Error:', error);
    return `
      <div class="nuva-error">
        <strong>⚠️ Error</strong>
        <p style="margin: 10px 0 0 0;">${error.message}</p>
      </div>
    `;
  }
}

async function answerDoubt(question, pageContent) {
  try {
    const contentPreview = pageContent.length > 3000 ? pageContent.substring(0, 3000) : pageContent;
    
    const prompt = `You are a helpful and brilliant educational assistant. A student has a question about the content they are reading.

${selectionMode ? 'Selected Text:' : 'Page Content Preview:'}
${contentPreview}

Student's Question: ${question}

Provide a comprehensive, detailed answer that:
1. Directly answers their question
2. Provides context and background information
3. Includes examples where helpful
4. Uses clear, student-friendly language
5. Is thorough and complete

Give a COMPLETE response, do not truncate and give complete response and also give the paragraph number from which you are taking information from like (...) where you provide the first line of the paragraph you extracted answer from. Be detailed and helpful.`;
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      })
    });
    
    if (!response.ok) throw new Error(`API Error ${response.status}`);
    
    const data = await response.json();
    
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const aiText = data.candidates[0].content.parts[0].text;
      
      return `
        <div class="nuva-success">
          <strong>💬 Answer to your doubt:</strong>
          ${selectionMode ? '<p style="margin-top: 8px; font-size: 13px;">Based on selected text</p>' : ''}
        </div>
        <div style="line-height: ${dyslexicMode ? '2.2' : '1.8'};">${formatText(aiText)}</div>
      `;
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Error:', error);
    return `
      <div class="nuva-error">
        <strong>⚠️ Error</strong>
        <p style="margin: 10px 0 0 0;">${error.message}</p>
        <p style="margin: 10px 0 0 0; font-size: 12px;">Please try again or rephrase your question.</p>
      </div>
    `;
  }
}

function formatText(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  const paragraphs = text.split('\n\n');
  let formatted = '';
  
  const spacing = dyslexicMode ? '20px' : '15px';
  const listSpacing = dyslexicMode ? '10px' : '5px';
  
  paragraphs.forEach(para => {
    if (para.trim().startsWith('- ') || para.trim().startsWith('• ') || para.trim().match(/^\d+\./)) {
      const items = para.split('\n');
      formatted += `<ul style="margin: ${spacing} 0; padding-left: ${dyslexicMode ? '30px' : '20px'};">`;
      items.forEach(item => {
        const cleanItem = item.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        if (cleanItem) {
          formatted += `<li style="margin: ${listSpacing} 0;">${cleanItem}</li>`;
        }
      });
      formatted += '</ul>';
    } else if (para.trim()) {
      formatted += `<p style="margin: ${spacing} 0;">${para.trim()}</p>`;
    }
  });
  
  return formatted;
}