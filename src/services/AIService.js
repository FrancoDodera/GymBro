// ============================================
// AI Service - Google Gemini Integration
// ============================================
// Servicio para generar planes de entrenamiento usando Google Gemini AI

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

/**
 * Genera un plan de entrenamiento usando Google Gemini
 * @param {Object} preferences - Preferencias del usuario
 * @param {Array} ejerciciosDisponibles - Lista de ejercicios de la base de datos
 * @returns {Promise<Object>} Plan generado con ejercicios
 */
export async function generateTrainingPlan(preferences, ejerciciosDisponibles) {
    const {
        objetivo,
        nivelExperiencia,
        duracionTipo,
        diasSemana,
        equipamiento,
        limitaciones
    } = preferences;

    // Crear lista de ejercicios disponibles para el prompt
    const ejerciciosTexto = ejerciciosDisponibles
        .map(ej => `- ${ej.nombre} (${ej.categoria}, ${ej.nivel_dificultad})`)
        .join('\n');

    // Construir el prompt optimizado
    const prompt = buildPrompt({
        objetivo,
        nivelExperiencia,
        duracionTipo,
        diasSemana,
        equipamiento,
        limitaciones,
        ejerciciosTexto
    });

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text;

        // Parsear la respuesta JSON
        const planData = JSON.parse(generatedText);

        // Validar y mapear ejercicios
        const planValidado = validateAndMapPlan(planData, ejerciciosDisponibles);

        return {
            success: true,
            plan: planValidado,
            promptUsado: prompt
        };
    } catch (error) {
        console.error('Error generating plan with Gemini:', error);
        throw new Error(`No se pudo generar el plan: ${error.message}`);
    }
}

/**
 * Construye el prompt para Gemini
 */
function buildPrompt({ objetivo, nivelExperiencia, duracionTipo, diasSemana, equipamiento, limitaciones, ejerciciosTexto }) {
    const objetivoTextos = {
        'perder_peso': 'perder peso y mejorar composición corporal',
        'ganar_musculo': 'ganar masa muscular',
        'tonificar': 'tonificar y definir el cuerpo',
        'resistencia': 'mejorar resistencia cardiovascular',
        'fuerza': 'aumentar fuerza general',
        'flexibilidad': 'mejorar flexibilidad y movilidad'
    };

    const duracionTextos = {
        'diario': 'un plan de entrenamiento para hoy (1 sesión)',
        'semanal': `un plan semanal de ${diasSemana} días`,
        'mensual': `un plan mensual de 4 semanas, ${diasSemana} días por semana`
    };

    const equipamientoTexto = Array.isArray(equipamiento) ? equipamiento.join(', ') : equipamiento;

    return `Eres un entrenador personal experto certificado. Tu tarea es crear ${duracionTextos[duracionTipo]} de entrenamiento personalizado.

**INFORMACIÓN DEL CLIENTE:**
- Objetivo: ${objetivoTextos[objetivo] || objetivo}
- Nivel de experiencia: ${nivelExperiencia}
- Equipamiento disponible: ${equipamientoTexto}
${limitaciones ? `- Limitaciones/Lesiones: ${limitaciones}` : ''}

**EJERCICIOS DISPONIBLES EN LA BASE DE DATOS:**
${ejerciciosTexto}

**INSTRUCCIONES CRÍTICAS:**
1. SOLO puedes usar ejercicios de la lista proporcionada arriba
2. Selecciona ejercicios apropiados para el nivel ${nivelExperiencia}
3. Considera el equipamiento disponible: ${equipamientoTexto}
${limitaciones ? `4. EVITA ejercicios que puedan agravar: ${limitaciones}` : ''}
5. Crea un plan balanceado y progresivo
6. Para nivel principiante: prioriza forma correcta sobre volumen
7. Para nivel intermedio/avanzado: incluye variación e intensidad

**FORMATO DE RESPUESTA (JSON):**
{
  "nombre": "Nombre descriptivo del plan",
  "descripcion": "Breve descripción de 2-3 líneas",
  "ejercicios": [
    {
      "nombre": "Nombre exacto del ejercicio de la lista",
      "dia": 1,
      "orden": 1,
      "series": 3,
      "repeticiones": "12-15",
      "duracion_minutos": null,
      "notas": "Consejos específicos para este ejercicio"
    }
  ]
}

**REGLAS PARA ESTRUCTURA DEL PLAN:**
- ${duracionTipo === 'diario' ? 'Incluye 5-8 ejercicios para una sesión completa' : ''}
- ${duracionTipo === 'semanal' ? `Distribuye ${diasSemana * 6} a ${diasSemana * 8} ejercicios totales en ${diasSemana} días (campo "dia": 1-${diasSemana})` : ''}
- ${duracionTipo === 'mensual' ? `Crea un plan de 4 semanas con progresión. Usa "dia" como día de la semana (1-7), y aumenta intensidad semanalmente` : ''}
- Series: 2-4 para principiantes, 3-5 para intermedios, 4-6 para avanzados
- Repeticiones: Varía según objetivo (fuerza: 4-8, hipertrofia: 8-12, resistencia: 12-20)
- Para cardio: usa "duracion_minutos" en lugar de series/repeticiones

**EJEMPLO DE EJERCICIOS DEL PLAN ${duracionTipo === 'semanal' ? '(DÍA 1 - Pecho/Tríceps)' : ''}:**
${duracionTipo === 'diario' ? `
- Sentadillas: 3 series de 12-15 reps
- Press de banca: 3 series de 10-12 reps
- Remo con barra: 3 series de 10-12 reps
- Press militar: 3 series de 10-12 reps
- Plancha: 3 series de 30-60 segundos
` : duracionTipo === 'semanal' ? `
Día 1 (Pecho/Tríceps):
- Press de banca: 3 series de 10-12
- Aperturas con mancuernas: 3 series de 12-15
- Fondos en paralelas: 3 series de 8-12
- Extensión de tríceps: 3 series de 12-15

Día 2 (Espalda/Bíceps):
- Dominadas: 3 series de 6-10
- Remo con barra: 3 series de 10-12
- Curl con mancuernas: 3 series de 12-15
` : `
Semana 1-2: Adaptación (3 series, reps moderadas)
Semana 3-4: Intensificación (4 series, reps altas o peso mayor)
`}

Genera ahora el plan completo en formato JSON. Asegúrate de que TODOS los nombres de ejercicios coincidan EXACTAMENTE con la lista proporcionada.`;
}

