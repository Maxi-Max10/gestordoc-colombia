sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    //Generacion de Word generico
    return {
        onDownloadWord: async function (context) {
            try {
                const docx = await context._ensureDocxLib();
                const aUsers = context._getSelectedUsers();

                if (!aUsers.length) {
                    MessageToast.show("Seleccione al menos un colaborador.");
                    return;
                }

                const sManualDate = context._manualDesahucioDate;
                const sFormattedDate = context._formatDateToSpanish(sManualDate);

                for (let oUser of aUsers) {
                    await this.generateWordForUser(context, docx, oUser);
                }

                MessageToast.show("Documento generado correctamente.");
            } catch (error) {
                console.error("Error generando Word:", error);
                MessageToast.show("Error generando el documento Word.");
            }
        },

        generateWordForUser: async function(context, docx, oUser) {
            const sTitle = context.sSelectedContract;
            let fileName = this.getContractFileName(context, oUser, sTitle);

            if (!fileName) {
                MessageToast.show("Contrato no válido seleccionado.");
                return;
            }

            let textContent = await this.extractTextFromWord("pdf/" + fileName);
            textContent = this.replaceWordVariables(textContent, oUser);

            const doc = this.createWordDocument(docx, textContent);
            await this.downloadWordDocument(docx, doc, oUser, sTitle);
        },

        getContractFileName: function(context, oUser, sTitle) {
            if (oUser.custom02 === "Operativo" && sTitle === "Contrato De Trabajo") {
                return context.mapTitleToFile("Contrato De Trabajo Operativo");
            } else if (oUser.custom02 === "Administrativo" && sTitle === "Contrato De Trabajo") {
                return context.mapTitleToFile("Contrato De Trabajo");
            }
            return context.mapTitleToFile(sTitle);
        },

        replaceWordVariables: function(textContent, oUser) {
            const sueldoNumeros = oUser.paycompvalue || 0;
            const sueldoLetras = this.convertNumberToWords(sueldoNumeros);
            const fechaActual = new Date().toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }).toUpperCase();

            return textContent
                .replace(/\[\[Nombre\]\]/g, oUser.firstName + " " + oUser.lastName)
                .replace(/\[\[SegundoNombre\]\]/g, oUser.secondName || "")
                .replace(/\[\[Apellido\]\]/g, oUser.lastName || "")
                .replace(/\[\[Documento\]\]/g, oUser.nationalId || "")
                .replace(/\[\[Nacionalidad\]\]/g, oUser.nationality || "")
                .replace(/\[\[EstadoCivil\]\]/g, oUser.maritalStatus || "")
                .replace(/\[\[Departamento\]\]/g, oUser.state || "")
                .replace(/\[\[Municipio\]\]/g, oUser.custom10 || "")
                .replace(/\[\[CorreoTrabajo\]\]/g, oUser.email || "")
                .replace(/\[\[Telefono\]\]/g, oUser.businessPhone || "")
                .replace(/\[\[TipoTrabajo\]\]/g, oUser.title || "")
                .replace(/\[\[hireDate\]\]/g, oUser.hireDate || "")
                .replace(/\[\[HireDatePost\]\]/g, oUser.HireDatePost || "")
                .replace(/\[\[HireDateEnd\]\]/g, fechaActual)
                .replace(/\[\[SueldoNumeros\]\]/g, oUser.paycompvalue || "")
                .replace(/\[\[SueldoLetras\]\]/g, sueldoLetras || "")
                .replace(/\[\[Department\]\]/g, oUser.department || "")
                .replace(/\[\[Division\]\]/g, oUser.division || "")
                .replace(/\[\[Custom03\]\]/g, oUser.custom03 || "");
        },

        createWordDocument: function(docx, textContent) {
            const { Document, Packer, Paragraph, TextRun, AlignmentType } = docx;

            const paragraphs = textContent.split('\n').map((line) => {
                const trimmed = line.trim();
                return new Paragraph({
                    spacing: {
                        before: 120,
                        after: 120,
                        line: 276
                    },
                    alignment: AlignmentType.JUSTIFIED,
                    children: [
                        new TextRun({
                            text: trimmed,
                            bold: /^[A-Z\s]+:$/.test(trimmed),
                            font: "Calibri",
                            size: 24
                        })
                    ]
                });
            });

            return new Document({
                sections: [{
                    properties: {
                        page: {
                            margin: {
                                top: 620,
                                right: 720,
                                bottom: 720,
                                left: 720
                            }
                        }
                    },
                    children: paragraphs
                }]
            });
        },

        downloadWordDocument: async function(docx, doc, oUser, sTitle) {
            const blob = await docx.Packer.toBlob(doc);
            const downloadFileName = `${oUser.firstName}_${oUser.lastName}_${sTitle}.docx`;

            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = downloadFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        extractTextFromWord: async function(filePath) {
            const mammoth = await window._ensureMammothLib();
            const response = await fetch(filePath);
            const arrayBuffer = await response.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        },

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
    };
});