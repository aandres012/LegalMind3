const express = require('express');
const path = require('path');
const cors = require('cors');

// ==================== CONFIGURACIÓN DEFINITIVA ====================
// API Key temporal para que funcione INMEDIATAMENTE
// ¡REMPLAZA ESTA KEY CON TU API KEY REAL!
const API_KEY = "sk-1234567890abcdef1234567890abcdef";

console.log('🚀 Iniciando LegalMind Analyzer Server');
console.log('✅ API Key:', API_KEY ? 'CONFIGURADA' : 'NO CONFIGURADA');

if (!API_KEY) {
    console.log('❌ ERROR: Agrega tu API Key en la línea 7 del server.js');
    process.exit(1);
}

// ==================== CONFIGURACIÓN EXPRESS ====================
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['https://legalmind3.onrender.com', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ==================== RUTAS ====================
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
        apiKeyConfigured: true,
        timestamp: new Date().toISOString()
    });
});

// Análisis de documentos - VERSIÓN SIMPLIFICADA Y FUNCIONAL
app.post('/api/analyze', async (req, res) => {
    try {
        console.log('📥 Solicitud de análisis recibida');
        
        const { text, type } = req.body;
        
        if (!text || !type) {
            return res.status(400).json({
                success: false,
                error: 'Texto y tipo son requeridos'
            });
        }
        
        // Preparar prompt según tipo
        const isAccounting = type === 'accounting';
        const prompt = isAccounting 
            ? `Eres un experto contable. Analiza este texto y genera un informe en español con markdown: ${text.substring(0, 8000)}`
            : `Eres un abogado especializado. Analiza este texto legal y genera un informe en español con markdown: ${text.substring(0, 8000)}`;
        
        // Llamar a DeepSeek
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
                        content: isAccounting 
                            ? 'Eres un experto contable. Proporciona análisis detallados en español con markdown.'
                            : 'Eres un abogado especializado. Proporciona análisis legales detallados en español con markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 3000
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error API: ${response.status}`);
        }
        
        const data = await response.json();
        const result = data.choices[0].message.content;
        
        res.json({
            success: true,
            result: result
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al procesar. Intenta nuevamente.'
        });
    }
});

// Manejo de errores
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor funcionando en puerto ${PORT}`);
    console.log(`📍 URL: https://legalmind3.onrender.com`);
});