const express = require('express');
const path = require('path');
const cors = require('cors');

// API Key de DeepSeek - ¡REMPLAZA CON TU KEY!
const API_KEY = "sk-de98f43195474e98851cee9848adc2ff";

console.log('🔍 DEBUG MODE ACTIVADO');
console.log('✅ API Key presente:', !!API_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware con logging
app.use(cors({
    origin: ['https://legalmind3.onrender.com', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Health check con info detallada
app.get('/api/health', (req, res) => {
    console.log('✅ Health check solicitado');
    res.json({ 
        status: 'OK', 
        message: 'Server funcionando',
        apiKey: !!API_KEY,
        timestamp: new Date().toISOString()
    });
});

// Análisis con DEBUGGING COMPLETO
app.post('/api/analyze', async (req, res) => {
    console.log('🟡 ANALYZE ENDPOINT HIT');
    
    try {
        console.log('📦 Body recibido:', {
            hasText: !!req.body.text,
            hasType: !!req.body.type,
            textLength: req.body.text?.length,
            type: req.body.type
        });

        const { text, type } = req.body;
        
        // Validaciones
        if (!text || !type) {
            console.log('❌ Error: Texto o tipo faltante');
            return res.status(400).json({
                success: false,
                error: 'Texto y tipo de análisis son requeridos'
            });
        }

        console.log('🔑 Usando API Key:', API_KEY ? 'PRESENTE' : 'AUSENTE');

        // Prompt simple para test
        const prompt = `Analiza este texto ${type} y genera un resumen en español: ${text.substring(0, 500)}`;
        console.log('📝 Prompt:', prompt.substring(0, 100) + '...');

        // Llamar a DeepSeek
        console.log('🌐 Enviando request a DeepSeek...');
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
                        content: 'Responde en español con formato markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 500
            })
        });

        console.log('📊 Status de DeepSeek:', response.status);
        console.log('📋 Headers:', Object.fromEntries(response.headers));

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            throw new Error(`DeepSeek error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Respuesta de DeepSeek recibida');
        
        const analysisResult = data.choices[0].message.content;
        console.log('📄 Resultado length:', analysisResult.length);

        res.json({
            success: true,
            result: analysisResult
        });
        
    } catch (error) {
        console.log('💥 ERROR CATCHED:', error.message);
        console.log('🔄 Stack:', error.stack);
        
        res.status(500).json({
            success: false,
            error: 'Error interno: ' + error.message
        });
    }
});

// Ruta de testing simple
app.post('/api/test', async (req, res) => {
    console.log('🧪 TEST ENDPOINT');
    try {
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
                        role: 'user',
                        content: 'Dime hola para confirmar que funciona'
                    }
                ],
                max_tokens: 10
            })
        });

        const data = await response.json();
        res.json({ success: true, response: data });
        
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Manejo de rutas
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((error, req, res, next) => {
    console.log('🔥 UNHANDLED ERROR:', error);
    res.status(500).json({ error: 'Error no manejado' });
});

app.listen(PORT, () => {
    console.log('🚀 Server iniciado en puerto:', PORT);
    console.log('🔍 Debug mode: ACTIVADO');
    console.log('📊 Logs disponibles en Render.com');
});