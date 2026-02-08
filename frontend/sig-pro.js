// ============================================================================
// SISTEMA GIS PROFESIONAL - ESTADO ZULIA
// Sistema de Información Geográfica con Análisis de Riesgos
// Versión con funcionalidades por rol
// ============================================================================

// ========== VARIABLES GLOBALES ==========
let map;
let currentMarker;
let currentCircle;
let currentLocation = null;
let selectedRisks = new Set();
let selectedSeverity = new Set();
let selectedImpacts = new Set();
let currentUser = null;
let analysisHistory = []; // Historial de análisis

// ========== BASE DE DATOS DE UBICACIONES ==========
const zuliaLocations = {
    // Municipio Maracaibo
    'maracaibo': { lat: 10.6316, lng: -71.6405, name: 'Maracaibo', type: 'Ciudad', municipality: 'Maracaibo' },
    'san isidro': { lat: 10.5987, lng: -71.6891, name: 'San Isidro', type: 'Sector', municipality: 'Maracaibo' },
    'santa lucia': { lat: 10.6400, lng: -71.6118, name: 'Santa Lucía', type: 'Parroquia', municipality: 'Maracaibo' },
    'el milagro': { lat: 10.6800, lng: -71.6000, name: 'El Milagro', type: 'Sector', municipality: 'Maracaibo' },
    'la lago': { lat: 10.6900, lng: -71.6300, name: 'La Lago', type: 'Urbanización', municipality: 'Maracaibo' },
    'valle frio': { lat: 10.6550, lng: -71.6200, name: 'Valle Frío', type: 'Sector', municipality: 'Maracaibo' },
    '18 de octubre': { lat: 10.6725, lng: -71.6345, name: '18 de Octubre', type: 'Barrio', municipality: 'Maracaibo' },
    'sabaneta': { lat: 10.6500, lng: -71.6500, name: 'Sabaneta', type: 'Parroquia', municipality: 'Maracaibo' },
    'raul leoni': { lat: 10.6234, lng: -71.6123, name: 'Raúl Leoni', type: 'Parroquia', municipality: 'Maracaibo' },
    'cacique mara': { lat: 10.6532, lng: -71.6789, name: 'Cacique Mara', type: 'Parroquia', municipality: 'Maracaibo' },
    'coquivacoa': { lat: 10.6445, lng: -71.6234, name: 'Coquivacoa', type: 'Parroquia', municipality: 'Maracaibo' },
    
    // Municipio San Francisco
    'san francisco': { lat: 10.5856, lng: -71.6722, name: 'San Francisco', type: 'Ciudad', municipality: 'San Francisco' },
    'la victoria': { lat: 10.5923, lng: -71.6634, name: 'La Victoria', type: 'Sector', municipality: 'San Francisco' },
    'marcial hernandez': { lat: 10.5789, lng: -71.6823, name: 'Marcial Hernández', type: 'Parroquia', municipality: 'San Francisco' },
    
    // Municipio Cabimas
    'cabimas': { lat: 10.3923, lng: -71.4479, name: 'Cabimas', type: 'Ciudad', municipality: 'Cabimas' },
    'costa oriental': { lat: 10.4234, lng: -71.4123, name: 'Costa Oriental del Lago', type: 'Zona', municipality: 'Cabimas' },
    
    // Municipio Ciudad Ojeda
    'ciudad ojeda': { lat: 10.1976, lng: -71.3024, name: 'Ciudad Ojeda', type: 'Ciudad', municipality: 'Lagunillas' },
    'lagunillas': { lat: 10.1334, lng: -71.2567, name: 'Lagunillas', type: 'Ciudad', municipality: 'Lagunillas' },
    
    // Municipio Santa Rita
    'santa rita': { lat: 10.1667, lng: -71.4833, name: 'Santa Rita', type: 'Ciudad', municipality: 'Santa Rita' },
    'el tablazo': { lat: 10.2123, lng: -71.4567, name: 'El Tablazo', type: 'Sector', municipality: 'Santa Rita' },
    
    // Municipio Machiques
    'machiques': { lat: 10.0500, lng: -72.5500, name: 'Machiques de Perijá', type: 'Ciudad', municipality: 'Machiques de Perijá' },
    'sierra de perija': { lat: 10.1234, lng: -72.6789, name: 'Sierra de Perijá', type: 'Zona', municipality: 'Machiques de Perijá' },
    
    // Municipio La Cañada de Urdaneta
    'concepcion': { lat: 10.1833, lng: -72.3167, name: 'Concepción', type: 'Ciudad', municipality: 'La Cañada de Urdaneta' },
    
    // Municipio Mara
    'san rafael del mojan': { lat: 11.0833, lng: -71.7833, name: 'San Rafael del Moján', type: 'Ciudad', municipality: 'Mara' },
    
    // Municipio Jesús Enrique Lossada
    'la concepcion': { lat: 10.7833, lng: -71.8667, name: 'La Concepción', type: 'Ciudad', municipality: 'Jesús Enrique Lossada' },
    
    // Municipio Miranda
    'los puertos de altagracia': { lat: 9.0333, lng: -71.4167, name: 'Los Puertos de Altagracia', type: 'Ciudad', municipality: 'Miranda' },
    
    // Municipio Rosario de Perijá
    'rosario de perija': { lat: 10.3500, lng: -72.3167, name: 'Rosario de Perijá', type: 'Ciudad', municipality: 'Rosario de Perijá' },
    
    // Municipio Valmore Rodríguez
    'bachaquero': { lat: 9.6833, lng: -71.3500, name: 'Bachaquero', type: 'Ciudad', municipality: 'Valmore Rodríguez' },
    
    // Municipio Sucre
    'bobures': { lat: 9.5000, lng: -71.7667, name: 'Bobures', type: 'Ciudad', municipality: 'Sucre' },
    
    // Municipio Colón
    'san carlos del zulia': { lat: 9.0000, lng: -72.3000, name: 'San Carlos del Zulia', type: 'Ciudad', municipality: 'Colón' },
    
    // Municipio Guajira
    'sinamaica': { lat: 10.7833, lng: -71.2833, name: 'Sinamaica', type: 'Ciudad', municipality: 'Guajira' },
    
    // Municipio Almirante Padilla
    'el mojan': { lat: 10.8667, lng: -71.6833, name: 'El Moján', type: 'Ciudad', municipality: 'Almirante Padilla' }
};

