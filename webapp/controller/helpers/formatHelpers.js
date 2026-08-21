/**
 * @file Formatter.js
 * @description Módulo de utilidades de la app SAP UI5 "gestordoccolombia".
 *
 * Acá vive toda la lógica de formato y transformación de datos que se necesita
 * para generar los documentos de RRHH (contratos en PDF y Word) para empleados colombianos.
 *
 * Se conecta con SAP SuccessFactors a través de OData y convierte los datos
 * que vienen del sistema en textos listos para insertar en las plantillas.
 *
 * Funciones principales:
 *  - convertNumberToWords  → Escribe el salario en letras (ej. "UN MILLÓN DE PESOS COLOMBIANOS")
 *  - formatDateToWords     → Fecha en formato extendido ("quince (15) días del mes de...")
 *  - formatDateToSpanish   → Fecha simple "15 de enero de 2024"
 *  - formatFechaCorta      → Fecha corta DD/MM/YYYY
 *  - formatFechaFormal     → Fecha de encabezado "15 de Enero del año 2024"
 *  - formatDateRaw         → Fecha reducida "15 de enero del año 2024"
 *  - formatSalary          → Salario con separadores "$ 4.853.000"
 *  - resolveGender         → Ajusta el género gramatical en el texto (ej. "PENSIONADO" / "PENSIONADA")
 *  - getPaisName           → Traduce el código de país de SAP o ISO al nombre completo
 *  - getSelectedUsers      → Lee la tabla de empleados, agarra las filas seleccionadas y devuelve los datos listos para usar
 */
