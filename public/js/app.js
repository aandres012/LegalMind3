// Debugging
console.log('🔍 LegalMind Frontend cargado');

// Debugging de variables del DOM
console.log('🔍 Verificando elementos del DOM:');
console.log('analyzeBtn:', document.getElementById('analyze-btn'));
console.log('resultsContainer:', document.getElementById('results-container'));
console.log('resultsContent:', document.getElementById('results-content'));
console.log('errorMessage:', document.getElementById('error-message'));

// Override para debugging
const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('🌐 Fetch llamado:', args[0], args[1]?.method);
    return originalFetch.apply(this, args)
        .then(response => {
            console.log('📡 Fetch response:', response.status, response.url);
            return response;
        })
        .catch(error => {
            console.error('❌ Fetch error:', error);
            throw error;
        });
};

// Configurar PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

// Claves para el sistema
const ADMIN_EMAIL = "admin@legalmind.com";
const DEFAULT_ADMIN_PASSWORD = "AdminLegalMind2023!";

document.addEventListener('DOMContentLoaded', function() {
    // Elementos de autenticación
    const authSection = document.getElementById('auth-section');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showLoginBtn = document.getElementById('show-login');
    const showRegisterBtn = document.getElementById('show-register');
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Elementos de administración
    const adminPanel = document.getElementById('admin-panel');
    const manageUsersBtn = document.getElementById('manage-users');
    const apiSettingsBtn = document.getElementById('api-settings');
    const userManagementPanel = document.getElementById('user-management');
    const apiSettingsPanel = document.getElementById('api-settings-panel');
    const usersTableBody = document.getElementById('users-table-body');
    
    // Selector de tipo de análisis
    const accountingAnalysis = document.getElementById('accounting-analysis');
    const legalAnalysis = document.getElementById('legal-analysis');
    const resultsTitle = document.getElementById('results-title');
    
    // Elementos del análisis - DEFINIR CORRECTAMENTE
    const fileInput = document.getElementById('file-input');
    const selectFileBtn = document.getElementById('select-file');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const filePages = document.getElementById('file-pages');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loading = document.getElementById('loading');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const analysisSection = document.getElementById('analysis-section');
    const uploadArea = document.getElementById('upload-area');
    const resultsContainer = document.getElementById('results-container');
    const resultsContent = document.getElementById('results-content');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const steps = document.querySelectorAll('.step');
    
    let analysisType = 'legal';
    let currentUser = null;
    let currentPDF = null;
    let totalPages = 0;
    let extractedText = '';

    // Verificar que los elementos existan
    if (!analyzeBtn || !resultsContainer || !resultsContent || !errorMessage) {
        console.error('❌ Elementos críticos del DOM no encontrados');
    }

    // ==================== FUNCIONES CORREGIDAS ====================

    // Función para mostrar errores CORREGIDA
    function showError(message) {
        console.error('🟥 Mostrando error:', message);
        
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        } else {
            console.error('❌ Elemento errorMessage no encontrado');
        }
        
        if (loading) {
            loading.style.display = 'none';
        }
        
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
        }
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
        }, 5000);
    }

    // Función para extraer texto del PDF
    async function extractTextFromPDF(pdf) {
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const extractionProgress = (i / pdf.numPages) * 50;
            if (progressBar) progressBar.style.width = extractionProgress + '%';
            if (progressText) progressText.textContent = Math.round(extractionProgress) + '% completado';
            
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `Página ${i}: ${pageText}\n\n`;
            
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return fullText;
    }

    // Función analyzeWithBackend CORREGIDA
    async function analyzeWithBackend(text, type) {
        console.log('🔍 analyzeWithBackend llamado');
        
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text.substring(0, 12000),
                    type: type
                })
            });

            // ✅ SOLO UNA vez .json()
            const data = await response.json();
            console.log('📨 Respuesta del servidor:', data);
            
            // ✅ Validación CORRECTA
            if (!data || typeof data !== 'object') {
                throw new Error('Respuesta inválida del servidor');
            }
            
            if (!data.success) {
                throw new Error(data.error || 'Error en el análisis');
            }
            
            if (!data.result) {
                throw new Error('No se recibió resultado del análisis');
            }
            
            console.log('✅ Análisis completado con éxito');
            return data.result;
            
        } catch (error) {
            console.error('❌ Error en analyzeWithBackend:', error.message);
            throw error;
        }
    }

    // Función para mostrar resultados
    function displayResults(analysisResult) {
        try {
            console.log('🎨 Mostrando resultados...');
            
            if (!resultsContent) {
                throw new Error('Elemento resultsContent no encontrado');
            }
            
            if (!resultsContainer) {
                throw new Error('Elemento resultsContainer no encontrado');
            }
            
            // Convertir markdown a HTML básico
            const htmlContent = analysisResult
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                .replace(/\*(.*)\*/gim, '<em>$1</em>')
                .replace(/- (.*$)/gim, '<li>$1</li>');
            
            resultsContent.innerHTML = htmlContent;
            resultsContainer.style.display = 'block';
            
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
            }
            
            if (loading) {
                loading.style.display = 'none';
            }
            
            // Desplazar hacia los resultados
            resultsContainer.scrollIntoView({behavior: 'smooth'});
            
        } catch (error) {
            console.error('❌ Error mostrando resultados:', error);
            showError('Error al mostrar los resultados: ' + error.message);
        }
    }

    // ==================== EVENT LISTENERS CORREGIDOS ====================

    // Analizar documento - EVENT LISTENER CORREGIDO
    analyzeBtn.addEventListener('click', async function() {
        console.log('🟡 Click en botón analizar');
        
        if (!currentPDF) {
            showError('Por favor, selecciona un archivo PDF primero.');
            return;
        }
        
        if (loading) loading.style.display = 'block';
        if (analyzeBtn) analyzeBtn.disabled = true;
        if (errorMessage) errorMessage.style.display = 'none';
        
        try {
            // Extraer texto del PDF
            extractedText = await extractTextFromPDF(currentPDF);
            
            // Realizar análisis
            const analysisResult = await analyzeWithBackend(extractedText, analysisType);
            
            // Mostrar resultados
            displayResults(analysisResult);
            
            // Actualizar paso 3
            updateStep(3, true);
            
        } catch (error) {
            console.error('💥 Error en event listener:', error);
            showError(error.message || 'Error desconocido');
        }
    });

    // ==================== REST