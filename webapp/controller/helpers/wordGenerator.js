/**
 * @file wordGenerator.js
 * @description Helper central para generar documentos Word (.docx)
 *              a partir de plantillas con placeholders del tipo [[Campo]].
 *
 * La idea general:
 *  Un archivo .docx es en realidad un ZIP que contiene XMLs internos.
 *  Este módulo descarga la plantilla, la descomprime con JSZip, reemplaza
 *  los placeholders [[Campo]] en los XMLs, y vuelve a empaquetar el archivo
 *  para que el navegador lo descargue.
 *
 * Funciones exportadas:
 *  - generateWord(config) → la función pública principal
 *
 * Funciones internas (no accesibles desde afuera):
 *  - _replaceVariables(xml, variables) → orquesta el reemplazo de placeholders
 *  - _cleanProofErr(xml)               → une fragmentos que Word separó sin querer
 *  - _escapeRegex(c)                   → prepara caracteres especiales para usar en búsquedas
 *  - _escXml(str)                      → prepara el texto del empleado para insertarlo en XML sin romperlo
 *  - _ensureJSZip()                    → carga JSZip solo cuando se necesita
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
     * @param {object} [config.data={}]     - Datos del empleado ya formateados
     *                                        (viene de getSelectedUsers en Formatter.js)
     */
    async function generateWord(config) {
        const { templatePath, fileName, data = {} } = config;

        // ── Paso 1: Asegurar que JSZip esté disponible ─────────────────────────
        // JSZip se carga solo cuando hace falta (lazy loading) para no frenar
        // el arranque de la app. Si ya estaba cargado, se reutiliza directamente.
        const JSZip = await _ensureJSZip();

        // ── Paso 2: Descargar la plantilla .docx y abrirla ─────────────────────
        // Como un .docx es un ZIP, se descarga como datos binarios (ArrayBuffer)
        // y se abre con JSZip para acceder a los XMLs que contiene adentro.
        const templateBytes = await fetch(templatePath).then(res => {
            if (!res.ok) throw new Error(`No se pudo cargar ${templatePath} (${res.status})`);
            return res.arrayBuffer();
        });
        const zip = await JSZip.loadAsync(templateBytes);

        // ── Paso 3: Definir qué reemplaza a cada placeholder ───────────────────
        // Cada clave es el placeholder exacto que aparece en la plantilla Word.
        // Cada valor es el dato del empleado ya formateado.
        //
        // Los checkboxes usan ☑ / ☐ según el tipo de documento del empleado
        // (CC, CE, TI, RC), que viene del campo docCardType en SAP.
        //
        // [[CiudadFecha]] une ciudad y fecha en una sola línea,
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

            // sIdentif y sIdentificado son el mismo dato; distintas plantillas usan distintos nombres
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

            // Alias: distintas plantillas escriben distinto el mismo campo (diferencia de mayúscula)
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
            "[[FechaCert]]": data.localDate     || "",  // Alias que usan los certificados laborales

            // Une ciudad + fecha en un solo placeholder:
            // "Bogotá, 15 de junio del año 2026"
            "[[CiudadFecha]]": data.sCiudadWork
                ? `${data.sCiudadWork}, ${data.localDate}`
                : (data.localDate || ""),

            "[[CiudadFirma]]": data.sCiudadWork || "",  // Solo la ciudad, sin fecha
        };

        // ── Paso 4: Reemplazar los placeholders en los XMLs internos del .docx ─
        // Los placeholders pueden aparecer en el cuerpo, los encabezados o los pies
        // de página. Se procesan todos para no dejar ninguno sin reemplazar.
        const targets = [
            "word/document.xml",  // Cuerpo principal del documento
            "word/header1.xml",   // Encabezado (primera página o sección 1)
            "word/header2.xml",   // Encabezado (resto de páginas)
            "word/footer1.xml",   // Pie de página (primera página o sección 1)
            "word/footer2.xml"    // Pie de página (resto de páginas)
        ];

        for (const path of targets) {
            if (!zip.files[path]) continue; // No todas las plantillas tienen todos estos archivos
            let xml = await zip.files[path].async("string");
            xml = _replaceVariables(xml, variables); // Hacer los reemplazos
            zip.file(path, xml); // Guardar el XML modificado de vuelta en el ZIP
        }

        // ── Paso 5: Reempaquetar el ZIP y descargar el .docx ───────────────────
        const blob = await zip.generateAsync({ type: "blob" });
        console.log("Tamaño del blob:", blob.size, "bytes");

        // Crear un enlace temporal invisible para forzar la descarga en el navegador
        const link = document.createElement("a");
        link.href     = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href); // Liberar la memoria usada por el enlace temporal

        MessageToast.show("Documento Word generado correctamente.");
    }

    // ════════════════════════════════════════════════════════════════════════════
    // FUNCIONES PRIVADAS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Orquesta el reemplazo de placeholders en el XML interno de un archivo Word.
     *
     * El problema de fondo: cuando se escribe una plantilla en Word, el editor
     * puede dividir un placeholder en varios fragmentos XML (por el corrector
     * ortográfico, cambios de formato, autoguardado, etc.).
     * Por ejemplo, [[Nombre]] puede quedar así en el XML:
     *
     *   <w:t>[[Nom</w:t></w:r><w:proofErr/><w:r><w:t>bre]]</w:t>
     *
     * La solución tiene tres pasos:
     *  1. _cleanProofErr: une los fragmentos separados por w:proofErr
     *  2. Reemplazo directo del placeholder completo (texto ya unido)
     *  3. Reemplazo con regex por si quedaron tags XML intercalados dentro del placeholder
     *
     * @param {string} xml        - Contenido del archivo XML interno del .docx
     * @param {object} variables  - Mapa { "[[Placeholder]]": "valor" }
     * @returns {string} XML con todos los placeholders reemplazados
     */
    function _replaceVariables(xml, variables) {
        // Paso 1: unir los fragmentos separados por w:proofErr
        xml = _cleanProofErr(xml);

        for (const [key, value] of Object.entries(variables)) {
            const escaped = _escXml(value); // Preparar el valor para insertarlo en XML

            // Paso 2: reemplazo directo (cubre los placeholders completos y los ya unidos en el paso 1)
            xml = xml.split(key).join(escaped);

            // Paso 3: reemplazo con regex por si quedan tags XML intercalados entre los caracteres
            // del placeholder (ej: [[No<w:rPr/>mbre]] → busca cada letra con tags opcionales entre ellas)
            const inner        = key.slice(2, -2); // Extraer "Nombre" de "[[Nombre]]"
            const anyXmlInline = "(?:<[^>]*>)*";   // Patrón que ignora cualquier tag XML entre caracteres
            const bracketOpen  = "\\[\\[" + anyXmlInline;
            const bracketClose = anyXmlInline + "\\]\\]";
            const innerPattern = inner.split("").map(c => _escapeRegex(c) + anyXmlInline).join("");
            const pattern = bracketOpen + innerPattern + bracketClose;
            xml = xml.replace(new RegExp(pattern, "g"), escaped);

            // Debug: detectar si "Ciudad de trabajo" aparece en el XML (útil para diagnosticar problemas de tabla)
            const idx4 = xml.indexOf("Ciudad de trabajo");
            if (idx4 !== -1) {
                console.log("CONTEXTO tabla completa:", xml.substring(idx4 - 1000, idx4 + 500));
            }
        }
        return xml;
    }

    /**
     * Une fragmentos de texto que Word separó con etiquetas w:proofErr cuando juntos
     * forman parte de un placeholder [[Campo]].
     *
     * Word inserta etiquetas <w:proofErr> (del corrector ortográfico) entre bloques
     * de texto, lo que puede partir un placeholder en dos y hacerlo irreconocible
     * para un reemplazo simple de string.
     *
     * Esta función detecta esos casos con una regex y los une en un solo bloque <w:t>,
     * pero solo cuando el texto combinado contiene "[" o "]" (es decir, es parte de
     * un placeholder). Los bloques que no tienen relación con placeholders no se tocan.
     *
     * Se repite en bucle hasta que no haya nada más para unir, para cubrir casos
     * donde haya varios w:proofErr seguidos fragmentando el mismo placeholder.
     *
     * @param {string} xml - XML del archivo interno del .docx
     * @returns {string}   - XML con los fragmentos unidos donde corresponde
     */
    function _cleanProofErr(xml) {
        let prev;
        do {
            prev = xml;
            xml = xml.replace(
                // Detecta: <w:t>texto1</w:t></w:r> + <w:proofErr/> + <w:r><w:rPr>...</w:rPr><w:t>texto2</w:t>
                /<w:t([^>]*)>([^<]*)<\/w:t><\/w:r>(?:<w:proofErr[^>]*\/>|<w:proofErr[^>]*><\/w:proofErr>)<w:r(?:[^>]*)><w:rPr>[\s\S]*?<\/w:rPr><w:t([^>]*)>([^<]*)<\/w:t>/g,
                function(match, attr1, text1, attr2, text2) {
                    const combined = text1 + text2;
                    // Solo unir si el texto combinado tiene parte de un placeholder
                    if (combined.includes("[") || combined.includes("]")) {
                        return `<w:t xml:space="preserve">${combined}</w:t>`;
                    }
                    return match; // No es un placeholder: dejar el XML tal como está
                }
            );
        } while (xml !== prev); // Repetir hasta que no quede nada más por unir
        return xml;
    }

    /**
     * Escapa los caracteres especiales de una cadena para poder usarla en una búsqueda RegExp.
     * Hace falta porque los placeholders tienen corchetes [[ ]] que son metacaracteres en regex.
     *
     * @param {string} c - Carácter a escapar
     * @returns {string}
     */
    function _escapeRegex(c) {
        return c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    /**
     * Escapa los caracteres reservados de XML en el valor del empleado antes de insertarlo.
     * Sin esto, un nombre como "Juan & María <Pérez>" rompería el XML y Word no podría
     * abrir el archivo generado.
     *
     * @param {string} str - Valor a insertar en el XML
     * @returns {string}   - Valor con los caracteres XML escapados
     */
    function _escXml(str) {
        return String(str)
            .replace(/&/g, "&amp;")   // & va primero para no re-escapar los demás
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    /**
     * Carga JSZip desde CDN solo si todavía no está disponible en el navegador.
     *
     * JSZip es la librería que permite abrir y volver a empaquetar el .docx
     * (que internamente es un ZIP). Se carga de forma lazy para no incluirla
     * en el bundle principal de la app: solo se descarga cuando el usuario
     * realmente genera un documento Word.
     *
     * @returns {Promise<JSZip>} - JSZip listo para usar
     */
    function _ensureJSZip() {
        // Si ya estaba cargado de una generación anterior, reutilizarlo sin volver a descargarlo
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