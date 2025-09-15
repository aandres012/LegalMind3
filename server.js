const express = require('express');
const path = require('path');

// API Key de DeepSeek - ¡REMPLAZA CON TU KEY!
const API_KEY = "sk-de98f43195474e98851cee9848adc2ff";

console.log('🚀 Iniciando LegalMind Server');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CORS CORREGIDO ====================
app.use((req, res, next) => {
    console.log('🌐 CORS Middleware:', req.method, req.path);
    
    // Permitir todos los orígenes
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
        console.log('🛬 Preflight request recibida');
        return res.status(200).end();
    }
    
    next();
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging de requests
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`, {
        'Content-Type': req.headers['content-type'],
        'Origin': req.headers['origin']
    });
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ==================== RUTAS ====================
app.get('/api/health', (req, res) => {
    console.log('✅ Health check OK');
    res.json({ 
        status: 'OK', 
        message: 'Server funcionando',
        apiKey: !!API_KEY,
        cors: 'configurado',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/test', async (req, res) => {
    console.log('🧪 Test endpoint');
    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'Hola, responde con OK' }],
                max_tokens: 5
            })
        });

        const data = await response.json();
        res.json({ 
            success: true, 
            deepSeekStatus: response.status,
            response: data 
        });
        
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/analyze', async (req, res) => {
    console.log('🟡 Analyze endpoint called');
    
    try {
        const { text, type } = req.body;
        console.log('📦 Request body:', { type, textLength: text?.length });
        
        if (!text || !type) {
            return res.status(400).json({
                success: false,
                error: 'Texto y tipo requeridos'
            });
        }

        const prompt = `Analiza este texto ${type} y genera un resumen en español: ${text.substring(0, 1000)}`;
        
        console.log('🌐 Calling DeepSeek API...');
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
                        content: 'Responde en español con formato markdown. Sé profesional y detallado.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 2000
            })
        });

        console.log('📊 DeepSeek response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`DeepSeek error: ${response.status}`);
        }

        const data = await response.json();
        const result = data.choices[0].message.content;
        
        console.log('✅ Analysis completed');
        res.json({
            success: true,
            result: result
        });
        
    } catch (error) {
        console.error('❌ Analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((error, req, res, next) => {
    console.error('🔥 Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🌐 CORS: Configurado para todos los orígenes`);
    console.log(`🔑 API Key: ${API_KEY ? 'PRESENTE' : 'AUSENTE'}`);
});