sap.ui.define([], function () {
    "use strict";

    function capitalize(text) {
        if (!text) return "";
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    return {

        // ─────────────────────────────────────────────────────────────────────────
        // FUNCIÓN: convertNumberToWords
        //
        // Convierte un número (el salario) a su equivalente escrito en palabras,
        // tal como se exige en los contratos colombianos.
        //
        // Ejemplo: 1234 → "MIL DOSCIENTOS TREINTA Y CUATRO PESOS COLOMBIANOS"
        //
        // Cómo funciona por dentro:
        //  - Primero se redondea al entero más cercano (los salarios no llevan centavos).
        //  - Luego una función interna llamada `numToWords` se llama a sí misma de forma
        //    recursiva para ir armando el texto por rangos:
        //      < 10        → unidades ("UNO", "DOS"...)
        //      < 100       → decenas ("VEINTE Y TRES"...)
        //      < 1.000     → centenas ("DOSCIENTOS CINCUENTA"...)
        //      < 1.000.000 → miles ("CUARENTA Y DOS MIL"...)
        //      ≥ 1.000.000 → millones (para salarios integrales altos)
        // ─────────────────────────────────────────────────────────────────────────
        convertNumberToWords: function (num) {

            num = Math.round(Number(num)); // Redondear antes de convertir (sin centavos)
            if (isNaN(num) || num < 0) return "CERO PESOS COLOMBIANOS";

            // Función recursiva interna: convierte un entero a palabras
            const numToWords = (n) => {
                // Tablas con las palabras para cada rango numérico
                const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
                const decenas  = ["DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
                const centenas = ["CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

                if (n === 0) return "CERO";
                if (n < 10)  return unidades[n];

                // Decenas: "VEINTE Y TRES", "CINCUENTA Y SIETE", etc.
                if (n < 100)
                    return decenas[Math.floor(n / 10) - 1] +
                        (n % 10 !== 0 ? " Y " + unidades[n % 10] : "");

                // Centenas: "DOSCIENTOS CINCUENTA", etc.
                if (n < 1000)
                    return centenas[Math.floor(n / 100) - 1] +
                        (n % 100 !== 0 ? " " + numToWords(n % 100) : "");

                // Miles: la función se llama a sí misma para el grupo de miles
                if (n < 1000000)
                    return numToWords(Math.floor(n / 1000)) + " MIL" +
                        (n % 1000 !== 0 ? " " + numToWords(n % 1000) : "");

                // Millones: para salarios integrales altos (ej. 5.000.000)
                return numToWords(Math.floor(n / 1000000)) + " MILLONES" +
                    (n % 1000000 !== 0 ? " " + numToWords(n % 1000000) : "");
            };

            const pesos        = Math.floor(num);
            //const centavos     = Math.round((num - pesos) * 100);
            //const centavosTexto = centavos < 10 ? `0${centavos}` : `${centavos}`;

            // Arma y devuelve el texto final en el formato que va en el contrato
            return `${numToWords(pesos)} PESOS COLOMBIANOS`;
        },

        // ─────────────────────────────────────────────────────────────────────────
        // FUNCIÓN: formatDateToWords
        //
        // Convierte una fecha al formato extendido que exigen los contratos:
        // "quince (15) días del mes de enero del año dos mil veinticuatro (2024)"
        //
        // Acepta dos tipos de entrada:
        //  - Un objeto Date de SAP → usa métodos UTC para no correr el día por diferencia de zona horaria
        //  - Un string ISO "YYYY-MM-DD" → se ancla a las 12:00 del mediodía para el mismo motivo
        //
        // Por dentro usa:
        //  - `numbersToWords`: un mapa fijo con los días del 1 al 31 en palabras
        //  - `yearToWords`: una función dinámica que arma cualquier año en palabras
        //    descomponiéndolo en miles, centenas y decenas
        // ─────────────────────────────────────────────────────────────────────────
        formatDateToWords: function (date) {
            if (!date) return "";

            const months = [
                "enero", "febrero", "marzo", "abril", "mayo", "junio",
                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
            ];

            // Mapa fijo: días del mes del 1 al 31 escritos en palabras
            const numbersToWords = {
                1:"un", 2:"dos", 3:"tres", 4:"cuatro", 5:"cinco",
                6:"seis", 7:"siete", 8:"ocho", 9:"nueve", 10:"diez",
                11:"once", 12:"doce", 13:"trece", 14:"catorce", 15:"quince",
                16:"dieciséis", 17:"diecisiete", 18:"dieciocho", 19:"diecinueve",
                20:"veinte", 21:"veintiún", 22:"veintidós", 23:"veintitrés",
                24:"veinticuatro", 25:"veinticinco", 26:"veintiséis",
                27:"veintisiete", 28:"veintiocho", 29:"veintinueve",
                30:"treinta", 31:"treinta y un"
            };

            // Arma cualquier año en palabras sin depender de un mapa fijo.
            // Lo descompone en miles, centenas y decenas para construirlo pieza por pieza.
            const yearToWords = (y) => {
                const miles    = Math.floor(y / 1000);
                const centenas = Math.floor((y % 1000) / 100);
                const decenas  = y % 100;

                const unidades = ["","un","dos","tres","cuatro","cinco","seis","siete","ocho","nueve"];
                const decMap   = {
                    10:"diez", 11:"once", 12:"doce", 13:"trece", 14:"catorce",
                    15:"quince", 16:"dieciséis", 17:"diecisiete", 18:"dieciocho", 19:"diecinueve",
                    20:"veinte", 21:"veintiún", 22:"veintidós", 23:"veintitrés", 24:"veinticuatro",
                    25:"veinticinco", 26:"veintiséis", 27:"veintisiete", 28:"veintiocho", 29:"veintinueve",
                    30:"treinta", 40:"cuarenta", 50:"cincuenta", 60:"sesenta",
                    70:"setenta", 80:"ochenta", 90:"noventa"
                };
                const centMap  = {
                    1:"ciento", 2:"doscientos", 3:"trescientos", 4:"cuatrocientos",
                    5:"quinientos", 6:"seiscientos", 7:"setecientos", 8:"ochocientos", 9:"novecientos"
                };

                // Convierte el tramo de decenas y unidades del año
                const decToWords = (n) => {
                    if (n === 0) return "";
                    if (decMap[n]) return decMap[n];
                    const d = Math.floor(n / 10) * 10;
                    const u = n % 10;
                    return decMap[d] + (u ? " y " + unidades[u] : "");
                };

                // Construye el año juntando cada parte: miles → centenas → decenas
                let parts = [];
                if (miles > 1)        parts.push(unidades[miles] + " mil");
                else if (miles === 1) parts.push("mil");
                if (centenas > 0)     parts.push(centMap[centenas]);
                if (decenas > 0)      parts.push(decToWords(decenas));

                return parts.join(" ");
            };

            // Caso 1: si llega un objeto Date de SAP → leer en UTC para no perder un día
            if (date instanceof Date) {
                const day   = date.getUTCDate();
                const month = months[date.getUTCMonth()];
                const year  = date.getUTCFullYear();
                const dayText  = numbersToWords[day] || day;
                const yearText = yearToWords(year);
                return `${dayText} (${day}) días del mes de ${month} del año ${yearText} (${year})`;
            }

            // Caso 2: si llega un string ISO "YYYY-MM-DD"
            // Se ancla a las 12:00 del mediodía para que la zona horaria local no corra el día
            const oDate = new Date(date + "T12:00:00");
            const day   = oDate.getDate();
            const month = months[oDate.getMonth()];
            const year  = oDate.getFullYear();
            const dayText  = numbersToWords[day] || day;
            const yearText = yearToWords(year);
            return `${dayText} (${day}) días del mes de ${month} del año ${yearText} (${year})`;
        },

        // ─────────────────────────────────────────────────────────────────────────
        // FUNCIÓN: formatDateToSpanish
        //
        // Formato simple para fechas en documentos generales.
        // Ejemplo: "2024-01-15" → "15 de enero de 2024"
        //
        // Nota: usa la hora local del navegador (sin corrección de zona horaria),
        // lo cual está bien para fechas que no son críticas.
        // ─────────────────────────────────────────────────────────────────────────
        formatDateToSpanish: function (sDate) {
            const oDate = new Date(sDate);
            const meses = [
                "enero", "febrero", "marzo", "abril", "mayo", "junio",
                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
            ];

            return `${oDate.getDate()} de ${meses[oDate.getMonth()]} de ${oDate.getFullYear()}`;
        },

        // ─────────────────────────────────────────────────────────────────────────
        // FUNCIÓN: formatFechaCorta
        //
        // Devuelve la fecha en formato DD/MM/YYYY, como se usa en encabezados
        // y pies de página de los documentos.
        //
        // Ejemplo: "2024-01-15" → "15/01/2024"
        //
        // Manejo de zona horaria:
        //  - Si llega un objeto Date de SAP → usa métodos UTC (la fecha ya está en UTC)
        //  - Si llega un string ISO → se ancla a las 12:00 para evitar que el día corra un día
        // ─────────────────────────────────────────────────────────────────────────
        formatFechaCorta: function (fecha) {
            if (!fecha) return null;

            // Objeto Date de SAP: leer en UTC para no perder un día por zona horaria
            if (fecha instanceof Date) {
                return `${String(fecha.getUTCDate()).padStart(2, '0')}/${String(fecha.getUTCMonth() + 1).padStart(2, '0')}/${fecha.getUTCFullYear()}`;
            }

            // String ISO: anclar a mediodía antes de parsear
            const d = new Date(fecha + "T12:00:00");
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        },

        // ─────────────────────────────────────────────────────────────────────────
        // FUNCIÓN: formatFechaFormal
        //
        // Formato para encabezados de contratos y cartas oficiales.
        // Ejemplo: "2024-01-15" → "15 de Enero del año 2024"
        //
        // Tiene un comportamiento especial:
        //  - Sin parámetro → devuelve la fecha actual del sistema (la del día en que
        //    se genera el documento), útil para timbrar automáticamente.
        //  - Con objeto Date de SAP → usa UTC para evitar el desfase de zona horaria.
        //  - Con string ISO → ancla a las 12:00 del mediodía, mismo motivo.
        // ─────────────────────────────────────────────────────────────────────────
        formatFechaFormal: function (fechaInput) {
            const meses = [
                "enero", "febrero", "marzo", "abril", "mayo", "junio",
                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
            ];

            // Sin parámetro: usar la fecha de hoy
            if (!fechaInput) {
                const hoy = new Date();
                const dia  = hoy.getDate().toString().padStart(2, '0');
                const mes  = meses[hoy.getMonth()];
                const anio = hoy.getFullYear();
                return `${dia} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} del año ${anio}`;
            }

            // Objeto Date de SAP
            if (fechaInput instanceof Date) {
                const dia  = fechaInput.getUTCDate().toString().padStart(2, '0');
                const mes  = meses[fechaInput.getUTCMonth()];
                const anio = fechaInput.getUTCFullYear();
                return `${dia} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} del año ${anio}`;
            }

            // String ISO "YYYY-MM-DD"
            const d = new Date(fechaInput + "T12:00:00");
            const dia  = d.getDate().toString().padStart(2, '0');
            const mes  = meses[d.getMonth()];
            const anio = d.getFullYear();
            return `${dia} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} del año ${anio}`;
        },

        // ─────────────────────────────────────────────────────────────────────────
        // FUNCIÓN: getCiudadWork
        //
        // Devuelve la ciudad donde trabaja el empleado.
        // SAP guarda ese dato en el campo custom10; si ese campo viene vacío,
        // se cae al campo `state` como segunda opción.
        // ─────────────────────────────────────────────────────────────────────────
        getCiudadWork: function (user) {
            return user.custom10 || user.state || user.country || "";
        },

        getCiudadResidencia: function (user) {
            return user.city || user.custom10 || user.state || user.country || "";
        },

        // ─────────────────────────────────────────────────────────────────────────
        // FUNCIÓN: getLocalDate
        //
        // Devuelve la fecha de hoy en formato legible para el cuerpo del documento.
        // Ejemplo: "4 de junio del año 2026"
        //
        // Usa la hora local porque representa el momento en que se genera el documento,
        // no una fecha que viene de SAP.
        // ─────────────────────────────────────────────────────────────────────────
        getLocalDate: function () {
            const d = new Date();
            const months = ["enero","febrero","marzo","abril","mayo","junio",
                            "julio","agosto","septiembre","octubre","noviembre","diciembre"];
            return `${d.getDate()} de ${months[d.getMonth()]} del año ${d.getFullYear()}`;
        },

        // ─────────────────────────────────────────────────────────────────────────
        // FUNCIÓN: formatDateRaw
        //
        // Versión más corta del formato de fecha: "15 de enero del año 2024"
        // A diferencia de formatDateToWords, no incluye el día escrito en palabras.
        //
        // Mismo manejo de zona horaria que el resto:
        //  - Objeto Date de SAP → métodos UTC
        //  - String ISO → anclar a las 12:00
        // ─────────────────────────────────────────────────────────────────────────
        formatDateRaw: function (dateStr) {
            if (!dateStr) return "";
            const months = ["enero","febrero","marzo","abril","mayo","junio",
                            "julio","agosto","septiembre","octubre","noviembre","diciembre"];

            if (dateStr instanceof Date) {
                return `${dateStr.getUTCDate()} de ${months[dateStr.getUTCMonth()]} del año ${dateStr.getUTCFullYear()}`;
            }

            const d = new Date(dateStr + "T12:00:00");
            return `${d.getDate()} de ${months[d.getMonth()]} del año ${d.getFullYear()}`;
        },

        // ─────────────────────────────────────────────────────────────────────────
        // FUNCIÓN: formatSalary
        //
        // Formatea un número de salario con separadores de miles y el símbolo de moneda,
        // usando la localización colombiana ("es-CO") que usa puntos como separador de miles.
        //
        // Ejemplo: 4853000 → "$ 4.853.000"
        // ─────────────────────────────────────────────────────────────────────────
        formatSalary: function (value) {
            if (!value) return "";
            return "$ " + Math.round(Number(value)).toLocaleString("es-CO");
        },

        // ─────────────────────────────────────────────────────────────────────────
        // FUNCIÓN: resolveGender
        //
        // Ajusta el género gramatical de un texto de plantilla.
        // Las plantillas usan la convención {A} para marcar la terminación femenina.
        //
        // Ejemplos:
        //  "PENSIONADO{A}" + "F" → "PENSIONADA"
        //  "PENSIONADO{A}" + "M" → "PENSIONADO"
        //
        // Esto permite tener un solo texto base en la plantilla para ambos géneros,
        // sin duplicar contenido.
        // ─────────────────────────────────────────────────────────────────────────
        resolveGender: function (text, gender) {
            if (!text) return "";
            const isFemale = gender === "F";
            // Si es femenino: reemplaza {A} por "A"; si es masculino: lo elimina
            return text.replace(/\{A\}/g, isFemale ? "A" : "").trim();
        },

        // ─────────────────────────────────────────────────────────────────────────
        // FUNCIÓN: getPaisName
        //
        // Traduce un código de país a su nombre completo.
        // SAP SuccessFactors puede manejar dos sistemas de códigos distintos:
        //
        //  1. SAP_CODES: códigos numéricos internos de SAP (ej. "39" → "Colombia")
        //  2. PAISES_ISO: códigos estándar internacionales alpha-3 (ej. "COL" → "Colombia")
        //
        // Primero intenta con el código SAP; si no lo encuentra, prueba con el ISO.
        // Si tampoco lo encuentra, devuelve el código tal como llegó.
        // ─────────────────────────────────────────────────────────────────────────
        getPaisName: function (countryCode) {

            // Códigos numéricos internos de SAP → nombre del país
            const SAP_CODES = {
                "1":   "Afganistán",
                "2":   "Albania",
                "3":   "Alemania",
                "4":   "Algeria",
                "5":   "Andorra",
                "6":   "Angola",
                "7":   "Antigua y Barbuda",
                "8":   "Arabia Saudita",
                "9":   "Argentina",
                "10":  "Armenia",
                "11":  "Australia",
                "12":  "Austria",
                "13":  "Azerbaiyán",
                "14":  "Bahamas",
                "15":  "Bahrein",
                "16":  "Bangladesh",
                "17":  "Barbados",
                "18":  "Bélgica",
                "19":  "Belice",
                "20":  "Benín",
                "21":  "Bielorrusia",
                "22":  "Bolivia",
                "23":  "Bosnia y Herzegovina",
                "24":  "Botsuana",
                "25":  "Brasil",
                "26":  "Brunéi",
                "27":  "Bulgaria",
                "28":  "Burkina Faso",
                "29":  "Burundi",
                "30":  "Bután",
                "31":  "Cabo Verde",
                "32":  "Camboya",
                "33":  "Camerún",
                "34":  "Canadá",
                "35":  "Chad",
                "36":  "Chile",
                "37":  "China",
                "38":  "Chipre",
                "39":  "Colombia",
                "40":  "Comoras",
                "41":  "Congo",
                "42":  "Corea del Norte",
                "43":  "Corea del Sur",
                "44":  "Costa Rica",
                "45":  "Croacia",
                "46":  "Cuba",
                "47":  "Dinamarca",
                "48":  "Dominica",
                "49":  "Ecuador",
                "50":  "Egipto",
                "51":  "El Salvador",
                "52":  "Emiratos Árabes Unidos",
                "53":  "Eritrea",
                "54":  "Eslovaquia",
                "55":  "Eslovenia",
                "56":  "España",
                "57":  "Estados Unidos",
                "58":  "Estonia",
                "59":  "Etiopía",
                "60":  "Filipinas",
                "61":  "Finlandia",
                "62":  "Fiyi",
                "63":  "Francia",
                "64":  "Gabón",
                "65":  "Gambia",
                "66":  "Georgia",
                "67":  "Ghana",
                "68":  "Granada",
                "69":  "Grecia",
                "70":  "Guatemala",
                "71":  "Guinea",
                "72":  "Guinea Ecuatorial",
                "73":  "Guinea-Bisáu",
                "74":  "Guyana",
                "75":  "Haití",
                "76":  "Honduras",
                "77":  "Hungría",
                "78":  "India",
                "79":  "Indonesia",
                "80":  "Irak",
                "81":  "Irán",
                "82":  "Irlanda",
                "83":  "Islandia",
                "84":  "Islas Marshall",
                "85":  "Islas Salomón",
                "86":  "Israel",
                "87":  "Colombia",
                "88":  "Italia",
                "89":  "Jamaica",
                "90":  "Japón",
                "91":  "Jordania",
                "92":  "Kazajistán",
                "93":  "Kenia",
                "94":  "Kirguistán",
                "95":  "Kiribati",
                "96":  "Kuwait",
                "97":  "Laos",
                "98":  "Lesoto",
                "99":  "Letonia",
                "100": "Líbano",
                "101": "Liberia",
                "102": "Libia",
                "103": "Liechtenstein",
                "104": "Lituania",
                "105": "Luxemburgo",
                "106": "Madagascar",
                "107": "Malasia",
                "108": "Malaui",
                "109": "Maldivas",
                "110": "Malí",
                "111": "Malta",
                "112": "Marruecos",
                "113": "Mauricio",
                "114": "Mauritania",
                "115": "México",
                "116": "Micronesia",
                "117": "Moldavia",
                "118": "Mónaco",
                "119": "Mongolia",
                "120": "Montenegro",
                "121": "Mozambique",
                "122": "Myanmar",
                "123": "Namibia",
                "124": "Nauru",
                "125": "Nepal",
                "126": "Nicaragua",
                "127": "Níger",
                "128": "Nigeria",
                "129": "Noruega",
                "130": "Nueva Zelanda",
                "131": "Omán",
                "132": "Países Bajos",
                "133": "Pakistán",
                "134": "Palaos",
                "135": "Palestina",
                "136": "Panamá",
                "137": "Papúa Nueva Guinea",
                "138": "Paraguay",
                "139": "Perú",
                "140": "Polonia",
                "141": "Portugal",
                "142": "Qatar",
                "143": "Reino Unido",
                "144": "República Centroafricana",
                "145": "República Checa",
                "146": "República Dominicana",
                "147": "República del Congo",
                "148": "Ruanda",
                "149": "Rumania",
                "150": "Rusia",
                "151": "Samoa",
                "152": "San Cristóbal y Nieves",
                "153": "San Marino",
                "154": "San Vicente y las Granadinas",
                "155": "Santa Lucía",
                "156": "Santo Tomé y Príncipe",
                "157": "Senegal",
                "158": "Serbia",
                "159": "Seychelles",
                "160": "Sierra Leona",
                "161": "Singapur",
                "162": "Siria",
                "163": "Somalia",
                "164": "Sri Lanka",
                "165": "Suazilandia",
                "166": "Sudáfrica",
                "167": "Sudán",
                "168": "Suecia",
                "169": "Suiza",
                "170": "Surinam",
                "171": "Tailandia",
                "172": "Tanzania",
                "173": "Tayikistán",
                "174": "Timor Oriental",
                "175": "Togo",
                "176": "Tonga",
                "177": "Trinidad y Tobago",
                "178": "Túnez",
                "179": "Turkmenistán",
                "180": "Turquía",
                "181": "Tuvalu",
                "182": "Ucrania",
                "183": "Uganda",
                "184": "Uruguay",
                "185": "Uzbekistán",
                "186": "Vanuatu",
                "187": "Venezuela",
                "188": "Vietnam",
                "189": "Yemen",
                "190": "Yibuti",
                "191": "Zambia",
                "192": "Zimbabue"
            };

            // Códigos ISO 3166-1 alpha-3 → nombre del país
            // Incluye los países que aparecen con más frecuencia en la nómina colombiana
            const PAISES_ISO = {
                "COL": "Colombia", "VEN": "Venezuela", "ECU": "Ecuador",
                "PER": "Perú",     "MEX": "México",    "ARG": "Argentina",
                "CHL": "Chile",    "USA": "Estados Unidos", "ESP": "España",
                "BRA": "Brasil",   "PAN": "Panamá",    "CRI": "Costa Rica",
                "BOL": "Bolivia",  "PRY": "Paraguay",  "URY": "Uruguay",
                "CUB": "Cuba",     "DOM": "República Dominicana"
            };

            // Orden de prioridad: código SAP numérico → código ISO → el valor original como último recurso
            return SAP_CODES[String(countryCode)] || PAISES_ISO[countryCode] || countryCode || "";
        },

        // ─────────────────────────────────────────────────────────────────────────
        // Helpers simples: acceso directo a campos del objeto usuario.
        // Se usan dentro de getSelectedUsers para estandarizar los datos antes de
        // pasarlos a las plantillas.
        // ─────────────────────────────────────────────────────────────────────────

        // Teléfono de trabajo; cadena vacía si el campo no existe en SAP
        getTelefono: function (user) {
            return user.businessPhone || "";
        },

        getEmail: function (user) {
            return user.email || "";
        },

        getNacionalidad: function (user) {
            return capitalize(user.nationality || "");
        },

        // Sexo en texto legible ("Femenino" / "Masculino") a partir del código SAP
        getSexo: function (user) {
            return user.gender === "F" ? "Femenino" : "Masculino";
        },

        // Estado civil del empleado (campo estándar de SuccessFactors)
        getEstadoCivil: function (user) {
            return capitalize(user.maritalStatus || "");
        },

        // Grupo sanguíneo del empleado
        getGrupoSanguineo: function (user) {
            return user.bloodType || "";
        },

        // ─────────────────────────────────────────────────────────────────────────
        // FUNCIÓN: getSelectedUsers
        //
        // Es la función principal del módulo y el punto de entrada para generar documentos.
        // Lee la tabla "idUserTable" de la vista SAP UI5, toma las filas que el usuario
        // seleccionó y devuelve un array con todos los datos ya formateados, listos para
        // reemplazar los placeholders en las plantillas Word y PDF.
        //
        // El flujo es:
        //  1. Obtener la tabla de la vista.
        //  2. Leer los ítems seleccionados (puede ser uno o varios empleados).
        //  3. Por cada fila, acceder al contexto de datos OData.
        //  4. Extraer cada campo con getProp() y aplicar los formatters del módulo.
        //  5. Devolver el array de objetos con todo listo para las plantillas.
        //
        // Los campos custom (custom02, custom03, custom10) son campos configurables
        // en SAP SuccessFactors que el cliente usa para guardar datos propios de su
        // negocio, como la dirección o la ciudad de trabajo del empleado.
        // ─────────────────────────────────────────────────────────────────────────
        getSelectedUsers: function () {
            var oTable = this.getView().byId("idUserTable");

            // Verificar que la tabla existe antes de continuar
            if (!oTable) {
                console.error("La tabla idUserTable no fue encontrada.");
                return [];
            }

            // Mapa completo de gentilicios por código de país ISO 3166-1 alpha-3.
            // Se usa para construir frases como "de nacionalidad colombiana" en los contratos.
            const GENTILICIOS = {"ABW": "arubeña", "AFG": "afgana", "AGO": "angoleña", "AIA": "anguillana", "ALA": "alandesa", "ALB": "albanesa", "AND": "andorrana", "ANT": "antillana", "ARE": "emiratí", "ARG": "argentina", "ARM": "armenia", "ASM": "samoana", "ATA": "antártica", "ATF": "francesa", "ATG": "antiguana", "AUS": "australiana", "AUT": "austríaca", "AZE": "azerbaiyana", "BDI": "burundesa", "BEL": "belga", "BEN": "beninesa", "BFA": "burkinesa", "BGD": "bangladesí", "BGR": "búlgara", "BHR": "bareiní", "BHS": "bahamesa", "BIH": "bosnia", "BLM": "bartoleña", "BLR": "bielorrusa", "BLZ": "beliceña", "BMU": "bermudense", "BOL": "boliviana", "BRA": "brasileña", "BRB": "barbadense", "BRN": "bruneana", "BTN": "butanesa", "BVT": "bouvetina", "BWA": "botsuana", "CAF": "centroafricana", "CAN": "canadiense", "CCK": "cocosense", "CHE": "suiza", "CHL": "chilena", "CHN": "china", "CIV": "marfileña", "CMR": "camerunesa", "COD": "congoleña", "COG": "congoleña", "COK": "cookiana", "COL": "colombiana", "COM": "comorense", "CPV": "caboverdiana", "CRI": "costarricense", "CUB": "cubana", "CXR": "navideña", "CYM": "caimanesa", "CYP": "chipriota", "CZE": "checa", "DEU": "alemana", "DJI": "yibutiana", "DMA": "dominiqueña", "DNK": "danesa", "DOM": "dominicana", "DZA": "argelina", "ECU": "ecuatoriana", "EGY": "egipcia", "ERI": "eritrea", "ESH": "saharaui", "ESP": "española", "EST": "estonia", "ETH": "etíope", "FIN": "finlandesa", "FJI": "fiyiana", "FLK": "malvinense", "FRA": "francesa", "FRO": "feroense", "FSM": "micronesia", "GAB": "gabonesa", "GBR": "británica", "GEO": "georgiana", "GGY": "guerneseyana", "GHA": "ghana", "GIB": "gibraltareña", "GIN": "guineana", "GLP": "guadalupense", "GMB": "gambiana", "GNB": "bisauguineana", "GNQ": "ecuatoguineana", "GRC": "griega", "GRD": "granadina", "GRL": "groenlandesa", "GTM": "guatemalteca", "GUF": "guayanesa", "GUM": "guameña", "GUY": "guyanesa", "HKG": "hongkonesa", "HMD": "heardense", "HND": "hondureña", "HRV": "croata", "HTI": "haitiana", "HUN": "húngara", "IDN": "indonesia", "IMN": "manesa", "IND": "india", "IOT": "británica", "IRL": "irlandesa", "IRN": "iraní", "IRQ": "iraquí", "ISL": "islandesa", "ISR": "israelí", "ITA": "italiana", "JAM": "jamaicana", "JEY": "jerseyana", "JOR": "jordana", "JPN": "japonesa", "KAZ": "kazaja", "KEN": "keniana", "KGZ": "kirguisa", "KHM": "camboyana", "KIR": "kiribatiana", "KNA": "kittiana", "KOR": "coreana", "KWT": "kuwaití", "LAO": "laosiana", "LBN": "libanesa", "LBR": "liberiana", "LBY": "libia", "LCA": "santalucense", "LIE": "liechtensteiniana", "LKA": "ceilanesa", "LSO": "lesotense", "LTU": "lituana", "LUX": "luxemburguesa", "LVA": "letona", "MAC": "macaense", "MAF": "sanmartinense", "MAR": "marroquí", "MCO": "monaguesca", "MDA": "moldava", "MDG": "malgache", "MDV": "maldiva", "MEX": "mexicana", "MHL": "marshallesa", "MKD": "macedonia", "MLI": "maliense", "MLT": "maltesa", "MMR": "birmana", "MNE": "montenegrina", "MNG": "mongola", "MNP": "marianense", "MOZ": "mozambiqueña", "MRT": "mauritana", "MSR": "montserratense", "MTQ": "martiniqueña", "MUS": "mauriciana", "MWI": "malauí", "MYS": "malasia", "MYT": "mahoreña", "NAM": "namibia", "NCL": "neocaledonia", "NER": "nigerina", "NFK": "norfolkense", "NGA": "nigeriana", "NIC": "nicaragüense", "NIU": "niuana", "NLD": "neerlandesa", "NOR": "noruega", "NPL": "nepalí", "NRU": "nauruana", "NZL": "neozelandesa", "OMN": "omaní", "PAK": "paquistaní", "PAN": "panameña", "PCN": "pitcairnesa", "PER": "peruana", "PHL": "filipina", "PLW": "palauana", "PNG": "papú", "POL": "polaca", "PRI": "puertorriqueña", "PRK": "surcoreana", "PRT": "portuguesa", "PRY": "paraguaya", "PSE": "palestina", "PYF": "polinesia", "QAT": "qatarí", "REU": "reunionense", "ROU": "rumana", "RUS": "rusa", "RWA": "ruandesa", "SAU": "saudí", "SDN": "sudanesa", "SEN": "senegalesa", "SGP": "singapurense", "SGS": "surgeorgiana", "SHN": "santalenense", "SJM": "svalbardense", "SLB": "salomonense", "SLE": "sierraleonesa", "SLV": "salvadoreña", "SMR": "sanmarinense", "SOM": "somalí", "SPM": "miquelonesa", "SRB": "serbia", "STP": "santotomense", "SUR": "surinamesa", "SVK": "eslovaca", "SVN": "eslovena", "SWE": "sueca", "SWZ": "suazilandesa", "SYC": "seychellense", "SYR": "siría", "TCA": "turcocaiqueña", "TCD": "chadiana", "TGO": "iraní", "THA": "tailandesa", "TJK": "tayika", "TKL": "tokelauana", "TKM": "turcomana", "TLS": "timorense", "TON": "tongana", "TTO": "trinitense", "TUN": "tunecina", "TUR": "turca", "TUV": "tuvaluana", "TWN": "taiwanesa", "TZA": "tanzana", "UGA": "ugandesa", "UKR": "ucraniana", "UMI": "estadounidense", "URY": "uruguaya", "USA": "estadounidense", "UZB": "uzbeka", "VAT": "vaticana", "VCT": "vicentina", "VEN": "venezolana", "VGB": "británica", "VIR": "virgenense", "VNM": "vietnamita", "VUT": "vanuatuense", "WLF": "wallisiana", "WSM": "samoana", "YEM": "yemení", "ZAF": "sudafricana", "ZMB": "zambiana", "ZWE": "zimbabuense" };

            // La tabla solo conoce los items actualmente renderizados. Con filtros y
            // growing, un colaborador seleccionado puede dejar de estar visible aunque
            // siga seleccionado lógicamente. La fuente confiable es el array mantenido
            // por onSelectionChange; se conserva el fallback por compatibilidad.
            var aSelectedUsers = Array.isArray(this.aSelectedEmployees) &&
                this.aSelectedEmployees.length > 0
                ? this.aSelectedEmployees
                : oTable.getSelectedItems()
                    .map(oItem => oItem.getBindingContext("view")?.getObject())
                    .filter(Boolean);

            // Si no hay colaboradores seleccionados, devolver array vacío sin tirar error
            if (aSelectedUsers.length === 0) {
                return [];
            }

            // Por cada colaborador seleccionado, armar el objeto para las plantillas.
            return aSelectedUsers.map(oSelectedUser => {
                // Admite las rutas anidadas que antes se leían desde el BindingContext.
                const getProp = path => path.split("/").reduce(
                    (value, key) => value == null ? undefined : value[key],
                    oSelectedUser
                );

                // Resolver el gentilicio desde el código de país de nacionalidad
                const countryCode = getProp("nationalityCode");
                const gentilicio  = GENTILICIOS[countryCode] || countryCode;

                // ─────────────────────────────────────────────────────────────
                // Objeto de retorno: todos los campos ya formateados,
                // listos para reemplazar los placeholders [[Campo]] en
                // las plantillas Word y PDF de los contratos HR.
                //
                // Algunos campos usan navegación OData expandida, por ejemplo:
                //   "empInfo/jobInfoNav/results/0/eventReason"
                // Esto significa que SAP cargó entidades relacionadas mediante
                // $expand en la consulta, y acá simplemente las recorremos
                // para llegar al campo que necesitamos.
                // ─────────────────────────────────────────────────────────────
                return {
                    // Identificación básica del empleado
                    userId:         getProp("userId"),
                    firstName:      getProp("firstName"),
                    lastName:       getProp("lastName"),
                    secondLastName: getProp("empInfo/personNav/personalInfoNav/results/0/secondLastName") || "",
                    nationalId:     getProp("nationalId"),          // Número de cédula
                    salut:          getProp("salut"),               // Tratamiento (Sr./Sra.)
                    gender:         getProp("gender"),              // Código SAP: "M" / "F"

                    // Contacto
                    email:          getProp("email"),
                    businessPhone:  getProp("businessPhone"),

                    // Nacionalidad y ubicación
                    nationality:    capitalize(gentilicio),    // Ej: "Colombiana"
                    country:        this.getPaisName(getProp("country")),
                    state:          getProp("state"),
                    city:             getProp("city") || "",
                    ciudadResidencia: getProp("city") || getProp("custom10") || getProp("state") || getProp("country") || "",

                    // Cargo y estructura organizacional
                    title:          (getProp("jobCode") || "").replace(/\s*\(\d+\)$/, ""),    // Cargo sin el código numérico SAP al final
                    position:       (getProp("jobCode") || "").replace(/\s*\(\d+\)$/, ""),
                    department:     (getProp("department") || "").replace(/\s*\(\d+\)$/, ""),
                    division:       (getProp("division") || "").replace(/\s?\(.*\)/, ""),
                    planta:         getProp("planta") || "",
                    area:           getProp("area")   || "",
                    eventReason:    getProp("empInfo/jobInfoNav/results/0/eventReason"),       // Razón del evento laboral

                    // Fechas formateadas: formatDateToWords produce el formato extendido que va en contratos
                    hireDate:                   this.formatDateToWords(getProp("hireDate")),
                    hireDatesimpl:              getProp("hireDate"),                            // Fecha sin formatear (valor crudo)
                    hireDateRaw:                getProp("empInfo/startDate"),
                    HireDatePost:               getProp("HireDatePost"),
                    originalStartDate:          getProp("empInfo/originalStartDate"),
                    originalStartDateFormatted: this.formatDateToWords(getProp("empInfo/originalStartDate")),
                    endDate:                    getProp("empInfo/endDate"),
                    endDateFormated:            this.formatDateToWords(getProp("empInfo/endDate")),
                    
                    customDate01:               this.formatDateToWords(getProp("empInfo/customDate1")),

                    // Salario: valor numérico para cálculos + texto en palabras para el contrato
                    paycompvalue:     getProp("paycompValue"),
                    payCompValueWord: this.convertNumberToWords(getProp("paycompValue")),

                    // Datos personales adicionales
                    maritalStatus: getProp("marriageStatus"),
                    bloodType:     getProp("bloodType") || "",
                    dateOfBirth:   getProp("dateOfBirth") || null,

                    // Dirección (custom03 es el campo de dirección configurado por este cliente en SAP)
                    address:      getProp("custom03") || "",
                    addressLine1: getProp("addressLine1") || "",
                    custom02:     getProp("custom02"),
                    custom03:     getProp("custom03"),              // Dirección del empleado

                    // Documento de identidad
                    docCardType:        getProp("docCardType") || "",
                    docExpeditionDate:  this.formatDateRaw(getProp("docExpeditionDate")),
                    docExpeditionCity: getProp("docExpeditionCity") || "",

                    // Jefe directo (datos del manager, obtenidos por navegación OData)
                    managerName:   getProp("managerName")  || "",
                    managerEmail:  getProp("managerEmail") || "",
                    managerNav:    getProp("managerUserNav"),
                    positionSup:   (getProp("manager/jobCode") || "").replace(/\s*\(\d+\)$/, ""),
                    TelefonoSup:   (getProp("manager/businessPhone") || "").replace(/(.*)x(.*)/, "($2) $1"),
                    CorreoTrabajoSup: getProp("manager/email"),

                    // Frecuencia de pago (obtenida vía $expand en OData: payGroupNav/paymentFrequencyFONav)
                    paymentFrequency: getProp("paymentFrequency") || "",

                    // Contacto personal  ← NUEVO
                    personalEmail: getProp("personalEmail") || "",
                    personalPhone: getProp("personalPhone") || "",

                    // Documento de identidad
                    docCardType:       getProp("docCardType") || "",
                    docExpeditionDate: this.formatDateRaw(getProp("docExpeditionDate")),
                    ciudadFirma:      getProp("ciudadFirma") || "",  // ← NUEVO

                    // Fecha de baja (disponible en inactivos; null en activos)  ← NUEVO
                    endDateBaja:          getProp("endDateBaja") || null,
                    endDateBajaFormatted: this.formatDateToWords(getProp("endDateBaja")),  // ← NUEVO

                    // Empresa (CO10 = Diaco, CO24 = Cyrgo)
                    company:     getProp("company") || "",
                    companyName: { "CO10": "Diaco S.A.", "CO24": "Cyrgo S.A." }[getProp("company")] || getProp("company") || "",
                        
                    // HRBP del empleado (obtenido vía $expand en OData: hrbpNav)
                    hrbpName: getProp("hrbpName") || "",

                    
                };
            });
        }

    };
});