// ========== FACTORES DE RIESGO ==========
const riskFactors = [
    { id: 'salinizado', name: 'Suelo Salinizado', level: 'high', category: 'soil' },
    { id: 'erosion', name: 'Erosión del Suelo', level: 'high', category: 'soil' },
    { id: 'inundacion', name: 'Riesgo de Inundación', level: 'high', category: 'water' },
    { id: 'aguasEstancadas', name: 'Aguas Estancadas', level: 'medium', category: 'water' },
    { id: 'aridez', name: 'Aridez Climática', level: 'medium', category: 'climate' },
    { id: 'contaminacion', name: 'Contaminación Petrolera', level: 'high', category: 'pollution' },
    { id: 'bajafertilidad', name: 'Baja Fertilidad', level: 'medium', category: 'soil' },
    { id: 'topografia', name: 'Topografía Accidentada', level: 'medium', category: 'terrain' },
    { id: 'quemas', name: 'Áreas Quemadas', level: 'high', category: 'fire' },
    { id: 'deforestacion', name: 'Deforestación', level: 'high', category: 'environmental' },
    { id: 'sequia', name: 'Sequía', level: 'high', category: 'climate' },
    { id: 'plagas', name: 'Plagas y Enfermedades', level: 'medium', category: 'biological' }
];

const severityLevels = [
    { id: 'muy-alto', name: 'Muy Alto' },
    { id: 'alto', name: 'Alto' },
    { id: 'moderado', name: 'Moderado' },
    { id: 'bajo', name: 'Bajo' }
];

const impactTypes = [
    { id: 'suelo', name: 'Suelo' },
    { id: 'agua', name: 'Agua' },
    { id: 'clima', name: 'Clima' },
    { id: 'biodiversidad', name: 'Biodiversidad' },
    { id: 'agricultura', name: 'Agricultura' }
];

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Verificar autenticación
    if (!ApiClient.isAuthenticated()) {
        window.location.href = 'auth.html';
        return;
    }

    // Obtener datos del usuario
    currentUser = ApiClient.getUser();
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }

    // Mostrar información del usuario
    displayUserInfo();

    // Verificar que Leaflet esté cargado
    if (typeof L === 'undefined') {
        setTimeout(initializeApp, 200);
        return;
    }
    
    // Inicializar componentes
    initMap();
    renderTags();
    setupEventListeners();
    
    // Cargar funcionalidades según el rol
    loadRoleFeatures();
}

