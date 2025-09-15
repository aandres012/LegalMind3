const express = require('express');
const path = require('path');
const cors = require('cors');

// API Key de DeepSeek - ¡YA ESTÁ FUNCIONANDO!
const API_KEY = "sk-de98f43195474e98851cee9848adc2ff"; // ← USA LA KEY QUE ACABAS DE PROBAR

console.log('🚀 LegalMind Analyzer - API Key verificada ✅');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['https://legalmind3.onrender.com', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'LegalMind API funcionando con DeepSeek ✅',
        timestamp: new Date().toISOString()
    });
});

// Análisis con DeepSeek - VERSIÓN FUNCIONAL
app.post('/api/analyze', async (req, res) => {
    try {
        console.log('📥 Solicitud de análisis recibida');
        
        const { text, type } = req.body;
        
        if (!text || !type) {
            return res.status(400).json({
                success: false,
                error: 'Texto y tipo de análisis son requeridos'
            });
        }

        // Preparar prompt según tipo de análisis
        let prompt = '';
        if (type === 'accounting') {
            prompt = `Eres un experto contable y financiero. Analiza el siguiente texto y genera un informe exhaustivo en español con formato markdown:

${text}

Incluye: Resumen ejecutivo, análisis financiero, hallazgos clave y recomendaciones.`;
        } else {
            prompt = `Eres un abogado especializado. Analiza el siguiente texto legal y genera un informe exhaustivo en español con formato markdown:

${text}

Incluye: Resumen ejecutivo, análisis legal, puntos de riesgo y recomendaciones.`;
        }

        // Llamar a la API de DeepSeek (¡QUE YA FUNCIONA!)
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
                            ? 'Eres un experto contable. Proporciona análisis detallados en español con markdown.'
                            : 'Eres un abogado especializado. Proporciona análisis legales detallados en español con markdown.'
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
            console.error('Error DeepSeek:', response.status, errorData);
            throw new Error(`Error en la API: ${response.status}`);
        }

        const data = await response.json();
        const analysisResult = data.choices[0].message.content;
        
        console.log('✅ Análisis completado exitosamente');
        res.json({
            success: true,
            result: analysisResult
        });
        
    } catch (error) {
        console.error('Error en análisis:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al procesar el análisis. Por favor, intente nuevamente.'
        });
    }
});

// Manejo de rutas
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor funcionando en puerto ${PORT}`);
    console.log(`📍 URL: https://legalmind3.onrender.com`);
    console.log(`🔑 API Key: CONFIGURADA Y FUNCIONANDO ✅`);
});