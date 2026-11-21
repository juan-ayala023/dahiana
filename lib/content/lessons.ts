/**
 * Escuelita financiera: 8 microlecciones (≤ 3 min) en formato historias + quiz de 3 preguntas.
 * Contenido educativo general para Colombia; no recomienda entidades ni marcas.
 */
export type LessonSlide = { emoji: string; title: string; body: string };
export type QuizQuestion = { question: string; options: [string, string, string]; correct: 0 | 1 | 2; explanation: string };
export type Lesson = {
  slug: string;
  order: number;
  emoji: string;
  title: string;
  subtitle: string;
  minutes: number;
  /** Degradado de las historias (dos colores). */
  colors: [string, string];
  slides: LessonSlide[];
  quiz: [QuizQuestion, QuizQuestion, QuizQuestion];
};

export const LESSONS: Lesson[] = [
  {
    slug: "presupuesto-50-30-20",
    order: 1,
    emoji: "📊",
    title: "Qué es un presupuesto",
    subtitle: "Y la regla 50/30/20",
    minutes: 3,
    colors: ["#F6D6E4", "#E8D5F2"],
    slides: [
      { emoji: "🗺️", title: "Un mapa para tu plata", body: "Un presupuesto es decidir de antemano a dónde va cada peso que te entra. No es para prohibirte cosas: es para que tu plata haga lo que tú quieres." },
      { emoji: "🧮", title: "La cuenta más simple", body: "Ingresos − gastos = lo que te queda. Si ese número es positivo, puedes ahorrar. Si es negativo, estás gastando plata que no tienes." },
      { emoji: "🏠", title: "50% necesidades", body: "La mitad de tus ingresos va a lo indispensable: arriendo, mercado, transporte, servicios y salud. Lo que tendrías que pagar sí o sí." },
      { emoji: "💅", title: "30% gustos", body: "Salidas, ropa, belleza, antojos, planes. Disfrutar también es parte del plan, y con un límite claro lo haces sin culpa." },
      { emoji: "🐷", title: "20% ahorro", body: "Tu fondo de emergencia, tus metas y tu futuro. Lo ideal es apartarlo apenas te pagan, antes de gastar en lo demás." },
      { emoji: "🌱", title: "Es una guía, no una ley", body: "Si hoy no te da el 50/30/20, empieza con lo que puedas: aunque sea 5% de ahorro. Lo importante es empezar y ajustar cada mes." },
    ],
    quiz: [
      { question: "Ganas $2.000.000 al mes. Según el 50/30/20, ¿cuánto debería ir a ahorro?", options: ["$200.000", "$400.000", "$600.000"], correct: 1, explanation: "El 20% de $2.000.000 son $400.000." },
      { question: "¿En qué grupo va el arriendo?", options: ["Necesidades", "Gustos", "Ahorro"], correct: 0, explanation: "Es un gasto indispensable que pagas sí o sí: necesidad." },
      { question: "¿Cuál es el mejor momento para ahorrar?", options: ["Lo que sobre a fin de mes", "Apenas te pagan", "Cuando tenga un aumento"], correct: 1, explanation: "\"Págate primero\": si esperas a que sobre, casi nunca sobra." },
    ],
  },
  {
    slug: "gastos-hormiga",
    order: 2,
    emoji: "🐜",
    title: "Gastos hormiga",
    subtitle: "El enemigo silencioso",
    minutes: 2,
    colors: ["#FFE4D6", "#F6D6E4"],
    slides: [
      { emoji: "🐜", title: "Pequeños pero muchos", body: "Son esos gastos chiquitos que haces casi sin pensar: un tinto, un pandebono, un domicilio, una app. Solos no parecen nada." },
      { emoji: "🧾", title: "Haz la cuenta", body: "Un antojo de $5.000 al día son $150.000 al mes y $1.800.000 al año. ¡Eso es un viaje!" },
      { emoji: "🔍", title: "Cómo descubrirlos", body: "Anota todo durante un mes, por pequeño que sea. La app te avisa cuando una categoría tiene muchos gasticos menores a $20.000." },
      { emoji: "✂️", title: "No se trata de eliminar todo", body: "Elige cuáles te hacen feliz de verdad y quédate con esos. Los que haces por costumbre o aburrimiento son los primeros en salir." },
      { emoji: "💡", title: "Truco", body: "Ponle un límite semanal a los antojos. Cuando se acabe, se acabó hasta el lunes. Lo que ahorres, ¡directo a tu jardín!" },
    ],
    quiz: [
      { question: "Un domicilio de $8.000 tres veces por semana, ¿cuánto suma al mes aprox.?", options: ["$24.000", "$96.000", "$300.000"], correct: 1, explanation: "3 × 4 semanas = 12 domicilios × $8.000 = $96.000." },
      { question: "¿Cuál es un gasto hormiga típico?", options: ["El arriendo", "Un snack diario", "El seguro de salud"], correct: 1, explanation: "Es pequeño, frecuente y casi automático." },
      { question: "¿Qué es lo más efectivo para controlarlos?", options: ["Prohibirme todo", "Anotarlos y elegir cuáles valen la pena", "Ignorarlos porque son pequeños"], correct: 1, explanation: "Verlos te da poder de decisión, sin dejar de disfrutar." },
    ],
  },
  {
    slug: "fondo-de-emergencia",
    order: 3,
    emoji: "🛟",
    title: "Fondo de emergencia",
    subtitle: "Tu red de seguridad",
    minutes: 3,
    colors: ["#D9EEF7", "#E8D5F2"],
    slides: [
      { emoji: "🌧️", title: "La vida pasa", body: "Se daña el celular, una cita médica, quedarte sin trabajo un tiempo. Las emergencias no avisan, pero sí se pueden preparar." },
      { emoji: "🛟", title: "¿Qué es?", body: "Una plata separada que solo usas para imprevistos de verdad. No es para viajes ni para el Black Friday." },
      { emoji: "📏", title: "¿Cuánto?", body: "Lo ideal: entre 3 y 6 meses de tus gastos fijos. Si tus fijos son $1.000.000, la meta es de $3.000.000 a $6.000.000." },
      { emoji: "🪜", title: "Paso a paso", body: "No tienes que tenerlo de una. Empieza con una meta pequeña, como $300.000, y ve subiendo. Cada abono cuenta." },
      { emoji: "🏦", title: "¿Dónde guardarlo?", body: "En un lugar seguro y que puedas sacar rápido, como una cuenta de ahorros aparte. Separado de la plata del día a día para no tentarte." },
    ],
    quiz: [
      { question: "Si tus gastos fijos son $1.200.000, ¿cuál sería un buen fondo de emergencia mínimo?", options: ["$1.200.000", "$3.600.000", "$12.000.000"], correct: 1, explanation: "3 meses × $1.200.000 = $3.600.000." },
      { question: "¿Cuál SÍ es una emergencia?", options: ["Una oferta increíble", "Una urgencia médica", "Un concierto"], correct: 1, explanation: "Es imprevista y necesaria. Las otras son gustos (¡válidos, pero con su propia meta!)." },
      { question: "¿Dónde conviene guardarlo?", options: ["Mezclado con la plata del mes", "En un lugar seguro y de fácil acceso, aparte", "Invertido en algo que no puedo sacar en años"], correct: 1, explanation: "Debe estar disponible rápido, pero separado para no gastarlo." },
    ],
  },
  {
    slug: "metas-smart",
    order: 4,
    emoji: "🎯",
    title: "Metas SMART",
    subtitle: "Para ahorrar de verdad",
    minutes: 2,
    colors: ["#E2F5EC", "#F6D6E4"],
    slides: [
      { emoji: "🌫️", title: "\"Quiero ahorrar\" no basta", body: "Una meta vaga se olvida rápido. Una meta clara te motiva cada vez que la ves." },
      { emoji: "🔎", title: "S y M: específica y medible", body: "No \"un viaje\", sino \"viaje a Santa Marta de $1.500.000\". Con nombre y número." },
      { emoji: "🙌", title: "A y R: alcanzable y relevante", body: "Que sea posible con tus ingresos y que de verdad te importe. Si no te emociona, no la vas a cumplir." },
      { emoji: "⏰", title: "T: con tiempo", body: "Ponle fecha. \"Para el 1 de junio\" convierte el sueño en un plan: la app te dice cuánto ahorrar por quincena." },
      { emoji: "🌷", title: "Ejemplo SMART", body: "\"Ahorrar $1.200.000 para un portátil antes de marzo, abonando $100.000 cada quincena.\" ¡Así se siembra una flor!" },
    ],
    quiz: [
      { question: "¿Cuál es una meta SMART?", options: ["Ahorrar más", "Ahorrar $600.000 para un curso antes de julio", "Ser millonaria"], correct: 1, explanation: "Tiene monto, propósito y fecha." },
      { question: "¿Qué significa la T?", options: ["Tranquila", "Con tiempo o fecha límite", "Total"], correct: 1, explanation: "Time-bound: la fecha convierte el deseo en plan." },
      { question: "Quieres $1.200.000 en 6 meses y te pagan quincenal. ¿Cuánto por quincena?", options: ["$100.000", "$200.000", "$50.000"], correct: 0, explanation: "6 meses = 12 quincenas. $1.200.000 / 12 = $100.000." },
    ],
  },
  {
    slug: "tarjetas-de-credito",
    order: 5,
    emoji: "💳",
    title: "Tarjetas de crédito sin miedo",
    subtitle: "Cuotas, intereses y pago total",
    minutes: 3,
    colors: ["#E8D5F2", "#FFE4D6"],
    slides: [
      { emoji: "💳", title: "Es plata prestada", body: "Lo que pagas con tarjeta de crédito no es tuyo: el banco te lo presta y luego te cobra. Bien usada es útil; mal usada es cara." },
      { emoji: "✅", title: "El pago total", body: "Si cada mes pagas el total de lo que usaste antes de la fecha límite, normalmente no pagas intereses. Esa es la clave de oro." },
      { emoji: "⚠️", title: "El pago mínimo es una trampa", body: "Pagar solo el mínimo deja el resto generando intereses. Una deuda pequeña puede durar años y costarte el doble." },
      { emoji: "🧩", title: "Las cuotas", body: "Diferir a varias cuotas suele generar intereses. Si puedes, compra a 1 cuota y págala completa. Revisa la tasa antes de diferir." },
      { emoji: "📅", title: "Hábitos sanos", body: "Úsala solo para lo que ya tienes en tu presupuesto, revisa el extracto cada mes y no la uses para sacar efectivo (los avances son carísimos)." },
    ],
    quiz: [
      { question: "¿Cómo evitas pagar intereses en compras a 1 cuota?", options: ["Pagando el mínimo", "Pagando el total antes de la fecha límite", "Usándola poco"], correct: 1, explanation: "Pagar el total a tiempo es la clave." },
      { question: "¿Qué pasa si solo pagas el mínimo?", options: ["Nada, está bien", "El saldo restante genera intereses", "Te devuelven plata"], correct: 1, explanation: "El resto queda como deuda con intereses y crece." },
      { question: "¿Qué conviene evitar?", options: ["Revisar el extracto", "Hacer avances en efectivo", "Comprar a 1 cuota"], correct: 1, explanation: "Los avances suelen tener intereses desde el primer día y costos extra." },
    ],
  },
  {
    slug: "bola-de-nieve-vs-avalancha",
    order: 6,
    emoji: "⛄",
    title: "Deudas: bola de nieve vs. avalancha",
    subtitle: "Dos métodos para salir de deudas",
    minutes: 3,
    colors: ["#D9EEF7", "#F6D6E4"],
    slides: [
      { emoji: "📝", title: "Primero, la lista", body: "Anota todas tus deudas: a quién, cuánto debes, la cuota mínima y la tasa de interés. Verlas juntas ya es un gran paso." },
      { emoji: "⛄", title: "Bola de nieve", body: "Pagas el mínimo en todas y todo lo extra va a la deuda MÁS PEQUEÑA. Cuando la terminas, esa plata pasa a la siguiente. Motiva porque ves victorias rápido." },
      { emoji: "🏔️", title: "Avalancha", body: "Pagas el mínimo en todas y lo extra va a la deuda con la TASA MÁS ALTA. Matemáticamente pagas menos intereses en total." },
      { emoji: "⚖️", title: "¿Cuál elegir?", body: "Si necesitas motivación, bola de nieve. Si eres disciplinada y quieres ahorrar más, avalancha. ¡El mejor método es el que sí cumples!" },
      { emoji: "🚫", title: "Mientras tanto", body: "No adquieras deudas nuevas y ten un mini fondo de emergencia para que un imprevisto no te devuelva al inicio." },
    ],
    quiz: [
      { question: "En el método bola de nieve, ¿a qué deuda va el dinero extra?", options: ["La de tasa más alta", "La más pequeña", "La más reciente"], correct: 1, explanation: "Bola de nieve = de la más pequeña a la más grande." },
      { question: "¿Qué método paga menos intereses en total?", options: ["Avalancha", "Bola de nieve", "Pagar solo mínimos"], correct: 0, explanation: "Atacar la tasa más alta reduce el costo total." },
      { question: "¿Qué es lo primero que debes hacer?", options: ["Pedir otro crédito", "Hacer la lista de todas tus deudas", "Ignorarlas un mes"], correct: 1, explanation: "Sin ver el panorama completo no puedes elegir estrategia." },
    ],
  },
  {
    slug: "interes-compuesto",
    order: 7,
    emoji: "💧",
    title: "Interés compuesto",
    subtitle: "Explicado fácil",
    minutes: 2,
    colors: ["#E2F5EC", "#D9EEF7"],
    slides: [
      { emoji: "🌱", title: "Intereses sobre intereses", body: "Cuando tu ahorro genera intereses y esos intereses también generan intereses, tu plata crece cada vez más rápido. Como una planta que da semillas." },
      { emoji: "🔢", title: "Un ejemplo", body: "Si ahorras $1.000.000 al 10% anual: el primer año ganas $100.000. El segundo ganas sobre $1.100.000, o sea $110.000. ¡Y así sigue creciendo!" },
      { emoji: "⏳", title: "El tiempo es tu superpoder", body: "Empezar temprano importa más que ahorrar mucho. Pequeños montos durante muchos años pueden superar montos grandes por poco tiempo." },
      { emoji: "🔁", title: "Constancia", body: "Abonar seguido, aunque sea poco, y no sacar la plata, deja que la magia ocurra." },
      { emoji: "⚠️", title: "Funciona al revés también", body: "En las deudas, el interés compuesto juega en tu contra. Por eso conviene pagar las deudas caras lo antes posible." },
    ],
    quiz: [
      { question: "¿Qué es el interés compuesto?", options: ["Intereses que solo se cobran una vez", "Intereses que también generan intereses", "Un impuesto"], correct: 1, explanation: "Los intereses se suman al capital y también rinden." },
      { question: "¿Qué factor ayuda más al interés compuesto?", options: ["El tiempo", "La suerte", "Sacar la plata seguido"], correct: 0, explanation: "Mientras más tiempo, más crece." },
      { question: "¿Dónde juega en tu contra?", options: ["En tus ahorros", "En las deudas", "En ninguna parte"], correct: 1, explanation: "Una deuda que no pagas también crece con intereses sobre intereses." },
    ],
  },
  {
    slug: "donde-guardar-tus-ahorros",
    order: 8,
    emoji: "🏦",
    title: "Dónde guardar tus ahorros",
    subtitle: "Opciones en Colombia",
    minutes: 3,
    colors: ["#FFE4D6", "#E2F5EC"],
    slides: [
      { emoji: "🛏️", title: "Debajo del colchón, no", body: "La plata en efectivo guardada en casa no crece y con la inflación pierde valor cada año. Además, se puede perder." },
      { emoji: "🏦", title: "Cuentas de ahorro", body: "Fáciles de abrir y de usar. Algunas pagan muy poco interés, así que sirven más para el día a día o el fondo de emergencia." },
      { emoji: "📈", title: "Cuentas de alto rendimiento", body: "Hay cuentas y bolsillos que pagan una tasa más alta y te dejan sacar la plata cuando quieras. Compara la tasa efectiva anual (E.A.) antes de elegir." },
      { emoji: "🔒", title: "CDT", body: "Un Certificado de Depósito a Término: dejas la plata quieta un tiempo fijo (por ejemplo, 90 o 180 días) a cambio de una tasa conocida desde el inicio. Ideal para metas con fecha." },
      { emoji: "🛡️", title: "Revisa que sea seguro", body: "Elige entidades vigiladas por la Superintendencia Financiera. Los depósitos en entidades inscritas a Fogafín tienen un seguro hasta cierto monto." },
      { emoji: "🧾", title: "Ojo con el 4x1000", body: "Algunos retiros y transferencias pagan el 4x1000. Puedes marcar una cuenta como exenta (hasta un tope) para no pagarlo en tus movimientos normales." },
    ],
    quiz: [
      { question: "¿Qué es un CDT?", options: ["Una tarjeta de crédito", "Un depósito a plazo fijo con tasa conocida", "Un tipo de préstamo"], correct: 1, explanation: "Dejas la plata un tiempo definido y recibes la tasa pactada." },
      { question: "¿Qué debes comparar entre cuentas de ahorro?", options: ["El color de la tarjeta", "La tasa efectiva anual (E.A.)", "El número de sucursales"], correct: 1, explanation: "La tasa E.A. te dice cuánto rinde realmente tu plata en un año." },
      { question: "¿Qué entidad vigila a los bancos en Colombia?", options: ["La DIAN", "La Superintendencia Financiera", "El Ministerio de Cultura"], correct: 1, explanation: "La Superfinanciera vigila a las entidades financieras." },
    ],
  },
];

export const lessonBySlug = (slug: string) => LESSONS.find((l) => l.slug === slug);
