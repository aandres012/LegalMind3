// Debugging
console.log('🔍 LegalMind Frontend cargado');

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

// Configuración de URLs - ¡IMPORTANTE! 
const API_BASE_URL = 'https://legalmind3.onrender.com';

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
    
    let analysisType = 'legal'; // Por defecto análisis legal
    let currentUser = null;

    // Inicializar la aplicación
    function initApp() {
        // Cargar usuarios desde localStorage
        if (!localStorage.getItem('legalmind_users')) {
            // Crear usuario administrador por defecto
            const defaultUsers = [
                {
                    id: 1,
                    name: 'Administrador',
                    email: ADMIN_EMAIL,
                    password: DEFAULT_ADMIN_PASSWORD,
                    role: 'admin',
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('legalmind_users', JSON.stringify(defaultUsers));
        }
        
        // Verificar si hay un usuario logueado
        const loggedInUser = localStorage.getItem('legalmind_current_user');
        if (loggedInUser) {
            currentUser = JSON.parse(loggedInUser);
            showAppContent();
        } else {
            authSection.style.display = 'block';
        }
    }

    // Mostrar contenido de la aplicación según el usuario
    function showAppContent() {
        authSection.style.display = 'none';
        
        // Mostrar menú de usuario
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = currentUser.name;
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        
        // Mostrar secciones según el rol
        if (currentUser.role === 'admin') {
            adminPanel.style.display = 'block';
            document.getElementById('seccion-inicio').style.display = 'block';
        } else {
            adminPanel.style.display = 'none';
            document.getElementById('seccion-inicio').style.display = 'block';
        }
        
        // Mostrar navegación
        showSection(document.getElementById('seccion-inicio'));
    }

    // Cambiar entre pestañas de login/registro
    loginTab.addEventListener('click', function() {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });
    
    registerTab.addEventListener('click', function() {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    });
    
    // Mostrar formulario de login
    showLoginBtn.addEventListener('click', function() {
        authSection.style.display = 'block';
        loginTab.click();
    });
    
    // Mostrar formulario de registro
    showRegisterBtn.addEventListener('click', function() {
        authSection.style.display = 'block';
        registerTab.click();
    });
    
    // Toggle visibilidad de contraseñas
    setupPasswordToggle('toggle-login-password', 'login-password');
    setupPasswordToggle('toggle-register-password', 'register-password');
    
    function setupPasswordToggle(toggleId, inputId) {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        
        toggle.addEventListener('click', function() {
            if (input.type === 'password') {
                input.type = 'text';
                toggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                toggle.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    }
    
    // Procesar login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');
        
        // Validar credenciales
        const users = JSON.parse(localStorage.getItem('legalmind_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            errorElement.style.display = 'none';
            currentUser = user;
            localStorage.setItem('legalmind_current_user', JSON.stringify(user));
            showAppContent();
        } else {
            errorElement.textContent = 'Credenciales incorrectas. Inténtalo de nuevo.';
            errorElement.style.display = 'block';
        }
    });
    
    // Procesar registro
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const errorElement = document.getElementById('register-error');
        const successElement = document.getElementById('register-success');
        
        // Validaciones
        if (password !== confirmPassword) {
            errorElement.textContent = 'Las contraseñas no coinciden.';
            errorElement.style.display = 'block';
            return;
        }
        
        if (password.length < 6) {
            errorElement.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            errorElement.style.display = 'block';
            return;
        }
        
        // Verificar si el usuario ya existe
        const users = JSON.parse(localStorage.getItem('legalmind_users') || '[]');
        if (users.some(u => u.email === email)) {
            errorElement.textContent = 'Este correo electrónico ya está registrado.';
            errorElement.style.display = 'block';
            return;
        }
        
        // Crear nuevo usuario
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            name: name,
            email: email,
            password: password,
            role: 'user',
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('legalmind_users', JSON.stringify(users));
        
        // Mostrar mensaje de éxito
        errorElement.style.display = 'none';
        successElement.textContent = '¡Registro exitoso! Ahora puedes iniciar sesión.';
        successElement.style.display = 'block';
        
        // Limpiar formulario
        registerForm.reset();
        
        // Cambiar a pestaña de login después de 2 segundos
        setTimeout(() => {
            successElement.style.display = 'none';
            loginTab.click();
        }, 2000);
    });
    
    // Cerrar sesión
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('legalmind_current_user');
        currentUser = null;
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
        authSection.style.display = 'block';
        adminPanel.style.display = 'none';
        document.getElementById('seccion-inicio').style.display = 'none';
        loginTab.click();
    });
    
    // Configuración de administración
    manageUsersBtn.addEventListener('click', function() {
        userManagementPanel.style.display = 'block';
        apiSettingsPanel.style.display = 'none';
        loadUsersTable();
    });
    
    apiSettingsBtn.addEventListener('click', function() {
        apiSettingsPanel.style.display = 'block';
        userManagementPanel.style.display = 'none';
        
        // Cargar API key desde localStorage si existe
        const savedApiKey = localStorage.getItem('deepseek_api_key');
        if (savedApiKey) {
            document.getElementById('api-key').value = savedApiKey;
        }
    });
    
    // Cargar tabla de usuarios
    function loadUsersTable() {
        const users = JSON.parse(localStorage.getItem('legalmind_users') || '[]');
        usersTableBody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="user-role ${user.role === 'admin' ? 'role-admin' : 'role-user'}">${user.role}</span></td>
                <td class="user-action">
                    ${user.role !== 'admin' ? `<button class="action-btn btn-delete" data-id="${user.id}">Eliminar</button>` : ''}
                </td>
            `;
            
            usersTableBody.appendChild(row);
        });
        
        // Agregar event listeners a los botones de eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-id'));
                deleteUser(userId);
            });
        });
    }
    
    // Eliminar usuario
    function deleteUser(userId) {
        if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            let users = JSON.parse(localStorage.getItem('legalmind_users') || '[]');
            users = users.filter(user => user.id !== userId);
            localStorage.setItem('legalmind_users', JSON.stringify(users));
            loadUsersTable();
        }
    }
    
    // Guardar API Key
    document.getElementById('save-api-key').addEventListener('click', function() {
        const apiKey = document.getElementById('api-key').value;
        const successMessage = document.getElementById('api-success-message');
        const errorMessage = document.getElementById('api-error-message');
        
        if (apiKey.trim() === '') {
            errorMessage.textContent = 'Por favor, ingresa una API key válida.';
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
            return;
        }
        
        localStorage.setItem('deepseek_api_key', apiKey);
        successMessage.textContent = 'API key guardada correctamente.';
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    });
    
    // Configurar selector de tipo de análisis
    accountingAnalysis.addEventListener('click', function() {
        accountingAnalysis.classList.add('selected');
        legalAnalysis.classList.remove('selected');
        analysisType = 'accounting';
        resultsTitle.textContent = 'Resumen Contable del Documento';
    });
    
    legalAnalysis.addEventListener('click', function() {
        legalAnalysis.classList.add('selected');
        accountingAnalysis.classList.remove('selected');
        analysisType = 'legal';
        resultsTitle.textContent = 'Resumen Analítico del Documento';
    });

    // Elementos de navegación
    const navInicio = document.getElementById('nav-inicio');
    const navCaracteristicas = document.getElementById('nav-caracteristicas');
    const navPrecios = document.getElementById('nav-precios');
    const navContacto = document.getElementById('nav-contacto');
    
    // Secciones
    const seccionInicio = document.getElementById('seccion-inicio');
    const seccionCaracteristicas = document.getElementById('seccion-caracteristicas');
    const seccionPrecios = document.getElementById('seccion-precios');
    const seccionContacto = document.getElementById('seccion-contacto');
    
    // Funcionalidad de navegación
    function showSection(section) {
        // Ocultar todas las secciones
        seccionInicio.classList.remove('active');
        seccionCaracteristicas.classList.remove('active');
        seccionPrecios.classList.remove('active');
        seccionContacto.classList.remove('active');
        adminPanel.style.display = 'none';
        userManagementPanel.style.display = 'none';
        apiSettingsPanel.style.display = 'none';
        
        // Quitar clase active de todos los nav items
        document.querySelectorAll('nav a').forEach(item => {
            item.classList.remove('active-nav');
        });
        
        // Mostrar la sección seleccionada
        if (section) {
            section.classList.add('active');
            
            // Activar el nav item correspondiente
            const navId = 'nav-' + section.id.split('-')[1];
            document.getElementById(navId).classList.add('active-nav');
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    navInicio.addEventListener('click', () => showSection(seccionInicio));
    navCaracteristicas.addEventListener('click', () => showSection(seccionCaracteristicas));
    navPrecios.addEventListener('click', () => showSection(seccionPrecios));
    navContacto.addEventListener('click', () => showSection(seccionContacto));
    
    // Botones de inicio
    document.getElementById('start-analysis-btn').addEventListener('click', function() {
        document.querySelector('.upload-container').scrollIntoView({behavior: 'smooth'});
    });
    
    document.getElementById('learn-more-btn').addEventListener('click', function() {
        showSection(seccionCaracteristicas);
    });
    
    // Elementos del análisis
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
    
    let currentPDF = null;
    let totalPages = 0;
    let extractedText = '';

    // Actualizar indicador de pasos
    function updateStep(stepNumber, completed = false) {
        steps.forEach((step, index) => {
            if (index + 1 === stepNumber) {
                step.classList.add('active');
                if (completed) {
                    step.classList.add('completed');
                }
            } else if (index + 1 < stepNumber) {
                step.classList.add('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }
    
    // Función para mostrar mensajes de éxito
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }
    
    // Función para mostrar errores
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
    
    // Seleccionar archivo
    selectFileBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Cuando se selecciona un archivo
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });
    
    // Arrastrar y soltar archivos
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            
            // Verificar que es un PDF
            if (file.type !== 'application/pdf') {
                showError('Por favor, sube solo archivos PDF');
                return;
            }
            
            handleFileSelection(file);
        }
    });
    
    // Función para manejar la selección de archivos
    function handleFileSelection(file) {
        // Validar tamaño del archivo (50MB máximo)
        if (file.size > 50 * 1024 * 1024) {
            showError('El archivo es demasiado grande. El límite es 50MB.');
            return;
        }
        
        const size = (file.size / (1024 * 1024)).toFixed(2);
        
        fileName.textContent = file.name;
        fileSize.textContent = size + ' MB';
        fileInfo.style.display = 'block';
        analysisSection.style.display = 'block';
        
        // Cargar el PDF para obtener información
        const reader = new FileReader();
        reader.onload = function(e) {
            const pdfData = new Uint8Array(e.target.result);
            
            // Cargar PDF con pdf.js
            pdfjsLib.getDocument({data: pdfData}).promise.then(function(pdf) {
                currentPDF = pdf;
                totalPages = pdf.numPages;
                filePages.textContent = totalPages;
                
                // Validar número de páginas
                if (totalPages > 2000) {
                    showError('El documento tiene demasiadas páginas. El límite es 2000 páginas.');
                    currentPDF = null;
                    return;
                }
                
                // Actualizar paso 1
                updateStep(1, true);
            }).catch(function(error) {
                console.error('Error al cargar el PDF:', error);
                showError('Error al cargar el PDF. Asegúrate de que es un archivo válido.');
            });
        };
        
        reader.readAsArrayBuffer(file);
        
        // Desplazar hacia la sección de análisis
        analysisSection.scrollIntoView({behavior: 'smooth'});
    }
    
    // Analizar documento
    analyzeBtn.addEventListener('click', async function() {
        if (!currentPDF) {
            showError('Por favor, selecciona un archivo PDF primero.');
            return;
        }
        
        // Verificar si hay API key configurada
        const apiKey = localStorage.getItem('deepseek_api_key');
        if (!apiKey) {
            showError('Error de configuración del sistema. Contacte al administrador.');
            return;
        }
        
        loading.style.display = 'block';
        analyzeBtn.disabled = true;
        errorMessage.style.display = 'none';
        
        try {
            // Extraer texto del PDF
            extractedText = await extractTextFromPDF(currentPDF);
            
            // Realizar análisis con nuestro backend
            await analyzeWithBackend(extractedText, analysisType);
            
        } catch (error) {
            console.error('Error al procesar el PDF:', error);
            showError('Error al procesar el PDF: ' + error.message);
            loading.style.display = 'none';
            analyzeBtn.disabled = false;
        }
    });
    
    // Función para extraer texto del PDF
    async function analyzeWithBackend(text, type) {
    try {
        console.log('🟡 Enviando análisis al backend...');
        
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

        // ✅ SOLO UNA vez response.json()
        const data = await response.json();
        
        console.log('📊 Respuesta del backend:', data);
        
        if (!data.success) {
            throw new Error(data.error || 'Error en el análisis');
        }
        
        return data.result;
        
    } catch (error) {
        console.error('❌ Error en analyzeWithBackend:', error);
        throw error;
    }
}
    
    // Función para analizar el texto con nuestro backend
    async function analyzeWithBackend(text, type) {
        try {
            // Actualizar progreso
            progressBar.style.width = '60%';
            progressText.textContent = '60% completado - Procesando con IA';
            
            // ✅ URL CORREGIDA: Usa API_BASE_URL
            const response = await fetch(`${API_BASE_URL}/api/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text.substring(0, 12000),
                    type: type
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en el servidor');
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Error en el análisis');
            }
            
            // Procesar la respuesta
            const analysisResult = data.result;
            
            // Mostrar resultados
            displayResults(analysisResult);
            
            // Completar progreso
            progressBar.style.width = '100%';
            progressText.textContent = '100% completado';
            
            // Actualizar paso 3
            updateStep(3, true);
            
            // Ocultar loading después de un breve retraso
            setTimeout(() => {
                loading.style.display = 'none';
            }, 1000);
            
        } catch (error) {
            console.error('Error en el análisis:', error);
            showError('Error en el análisis: ' + error.message);
            loading.style.display = 'none';
            analyzeBtn.disabled = false;
        }
    }
    
    // Mostrar resultados en la interfaz
    function displayResults(analysisResult) {
        // Convertir markdown a HTML básico
        const htmlContent = analysisResult
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/- (.*$)/gim, '<li>$1</li>')
            .replace(/<li>(.*)<\/li>\n<li>(.*)<\/li>/gim, '<ul><li>$1</li><li>$2</li></ul>');
        
        resultsContent.innerHTML = htmlContent;
        resultsContainer.style.display = 'block';
        analyzeBtn.disabled = false;
        
        // Desplazar hacia los resultados
        resultsContainer.scrollIntoView({behavior: 'smooth'});
    }
    
    // Exportar resultados
    document.getElementById('export-btn').addEventListener('click', function() {
        const resultText = resultsContent.innerText;
        const blob = new Blob([resultText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = analysisType === 'accounting' ? 'analisis_contable.txt' : 'analisis_legal.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // Inicializar la aplicación
    initApp();
});