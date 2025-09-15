const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// TEMPORAL: Agrega tu API key aquí mismo (luego la pondrás en variables de entorno)
const API_KEY_TEMPORAL = "sk-de98f43195474e98851cee9848adc2ff"; // ← REEMPLAZA ESTO
process.env.DEEPSEEK_API_KEY = API_KEY_TEMPORAL;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public'))); // ← CAMBIADO

// Servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para análisis con DeepSeek
app.post('/api/analyze', async (req, res) => {
    try {
        const { text, type } = req.body;
        
        // Validar que tenemos API key
        if (!process.env.DEEPSEEK_API_KEY) {
            return res.status(500).json({ 
                error: 'API key no configurada en el servidor' 
            });
        }

        // Preparar el prompt según el tipo de análisis
        let prompt = '';
        if (type === 'accounting') {
            prompt = `Eres un experto contable y financiero especializado en análisis de documentos contables, estados financieros, balances e informes fiscales. Analiza el siguiente texto y genera un informe exhaustivo y bien estructurado en español, utilizando el formato markdown.

Texto a Analizar:
${text}

Formato Requerido para el Informe: [TU PROMPT COMPLETO AQUÍ]`;
        } else {
            prompt = `Eres un asistente legal especializado en análisis, síntesis y redacción de informes ejecutivos para socios de bufetes de abogados. Analiza el siguiente texto legal y genera un informe exhaustivo y bien estructurado en español, utilizando el formato markdown. El tono debe ser profesional, conciso y dirigido a abogados experienciados.

Texto a Analizar:
${text}

Formato Requerido para el Informe: [TU PROMPT COMPLETO AQUÍ]`;
        }

        // Realizar la solicitud a la API de DeepSeek
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
                            ? 'Eres un experto contable y financiero especializado en análisis de documentos contables. Proporciona respuestas detalladas y bien estructuradas en español usando markdown.'
                            : 'Eres un asistente legal especializado en análisis de documentos legales. Proporciona respuestas detalladas y bien estructuradas en español usando markdown.'
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
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Error en la API de DeepSeek');
        }

        const data = await response.json();
        const analysisResult = data.choices[0].message.content;
        
        res.json({ success: true, result: analysisResult });
        
    } catch (error) {
        console.error('Error en el análisis:', error);
        res.status(500).json({ 
            error: 'Error al procesar la solicitud: ' + error.message 
        });
    }
});

// Ruta para verificar el estado del servidor
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'LegalMind API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Manejar rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor LegalMind ejecutándose en el puerto ${PORT}`);
    console.log(`📁 Sirviendo archivos estáticos desde: ${path.join(__dirname, 'public')}`);
});