const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Configuración de entorno
const configureEnvironment = () => {
    try {
        if (process.env.NODE_ENV !== 'production') {
            require('dotenv').config();
        }
        
        if (process.env.DEEPSEEK_API_KEY) {
            console.log('✅ API Key cargada desde variables de entorno');
            return true;
        }
        
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
        
        if (!process.env.DEEPSEEK_API_KEY) {
            process.env.DEEPSEEK_API_KEY = "sk-tu-api-key-real-aqui";
            console.log('⚠️  API Key cargada desde fallback hardcodeado');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error configurando entorno:', error.message);
        return false;
    }
};

configureEnvironment();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['https://legalmind3.onrender.com', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'LegalMind API funcionando',
        timestamp: new Date().toISOString(),
        apiKeyConfigured: !!process.env.DEEPSEEK_API_KEY
    });
});

// Análisis con DeepSeek
app.post('/api/analyze', async (req, res) => {
    try {
        console.log('🔍 Iniciando análisis...');
        console.log('✅ API Key presente:', !!process.env.DEEPSEEK_API_KEY);
        
        const { text, type } = req.body;
        
        if (!process.env.DEEPSEEK_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Error de configuración del sistema'
            });
        }

        let prompt = '';
        if (type === 'accounting') {
            prompt = `Eres un experto contable... [TU PROMPT]`;
        } else {
            prompt = `Eres un asistente legal... [TU PROMPT]`;
        }

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
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            throw new Error('Error en la API de DeepSeek');
        }

        const data = await response.json();
        const analysisResult = data.choices[0].message.content;
        
        res.json({ success: true, result: analysisResult });
        
    } catch (error) {
        console.error('❌ Error en análisis:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar el análisis'
        });
    }
});

// Error handling
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`✅ API Key configurada: ${!!process.env.DEEPSEEK_API_KEY}`);
});