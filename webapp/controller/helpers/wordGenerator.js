/**
 * @file wordGenerator.js
 * @description Helper central para la generación de documentos Word (.docx)
 *              a partir de plantillas con placeholders del tipo [[Campo]].
 *
 * Estrategia técnica:
 *  Un archivo .docx es en realidad un ZIP que contiene XMLs internos.
 *  Este módulo descarga la plantilla, la descomprime con JSZip, reemplaza
 *  los placeholders [[Campo]] en los XMLs relevantes, y vuelve a empaquetar
 *  el archivo para descargarlo en el navegador.
 *
 * Funciones exportadas:
 *  - generateWord(config) → función pública principal
 *
 * Funciones internas (privadas):
 *  - _replaceVariables(xml, variables) → orquesta el reemplazo de placeholders
 *  - _cleanProofErr(xml)               → une runs XML fragmentados por el corrector de Word
 *  - _escapeRegex(c)                   → escapa caracteres especiales para RegExp
 *  - _escXml(str)                      → escapa caracteres especiales para XML
 *  - _ensureJSZip()                    → carga JSZip dinámicamente si no está disponible
 *
 * Placeholders soportados (formato [[NombreCampo]] en la plantilla Word):
 *  Datos personales, contacto, laboral, salarial, fechas y lugar.
 *  Ver el mapa `variables` dentro de generateWord para la lista completa.
 */
sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    /**
     * Función pública principal del módulo.
     * Toma una plantilla .docx, reemplaza los [[placeholders]] con los datos
     * del empleado y descarga el archivo resultante en el navegador.
     *
     * @param {object} config
     * @param {string} config.templatePath  - Ruta relativa a la plantilla .docx (ej: "pdf/Contrato.docx")
     * @param {string} config.fileName      - Nombre del archivo descargado (ej: "Juan_Perez_Contrato.docx")
     * @param {object} [config.data={}]     - Objeto con los datos del empleado ya formateados
     *                                        (viene de getSelectedUsers en Formatter.js)
     */
    async function generateWord(config) {
        const { templatePath, fileName, data = {} } = config;

        // ── Paso 1: Asegurar que JSZip esté disponible ─────────────────────────
        // JSZip se carga dinámicamente (lazy) para no afectar el tiempo de inicio
        // de la app. Si ya está en window, se reutiliza sin volver a cargarlo.
        const JSZip = await _ensureJSZip();

        // ── Paso 2: Descargar la plantilla .docx y descomprimirla ───────────────
        // Un .docx es un ZIP: se carga como ArrayBuffer y se abre con JSZip
        // para acceder a sus archivos XML internos.
        const templateBytes = await fetch(templatePath).then(res => {
            if (!res.ok) throw new Error(`No se pudo cargar ${templatePath} (${res.status})`);
            return res.arrayBuffer();
        });
        const zip = await JSZip.loadAsync(templateBytes);

        // ── Paso 3: Definir el mapa de placeholders → valores ──────────────────
        // Cada clave es el placeholder exacto que aparece en la plantilla Word.
        // Cada valor es el dato del empleado ya formateado.
        //
        // Los checkboxes usan ☑ / ☐ según el tipo de documento del empleado
        // (CC, CE, TI, RC), obtenido del campo docCardType en SAP.
        //
        // [[CiudadFecha]] combina ciudad y fecha en una sola expresión,
        // por ejemplo: "Bogotá, 15 de junio del año 2026"
        const variables = {
            // ── Datos personales ──────────────────────────────────────────────
            "[[Nombre]]":          data.sNombre          || "",
            "[[Cedula]]":          data.sCedula           || "",
            "[[FechaNacimiento]]": data.sFechaNacimiento  || "",
            "[[Sexo]]":            data.sSexo             || "",
            "[[EstadoCivil]]":     data.sEstadoCivil      || "",
            "[[GrupoSanguineo]]":  data.sGrupoSangre      || "",
            "[[Nacionalidad]]":    data.sNacional         || "",
            "[[Pais]]":            data.sPais             || "",
            "[[DocCardType]]":     data.sDocCardType      || "",

            // Checkboxes del tipo de documento: marcado (☑) o vacío (☐) según SAP
            "[[CheckCC]]": data.sDocCardType === "CC" ? "☑" : "☐",
            "[[CheckCE]]": data.sDocCardType === "CE" ? "☑" : "☐",
            "[[CheckTI]]": data.sDocCardType === "TI" ? "☑" : "☐",
            "[[CheckRC]]": data.sDocCardType === "RC" ? "☑" : "☐",

            "[[FechaExpedicion]]": data.sFechaExpedicion  || "",

            // sIdentif y sIdentificado son alias del mismo campo (distintas plantillas usan distintos nombres)
            "[[Identificado]]":    data.sIdentif || data.sIdentificado || "",

            // ── Contacto ─────────────────────────────────────────────────────
            "[[Email]]":     data.sEmail     || "",
            "[[Telefono]]":  data.sTelefono  || "",
            "[[Direccion]]": data.sDireccion || "",

            // ── Datos laborales ──────────────────────────────────────────────
            "[[Cargo]]":             data.sCargo             || "",
            "[[CiudadWork]]":        data.sCiudadWork        || "",  // Ciudad de trabajo (custom10 en SAP)
            "[[Planta]]":            data.sPlanta            || "",
            "[[Area]]":              data.sArea              || "",
            "[[JefeNombre]]":        data.sJefeNombre        || "",
            "[[Institucion]]":       data.sInstitucion       || "",
            "[[FechaIngreso]]":      data.sIngreso           || "",
            "[[FechaSalida]]":       data.sSalida            || "",

            // Alias: sFechaContratacion y sfechaContratacion (distintas plantillas, distinto case)
            "[[FechaContratacion]]": data.sFechaContratacion || data.sfechaContratacion || "",

            // ── Datos salariales ─────────────────────────────────────────────
            "[[Salario]]":                  data.sSalario                || "",
            "[[SalarioLetras]]":            data.sSalarioLetras          || "",  // Ej: "CUATRO MILLONES PESOS COLOMBIANOS"
            "[[SalarioenLetras]]":          data.sSalarioLetras          || "",  // Alias para plantillas que usan este nombre
            "[[PeriodoPago]]":              data.sPeriodoPago            || "",  // Mensual / Quincenal
            "[[ComponenteRemunerativo]]":   data.sCompRemunerativo       || "",  // Para contratos de salario integral
            "[[CompRemunerativoLetras]]":   data.sCompRemunerativoLetras || "",
            "[[FactorPrestacional]]":       data.sFactorPrestacional     || "",
            "[[FactorPrestacionalLetras]]": data.sFactorPrestacionalLetras || "",

            // ── Fecha y lugar del documento ──────────────────────────────────
            "[[Fecha]]":     data.localDate     || "",
            "[[FechaLarga]]": data.localDateLong || "",
            "[[FechaCert]]": data.localDate     || "",  // Alias para certificados laborales

            // Combina ciudad + fecha en un solo placeholder:
            // "Bogotá, 15 de junio del año 2026"
            "[[CiudadFecha]]": data.sCiudadWork
                ? `${data.sCiudadWork}, ${data.localDate}`
                : (data.localDate || ""),

            "[[CiudadFirma]]": data.sCiudadWork || "",  // Solo la ciudad, sin fecha
        };

        // ── Paso 4: Reemplazar placeholders en los XMLs internos del .docx ─────
        // Un .docx puede tener placeholders en el cuerpo, encabezados y pies de página.
        // Se procesan todos los archivos relevantes para cubrir todos los casos.
        const targets = [
            "word/document.xml",  // Cuerpo principal del documento
            "word/header1.xml",   // Encabezado (primera página o sección 1)
            "word/header2.xml",   // Encabezado (resto de páginas)
            "word/footer1.xml",   // Pie de página (primera página o sección 1)
            "word/footer2.xml"    // Pie de página (resto de páginas)
        ];

        for (const path of targets) {
            if (!zip.files[path]) continue; // Algunas plantillas no tienen todos los archivos
            let xml = await zip.files[path].async("string");
            xml = _replaceVariables(xml, variables); // Aplicar el reemplazo
            zip.file(path, xml); // Guardar el XML modificado de vuelta en el ZIP
        }

        // ── Paso 5: Reempaquetar el ZIP y descargar el .docx ───────────────────
        const blob = await zip.generateAsync({ type: "blob" });
        console.log("Tamaño del blob:", blob.size, "bytes");

        // Crear un enlace temporal para forzar la descarga del archivo en el navegador
        const link = document.createElement("a");
        link.href     = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href); // Liberar la memoria del objeto URL

        MessageToast.show("Documento Word generado correctamente.");
    }

    // ════════════════════════════════════════════════════════════════════════════
    // FUNCIONES PRIVADAS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Orquesta el reemplazo de placeholders en un XML de Word.
     *
     * El problema principal: Word divide los placeholders en múltiples "runs" XML
     * al escribir la plantilla (por el corrector ortográfico, cambios de formato,
     * autoguardado, etc.). Por ejemplo, [[Nombre]] puede quedar en el XML así:
     *
     *   <w:t>[[Nom</w:t></w:r><w:proofErr/><w:r><w:t>bre]]</w:t>
     *
     * Solución en dos pasos:
     *  1. _cleanProofErr: une los runs fragmentados por w:proofErr
     *  2. Reemplazo directo del placeholder completo
     *  3. Reemplazo con regex por si quedaron tags XML inline entre caracteres
     *
     * @param {string} xml        - Contenido XML del archivo interno del .docx
     * @param {object} variables  - Mapa { "[[Placeholder]]": "valor" }
     * @returns {string} XML con los placeholders reemplazados
     */
    function _replaceVariables(xml, variables) {
        // Paso 1: limpiar w:proofErr que fragmentan los placeholders entre runs
        xml = _cleanProofErr(xml);

        for (const [key, value] of Object.entries(variables)) {
            const escaped = _escXml(value); // Escapar caracteres XML especiales en el valor

            // Paso 2: reemplazo directo — cubre variables completas y las ya unidas por _cleanProofErr
            xml = xml.split(key).join(escaped);

            // Paso 3: reemplazo con regex por si quedan tags XML inline entre los caracteres
            // del placeholder (ej: [[No<w:rPr/>mbre]] → busca cada letra con tags opcionales entre ellas)
            const inner       = key.slice(2, -2); // Extraer "Nombre" de "[[Nombre]]"
            const anyXmlInline = "(?:<[^>]*>)*";  // Patrón para ignorar cualquier tag XML entre caracteres
            const bracketOpen  = "\\[\\[" + anyXmlInline;
            const bracketClose = anyXmlInline + "\\]\\]";
            const innerPattern = inner.split("").map(c => _escapeRegex(c) + anyXmlInline).join("");
            const pattern = bracketOpen + innerPattern + bracketClose;
            xml = xml.replace(new RegExp(pattern, "g"), escaped);

            // Debug: verificar si "Ciudad de trabajo" aparece en el XML (ayuda a diagnosticar problemas de tabla)
            const idx4 = xml.indexOf("Ciudad de trabajo");
            if (idx4 !== -1) {
                console.log("CONTEXTO tabla completa:", xml.substring(idx4 - 1000, idx4 + 500));
            }
        }
        return xml;
    }

    /**
     * Une runs XML separados por w:proofErr cuando juntos forman parte de un placeholder.
     *
     * Word inserta etiquetas <w:proofErr> (marcadores del corrector ortográfico) entre
     * los runs de texto, lo que fragmenta los placeholders [[Campo]] y los hace
     * irreconocibles para un reemplazo simple de string.
     *
     * Este método los detecta con una regex y los une en un solo <w:t> combinado,
     * pero solo cuando el texto combinado contiene "[" o "]" (es decir, forma parte
     * de un placeholder). Los runs sin relación con placeholders no se tocan.
     *
     * Se repite en un bucle hasta que no haya más cambios, para cubrir casos
     * donde haya múltiples w:proofErr seguidos fragmentando el mismo placeholder.
     *
     * @param {string} xml - XML del archivo interno del .docx
     * @returns {string}   - XML con runs unidos donde corresponde
     */
    function _cleanProofErr(xml) {
        let prev;
        do {
            prev = xml;
            xml = xml.replace(
                // Regex que detecta: <w:t>texto1</w:t></w:r> + <w:proofErr/> + <w:r><w:rPr>...</w:rPr><w:t>texto2</w:t>
                /<w:t([^>]*)>([^<]*)<\/w:t><\/w:r>(?:<w:proofErr[^>]*\/>|<w:proofErr[^>]*><\/w:proofErr>)<w:r(?:[^>]*)><w:rPr>[\s\S]*?<\/w:rPr><w:t([^>]*)>([^<]*)<\/w:t>/g,
                function(match, attr1, text1, attr2, text2) {
                    const combined = text1 + text2;
                    // Solo unir si el texto combinado contiene parte de un placeholder
                    if (combined.includes("[") || combined.includes("]")) {
                        return `<w:t xml:space="preserve">${combined}</w:t>`;
                    }
                    return match; // No es un placeholder: dejar el XML original sin cambios
                }
            );
        } while (xml !== prev); // Repetir hasta que no haya más fragmentos que unir
        return xml;
    }

    /**
     * Escapa los caracteres especiales de una cadena para usarla en una RegExp.
     * Necesario porque los placeholders contienen corchetes [[ ]] que son
     * metacaracteres en expresiones regulares.
     *
     * @param {string} c - Carácter a escapar
     * @returns {string}
     */
    function _escapeRegex(c) {
        return c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    /**
     * Escapa caracteres reservados de XML para que los valores del empleado
     * no rompan el XML interno del .docx al insertarse.
     *
     * Ejemplo: si el nombre fuera "Juan & María <Pérez>", sin escapar
     * el XML resultante sería inválido y Word no podría abrir el archivo.
     *
     * @param {string} str - Valor a insertar en el XML
     * @returns {string}   - Valor con caracteres XML escapados
     */
    function _escXml(str) {
        return String(str)
            .replace(/&/g, "&amp;")   // & debe ser lo primero para no re-escapar los demás
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    /**
     * Carga JSZip dinámicamente desde CDN si aún no está disponible en window.
     *
     * JSZip es necesario para descomprimir el .docx (que internamente es un ZIP).
     * Se carga de forma lazy para no incluirlo en el bundle principal de la app
     * y solo consumir la descarga cuando el usuario realmente genera un Word.
     *
     * @returns {Promise<JSZip>} - La librería JSZip lista para usar
     */
    function _ensureJSZip() {
        // Si ya fue cargado en una generación anterior, reutilizarlo directamente
        if (window.JSZip) return Promise.resolve(window.JSZip);

        // Si no está disponible, inyectar el script desde CDN y esperar a que cargue
        return new Promise((resolve, reject) => {
            const script   = document.createElement("script");
            script.src     = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload  = () => resolve(window.JSZip);
            script.onerror = () => reject(new Error("No se pudo cargar JSZip."));
            document.head.appendChild(script);
        });
    }

    // Solo se exporta generateWord; las funciones privadas no son accesibles desde afuera
    return { generateWord };
});