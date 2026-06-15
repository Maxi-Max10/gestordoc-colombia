sap.ui.define([
        "sap/m/MessageToast"
        ], function (MessageToast) {
        "use strict";

        async function generateWord(config) {
                const { templatePath, fileName, data = {} } = config;

                const JSZip         = await _ensureJSZip();
                const templateBytes = await fetch(templatePath).then(res => {
                if (!res.ok) throw new Error(`No se pudo cargar ${templatePath} (${res.status})`);
                return res.arrayBuffer();
                });
                const zip = await JSZip.loadAsync(templateBytes);

                const variables = {
                // Datos personales
                "[[Nombre]]":                   data.sNombre                || "",
                "[[Cedula]]":                   data.sCedula                || "",
                "[[FechaNacimiento]]":          data.sFechaNacimiento       || "",
                "[[Sexo]]":                     data.sSexo                  || "",
                "[[EstadoCivil]]":              data.sEstadoCivil           || "",
                "[[GrupoSanguineo]]":           data.sGrupoSangre           || "",
                "[[Nacionalidad]]":             data.sNacional              || "",
                "[[Pais]]":                     data.sPais                  || "",
                "[[DocCardType]]":              data.sDocCardType           || "",
                "[[CheckCC]]": data.sDocCardType === "CC" ? "☑" : "☐",
                "[[CheckCE]]": data.sDocCardType === "CE" ? "☑" : "☐",
                "[[CheckTI]]": data.sDocCardType === "TI" ? "☑" : "☐",
                "[[CheckRC]]": data.sDocCardType === "RC" ? "☑" : "☐",
                "[[FechaExpedicion]]":          data.sFechaExpedicion       || "",
                "[[Identificado]]":             data.sIdentif || data.sIdentificado || "",

                // Contacto
                "[[Email]]":                    data.sEmail                 || "",
                "[[Telefono]]":                 data.sTelefono              || "",
                "[[Direccion]]":                data.sDireccion             || "",

                // Laboral
                "[[Cargo]]":                    data.sCargo                 || "",
                "[[CiudadWork]]":               data.sCiudadWork            || "",
                "[[Planta]]":                   data.sPlanta                || "",
                "[[Area]]":                     data.sArea                  || "",
                "[[JefeNombre]]":               data.sJefeNombre            || "",
                "[[Institucion]]":              data.sInstitucion           || "",
                "[[FechaIngreso]]":             data.sIngreso               || "",
                "[[FechaSalida]]":              data.sSalida                || "",
                "[[FechaContratacion]]":        data.sFechaContratacion || data.sfechaContratacion || "",

                // Salarial
                "[[Salario]]":                  data.sSalario               || "",
                "[[SalarioLetras]]":            data.sSalarioLetras         || "",
                "[[SalarioenLetras]]":          data.sSalarioLetras         || "",
                "[[PeriodoPago]]":              data.sPeriodoPago           || "",
                "[[ComponenteRemunerativo]]":   data.sCompRemunerativo      || "",
                "[[CompRemunerativoLetras]]":   data.sCompRemunerativoLetras|| "",
                "[[FactorPrestacional]]":       data.sFactorPrestacional    || "",
                "[[FactorPrestacionalLetras]]": data.sFactorPrestacionalLetras || "",

                // Fecha / lugar
                "[[Fecha]]":                    data.localDate              || "",
                "[[FechaLarga]]":               data.localDateLong          || "",
                "[[FechaCert]]":                data.localDate              || "",
                "[[CiudadFecha]]":              data.sCiudadWork
                                                        ? `${data.sCiudadWork}, ${data.localDate}`
                                                        : (data.localDate       || ""),
                "[[CiudadFirma]]":              data.sCiudadWork            || "",
                };

                const targets = [
                "word/document.xml",
                "word/header1.xml", "word/header2.xml",
                "word/footer1.xml", "word/footer2.xml"
                ];

                for (const path of targets) {
                if (!zip.files[path]) continue;
                let xml = await zip.files[path].async("string");
                xml = _replaceVariables(xml, variables);
                zip.file(path, xml);
                }

                const blob = await zip.generateAsync({ type: "blob" });
                console.log("Tamaño del blob:", blob.size, "bytes");

                const link = document.createElement("a");
                link.href     = URL.createObjectURL(blob);
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);

                MessageToast.show("Documento Word generado correctamente.");
        }

        // ── Privados ──────────────────────────────────────────────────────────────

        function _replaceVariables(xml, variables) {
                // Paso 1: limpiar proofErr que fragmentan las variables
                // Busca patrones donde un run termina y el siguiente empieza, con proofErr en medio,
                // y los une solo cuando hay fragmentos de [[ ]] involucrados
                xml = _cleanProofErr(xml);

                for (const [key, value] of Object.entries(variables)) {
                const escaped = _escXml(value);

                // Reemplazo directo (cubre variables completas y las ya limpiadas)
                xml = xml.split(key).join(escaped);

                // Reemplazo fragmentado por tags simples dentro del run
                const inner = key.slice(2, -2);
                const anyXmlInline = "(?:<[^>]*>)*";
                const bracketOpen  = "\\[\\[" + anyXmlInline;
                const bracketClose = anyXmlInline + "\\]\\]";
                const innerPattern = inner.split("").map(c => _escapeRegex(c) + anyXmlInline).join("");
                const pattern = bracketOpen + innerPattern + bracketClose;
                xml = xml.replace(new RegExp(pattern, "g"), escaped);

                const idx4 = xml.indexOf("Ciudad de trabajo");
                        if (idx4 !== -1) {
                        console.log("CONTEXTO tabla completa:", xml.substring(idx4 - 1000, idx4 + 500));
                        }
                
                }
                return xml;
        }

        function _cleanProofErr(xml) {
                // Une runs separados por w:proofErr cuando juntos forman parte de una variable
                // Repite hasta que no haya más cambios (puede haber múltiples proofErr seguidos)
                let prev;
                do {
                prev = xml;
                xml = xml.replace(
                        /<w:t([^>]*)>([^<]*)<\/w:t><\/w:r>(?:<w:proofErr[^>]*\/>|<w:proofErr[^>]*><\/w:proofErr>)<w:r(?:[^>]*)><w:rPr>[\s\S]*?<\/w:rPr><w:t([^>]*)>([^<]*)<\/w:t>/g,
                        function(match, attr1, text1, attr2, text2) {
                        const combined = text1 + text2;
                        if (combined.includes("[") || combined.includes("]")) {
                                return `<w:t xml:space="preserve">${combined}</w:t>`;
                        }
                        return match;
                        }
                );
                } while (xml !== prev);
                return xml;
        }
        
        function _escapeRegex(c) {
                return c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }

        function _escXml(str) {
                return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;");
        }

        function _ensureJSZip() {
                if (window.JSZip) return Promise.resolve(window.JSZip);
                return new Promise((resolve, reject) => {
                const script   = document.createElement("script");
                script.src     = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
                script.onload  = () => resolve(window.JSZip);
                script.onerror = () => reject(new Error("No se pudo cargar JSZip."));
                document.head.appendChild(script);
                });
        }

        return { generateWord };
        });