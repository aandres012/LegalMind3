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
app.use(express.static(path.join(__dirname, 'public')));
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
${text.substring(0, 12000)}... [texto truncado por razones de longitud]

Formato Requerido para el Informe:

# INFORME CONTABLE - ANÁLISIS FINANCIERO

## 1. INFORMACIÓN GENERAL
- **Tipo de Documento:** [Identifica el tipo de documento contable]
- **Periodo Cubierto:** [Rango de fechas del informe]
- **Entidad/Compañía:** [Nombre de la empresa o entidad]
- **Preparado por:** [Firma contable o departamento responsable]

## 2. RESUMEN EJECUTIVO
[Proporciona una visión general de máximo nivel en 2 o 3 párrafos. Enfócate en los hallazgos más importantes, tendencias financieras y aspectos críticos.]

## 3. ANÁLISIS DE ESTADOS FINANCIEROS
### Balance General
- **Activos:** [Análisis de la estructura de activos, liquidez, cambios significativos]
- **Pasivos:** [Análisis de la estructura de deuda, obligaciones, plazos]
- **Patrimonio:** [Evolución del patrimonio, contribuciones, utilidades retenidas]

### Estado de Resultados
- **Ingresos:** [Análisis de fuentes de ingresos, tendencias, crecimiento]
- **Gastos:** [Estructura de costos, gastos operativos, eficiencia]
- **Resultado Neto:** [Rentabilidad, margen neto, comparativa con periodos anteriores]

### Estado de Flujos de Efectivo
- **Flujos Operativos:** [Capacidad de generación de efectivo de las operaciones]
- **Flujos de Inversión:** [Inversiones en activos fijos, desinversiones]
- **Flujos de Financiación:** [Préstamos, pagos de deuda, dividendos]

## 4. INDICADORES FINANCIEROS CLAVE
### Liquidez
- **Capital de Trabajo:** [Análisis y evaluación]
- **Razón Corriente:** [Cálculo y interpretación]
- **Prueba Ácida:** [Cálculo y interpretación]

### Solvencia
- **Endeudamiento:** [Nivel de apalancamiento, sostenibilidad]
- **Cobertura de Intereses:** [Capacidad para cubrir obligaciones financieras]

### Rentabilidad
- **ROA (Return on Assets):** [Eficiencia en el uso de activos]
- **ROE (Return on Equity):** [Rentabilidad sobre el patrimonio]
- **Margen Neto:** [Eficiencia operativa global]

## 5. HALLAZGOS Y OBSERVACIONES
### Aspectos Positivos
- [Lista de aspectos favorables encontrados]

### Áreas de Mejora
- [Aspectos que requieren atención o mejoras]

### Riesgos Identificados
- **Alto Riesgo:** [Problemas graves que requieren atención inmediata]
- **Medio Riesgo:** [Aspectos que merecen monitoreo]
- **Bajo Riesgo:** [Observaciones menores]

## 6. RECOMENDACIONES
- **Prioridad Alta:** [Acciones urgentes necesarias]
- **Prioridad Media:** [Mejoras recomendadas]
- **Prioridad Baja:** [Sugerencias de optimización]

## 7. CONCLUSIONES
[Resumen final con las conclusiones más importantes del análisis]`;
        } else {
            prompt = `Eres un asistente legal especializado en análisis, síntesis y redacción de informes ejecutivos para socios de bufetes de abogados. Analiza el siguiente texto legal y genera un informe exhaustivo y bien estructurado en español, utilizando el formato markdown. El tono debe ser profesional, conciso y dirigido a abogados experienciados.

Texto a Analizar:
${text.substring(0, 12000)}... [texto truncado por razones de longitud]

Formato Requerido para el Informe:

# ANÁLISIS LEGAL - INFORME EJECUTIVO

## 1. METADATOS Y CONTEXTO
- **Naturaleza del Documento:** [Identifica el tipo de documento]
- **Partes Intervinientes:** [Lista todas las partes identificadas y su rol]
- **Jurisdicción y Ley Aplicable:** [Identifica la jurisdicción, ley aplicable y fuentes legales mencionadas]
- **Fechas Relevantes:** [Fecha de firma, vigencia, plazos críticos]
- **Resumen del Objeto Principal:** [Una descripción concisa de 2 líneas sobre la finalidad del documento]

## 2. RESUMEN EJECUTIVO
[Proporciona una visión general de máximo nivel en 2 o 3 párrafos. Enfócate en la relación jurídica principal, el estado de las negociaciones (si aplica), y las implicaciones legales y comerciales más importantes.]

## 3. HALLAZGOS CLAVE Y ANÁLISIS
### Obligaciones Principales
- **Parte A:** [Lista de 3-5 obligaciones core con referencia a cláusula y página]
- **Parte B:** [Lista de 3-5 obligaciones core con referencia a cláusula y página]

### Derechos Principales
- **Parte A:** [Lista de los derechos más importantes]
- **Parte B:** [Lista de los derechos más importantes]

### Puntos de Riesgo y Controversia Potencial
- **Alto Riesgo:** [Enumera las cláusulas más problemáticas, ambigüedades graves, limitaciones de responsabilidad excesivas, indemnizaciones desproporcionadas]
- **Medio Riesgo:** [Señala posibles áreas de conflicto, plazos ajustados, condiciones poco claras]
- **Bajo Riesgo/Observaciones:** [Aspectos menores que merecen una revisión]

### Cláusulas Críticas Anotadas
- **Indemnización:** [Resumen y análisis de la cláusula]
- **Confidencialidad:** [Resumen y análisis de la cláusula]
- **Propiedad Intelectual:** [Resumen y análisis, si aplica]
- **Terminación:** [Resumen de causales de terminación]
- **Solución de Controversias:** [Foro elegido, ley aplicable]

## 4. RECOMENDACIONES ACCIONABLES
- **Prioridad Alta:** [Acciones específicas y urgentes]
- **Prioridad Media:** [Acciones recomendadas]
- **Prioridad Baja:** [Sugerencias de mejora]

## 5. ANEXOS DE REFERENCIA RÁPIDA
- **Definiciones Importantes:** [Tabla con términos definidos relevantes]
- **Cronograma de Hitos:** [Linea de tiempo con fechas críticas]
- **Índice de Cláusulas Relevantes:** [Lista de números de cláusula importantes]`;
        } // ← ESTA ES LA LÍNEA QUE FALTABA PARA CERRAR EL ELSE

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