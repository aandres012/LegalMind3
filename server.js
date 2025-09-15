const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['https://legalmind3.onrender.com', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejar todas las rutas para SPA
app.get('*', (req, res) => {
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

Formato Requerido para el Informe:

# INFORME CONTABLE - ANÁLISIS FINANCIERO

## 1. INFORMACIÓN GENERAL
- **Tipo de Documento:** [Identifica el tipo de documento contable]
- **Periodo Cubierto:** [Rango de fechas del informe]
- **Entidad/Compañía:** [Nombre de la empresa o entidad]

## 2. RESUMEN EJECUTIVO
[Proporciona una visión general de máximo nivel en 2 o 3 párrafos.]

## 3. ANÁLISIS DE ESTADOS FINANCIEROS
### Balance General
- **Activos:** [Análisis de la estructura de activos]
- **Pasivos:** [Análisis de la estructura de deuda]
- **Patrimonio:** [Evolución del patrimonio]

### Estado de Resultados
- **Ingresos:** [Análisis de fuentes de ingresos]
- **Gastos:** [Estructura de costos]
- **Resultado Neto:** [Rentabilidad]

## 4. INDICADORES FINANCIEROS CLAVE
### Liquidez
- **Capital de Trabajo:** [Análisis y evaluación]
- **Razón Corriente:** [Cálculo y interpretación]

### Solvencia
- **Endeudamiento:** [Nivel de apalancamiento]

### Rentabilidad
- **ROA (Return on Assets):** [Eficiencia en el uso de activos]
- **ROE (Return on Equity):** [Rentabilidad sobre el patrimonio]

## 5. HALLAZGOS Y OBSERVACIONES
### Aspectos Positivos
- [Lista de aspectos favorables encontrados]

### Áreas de Mejora
- [Aspectos que requieren atención o mejoras]

## 6. RECOMENDACIONES
- **Prioridad Alta:** [Acciones urgentes necesarias]
- **Prioridad Media:** [Mejoras recomendadas]

## 7. CONCLUSIONES
[Resumen final con las conclusiones más importantes]`;
        } else {
            prompt = `Eres un asistente legal especializado en análisis, síntesis y redacción de informes ejecutivos para socios de bufetes de abogados. Analiza el siguiente texto legal y genera un informe exhaustivo y bien estructurado en español, utilizando el formato markdown. El tono debe ser profesional, conciso y dirigido a abogados experienciados.

Texto a Analizar:
${text}

Formato Requerido para el Informe:

# ANÁLISIS LEGAL - INFORME EJECUTIVO

## 1. METADATOS Y CONTEXTO
- **Naturaleza del Documento:** [Identifica el tipo de documento]
- **Partes Intervinientes:** [Lista todas las partes identificadas y su rol]
- **Jurisdicción y Ley Aplicable:** [Identifica la jurisdicción, ley aplicable]
- **Fechas Relevantes:** [Fecha de firma, vigencia, plazos críticos]
- **Resumen del Objeto Principal:** [Descripción concisa de la finalidad]

## 2. RESUMEN EJECUTIVO
[Proporciona una visión general de máximo nivel en 2 o 3 párrafos.]

## 3. HALLAZGOS CLAVE Y ANÁLISIS
### Obligaciones Principales
- **Parte A:** [Lista de obligaciones principales]
- **Parte B:** [Lista de obligaciones principales]

### Derechos Principales
- **Parte A:** [Lista de los derechos más importantes]
- **Parte B:** [Lista de los derechos más importantes]

### Puntos de Riesgo y Controversia Potencial
- **Alto Riesgo:** [Cláusulas problemáticas, ambigüedades graves]
- **Medio Riesgo:** [Posibles áreas de conflicto]
- **Bajo Riesgo/Observaciones:** [Aspectos menores que merecen revisión]

## 4. RECOMENDACIONES ACCIONABLES
- **Prioridad Alta:** [Acciones específicas y urgentes]
- **Prioridad Media:** [Acciones recomendadas]
- **Prioridad Baja:** [Sugerencias de mejora]

## 5. ANEXOS DE REFERENCIA RÁPIDA
- **Definiciones Importantes:** [Términos definidos más relevantes]
- **Cronograma de Hitos:** [Linea de tiempo con fechas críticas]
- **Índice de Cláusulas Relevantes:** [Números de cláusula importantes]`;
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