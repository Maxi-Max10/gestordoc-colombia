sap.ui.define([], function () {
    "use strict";

    return {


        // =====================================================================================
        // Convierte un número (salario) a palabras siguiendo formato dominicano.
        // Ejemplo: 1234.56 → "MIL DOSCIENTOS TREINTA Y CUATRO PESOS DOMINICANOS CON 56/100"
        // =====================================================================================
        convertNumberToWords: function (num) {
            if (isNaN(num) || num < 0) return "CERO PESOS DOMINICANOS CON 00/100";

            // Formateador para valores en moneda
            const formatter = new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "DOP",
                minimumFractionDigits: 2,
            });

            // Conversión recursiva de números a palabras
            const numToWords = (n) => {
                const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
                const decenas = ["DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
                const centenas = ["CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

                if (n === 0) return "CERO";
                if (n < 10) return unidades[n];
                if (n < 100)
                    return decenas[Math.floor(n / 10) - 1] +
                        (n % 10 !== 0 ? " Y " + unidades[n % 10] : "");
                if (n < 1000)
                    return centenas[Math.floor(n / 100) - 1] +
                        (n % 100 !== 0 ? " " + numToWords(n % 100) : "");
                if (n < 1000000)
                    return numToWords(Math.floor(n / 1000)) + " MIL " +
                        (n % 1000 !== 0 ? numToWords(n % 1000) : "");

                return formatter.format(n).toUpperCase(); // para números muy grandes
            };

            // Separa pesos y centavos
            let pesos = Math.floor(num);
            let centavos = Math.round((num - pesos) * 100);
            let centavosTexto = centavos < 10 ? `0${centavos}` : centavos;

            return `${numToWords(pesos)} PESOS DOMINICANOS CON ${centavosTexto}/100`;
        },

        // =====================================================================================
        // Convierte una fecha a un formato extendido:
        // Ejemplo: "2024-01-15" → "quince (15) días del mes de enero del año dos mil veinticuatro (2024)"
        // =====================================================================================
        formatDateToWords: function (date) {
            if (!date) return "";

            const months = [
                "enero", "febrero", "marzo", "abril", "mayo", "junio",
                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
            ];

            // Texto en palabras para días
            const numbersToWords = {
                1: "un", 2: "dos", 3: "tres", 4: "cuatro", 5: "cinco",
                6: "seis", 7: "siete", 8: "ocho", 9: "nueve", 10: "diez",
                11: "once", 12: "doce", 13: "trece", 14: "catorce", 15: "quince",
                16: "dieciséis", 17: "diecisiete", 18: "dieciocho", 19: "diecinueve",
                20: "veinte", 21: "veintiún", 22: "veintidós", 23: "veintitrés", 
                24: "veinticuatro", 25: "veinticinco", 26: "veintiséis",
                27: "veintisiete", 28: "veintiocho", 29: "veintinueve",
                30: "treinta", 31: "treinta y un"
            };

            // Palabras para años
            const yearWords = {
                2020: "dos mil veinte", 2021: "dos mil veintiuno", 2022: "dos mil veintidós",
                2023: "dos mil veintitrés", 2024: "dos mil veinticuatro",
                2025: "dos mil veinticinco", 2026: "dos mil veintiséis",
                2028: "dos mil veintiocho", 2029: "dos mil veintinueve"
            };

            let oDate = new Date(date);
            let day = oDate.getDate();
            let month = months[oDate.getMonth()];
            let year = oDate.getFullYear();

            let dayText = numbersToWords[day] || day;
            let yearText = yearWords[year] || year;

            return `${dayText} (${day}) días del mes de ${month} del año ${yearText} (${year})`;
        },

        // =====================================================================================
        // Convierte una fecha al formato: "15 de enero de 2024"
        // =====================================================================================
        formatDateToSpanish: function (sDate) {
            const oDate = new Date(sDate);
            const meses = [
                "enero", "febrero", "marzo", "abril", "mayo", "junio",
                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
            ];

            return `${oDate.getDate()} de ${meses[oDate.getMonth()]} de ${oDate.getFullYear()}`;
        },

        // =====================================================================================
        // Formato corto DD/MM/YYYY
        // Se corrige desfase sumando 1 día (tema común en SAP)
        // =====================================================================================
        formatFechaCorta: function (fecha) {
            if (!fecha) return null;
            const d = new Date(fecha);
            d.setDate(d.getDate() + 1);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        },

        // =====================================================================================
        // Formato formal: "15 de Enero del año 2024"
        // =====================================================================================
        formatFechaFormal: function (fechaInput) {
            const meses = [
                "enero", "febrero", "marzo", "abril", "mayo", "junio",
                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
            ];

            let fecha = !fechaInput ? new Date() :
                        typeof fechaInput === "string" ? new Date(fechaInput) :
                        fechaInput;

            const dia = fecha.getDate().toString().padStart(2, '0');
            const mes = meses[fecha.getMonth()];
            const anio = fecha.getFullYear();

            return `${dia} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} del año ${anio}`;
        },

        // =====================================================================================
        // Ciudad de trabajo: custom10 tiene la ciudad, con fallback a state
        // =====================================================================================
        getCiudadWork: function (user) {
            return user.custom10 || user.state || "";
        },

        // =====================================================================================
        // Fecha actual formateada: "4 de junio del año 2026"
        // =====================================================================================
        getLocalDate: function () {
            const d = new Date();
            const months = ["enero","febrero","marzo","abril","mayo","junio",
                            "julio","agosto","septiembre","octubre","noviembre","diciembre"];
            return `${d.getDate()} de ${months[d.getMonth()]} del año ${d.getFullYear()}`;
        },

        // =====================================================================================
        // Fecha desde string ISO: "2024-01-15" → "15 de enero del año 2024"
        // Agrega T12:00:00 para evitar desfase de timezone
        // =====================================================================================
        formatDateRaw: function (dateStr) {
            if (!dateStr) return "";
            const d = dateStr instanceof Date ? dateStr : new Date(dateStr + "T12:00:00");
            const months = ["enero","febrero","marzo","abril","mayo","junio",
                            "julio","agosto","septiembre","octubre","noviembre","diciembre"];
            return `${d.getDate()} de ${months[d.getMonth()]} del año ${d.getFullYear()}`;
        },

        // =====================================================================================
        // Salario formateado: 4853000 → "$ 4.853.000"
        // =====================================================================================
        formatSalary: function (value) {
            if (!value) return "";
            return "$ " + Number(value).toLocaleString("es-CO");
        },

        // =====================================================================================
        // Resuelve género en texto con placeholder {A}
        // Ejemplo: "PENSIONADO{A}" → "PENSIONADA" (mujer) o "PENSIONADO" (hombre)
        // =====================================================================================
        resolveGender: function (text, gender) {
            if (!text) return "";
            const isFemale = gender === "F";
            return text.replace(/\{A\}/g, isFemale ? "A" : "").trim();
        },

        //Helper para obtener el nombre del país a partir del código, con un mapa predefinido
        getPaisName: function (countryCode) {
            const PAISES = {
                "COL": "Colombia",
                "VEN": "Venezuela",
                "ECU": "Ecuador",
                "PER": "Perú",
                "MEX": "México",
                "ARG": "Argentina",
                "CHL": "Chile",
                "USA": "Estados Unidos",
                "ESP": "España"
                // agregás los que necesites
            };
            return PAISES[countryCode] || countryCode || "";
        },

        // =====================================================================================
        // Obtiene el teléfono de trabajo, con fallback a cadena vacía si no existe
        // =====================================================================================
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
                const countryCode = getProp("empInfo/personNav/nationalIdNav/results/0/country");
                const gentilicio = GENTILICIOS[countryCode] || countryCode;

                console.log(
                    "customString10:", getProp("empInfo/personNav/personalInfoNav/results/0/customString10"),
                    "personalInfoNav/0:", getProp("empInfo/personNav/personalInfoNav/results/0")
                );

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
                    country: getProp("country"),
                    eventReason: getProp("empInfo/jobInfoNav/results/0/eventReason"),
                    hireDate: this.formatDateToWords(getProp("hireDate")),
                    hireDatesimpl: getProp("hireDate"),
                    hireDateRaw: getProp("empInfo/startDate"),
                    HireDatePost: getProp("HireDatePost"),
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
                    bloodType: getProp("empInfo/personNav/personalInfoNav/results/0/customString10") || "",
                };
            });
        }


    };
});
