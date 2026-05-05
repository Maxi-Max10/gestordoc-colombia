sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    // Este módulo retorna un objeto con funciones para generar PDFs
    return {

        /**
         * Genera un PDF para cada usuario seleccionado,
         * haciendo reemplazos dinámicos en plantillas Word → PDF.
         */
        onDownloadPDF1: async function (context) {
            try {
                // Carga dinámica del toolkit PDF-lib
                const { PDFLib } = await context._ensurePdfToolkit();

                // Obtiene los usuarios seleccionados desde el contexto del controlador
                var aUsers = context._getSelectedUsers();
                
                if (aUsers.length === 0) {
                    MessageToast.show("Seleccione al menos un colaborador.");
                    return;
                }

                // Procesa cada usuario seleccionado
                for (let oUser of aUsers) {
                    var sTitle = context.sSelectedContract;
                    var contractFile;

                    // Se selecciona la plantilla según tipo de empleado
                    if (oUser.custom02 == "Operativo" && sTitle == "Contrato De Trabajo") {
                        contractFile = context.mapTitleToFile("Contrato De Trabajo Operativo");
                    } else if (oUser.custom02 == "Administrativo" && sTitle == "Contrato De Trabajo") {
                        contractFile = context.mapTitleToFile("Contrato De Trabajo");
                    } else {
                        contractFile = context.mapTitleToFile(sTitle);
                    }

                    // Validación
                    if (!contractFile) {
                        MessageToast.show("Contrato no válido seleccionado.");
                        return;
                    }

                    // Salario (número y letras)
                    let sueldoNumeros = oUser.paycompvalue || 0;
                    let sueldoLetras = this.convertNumberToWords(sueldoNumeros);

                    // Fecha formateada
                    let fechaActual = new Date().toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                    }).toUpperCase();

                    // Extrae el texto plano del archivo Word correspondiente
                    let textContent = await this.extractTextFromWord("pdf/" + contractFile);

                    // Reemplaza todas las variables tipo [[Nombre]]
                    textContent = this.replaceTemplateVariables(textContent, oUser, sueldoNumeros, sueldoLetras, fechaActual);

                    // Limpia caracteres tabuladores
                    textContent = textContent.replace(/\t/g, " ");

                    // Genera el PDF usando hojaMetaldom.pdf como plantilla
                    await this.generatePDFWithTemplate(PDFLib, textContent, oUser, sTitle);
                }

            } catch (error) {
                console.error("Error generando el documento:", error);
                MessageToast.show("Error generando el documento.");
            }
        },

        /**
         * Reemplaza todas las variables tipo [[Nombre]] dentro del texto extraído.
         */
        replaceTemplateVariables: function(textContent, oUser, sueldoNumeros, sueldoLetras, fechaActual) {
            return textContent
                .replace(/\[\[Nombre\]\]/g, `${oUser.firstName} ${oUser.lastName} ${oUser.secondLastName}`)
                .replace(/\[\[Nacionalidad\]\]/g, oUser.nacionality || "COMPLETAR")
                .replace(/\[\[Departamento\]\]/g, oUser.state || "COMPLETAR")
                .replace(/\[\[Provincia\]\]/g, oUser.state || "COMPLETAR")
                .replace(/\[\[TipoTrabajo\]\]/g, oUser.title ? oUser.title.replace(/\s*\(\d+\)$/, "") : "COMPLETAR")
                .replace(/\[\[Categoria\]\]/g, oUser.custom02 || "COMPLETAR")
                .replace(/\[\[Municipio\]\]/g, oUser.state || "COMPLETAR")
                .replace(/\[\[Telefono\]\]/g, oUser.businessPhone || "COMPLETAR")
                .replace(/\[\[CorreoTrabajo\]\]/g, oUser.email || "COMPLETAR")
                .replace(/\[\[hireDate\]\]/g, oUser.hireDate || "COMPLETAR")
                .replace(/\[\[HireDatePost\]\]/g, oUser.HireDatePost || "COMPLETAR")
                .replace(/\[\[hireDateExt\]\]/g, oUser.hireDateExt && oUser.hireDateExt.trim() !== "" ? oUser.hireDateExt : "COMPLETAR")
                .replace(/\[\[SueldoNumeros\]\]/g, sueldoNumeros || "COMPLETAR")
                .replace(/\[\[SueldoLetras\]\]/g, sueldoLetras || "COMPLETAR")
                .replace(/\[\[HireDateEnd\]\]/g, fechaActual || "COMPLETAR")
                .replace(/\[\[EstadoCivil\]\]/g, oUser.maritalStatus || "COMPLETAR")
                .replace(/\[\[Documento\]\]/g, oUser.nationalId || "COMPLETAR")
                .replace(/\[\[DepartmentEmp\]\]/g, oUser.department || "COMPLETAR")
                .replace(/\[\[divisionEmp\]\]/g, oUser.division || "COMPLETAR")
                .replace(/\[\[Custom03\]\]/g, oUser.custom03 || "COMPLETAR")
                .replace(/\[\[positionSup\]\]/g, oUser.positionSup || "COMPLETAR")
                .replace(/\[\[TelefonoSup\]\]/g, oUser.TelefonoSup || "COMPLETAR")
                .replace(/\[\[CorreoTrabajoSup\]\]/g, oUser.CorreoTrabajoSup || "COMPLETAR")
                .replace(/\[\[fechaPropuestaIngreso\]\]/g, oUser.fechaPropuesta || "COMPLETAR")
                .replace(/\[\[startDate\]\]/g, oUser.startDate || "COMPLETAR")
                .replace(/\[\[contratoDate\]\]/g, this.formatDateToWords(new Date()))
                .replace(/\[\[salutation\]\]/g, oUser.salut || "COMPLETAR");
        },

        /**
         * Genera un PDF mezclando la plantilla hojaMetaldom.pdf y el texto reemplazado.
         */
        generatePDFWithTemplate: async function(PDFLib, textContent, oUser, sTitle) {

            // Carga PDF de plantilla
            const pdfFilePath = "pdf/hojaMetaldom.pdf";
            const existingPdfBytes = await fetch(pdfFilePath).then(res => res.arrayBuffer());

            const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
            const newPdf = await PDFLib.PDFDocument.create();

            // Copia la página de plantilla
            const [templatePage] = await newPdf.copyPages(pdfDoc, [0]);

            // Añade la página inicial
            let page = newPdf.addPage(templatePage);
            let { width } = page.getSize();

            const font = await newPdf.embedFont(PDFLib.StandardFonts.Helvetica);
            const boldFont = await newPdf.embedFont(PDFLib.StandardFonts.HelveticaBold);

            // Coordenadas iniciales
            let x = 30;
            let y = 650;
            let fontSize = 8;
            let lineHeight = fontSize + 2;
            let maxWidth = width - 60;
            let marginBottom = 120;

            // Lista de frases que deben dibujarse en negrita
            const boldPhrases = [
                "A QUIEN PUEDA INTERESAR",
                "PRIMERO", "SEGUNDO", "TERCERO",
                "METALDOM, S.A.", "METALDOM",
                "ARTÍCULO PRIMERO", "ARTÍCULO",
                "CONTRATO DE TRABAJO POR TIEMPO INDEFINIDO",
                "ENTRE", "POR CUANTO:"
            ];

            // Divide el contenido en párrafos
            const paragraphs = textContent.split("\n");

            for (let paragraph of paragraphs) {
                let lines = this.splitTextIntoLines(paragraph, maxWidth, font, fontSize);

                for (let line of lines) {
                    // Dibuja la línea con control de texto en negrita
                    await this.drawLineWithBoldPhrases(page, line, x, y, fontSize, font, boldFont, boldPhrases);

                    y -= lineHeight;

                    // Si llega al final de página → crea otra página
                    if (y < marginBottom) {
                        const [newTemplatePage] = await newPdf.copyPages(pdfDoc, [0]);
                        page = newPdf.addPage(newTemplatePage);
                        y = 650;
                    }
                }

                y -= lineHeight;
            }
        },

        /**
         * Divide texto en líneas según máximo de ancho permitido.
         */
        splitTextIntoLines: function(text, maxWidth, font, fontSize) {
            let words = text.split(" ");
            let lines = [];
            let currentLine = "";

            for (let word of words) {
                let testLine = currentLine.length > 0 ? currentLine + " " + word : word;
                let textWidth = font.widthOfTextAtSize(testLine, fontSize);

                if (textWidth < maxWidth) {
                    currentLine = testLine;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }

            if (currentLine.length > 0) {
                lines.push(currentLine);
            }

            return lines;
        },

        /**
         * Dibuja una línea, detectando palabras clave para mostrarlas en negrita.
         */
        drawLineWithBoldPhrases: async function(page, line, x, y, fontSize, font, boldFont, boldPhrases) {
            let lineX = x;
            let remainingText = line;

            while (remainingText.length > 0) {
                let match = null;
                let matchStart = -1;
                let matchEnd = -1;

                // Busca la palabra/frase en negrita más cercana al inicio
                for (let phrase of boldPhrases) {
                    let index = remainingText.toUpperCase().indexOf(phrase);

                    if (index !== -1 && (match === null || index < matchStart)) {
                        match = phrase;
                        matchStart = index;
                        matchEnd = index + phrase.length;
                    }
                }

                // Si encuentra un texto para poner en negrita
                if (match) {
                    let before = remainingText.slice(0, matchStart);

                    // Dibuja el texto normal previo
                    if (before.trim()) {
                        page.drawText(before, { x: lineX, y, size: fontSize, font });
                        lineX += font.widthOfTextAtSize(before, fontSize);
                    }

                    // Dibuja la frase en negrita
                    page.drawText(remainingText.slice(matchStart, matchEnd), {
                        x: lineX, y, size: fontSize, font: boldFont
                    });

                    lineX += boldFont.widthOfTextAtSize(remainingText.slice(matchStart, matchEnd), fontSize);
                    remainingText = remainingText.slice(matchEnd);

                } else {
                    // Si no tiene nada más en negrita → dibuja normal
                    page.drawText(remainingText, { x: lineX, y, size: fontSize, font });
                    break;
                }
            }
        },

        /**
         * Extrae texto desde un archivo Word usando Mammoth.js
         */
        extractTextFromWord: async function(filePath) {
            const mammoth = await window._ensureMammothLib();
            const response = await fetch(filePath);
            const arrayBuffer = await response.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });

            return result.value;
        },

        /**
         * Descarga un PDF en el navegador.
         */
        downloadPDF: function(pdfBytes, fileName) {
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        /**
         * Convierte un número en texto y formato monetario dominicano.
         */
        convertNumberToWords: function(num) {
            if (isNaN(num) || num < 0) return "CERO PESOS DOMINICANOS CON 00/100";

            const formatter = new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "DOP",
                minimumFractionDigits: 2,
            });

            const numToWords = (n) => {
                const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
                const decenas = ["DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
                const centenas = ["CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

                if (n === 0) return "CERO";
                if (n < 10) return unidades[n];
                if (n < 100) return decenas[Math.floor(n / 10) - 1] + (n % 10 !== 0 ? " Y " + unidades[n % 10] : "");
                if (n < 1000) return centenas[Math.floor(n / 100) - 1] + (n % 100 !== 0 ? " " + numToWords(n % 100) : "");
                if (n < 1000000) return numToWords(Math.floor(n / 1000)) + " MIL " + (n % 1000 !== 0 ? numToWords(n % 1000) : "");

                return formatter.format(n).toUpperCase();
            };
            
            let pesos = Math.floor(num);
            let centavos = Math.round((num - pesos) * 100);
            let centavosTexto = centavos < 10 ? `0${centavos}` : centavos;

            return `${numToWords(pesos)} PESOS DOMINICANOS CON ${centavosTexto}/100`;
        },

        /**
         * Convierte una fecha a formato largo (DÍA DE MES DE AÑO).
         */
        formatDateToWords: function(date) {
            return new Date(date).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }).toUpperCase();
        }
    };
});