function displayUserInfo() {
    document.getElementById('username-display').textContent = currentUser.username;
    document.getElementById('role-display').textContent = capitalizeRole(currentUser.rol);

    // Mostrar botón de admin solo si es administrador
    if (currentUser.rol === 'administrador') {
        document.getElementById('btn-admin-panel').style.display = 'flex';
    }
}

function capitalizeRole(role) {
    const roles = {
        'consultor': 'Consultor',
        'analista': 'Analista',
        'administrador': 'Administrador'
    };
    return roles[role] || role;
}

// ========== FUNCIONALIDADES POR ROL ==========
function loadRoleFeatures() {
    console.log(`✅ Usuario: ${currentUser.username} | Rol: ${currentUser.rol}`);
    
    // Funcionalidades según rol
    if (currentUser.rol === 'analista' || currentUser.rol === 'administrador') {
        addExportButton();
        addHistoryButton();
    }
    
    if (currentUser.rol === 'administrador') {
        addDataManagementFeatures();
    }
}

function addExportButton() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    // Crear contenedor para botones si no existe
    let btnContainer = document.querySelector('.analyze-btn-container');
    if (!btnContainer) {
        btnContainer = document.createElement('div');
        btnContainer.className = 'analyze-btn-container';
        btnContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px; width: calc(100% - 40px); margin: 0 20px 20px;';
        
        // Mover el botón de análisis al contenedor
        const parent = analyzeBtn.parentElement;
        parent.insertBefore(btnContainer, analyzeBtn);
        btnContainer.appendChild(analyzeBtn);
    }
    
    // Agregar botón de exportar PDF
    const exportBtn = document.createElement('button');
    exportBtn.id = 'exportPdfBtn';
    exportBtn.className = 'export-btn';
    exportBtn.innerHTML = '📄 Exportar Análisis a PDF';
    exportBtn.disabled = true;
    exportBtn.style.cssText = `
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 0.95em;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    exportBtn.onclick = exportToPDF;
    
    btnContainer.appendChild(exportBtn);
    
    // Estilo hover
    exportBtn.onmouseover = function() {
        if (!this.disabled) {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.4)';
        }
    };
    exportBtn.onmouseout = function() {
        this.style.transform = 'none';
        this.style.boxShadow = 'none';
    };
}

function addHistoryButton() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const btnContainer = analyzeBtn.parentElement;
    
    // Agregar botón de historial
    const historyBtn = document.createElement('button');
    historyBtn.id = 'historyBtn';
    historyBtn.className = 'history-btn';
    historyBtn.innerHTML = '📊 Ver Historial de Análisis';
    historyBtn.style.cssText = `
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 0.95em;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    historyBtn.onclick = showHistory;
    
    btnContainer.appendChild(historyBtn);
    
    // Estilo hover
    historyBtn.onmouseover = function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 20px rgba(8, 145, 178, 0.4)';
    };
    historyBtn.onmouseout = function() {
        this.style.transform = 'none';
        this.style.boxShadow = 'none';
    };
}

function addDataManagementFeatures() {
    console.log('✅ Funcionalidades de administrador habilitadas');
    // En futuras versiones: agregar gestión de ubicaciones, factores, etc.
}

// ========== EXPORTAR A PDF ==========
function exportToPDF() {
    if (!currentLocation) {
        alert('No hay análisis para exportar');
        return;
    }
    
    // Generar contenido del PDF
    const risks = Array.from(selectedRisks).map(id => {
        const factor = riskFactors.find(f => f.id === id);
        return factor;
    });
    
    const highRiskCount = risks.filter(r => r.level === 'high').length;
    let overallRisk;
    
    if (highRiskCount >= 4) {
        overallRisk = 'MUY ALTO';
    } else if (highRiskCount >= 2) {
        overallRisk = 'ALTO';
    } else if (highRiskCount >= 1) {
        overallRisk = 'MODERADO';
    } else {
        overallRisk = 'BAJO';
    }
    
    // Crear contenido del reporte
    let reportContent = `
═══════════════════════════════════════════════════
  REPORTE DE ANÁLISIS DE RIESGO - GIS ZULIA
═══════════════════════════════════════════════════

UBICACIÓN:
  Nombre: ${currentLocation.name}
  Tipo: ${currentLocation.type}
  Municipio: ${currentLocation.municipality}
  Coordenadas: ${currentLocation.lat.toFixed(4)}°N, ${Math.abs(currentLocation.lng).toFixed(4)}°W

NIVEL DE RIESGO GENERAL: ${overallRisk}

FACTORES DE RIESGO IDENTIFICADOS (${risks.length}):
`;

    risks.forEach((risk, index) => {
        reportContent += `\n${index + 1}. ${risk.name} [${risk.level === 'high' ? 'ALTO' : 'MEDIO'}]`;
    });
    
    reportContent += `

ANÁLISIS GENERADO POR:
  Usuario: ${currentUser.username}
  Rol: ${capitalizeRole(currentUser.rol)}
  Fecha: ${new Date().toLocaleString('es-ES')}

═══════════════════════════════════════════════════
Sistema GIS Risk Zulia - Análisis de Zonas de Riesgo
`;

    // Crear blob y descargar
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_${currentLocation.name.replace(/ /g, '_')}_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ Reporte exportado correctamente');
}