/**
 * Valida y mapea el plan generado con los ejercicios de la BD
 */
function validateAndMapPlan(planData, ejerciciosDisponibles) {
    const ejerciciosMap = new Map(
        ejerciciosDisponibles.map(ej => [ej.nombre.toLowerCase().trim(), ej])
    );

    const ejerciciosValidados = [];
    const ejerciciosNoEncontrados = [];

    for (const ejercicio of planData.ejercicios) {
        const nombreBuscado = ejercicio.nombre.toLowerCase().trim();
        const ejercicioEncontrado = ejerciciosMap.get(nombreBuscado);

        if (ejercicioEncontrado) {
            ejerciciosValidados.push({
                ejercicio_id: ejercicioEncontrado.id,
                nombre: ejercicioEncontrado.nombre,
                dia: ejercicio.dia || 1,
                orden: ejercicio.orden,
                series: ejercicio.series || 3,
                repeticiones: ejercicio.repeticiones || '10-12',
                duracion_minutos: ejercicio.duracion_minutos || null,
                notas: ejercicio.notas || ''
            });
        } else {
            // Intentar búsqueda fuzzy
            const ejercicioSimilar = findSimilarExercise(ejercicio.nombre, ejerciciosDisponibles);
            if (ejercicioSimilar) {
                ejerciciosValidados.push({
                    ejercicio_id: ejercicioSimilar.id,
                    nombre: ejercicioSimilar.nombre,
                    dia: ejercicio.dia || 1,
                    orden: ejercicio.orden,
                    series: ejercicio.series || 3,
                    repeticiones: ejercicio.repeticiones || '10-12',
                    duracion_minutos: ejercicio.duracion_minutos || null,
                    notas: ejercicio.notas || ''
                });
            } else {
                ejerciciosNoEncontrados.push(ejercicio.nombre);
            }
        }
    }

    if (ejerciciosNoEncontrados.length > 0) {
        console.warn('Ejercicios no encontrados en BD:', ejerciciosNoEncontrados);
    }

    return {
        nombre: planData.nombre,
        descripcion: planData.descripcion,
        ejercicios: ejerciciosValidados
    };
}

/**
 * Busca un ejercicio similar usando coincidencia parcial
 */
function findSimilarExercise(nombreBuscado, ejerciciosDisponibles) {
    const nombreLower = nombreBuscado.toLowerCase();

    // Buscar coincidencia parcial
    return ejerciciosDisponibles.find(ej => {
        const ejNombre = ej.nombre.toLowerCase();
        return ejNombre.includes(nombreLower) || nombreLower.includes(ejNombre);
    });
}

/**
 * Obtiene sugerencias de equipamiento basado en los ejercicios disponibles
 */
export function getEquipmentOptions() {
    return [
        { value: 'peso_corporal', label: 'Peso Corporal', icon: '🏃' },
        { value: 'mancuernas', label: 'Mancuernas', icon: '🏋️' },
        { value: 'barra', label: 'Barra', icon: '💪' },
        { value: 'maquinas', label: 'Máquinas', icon: '⚙️' },
        { value: 'bandas', label: 'Bandas Elásticas', icon: '🎗️' },
        { value: 'kettlebells', label: 'Kettlebells', icon: '⚫' },
        { value: 'completo', label: 'Gimnasio Completo', icon: '🏢' }
    ];
}

/**
 * Obtiene opciones de objetivos
 */
export function getObjectiveOptions() {
    return [
        { value: 'perder_peso', label: 'Perder Peso', icon: '⚖️', description: 'Reducir grasa corporal' },
        { value: 'ganar_musculo', label: 'Ganar Músculo', icon: '💪', description: 'Hipertrofia muscular' },
        { value: 'tonificar', label: 'Tonificar', icon: '✨', description: 'Definir y tonificar' },
        { value: 'resistencia', label: 'Resistencia', icon: '🏃', description: 'Cardio y resistencia' },
        { value: 'fuerza', label: 'Fuerza', icon: '🏋️', description: 'Aumentar fuerza máxima' },
        { value: 'flexibilidad', label: 'Flexibilidad', icon: '🧘', description: 'Movilidad y flexibilidad' }
    ];
}

export default {
    generateTrainingPlan,
    getEquipmentOptions,
    getObjectiveOptions
};
