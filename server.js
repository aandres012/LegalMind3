const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');


// Configuración robusta de variables de entorno
const configureEnvironment = () => {
    try {
        // 1. Intentar cargar .env en desarrollo
        if (process.env.NODE_ENV !== 'production') {
            require('dotenv').config();
        }
        
        // 2. Verificar si la API key existe en variables de entorno
        if (process.env.DEEPSEEK_API_KEY) {
            console.log('✅ API Key cargada desde variables de entorno');
            return true;
        }
        
        // 3. Fallback: Intentar cargar desde archivo config.json (para producción)
        try {
            const configPath = path.join(__dirname, 'config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (config.DEEPSEEK_API_KEY) {
                    process.env.DEEPSEEK_API_KEY = config.DEEPSEEK_API_KEY;
                    console.log('✅ API Key cargada desde config.json');
                    return true;
                }
            }
        } catch (configError) {
            console.log('⚠️  No se pudo cargar config.json:', configError.message);
        }
        
        // 4. Último fallback: Variable hardcodeada (SOLO PARA TESTING)
        if (!process.env.DEEPSEEK_API_KEY) {
            // ¡¡¡REMPLAZA ESTA KEY CON TU API KEY REAL!!!
            process.env.DEEPSEEK_API_KEY = "sk-tu-api-key-real-aqui";
            console.log('⚠️  API Key cargada desde fallback hardcodeado (SOLO TESTING)');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error crítico configurando entorno:', error.message);
        return false;
    }
};

// Configurar entorno
configureEnvironment();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware con configuración robusta
app.use(cors({
    origin: [
        'https://legalmind3.onrender.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'LegalMind API funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        apiKeyConfigured: !!process.env.DEEPSEEK_API_KEY
    });
});

// DeepSeek Analysis endpoint - VERSIÓN ROBUSTA
app.post('/api/analyze', async (req, res) =>
app.post('/api/analyze', async (req, res) => {
    try {
        // 👇🏻 AQUÍ VA EL CÓDIGO DEL PASO 4 👇🏻
        console.log('🔍 Iniciando análisis...');
        console.log('✅ API Key presente:', !!process.env.DEEPSEEK_API_KEY);
        console.log('📦 Tipo de análisis:', req.body.type);
        console.log('📏 Longitud del texto:', req.body.text?.length);
        
        const { text, type } = req.body;
        
        if (!process.env.DEEPSEEK_API_KEY) {
            console.log('❌ ERROR CRÍTICO: API Key no configurada');
            return res.status(500).json({
                success: false,
                error: 'Error de configuración del sistema. Contacte al administrador.'
            });
        }
        // 👆🏻 HASTA AQUÍ EL CÓDIGO NUEVO 👆🏻

        // ... [TU CÓDIGO ORIGINAL DE ANÁLISIS CONTINÚA AQUÍ] ...
        let prompt = '';
        if (type === 'accounting') {
            prompt = `Eres un experto contable...`;
        } else {
            prompt = `Eres un asistente legal...`;
        }

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            // ... resto de tu código ...
        });

    } catch (error) {
        // ... manejo de errores ...
    }
});





 {
    try {
        console.log('📥 Request recibido para análisis:', {
            type: req.body.type,
            textLength: req.body.text?.length
        });

        const { text, type } = req.body;

        // Validaciones
        if (!text || !type) {
            return res.status(400).json({
                success: false,
                error: 'Texto y tipo son requeridos'
            });
        }

        if (!process.env.DEEPSEEK_API_KEY) {
            console.error('❌ API Key no configurada');
            return res.status(500).json({
                success: false,
                error: 'Error de configuración del sistema. Contacte al administrador.'
            });
        }

        // Preparar prompt según tipo
        const prompts = {
            accounting: `Eres un experto contable... [TU PROMPT COMPLETO AQUÍ]`,
            legal: `Eres un asistente legal... [TU PROMPT COMPLETO AQUÍ]`
        };

        const prompt = prompts[type] || prompts.legal;

        // Call DeepSeek API
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: type === 'accounting' 
                            ? 'Eres un experto contable...'
                            : 'Eres un asistente legal...'
                    },
                    {
                        role: 'user',
                        content: `${prompt}\n\nTexto a Analizar:\n${text.substring(0, 12000)}`
                    }
                ],
                temperature: 0.1,
                max_tokens: 4000,
                stream: false
            }),
            timeout: 30000
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error de DeepSeek API:', response.status, errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Respuesta inválida de la API');
        }

        const analysisResult = data.choices[0].message.content;

        console.log('✅ Análisis completado exitosamente');
        res.json({
            success: true,
            result: analysisResult,
            model: data.model,
            usage: data.usage
        });

    } catch (error) {
        console.error('❌ Error en análisis:', error.message);
        
        res.status(500).json({
            success: false,
            error: process.env.NODE_ENV === 'production' 
                ? 'Error al procesar el análisis. Por favor, intente nuevamente.'
                : `Error: ${error.message}`
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Error no manejado:', error);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 LegalMind Analyzer Server
✅ Puerto: ${PORT}
✅ Entorno: ${process.env.NODE_ENV || 'development'}
✅ API Key configurada: ${!!process.env.DEEPSEEK_API_KEY}
✅ URL: http://localhost:${PORT}
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Apagando servidor gracefulmente...');
    process.exit(0);
});