// ========== HISTORIAL ==========
function showHistory() {
    if (analysisHistory.length === 0) {
        alert('No hay análisis en el historial');
        return;
    }
    
    let historyContent = '📊 HISTORIAL DE ANÁLISIS\n\n';
    analysisHistory.forEach((item, index) => {
        historyContent += `${index + 1}. ${item.location} - ${item.date}\n`;
        historyContent += `   Riesgo: ${item.risk} | Factores: ${item.factorsCount}\n\n`;
    });
    
    alert(historyContent);
}

function saveToHistory(location, risk, factorsCount) {
    analysisHistory.push({
        location: location,
        date: new Date().toLocaleString('es-ES'),
        risk: risk,
        factorsCount: factorsCount
    });
}

// ========== MAPA ==========
function initMap() {
    const center = [10.2500, -71.7500];
    const bounds = [[8.5000, -73.5000], [12.0000, -70.5000]];

    map = L.map('map', {
        center: center,
        zoom: 8,
        minZoom: 7,
        maxZoom: 16,
        maxBounds: bounds,
        maxBoundsViscosity: 0.9
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// ========== RENDERIZAR TAGS ==========
function renderTags() {
    const riskTagsContainer = document.getElementById('riskTags');
    const severityTagsContainer = document.getElementById('severityTags');
    const impactTagsContainer = document.getElementById('impactTags');

    riskFactors.forEach(factor => {
        const tag = createTag(factor.name, factor.id, 'risk', factor.level);
        riskTagsContainer.appendChild(tag);
    });

    severityLevels.forEach(level => {
        const tag = createTag(level.name, level.id, 'severity');
        severityTagsContainer.appendChild(tag);
    });

    impactTypes.forEach(impact => {
        const tag = createTag(impact.name, impact.id, 'impact');
        impactTagsContainer.appendChild(tag);
    });
}

function createTag(text, id, type, riskLevel = null) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.dataset.id = id;
    tag.dataset.type = type;
    
    let indicator = '';
    if (riskLevel) {
        indicator = `<span class="risk-indicator risk-${riskLevel}"></span>`;
    }
    
    tag.innerHTML = `${indicator}${text}`;
    tag.onclick = () => toggleTag(tag, id, type, text);
    
    return tag;
}

function toggleTag(tag, id, type, text) {
    tag.classList.toggle('selected');
    
    if (tag.classList.contains('selected')) {
        if (type === 'risk') selectedRisks.add(id);
        if (type === 'severity') selectedSeverity.add(id);
        if (type === 'impact') selectedImpacts.add(id);
        addSelectedTag(id, text, type);
    } else {
        if (type === 'risk') selectedRisks.delete(id);
        if (type === 'severity') selectedSeverity.delete(id);
        if (type === 'impact') selectedImpacts.delete(id);
        removeSelectedTag(id);
    }
    
    updateSelectedFilters();
    updateAnalyzeButton();
}

function addSelectedTag(id, text, type) {
    const selectedTagsContainer = document.getElementById('selectedTags');
    const selectedTag = document.createElement('div');
    selectedTag.className = 'selected-tag';
    selectedTag.dataset.id = id;
    selectedTag.innerHTML = `${text}<span class="selected-tag-close" onclick="removeTagById('${id}', '${type}')">×</span>`;
    selectedTagsContainer.appendChild(selectedTag);
}

function removeSelectedTag(id) {
    const selectedTag = document.querySelector(`.selected-tag[data-id="${id}"]`);
    if (selectedTag) selectedTag.remove();
}

function removeTagById(id, type) {
    const tag = document.querySelector(`.tag[data-id="${id}"][data-type="${type}"]`);
    if (tag) {
        tag.classList.remove('selected');
        if (type === 'risk') selectedRisks.delete(id);
        if (type === 'severity') selectedSeverity.delete(id);
        if (type === 'impact') selectedImpacts.delete(id);
        removeSelectedTag(id);
        updateSelectedFilters();
        updateAnalyzeButton();
    }
}

function updateSelectedFilters() {
    const section = document.getElementById('selectedFiltersSection');
    const hasFilters = selectedRisks.size > 0 || selectedSeverity.size > 0 || selectedImpacts.size > 0;
    section.style.display = hasFilters ? 'block' : 'none';
}

function updateAnalyzeButton() {
    const btn = document.getElementById('analyzeBtn');
    const exportBtn = document.getElementById('exportPdfBtn');
    const hasLocation = currentLocation !== null;
    const hasFilters = selectedRisks.size > 0;
    btn.disabled = !hasLocation || !hasFilters;
    
    // Habilitar exportar solo si hay análisis
    if (exportBtn) {
        exportBtn.disabled = !hasLocation || !hasFilters;
    }
}

// ========== BÚSQUEDA DE UBICACIONES ==========
function setupEventListeners() {
    const searchInput = document.getElementById('locationSearch');
    const dropdown = document.getElementById('locationDropdown');

    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase().trim();
        
        if (value.length < 2) {
            dropdown.classList.remove('active');
            return;
        }

        const matches = Object.keys(zuliaLocations).filter(key => {
            const loc = zuliaLocations[key];
            return key.includes(value) || 
                   loc.name.toLowerCase().includes(value) ||
                   loc.municipality.toLowerCase().includes(value) ||
                   loc.type.toLowerCase().includes(value);
        });

        if (matches.length > 0) {
            dropdown.innerHTML = matches.map(key => {
                const loc = zuliaLocations[key];
                return `
                    <div class="location-item" onclick="selectLocation('${key}')">
                        <span class="location-item-icon">📍</span>
                        <div class="location-item-text">
                            <div class="location-item-name">${loc.name}</div>
                            <div class="location-item-details">${loc.type} - Municipio ${loc.municipality}</div>
                        </div>
                    </div>
                `;
            }).join('');
            dropdown.classList.add('active');
        } else {
            dropdown.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
            dropdown.classList.add('active');
        }
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length >= 2) {
            dropdown.classList.add('active');
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

function selectLocation(key) {
    const location = zuliaLocations[key];
    const searchInput = document.getElementById('locationSearch');
    const dropdown = document.getElementById('locationDropdown');
    
    searchInput.value = `${location.name} - ${location.type}`;
    dropdown.classList.remove('active');
    
    currentLocation = location;
    
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }
    
    currentMarker = L.marker([location.lat, location.lng]).addTo(map);
    currentMarker.bindPopup(`
        <strong>${location.name}</strong><br>
        ${location.type} - Municipio ${location.municipality}<br>
        <small>Lat: ${location.lat.toFixed(4)}°, Lng: ${location.lng.toFixed(4)}°</small>
    `).openPopup();
    
    map.setView([location.lat, location.lng], 13);
    
    updateAnalyzeButton();
}

// ========== ANÁLISIS DE RIESGOS ==========
function analyzeRisks() {
    if (!currentLocation || selectedRisks.size === 0) {
        alert('Seleccione una ubicación y al menos un factor de riesgo');
        return;
    }

    const risks = Array.from(selectedRisks).map(id => {
        const factor = riskFactors.find(f => f.id === id);
        return {
            id: factor.id,
            name: factor.name,
            level: factor.level,
            category: factor.category
        };
    });

    displayResults(risks);
}

function displayResults(risks) {
    const resultsContent = document.getElementById('resultsContent');
    const resultsPanel = document.getElementById('resultsPanel');

    const descriptions = {
        'salinizado': 'Acumulación excesiva de sales que afecta la capacidad del suelo para soportar cultivos.',
        'erosion': 'Pérdida progresiva de suelo fértil por acción del agua, viento o actividad humana.',
        'inundacion': 'Zona susceptible a encharcamientos y desbordamientos durante temporadas de lluvia.',
        'aguasEstancadas': 'Presencia de agua acumulada que favorece la proliferación de vectores de enfermedades.',
        'aridez': 'Déficit hídrico severo que limita el desarrollo de actividades agrícolas.',
        'contaminacion': 'Degradación del suelo por presencia de hidrocarburos y derivados del petróleo.',
        'bajafertilidad': 'Suelos pobres en nutrientes esenciales para el crecimiento de plantas.',
        'topografia': 'Terrenos con pendientes pronunciadas que dificultan el uso agrícola.',
        'quemas': 'Áreas afectadas por incendios que han degradado la capa vegetal y orgánica.',
        'deforestacion': 'Pérdida de cobertura forestal que aumenta la vulnerabilidad del ecosistema.',
        'sequia': 'Períodos prolongados sin precipitaciones que afectan la disponibilidad de agua.',
        'plagas': 'Presencia de organismos que dañan cultivos y reducen la productividad.'
    };

    const highRiskCount = risks.filter(r => r.level === 'high').length;
    let overallRisk, riskColor;
    
    if (highRiskCount >= 4) {
        overallRisk = 'MUY ALTO';
        riskColor = '#dc2626';
    } else if (highRiskCount >= 2) {
        overallRisk = 'ALTO';
        riskColor = '#d97706';
    } else if (highRiskCount >= 1) {
        overallRisk = 'MODERADO';
        riskColor = '#f59e0b';
    } else {
        overallRisk = 'BAJO';
        riskColor = '#059669';
    }

    resultsContent.innerHTML = `
        <div class="result-location">
            <h4>📍 ${currentLocation.name}</h4>
            <div class="result-coords">
                ${currentLocation.type} - Municipio ${currentLocation.municipality}<br>
                Coordenadas: ${currentLocation.lat.toFixed(4)}°N, ${Math.abs(currentLocation.lng).toFixed(4)}°W
            </div>
            <div class="risk-level-box">
                <div class="risk-level-label">NIVEL DE RIESGO GENERAL</div>
                <div class="risk-level-value" style="color: ${riskColor};">${overallRisk}</div>
            </div>
        </div>
        
        <div class="results-list">
            <h4>Factores de Riesgo Detectados (${risks.length})</h4>
            ${risks.map(risk => `
                <div class="result-item">
                    <div class="result-item-header">
                        <span class="result-item-name">${risk.name}</span>
                        <span class="result-item-badge ${risk.level === 'high' ? 'badge-high' : 'badge-medium'}">
                            ${risk.level === 'high' ? 'ALTO' : 'MEDIO'}
                        </span>
                    </div>
                    <div class="result-item-desc">${descriptions[risk.id]}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="recommendations">
            <h4>⚠️ Recomendaciones Técnicas</h4>
            <p>
                ${highRiskCount >= 3 
                    ? 'Se requiere consulta urgente con especialistas en gestión ambiental y agrícola antes de iniciar cualquier desarrollo en la zona. Se recomienda realizar estudios de suelo detallados y planes de mitigación.' 
                    : highRiskCount >= 1
                    ? 'Los factores de riesgo identificados son manejables con técnicas apropiadas. Se recomienda implementar prácticas de conservación de suelos y manejo sostenible de recursos.'
                    : 'La zona presenta condiciones aceptables. Se recomienda monitoreo periódico y buenas prácticas agrícolas.'}
            </p>
        </div>
    `;

    resultsPanel.classList.add('active');

    if (currentCircle) {
        map.removeLayer(currentCircle);
    }

    currentCircle = L.circle([currentLocation.lat, currentLocation.lng], {
        color: riskColor,
        fillColor: riskColor,
        fillOpacity: 0.25,
        radius: 800
    }).addTo(map);
    
    // Guardar en historial (solo para analistas y admins)
    if (currentUser.rol === 'analista' || currentUser.rol === 'administrador') {
        saveToHistory(currentLocation.name, overallRisk, risks.length);
    }
}

function closeResults() {
    document.getElementById('resultsPanel').classList.remove('active');
}

// ========== NAVEGACIÓN ==========
function goToAdminPanel() {
    window.location.href = 'admin-panel.html';
}

function handleLogout() {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
        ApiClient.logout();
    }
}

// Hacer funciones globales
window.selectLocation = selectLocation;
window.toggleTag = toggleTag;
window.removeTagById = removeTagById;
window.analyzeRisks = analyzeRisks;
window.closeResults = closeResults;
window.goToAdminPanel = goToAdminPanel;
window.handleLogout = handleLogout;
window.exportToPDF = exportToPDF;
window.showHistory = showHistory;
