const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// ==================== CONFIGURACIÓN DE API KEY ====================
console.log('🔍 Iniciando LegalMind Analyzer Server');
console.log('📋 Modo:', process.env.NODE_ENV || 'development');

// Función para obtener la API key
const getApiKey = () => {
    // 1. Intentar desde variable de entorno principal
    if (process.env.DEEPSEEK_API_KEY) {
        console.log('✅ API Key encontrada en DEEPSEEK_API_KEY');
        return process.env.DEEPSEEK_API_KEY;
    }
    
    // 2. Intentar desde otras variables comunes
    const alternativeKeys = [
        process.env.API_KEY,
        process.env.DEEPSEEK_KEY, 
        process.env.API_KEY_DEEPSEEK,
        process.env.DEEPSEEK_API_KEY
    ].filter(key => key && key.trim() !== '');
    
    if (alternativeKeys.length > 0) {
        console.log('✅ API Key encontrada en variable alternativa');
        return alternativeKeys[0];
    }
    
    // 3. Intentar desde archivo config.json
    try {
        const configPath = path.join(__dirname, 'config.json');
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const configKey = config.DEEPSEEK_API_KEY || config.apiKey || config.key;
            if (configKey) {
                console.log('✅ API Key encontrada en config.json');
                return configKey;
            }
        }
    } catch (error) {
        console.log('⚠️  No se pudo leer config.json:', error.message);
    }
    
    // 4. ❌ NO HARDCODEAR LA KEY - Mejor mostrar error claro
    console.log('❌ ERROR: API Key no encontrada en ninguna fuente');
    return null;
};

// Configurar API key
const API_KEY = getApiKey();
if (!API_KEY) {
    console.log('\n🚨 ERROR CRÍTICO:');
    console.log('   No se encontró la API Key de DeepSeek');
    console.log('   Configura una de estas opciones:');
    console.log('   1. Variable de entorno DEEPSEEK_API_KEY en Render.com');
    console.log('   2. Archivo config.json en la raíz del proyecto');
    console.log('   3. Otras variables: API_KEY, DEEPSEEK_KEY');
    console.log('\n💡 Solución: Ve a Render.com → Environment → Add Environment Variable');
    console.log('   Key: DEEPSEEK_API_KEY');
    console.log('   Value: tu-api-key-real-de-deepseek');
}

// ==================== CONFIGURACIÓN EXPRESS ====================
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: [
        'https://legalmind3.onrender.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ==================== RUTAS ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'LegalMind API funcionando',
        timestamp: new Date().toISOString(),
        apiKeyConfigured: !!API_KEY,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Análisis de documentos
app.post('/api/analyze', async (req, res) => {
    try {
        console.log('📥 Solicitud de análisis recibida');
        
        const { text, type } = req.body;
        
        // Validar entrada
        if (!text || !type) {
            return res.status(400).json({
                success: false,
                error: 'Texto y tipo de análisis son requeridos'
            });
        }
        
        // Validar API key
        if (!API_KEY) {
            console.log('❌ Intento de análisis sin API key configurada');
            return res.status(500).json({
                success: false,
                error: 'Error de configuración del sistema. Contacte al administrador.'
            });
        }
        
        console.log('✅ API Key verificada, iniciando análisis...');
        
        // Preparar prompt según tipo de análisis
        let prompt = '';
        if (type === 'accounting') {
            prompt = `Eres un experto contable y financiero especializado en análisis de documentos contables, estados financieros, balances e informes fiscales. Analiza el siguiente texto y genera un informe exhaustivo y bien estructurado en español, utilizando el formato markdown.

Texto a Analizar:
${text}

Genera un informe contable completo con: Resumen ejecutivo, análisis de estados financieros, indicadores clave, hallazgos y recomendaciones.`;
        } else {
            prompt = `Eres un asistente legal especializado en análisis, síntesis y redacción de informes ejecutivos para socios de bufetes de abogados. Analiza el siguiente texto legal y genera un informe exhaustivo y bien estructurado en español, utilizando el formato markdown.

Texto a Analizar:
${text}

Genera un informe legal completo con: Metadatos y contexto, resumen ejecutivo, hallazgos clave, puntos de riesgo y recomendaciones accionables.`;
        }
        
        // Llamar a la API de DeepSeek
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: type === 'accounting' 
                            ? 'Eres un experto contable y financiero. Proporciona respuestas detalladas y bien estructuradas en español usando markdown.'
                            : 'Eres un asistente legal especializado. Proporciona respuestas detalladas y bien estructuradas en español usando markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 4000
            })
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Error de DeepSeek API:', response.status, errorData);
            throw new Error(`Error en la API: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Respuesta inválida de la API');
        }
        
        const analysisResult = data.choices[0].message.content;
        
        console.log('✅ Análisis completado exitosamente');
        res.json({
            success: true,
            result: analysisResult
        });
        
    } catch (error) {
        console.error('❌ Error en análisis:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al procesar el análisis. Por favor, intente nuevamente.'
        });
    }
});

// Manejo de errores
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
    });
});

app.use((error, req, res, next) => {
    console.error('❌ Error no manejado:', error);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// ==================== INICIAR SERVIDOR ====================
app.listen(PORT, () => {
    console.log('\n🚀 LegalMind Analyzer Server iniciado');
    console.log(`✅ Puerto: ${PORT}`);
    console.log(`✅ Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ API Key: ${API_KEY ? '✅ CONFIGURADA' : '❌ NO CONFIGURADA'}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    
    if (!API_KEY) {
        console.log('\n🔴 ATENCIÓN: API Key no configurada');
        console.log('   Para configurar:');
        console.log('   1. Ve a Render.com → Environment Variables');
        console.log('   2. Agrega: DEEPSEEK_API_KEY = tu-api-key-real');
        console.log('   3. Haz redeploy');
    }
});