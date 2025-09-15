const express = require('express');
const path = require('path');
const cors = require('cors');

// API Key - ¡REMPLAZAR CON TU KEY REAL!
const API_KEY = "sk-de98f43195474e98851cee9848adc2ff";

// Validación inicial
if (!API_KEY || API_KEY === "sk-tu-api-key-real-aqui") {
    console.error('❌ ERROR: Debes configurar tu API Key real en la línea 5');
    process.exit(1);
}

console.log('🚀 Iniciando LegalMind Server');
console.log('✅ API Key configurada');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico y robusto
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server funcionando',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/analyze', async (req, res) => {
    try {
        console.log('📥 Análisis solicitado');
        const { text, type } = req.body;

        if (!text || !type) {
            return res.status(400).json({
                success: false,
                error: 'Texto y tipo requeridos'
            });
        }

        // Prompt simple para prueba
        const prompt = `Analiza el siguiente texto ${type} y genera un resumen en español: ${text.substring(0, 1000)}`;

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
                        content: 'Eres un asistente útil que responde en español con formato markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const result = data.choices[0].message.content;

        res.json({
            success: true,
            result: result
        });

    } catch (error) {
        console.error('Error en análisis:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Todas las demás rutas sirven el frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rechazada:', reason);
});