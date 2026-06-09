sap.ui.define([], function () {
    "use strict";

    return {

        // Convierte un número (salario) a palabras en formato colombiano.
        // Ejemplo: 1234.56 → "MIL DOSCIENTOS TREINTA Y CUATRO PESOS COLOMBIANOS CON 56/100"
        convertNumberToWords: function (num) {
            
           num = Math.round(Number(num) * 100) / 100; // redondear a 2 decimales antes de separar
                if (isNaN(num) || num < 0) return "CERO PESOS COLOMBIANOS CON 00/100";

            const numToWords = (n) => {
                const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
                const decenas  = ["DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
                const centenas = ["CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

                if (n === 0) return "CERO";
                if (n < 10)  return unidades[n];
                if (n < 100)
                    return decenas[Math.floor(n / 10) - 1] +
                        (n % 10 !== 0 ? " Y " + unidades[n % 10] : "");
                if (n < 1000)
                    return centenas[Math.floor(n / 100) - 1] +
                        (n % 100 !== 0 ? " " + numToWords(n % 100) : "");
                if (n < 1000000)
                    return numToWords(Math.floor(n / 1000)) + " MIL" +
                        (n % 1000 !== 0 ? " " + numToWords(n % 1000) : "");
                // Millones — soporte para salarios integrales altos
                return numToWords(Math.floor(n / 1000000)) + " MILLONES" +
                    (n % 1000000 !== 0 ? " " + numToWords(n % 1000000) : "");
            };

            const pesos        = Math.floor(num);
            const centavos     = Math.round((num - pesos) * 100);
            const centavosTexto = centavos < 10 ? `0${centavos}` : `${centavos}`;

            return `${numToWords(pesos)} PESOS COLOMBIANOS CON ${centavosTexto}/100`;
        },

        // Convierte una fecha a un formato extendido:
        // Ejemplo: "2024-01-15" → "quince (15) días del mes de enero del año dos mil veinticuatro (2024)"
        formatDateToWords: function (date) {
            if (!date) return "";

            const months = [
                "enero", "febrero", "marzo", "abril", "mayo", "junio",
                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
            ];

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

            // Convierte cualquier año a palabras sin depender de un mapa fijo
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

                const decToWords = (n) => {
                    if (n === 0) return "";
                    if (decMap[n]) return decMap[n];
                    const d = Math.floor(n / 10) * 10;
                    const u = n % 10;
                    return decMap[d] + (u ? " y " + unidades[u] : "");
                };

                let parts = [];
                if (miles > 1)      parts.push(unidades[miles] + " mil");
                else if (miles === 1) parts.push("mil");

                if (centenas > 0)   parts.push(centMap[centenas]);
                if (decenas > 0)    parts.push(decToWords(decenas));

                return parts.join(" ");
            };

            // Acepta Date de SAP (objeto) o string ISO
            let oDate;
            if (date instanceof Date) {
                oDate = date;
                const day   = oDate.getUTCDate();
                const month = months[oDate.getUTCMonth()];
                const year  = oDate.getUTCFullYear();
                const dayText  = numbersToWords[day] || day;
                const yearText = yearToWords(year);
                return `${dayText} (${day}) días del mes de ${month} del año ${yearText} (${year})`;
            }

            oDate = new Date(date + "T12:00:00");
            const day   = oDate.getDate();
            const month = months[oDate.getMonth()];
            const year  = oDate.getFullYear();
            const dayText  = numbersToWords[day] || day;
            const yearText = yearToWords(year);
            return `${dayText} (${day}) días del mes de ${month} del año ${yearText} (${year})`;
        },

        // Convierte una fecha al formato: "15 de enero de 2024"
        formatDateToSpanish: function (sDate) {
            const oDate = new Date(sDate);
            const meses = [
                "enero", "febrero", "marzo", "abril", "mayo", "junio",
                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
            ];

            return `${oDate.getDate()} de ${meses[oDate.getMonth()]} de ${oDate.getFullYear()}`;
        },

        // Formato corto DD/MM/YYYY
        // Usa UTC para evitar desfase de timezone con fechas de SAP
        formatFechaCorta: function (fecha) {
            if (!fecha) return null;
            if (fecha instanceof Date) {
                return `${String(fecha.getUTCDate()).padStart(2, '0')}/${String(fecha.getUTCMonth() + 1).padStart(2, '0')}/${fecha.getUTCFullYear()}`;
            }
            const d = new Date(fecha + "T12:00:00");
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        },

        // Formato formal: "15 de Enero del año 2024"
        // Usa UTC para evitar desfase de timezone con fechas de SAP
        formatFechaFormal: function (fechaInput) {
            const meses = [
                "enero", "febrero", "marzo", "abril", "mayo", "junio",
                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
            ];

            if (!fechaInput) {
                // Fecha actual: usar hora local (es la hora del usuario)
                const hoy = new Date();
                const dia  = hoy.getDate().toString().padStart(2, '0');
                const mes  = meses[hoy.getMonth()];
                const anio = hoy.getFullYear();
                return `${dia} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} del año ${anio}`;
            }

            if (fechaInput instanceof Date) {
                const dia  = fechaInput.getUTCDate().toString().padStart(2, '0');
                const mes  = meses[fechaInput.getUTCMonth()];
                const anio = fechaInput.getUTCFullYear();
                return `${dia} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} del año ${anio}`;
            }

            // String ISO "YYYY-MM-DD": anclar al mediodía para neutralizar timezone
            const d = new Date(fechaInput + "T12:00:00");
            const dia  = d.getDate().toString().padStart(2, '0');
            const mes  = meses[d.getMonth()];
            const anio = d.getFullYear();
            return `${dia} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} del año ${anio}`;
        },

        // Ciudad de trabajo: custom10 tiene la ciudad, con fallback a state
        getCiudadWork: function (user) {
            return user.custom10 || user.state || "";
        },

        // Fecha actual formateada: "4 de junio del año 2026"
        // Usa hora local porque es la fecha del documento (no viene de SAP)
        getLocalDate: function () {
            const d = new Date();
            const months = ["enero","febrero","marzo","abril","mayo","junio",
                            "julio","agosto","septiembre","octubre","noviembre","diciembre"];
            return `${d.getDate()} de ${months[d.getMonth()]} del año ${d.getFullYear()}`;
        },

        // Fecha desde string ISO o Date de SAP: "2024-01-15" → "15 de enero del año 2024"
        // - Date de SAP  → getUTC* (ya está desplazada por timezone)
        // - String ISO   → anclar a T12:00:00 para neutralizar timezone
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

        // Salario formateado: 4853000 → "$ 4.853.000"
        formatSalary: function (value) {
            if (!value) return "";
            return "$ " + Number(value).toLocaleString("es-CO");
        },

        // Resuelve género en texto con placeholder {A}
        // Ejemplo: "PENSIONADO{A}" → "PENSIONADA" (mujer) o "PENSIONADO" (hombre)
        resolveGender: function (text, gender) {
            if (!text) return "";
            const isFemale = gender === "F";
            return text.replace(/\{A\}/g, isFemale ? "A" : "").trim();
        },

        getPaisName: function (countryCode) {
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

            const PAISES_ISO = {
                "COL": "Colombia", "VEN": "Venezuela", "ECU": "Ecuador",
                "PER": "Perú",     "MEX": "México",    "ARG": "Argentina",
                "CHL": "Chile",    "USA": "Estados Unidos", "ESP": "España",
                "BRA": "Brasil",   "PAN": "Panamá",    "CRI": "Costa Rica",
                "BOL": "Bolivia",  "PRY": "Paraguay",  "URY": "Uruguay",
                "CUB": "Cuba",     "DOM": "República Dominicana"
            };

            return SAP_CODES[String(countryCode)] || PAISES_ISO[countryCode] || countryCode || "";
        },

        // Obtiene el teléfono de trabajo, con fallback a cadena vacía si no existe
        getTelefono: function (user) {
            return user.businessPhone || "";
        },

        getEmail: function (user) {
            return user.email || "";
        },

        getNacionalidad: function (user) {
            return user.nationality || "";
        },

        getSexo: function (user) {
            return user.gender === "F" ? "Femenino" : "Masculino";
        },

        getEstadoCivil: function (user) {
            return user.maritalStatus || "";
        },

        getGrupoSanguineo: function (user) {
            return user.bloodType || "";
        },

        // =====================================================================================
        // Obtiene los usuarios seleccionados en la tabla idUserTable y devuelve
        // un array de objetos con todos los datos necesarios para los documentos.
        // =====================================================================================
        getSelectedUsers: function () {
            var oTable = this.getView().byId("idUserTable");

            if (!oTable) {
                console.error("La tabla idUserTable no fue encontrada.");
                return [];
            }

            // Gran mapa de gentilicios según código de país
            const GENTILICIOS = {"ABW": "arubeña", "AFG": "afgana", "AGO": "angoleña", "AIA": "anguillana", "ALA": "alandesa", "ALB": "albanesa", "AND": "andorrana", "ANT": "antillana", "ARE": "emiratí", "ARG": "argentina", "ARM": "armenia", "ASM": "samoana", "ATA": "antártica", "ATF": "francesa", "ATG": "antiguana", "AUS": "australiana", "AUT": "austríaca", "AZE": "azerbaiyana", "BDI": "burundesa", "BEL": "belga", "BEN": "beninesa", "BFA": "burkinesa", "BGD": "bangladesí", "BGR": "búlgara", "BHR": "bareiní", "BHS": "bahamesa", "BIH": "bosnia", "BLM": "bartoleña", "BLR": "bielorrusa", "BLZ": "beliceña", "BMU": "bermudense", "BOL": "boliviana", "BRA": "brasileña", "BRB": "barbadense", "BRN": "bruneana", "BTN": "butanesa", "BVT": "bouvetina", "BWA": "botsuana", "CAF": "centroafricana", "CAN": "canadiense", "CCK": "cocosense", "CHE": "suiza", "CHL": "chilena", "CHN": "china", "CIV": "marfileña", "CMR": "camerunesa", "COD": "congoleña", "COG": "congoleña", "COK": "cookiana", "COL": "colombiana", "COM": "comorense", "CPV": "caboverdiana", "CRI": "costarricense", "CUB": "cubana", "CXR": "navideña", "CYM": "caimanesa", "CYP": "chipriota", "CZE": "checa", "DEU": "alemana", "DJI": "yibutiana", "DMA": "dominiqueña", "DNK": "danesa", "DOM": "dominicana", "DZA": "argelina", "ECU": "ecuatoriana", "EGY": "egipcia", "ERI": "eritrea", "ESH": "saharaui", "ESP": "española", "EST": "estonia", "ETH": "etíope", "FIN": "finlandesa", "FJI": "fiyiana", "FLK": "malvinense", "FRA": "francesa", "FRO": "feroense", "FSM": "micronesia", "GAB": "gabonesa", "GBR": "británica", "GEO": "georgiana", "GGY": "guerneseyana", "GHA": "ghana", "GIB": "gibraltareña", "GIN": "guineana", "GLP": "guadalupense", "GMB": "gambiana", "GNB": "bisauguineana", "GNQ": "ecuatoguineana", "GRC": "griega", "GRD": "granadina", "GRL": "groenlandesa", "GTM": "guatemalteca", "GUF": "guayanesa", "GUM": "guameña", "GUY": "guyanesa", "HKG": "hongkonesa", "HMD": "heardense", "HND": "hondureña", "HRV": "croata", "HTI": "haitiana", "HUN": "húngara", "IDN": "indonesia", "IMN": "manesa", "IND": "india", "IOT": "británica", "IRL": "irlandesa", "IRN": "iraní", "IRQ": "iraquí", "ISL": "islandesa", "ISR": "israelí", "ITA": "italiana", "JAM": "jamaicana", "JEY": "jerseyana", "JOR": "jordana", "JPN": "japonesa", "KAZ": "kazaja", "KEN": "keniana", "KGZ": "kirguisa", "KHM": "camboyana", "KIR": "kiribatiana", "KNA": "kittiana", "KOR": "coreana", "KWT": "kuwaití", "LAO": "laosiana", "LBN": "libanesa", "LBR": "liberiana", "LBY": "libia", "LCA": "santalucense", "LIE": "liechtensteiniana", "LKA": "ceilanesa", "LSO": "lesotense", "LTU": "lituana", "LUX": "luxemburguesa", "LVA": "letona", "MAC": "macaense", "MAF": "sanmartinense", "MAR": "marroquí", "MCO": "monaguesca", "MDA": "moldava", "MDG": "malgache", "MDV": "maldiva", "MEX": "mexicana", "MHL": "marshallesa", "MKD": "macedonia", "MLI": "maliense", "MLT": "maltesa", "MMR": "birmana", "MNE": "montenegrina", "MNG": "mongola", "MNP": "marianense", "MOZ": "mozambiqueña", "MRT": "mauritana", "MSR": "montserratense", "MTQ": "martiniqueña", "MUS": "mauriciana", "MWI": "malauí", "MYS": "malasia", "MYT": "mahoreña", "NAM": "namibia", "NCL": "neocaledonia", "NER": "nigerina", "NFK": "norfolkense", "NGA": "nigeriana", "NIC": "nicaragüense", "NIU": "niuana", "NLD": "neerlandesa", "NOR": "noruega", "NPL": "nepalí", "NRU": "nauruana", "NZL": "neozelandesa", "OMN": "omaní", "PAK": "paquistaní", "PAN": "panameña", "PCN": "pitcairnesa", "PER": "peruana", "PHL": "filipina", "PLW": "palauana", "PNG": "papú", "POL": "polaca", "PRI": "puertorriqueña", "PRK": "surcoreana", "PRT": "portuguesa", "PRY": "paraguaya", "PSE": "palestina", "PYF": "polinesia", "QAT": "qatarí", "REU": "reunionense", "ROU": "rumana", "RUS": "rusa", "RWA": "ruandesa", "SAU": "saudí", "SDN": "sudanesa", "SEN": "senegalesa", "SGP": "singapurense", "SGS": "surgeorgiana", "SHN": "santalenense", "SJM": "svalbardense", "SLB": "salomonense", "SLE": "sierraleonesa", "SLV": "salvadoreña", "SMR": "sanmarinense", "SOM": "somalí", "SPM": "miquelonesa", "SRB": "serbia", "STP": "santotomense", "SUR": "surinamesa", "SVK": "eslovaca", "SVN": "eslovena", "SWE": "sueca", "SWZ": "suazilandesa", "SYC": "seychellense", "SYR": "siría", "TCA": "turcocaiqueña", "TCD": "chadiana", "TGO": "iraní", "THA": "tailandesa", "TJK": "tayika", "TKL": "tokelauana", "TKM": "turcomana", "TLS": "timorense", "TON": "tongana", "TTO": "trinitense", "TUN": "tunecina", "TUR": "turca", "TUV": "tuvaluana", "TWN": "taiwanesa", "TZA": "tanzana", "UGA": "ugandesa", "UKR": "ucraniana", "UMI": "estadounidense", "URY": "uruguaya", "USA": "estadounidense", "UZB": "uzbeka", "VAT": "vaticana", "VCT": "vicentina", "VEN": "venezolana", "VGB": "británica", "VIR": "virgenense", "VNM": "vietnamita", "VUT": "vanuatuense", "WLF": "wallisiana", "WSM": "samoana", "YEM": "yemení", "ZAF": "sudafricana", "ZMB": "zambiana", "ZWE": "zimbabuense" }; 

            var aSelectedItems = oTable.getSelectedItems();
            if (aSelectedItems.length === 0) {
                return [];
            }

            // Mapear cada fila seleccionada a un objeto con información del empleado
            return aSelectedItems.map(oItem => {
                const oContext = oItem.getBindingContext("view");
                if (!oContext) {
                    console.warn("No se encontró el contexto de datos para el elemento seleccionado.");
                    return null;
                }

                // Función para simplificar llamadas a oContext.getProperty
                const getProp = path => oContext.getProperty(path);

                // Obtener nacionalidad/gentilicio
                const countryCode = getProp("nationalityCode");
                const gentilicio = GENTILICIOS[countryCode] || countryCode;
                

                // Devuelve todos los datos listos para insertarse en las plantillas .docx
                return {
                    userId: getProp("userId"),
                    firstName: getProp("firstName"),
                    lastName: getProp("lastName"),
                    secondLastName: getProp("empInfo/personNav/personalInfoNav/results/0/secondLastName") || "",
                    email: getProp("email"),
                    nationality: gentilicio,
                    title: (getProp("jobCode") || "").replace(/\s*\(\d+\)$/, ""),
                    custom02: getProp("custom02"),
                    customDate01: this.formatDateToWords(getProp("empInfo/customDate1")),
                    businessPhone: getProp("businessPhone"),
                    state: getProp("state"),
                    custom10: getProp("custom10"),
                    country: this.getPaisName(getProp("country")),
                    eventReason: getProp("empInfo/jobInfoNav/results/0/eventReason"),
                    hireDate: this.formatDateToWords(getProp("hireDate")),
                    hireDatesimpl: getProp("hireDate"),
                    hireDateRaw: getProp("empInfo/startDate"),
                    HireDatePost: getProp("HireDatePost"),
                    originalStartDate: getProp("empInfo/originalStartDate"),
                    originalStartDateFormatted: this.formatDateToWords(getProp("empInfo/originalStartDate")),
                    hireDateExt: this.formatDateToWords(getProp("empInfo/endDate")),
                    paycompvalue: getProp("paycompValue"),
                    payCompValueWord: this.convertNumberToWords(getProp("paycompValue")),
                    nationalId: getProp("nationalId"),
                    maritalStatus: getProp("marriageStatus"),
                    salut: getProp("salut"),
                    endDate: getProp("empInfo/endDate"),
                    endDateFormated: this.formatDateToWords(getProp("empInfo/endDate")),
                    department: (getProp("department") || "").replace(/\s*\(\d+\)$/, ""),
                    division: (getProp("division") || "").replace(/\s?\(.*\)/, ""),
                    custom03: getProp("custom03"),
                    position: (getProp("jobCode") || "").replace(/\s*\(\d+\)$/, ""),
                    positionSup: (getProp("manager/jobCode") || "").replace(/\s*\(\d+\)$/, ""),
                    TelefonoSup: (getProp("manager/businessPhone") || "").replace(/(.*)x(.*)/, "($2) $1"),
                    CorreoTrabajoSup: getProp("manager/email"),
                    gender:    getProp("gender"),
                    address:   getProp("custom03") || "",
                    bloodType: getProp("bloodType") || "",
                    dateOfBirth: getProp("dateOfBirth") || null,
                    addressLine1:       getProp("addressLine1") || "",
                    docExpeditionDate:  this.formatDateRaw(getProp("docExpeditionDate")),
                    managerName:  getProp("managerName")  || "",
                    managerEmail: getProp("managerEmail") || "",
                    managerNav:   getProp("managerUserNav"),
                    docCardType: getProp("docCardType") || "",
                    getCiudadWork: function (user) {
                        return user.custom10 || user.state || user.country || "";
                    },
                    
                };
            });
        }


    };
});
