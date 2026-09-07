/**
 * Lista de trabajo CIE-10 para el buscador de diagnósticos. La base de datos no
 * tiene (todavía) un catálogo CIE-10 propio, así que el módulo trae los códigos
 * de uso más frecuente en consulta ambulatoria en Perú y además permite
 * registrar un código escrito a mano cuando no aparece en la lista.
 */
export type Cie10 = { codigo: string; descripcion: string; sinonimos?: string };

export const CIE10: Cie10[] = [
  { codigo: "A09.X", descripcion: "Diarrea y gastroenteritis de presunto origen infeccioso", sinonimos: "diarrea eda gastroenteritis" },
  { codigo: "B34.9", descripcion: "Infección viral no especificada", sinonimos: "virosis viral" },
  { codigo: "E03.9", descripcion: "Hipotiroidismo no especificado", sinonimos: "tiroides hipotiroidismo" },
  { codigo: "E05.9", descripcion: "Tirotoxicosis (hipertiroidismo) no especificada", sinonimos: "hipertiroidismo" },
  { codigo: "E11.9", descripcion: "Diabetes mellitus tipo 2 sin complicaciones", sinonimos: "diabetes dm2" },
  { codigo: "E11.6", descripcion: "Diabetes mellitus tipo 2 con otras complicaciones especificadas", sinonimos: "diabetes complicada" },
  { codigo: "E66.9", descripcion: "Obesidad no especificada", sinonimos: "obesidad" },
  { codigo: "E78.5", descripcion: "Hiperlipidemia no especificada", sinonimos: "dislipidemia colesterol trigliceridos" },
  { codigo: "E86.X", descripcion: "Depleción del volumen (deshidratación)", sinonimos: "deshidratacion" },
  { codigo: "F32.9", descripcion: "Episodio depresivo no especificado", sinonimos: "depresion" },
  { codigo: "F41.1", descripcion: "Trastorno de ansiedad generalizada", sinonimos: "ansiedad" },
  { codigo: "F51.0", descripcion: "Insomnio no orgánico", sinonimos: "insomnio sueño" },
  { codigo: "G43.9", descripcion: "Migraña no especificada", sinonimos: "migraña jaqueca" },
  { codigo: "G44.2", descripcion: "Cefalea tensional", sinonimos: "cefalea dolor de cabeza" },
  { codigo: "H10.9", descripcion: "Conjuntivitis no especificada", sinonimos: "conjuntivitis ojo rojo" },
  { codigo: "H66.9", descripcion: "Otitis media no especificada", sinonimos: "otitis oido" },
  { codigo: "I10.X", descripcion: "Hipertensión esencial (primaria)", sinonimos: "hta hipertension presion alta" },
  { codigo: "I25.9", descripcion: "Enfermedad isquémica crónica del corazón", sinonimos: "cardiopatia isquemica coronaria" },
  { codigo: "I48.X", descripcion: "Fibrilación y aleteo auricular", sinonimos: "fibrilacion auricular fa" },
  { codigo: "I50.9", descripcion: "Insuficiencia cardíaca no especificada", sinonimos: "falla cardiaca icc" },
  { codigo: "I83.9", descripcion: "Várices de miembros inferiores sin úlcera ni inflamación", sinonimos: "varices" },
  { codigo: "J00.X", descripcion: "Rinofaringitis aguda (resfriado común)", sinonimos: "resfrio resfriado gripe" },
  { codigo: "J02.9", descripcion: "Faringitis aguda no especificada", sinonimos: "faringitis dolor de garganta" },
  { codigo: "J03.9", descripcion: "Amigdalitis aguda no especificada", sinonimos: "amigdalitis" },
  { codigo: "J06.9", descripcion: "Infección aguda de las vías respiratorias superiores", sinonimos: "ira ivrs" },
  { codigo: "J18.9", descripcion: "Neumonía no especificada", sinonimos: "neumonia" },
  { codigo: "J20.9", descripcion: "Bronquitis aguda no especificada", sinonimos: "bronquitis" },
  { codigo: "J30.4", descripcion: "Rinitis alérgica no especificada", sinonimos: "rinitis alergia" },
  { codigo: "J45.9", descripcion: "Asma no especificada", sinonimos: "asma" },
  { codigo: "J44.9", descripcion: "Enfermedad pulmonar obstructiva crónica", sinonimos: "epoc" },
  { codigo: "K21.0", descripcion: "Enfermedad por reflujo gastroesofágico con esofagitis", sinonimos: "reflujo erge" },
  { codigo: "K29.7", descripcion: "Gastritis no especificada", sinonimos: "gastritis" },
  { codigo: "K30.X", descripcion: "Dispepsia", sinonimos: "dispepsia" },
  { codigo: "K59.0", descripcion: "Estreñimiento", sinonimos: "constipacion estreñimiento" },
  { codigo: "K80.2", descripcion: "Cálculo de la vesícula biliar sin colecistitis", sinonimos: "colelitiasis calculos vesicula" },
  { codigo: "L20.9", descripcion: "Dermatitis atópica no especificada", sinonimos: "dermatitis eczema" },
  { codigo: "L30.9", descripcion: "Dermatitis no especificada", sinonimos: "dermatitis" },
  { codigo: "M10.9", descripcion: "Gota no especificada", sinonimos: "gota acido urico" },
  { codigo: "M15.9", descripcion: "Poliartrosis no especificada", sinonimos: "artrosis" },
  { codigo: "M54.5", descripcion: "Lumbago no especificado", sinonimos: "lumbalgia dolor lumbar" },
  { codigo: "M54.2", descripcion: "Cervicalgia", sinonimos: "cervicalgia dolor cervical" },
  { codigo: "M79.1", descripcion: "Mialgia", sinonimos: "mialgia dolor muscular" },
  { codigo: "N39.0", descripcion: "Infección de vías urinarias, sitio no especificado", sinonimos: "itu infeccion urinaria" },
  { codigo: "N20.0", descripcion: "Cálculo del riñón", sinonimos: "litiasis renal calculo" },
  { codigo: "N18.9", descripcion: "Enfermedad renal crónica no especificada", sinonimos: "erc insuficiencia renal" },
  { codigo: "N40.X", descripcion: "Hiperplasia de la próstata", sinonimos: "prostata hbp" },
  { codigo: "N76.0", descripcion: "Vaginitis aguda", sinonimos: "vaginitis flujo" },
  { codigo: "O21.0", descripcion: "Hiperemesis gravídica leve", sinonimos: "vomitos embarazo" },
  { codigo: "Z34.9", descripcion: "Supervisión de embarazo normal no especificado", sinonimos: "control prenatal embarazo" },
  { codigo: "R10.4", descripcion: "Dolor abdominal no especificado", sinonimos: "dolor abdominal" },
  { codigo: "R42.X", descripcion: "Mareo y desvanecimiento", sinonimos: "mareo vertigo" },
  { codigo: "R50.9", descripcion: "Fiebre no especificada", sinonimos: "fiebre sindrome febril" },
  { codigo: "R51.X", descripcion: "Cefalea", sinonimos: "cefalea" },
  { codigo: "R53.X", descripcion: "Malestar y fatiga", sinonimos: "fatiga astenia" },
  { codigo: "D50.9", descripcion: "Anemia por deficiencia de hierro no especificada", sinonimos: "anemia ferropenica" },
  { codigo: "Z00.0", descripcion: "Examen médico general", sinonimos: "chequeo examen preventivo" },
  { codigo: "Z01.7", descripcion: "Examen de laboratorio", sinonimos: "laboratorio control" },
  { codigo: "Z02.0", descripcion: "Examen para admisión a institución educativa", sinonimos: "certificado escolar" },
  { codigo: "Z76.0", descripcion: "Consulta para repetir receta", sinonimos: "receta control cronico" },
];

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function buscarCie10(termino: string, limite = 8): Cie10[] {
  const q = normalizar(termino.trim());
  if (!q) return [];
  return CIE10.filter((d) => {
    const heno = normalizar(`${d.codigo} ${d.descripcion} ${d.sinonimos ?? ""}`);
    return heno.includes(q);
  }).slice(0, limite);
}
