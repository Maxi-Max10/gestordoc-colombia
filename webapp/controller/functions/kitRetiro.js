sap.ui.define([
    "sap/m/MessageToast",
    "gestordoccolombia/controller/helpers/wordGenerator"

], function (MessageToast, wordGenerator) {
    "use strict";

    async function onDownloadPDFKitRetiro(oController, sButtonId) {
        try {
            await oController._ensurePdfToolkit();

            const PDFLibRef      = window.PDFLib      || oController._pdfLibRef;
            const html2canvasRef = window.html2canvas  || oController._html2canvasRef;

            if (!PDFLibRef || !html2canvasRef) {
                throw new Error("No se pudieron cargar las bibliotecas PDF/Canvas requeridas.");
            }

            const aUsers = oController.getSelectedUsers();
            if (aUsers.length === 0) {
                MessageToast.show("Seleccione al menos un colaborador.");
                return;
            }

            for (let i = 0; i < aUsers.length; i++) {
                const user = aUsers[i];

                /*
                // ── FORZAR CYRGO PARA PRUEBAS — BORRAR ANTES DE PRODUCCIÓN ──
                user.company       = "CO10";
                user.ciudadFirma   = "Barranquilla";
                user.firstName     = "Juan";
                user.lastName      = "Pérez";
                user.nationalId    = "12345678";
                user.paycompvalue  = 2000000;
                user.title         = "Analista";
                user.gender        = "M";
                user.addressLine1  = "Calle 93 B N° 18-12";
                user.personalEmail = "juan.perez@correo.com";
                user.personalPhone = "3001234567";
                user.hireDatesimpl = "2022-01-15";
                user.endDateBaja   = "2026-05-25";
                */
                

                if (aUsers.length > 1) {
                    MessageToast.show(`Generando documento ${i + 1} de ${aUsers.length}...`);
                }

                const sNombre        = `${user.firstName} ${user.lastName}`;
                const sCedula        = user.nationalId     || "";
                const sCiudadFirma = user.ciudadFirma || "";
                const sCiudadResidencia = oController.getCiudadResidencia(user);
                const localDate      = oController.getLocalDate();
                const sCargo         = oController.resolveGender(user.title || "", user.gender);
                const sSalario       = oController.formatSalary(user.paycompvalue);
                const sfechaContratacion = oController.formatDateRaw(user.originalStartDate);
                const sfechaBaja = oController.formatDateRaw(user.endDateBaja);
                const sIdentif       = (user.gender === "F") ? "identificada" : "identificado";
                const sDireccion     = (user.addressLine1 || "").replace(/\s+/g, " ").trim();

                // ← NUEVO: campos que ahora vienen desde la carga enriquecida
                const sEmail       = user.personalEmail || "";
                const sTelefono    = user.personalPhone || "";
                //const sFechaBajaCorta = user.endDateBaja? oController.formatFechaCorta(user.endDateBaja): "";

                // ── Empresa ───────────────────────────────────────────────────
                const isCyrgo = user.company === "CO24";
                const empresaData = isCyrgo ? {
                    empresaNombre: "CYRGO S.A.S.",
                    repNombre:     "DANIEL EDUARDO NUNCIRA AGUDELO",
                    repCC:         "74.371.977",
                    firmaImg:      "img/firma_Daniel_Cyrgo.jpg",
                    qrImg:         "img/qrImg.png",
                    nit:            "860.009.694-2"
                } : {
                    empresaNombre: "DIACO S.A.",
                    repNombre:     "LAURA CRISTINA CERÓN MUÑOZ",
                    repCC:         "52.705.312",
                    firmaImg:      "",
                    qrImg:         "img/qrImg.png",
                    nit:           "891.800.111-5"
                };

                // ── Word ─────────────────────────────────────────────────────
                if (sButtonId.includes("wordDataInfo")) {
                    const wordTemplatePath = isCyrgo
                        ? "templates/word/Kit_Retiro_Cyrgo.docx"
                        : "templates/word/Kit_Retiro_Diaco.docx";

                    await wordGenerator.generateWord({
                        templatePath: wordTemplatePath,
                        fileName:     `${user.firstName}_${user.lastName}_Kit_Retiro.docx`,
                        data: {
                            sNombre, sCedula, localDate, sCargo,
                            sSalario, sfechaContratacion, sfechaBaja, sfechaContratacion, sIdentif,
                            sEmail, sTelefono, sDireccion, sCiudadFirma, sCiudadResidencia
                        }
                    });
                    continue;
                }

                // ── ANTES de llamar a _buildCyrgo() / _buildDiaco() ──────────────────
                // Asegurate de que esto esté resuelto con await:

                const loadImageAsBase64 = (path) =>
                    fetch(path)
                        .then(r => r.blob())
                        .then(blob => new Promise((res, rej) => {
                            const reader = new FileReader();
                            reader.onload  = () => res(reader.result);
                            reader.onerror = rej;
                            reader.readAsDataURL(blob);
                        }));

                const removeWhiteBackground = (dataUrl) =>
                    new Promise((res) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement("canvas");
                            canvas.width  = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0);
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const data = imageData.data;
                            for (let i = 0; i < data.length; i += 4) {
                                const r = data[i], g = data[i+1], b = data[i+2];
                                if (r > 220 && g > 220 && b > 220) {
                                    data[i + 3] = 0;
                                }
                            }
                            ctx.putImageData(imageData, 0, 0);
                            res(canvas.toDataURL("image/png"));
                        };
                        img.src = dataUrl;
                    });

                const qrBase64Raw    = await loadImageAsBase64(empresaData.qrImg);
                const qrBase64       = await removeWhiteBackground(qrBase64Raw);

                const firmaBase64Raw = empresaData.firmaImg ? await loadImageAsBase64(empresaData.firmaImg) : "";
                const firmaBase64    = firmaBase64Raw ? await removeWhiteBackground(firmaBase64Raw) : "";

                const STYLE = `font-family:Arial,sans-serif;font-size:9.5pt;line-height:1.2;padding:0px 70px 20px 70px;color:#000;`;

                // ── Bloques HTML Diaco (3 páginas) ───────────────────────────
                function _buildDiaco() {
                    const htmlPagina1 = `
                        <div style="${STYLE}width:100%;box-sizing:border-box;">

                            <p style="margin:0 0 16px 0;">${sCiudadFirma ? sCiudadFirma + ", " : ""}${localDate}</p>

                            <p style="margin:0;">Señor:</p>
                            <p style="font-weight:bold;margin:0;">${sNombre}</p>
                            <p style="margin:0 0 16px 0;">${sCiudadFirma}</p>

                            <p style="text-align:justify;margin:0 0 16px 0;">
                                Con referencia al retiro de la empresa, a continuación, se relaciona lista documentos
                                entregados en la fecha:
                            </p>

                            <ol style="margin:0 0 24px 20px;line-height:1.8;">
                                <li>Aprobación para envío de documentación, datos de notificación y pago de liquidación final</li>
                                <li>Certificación laboral</li>
                                <li>Comunicación plazo máximo para realización exámenes de egreso</li>
                                <li>Exámenes médicos post – ocupacionales</li>
                                <li>Paz y salvo de Seguridad social y parafiscales</li>
                                <li>Formato Paz y Salvo</li>
                                <li>Encuesta de retiro</li>
                            </ol>

                            <img src="${qrBase64}" style="width:130px;height:130px;display:block;margin:0 0 20px 0;" />

                            <p style="margin:0 0 60px 0;">Cordialmente,</p>

                            <div style="text-align:center;">
                                <p style="border-top:1.5px solid #000;width:260px;margin:0 auto;padding-top:6px;">
                                    <strong>Gestión Personas</strong>
                                </p>
                            </div>

                        </div>
                    `;

                    const htmlPagina2 = `
                        <div style="${STYLE}width:100%;box-sizing:border-box;">

                            <p style="margin:0 0 16px 0;">${sCiudadFirma ? sCiudadFirma + ", " : ""}${localDate}</p>

                            <p style="margin:0;">Señor:</p>
                            <p style="font-weight:bold;margin:0;">${sNombre}</p>
                            <p style="margin:0 0 16px 0;">${sCiudadFirma}</p>

                            <p style="text-align:justify;margin:0 0 14px 0;">
                                Pensando en su comodidad, tenemos disponible para usted las siguientes opciones (Marque X):
                            </p>

                            <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
                                <tr>
                                    <td style="width:24px;vertical-align:top;font-weight:bold;">1.</td>
                                    <td style="text-align:justify;">
                                        <strong>Envío de documentos de retiro a correo electrónico:</strong>
                                        Recibir, revisar y aprobar a través de su correo electrónico, los documentos de su
                                        paquete de egreso. Una vez dicha documentación de egreso haya sido aprobada por usted,
                                        deberá imprimirla, firmarla en señal de aceptación y enviarla escaneada al correo
                                        electrónico <span style="text-decoration:underline;">nominadiaco@diaco.com.co</span><br><br>
                                        <p style="text-align:center;margin:0;">Acepto______&nbsp;&nbsp;&nbsp;No Acepto ______</p>
                                    </td>
                                </tr>
                            </table>

                            <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
                                <tr>
                                    <td style="width:24px;vertical-align:top;font-weight:bold;">2.</td>
                                    <td style="text-align:justify;">
                                        <strong>Pago de liquidación de prestaciones sociales, por medio de transferencia electrónica:</strong>
                                        Una vez nómina, haya recibido los documentos de egreso firmados en señal de aceptación,
                                        realizaremos el pago de su liquidación final de prestaciones sociales dentro de los tres (3)
                                        días hábiles siguientes, directamente a la cuenta bancaria Davivienda matriculada con la
                                        empresa, por medio de transferencia electrónica.<br><br>
                                        <p style="text-align:center;margin:0;">Acepto______&nbsp;&nbsp;&nbsp;No Acepto ______</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="text-align:justify;margin:0 0 14px 0;">
                                En caso contrario de no aceptación de los puntos 1 o 2, deberá dirigirse personalmente a las
                                instalaciones de la empresa, para recibir los documentos o reclamar el pago de su liquidación
                                de prestaciones sociales.
                            </p>

                            <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
                                <tr>
                                    <td style="width:24px;vertical-align:top;font-weight:bold;">3.</td>
                                    <td style="text-align:justify;">
                                        <strong>Cesantías años anteriores consignadas en Fondo privado:</strong>
                                        Confirmo que SI ___ NO ___, deseo retirar mis cesantías de años anteriores consignadas
                                        por esta compañía en mi cuenta del Fondo de Cesantías _________________________.
                                        (En caso afirmativo la compañía solicitará al fondo la consignación en su cuenta bancaria
                                        de nómina, en caso negativo puede solicitar a la compañía posteriormente cuando lo requiera
                                        al correo electrónico <span style="text-decoration:underline;">nominadiaco@diaco.com.co</span>).
                                    </td>
                                </tr>
                            </table>

                            <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
                                <tr>
                                    <td style="width:24px;vertical-align:top;font-weight:bold;">4.</td>
                                    <td>
                                        <strong>Datos de notificación:</strong>
                                        <table style="width:100%;border-collapse:collapse;margin-top:8px;">
                                            <tr>
                                                <td style="padding:3px 0;width:55%;">Ciudad de Residencia:</td>
                                                <td>&nbsp${sCiudadResidencia}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:3px 0;">Dirección (incluir el barrio/sector):</td>
                                                <td>&nbsp${sDireccion}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:3px 0;">Teléfono:</td>
                                                <td>&nbsp${sTelefono}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:3px 0;">Correo Electrónico:</td>
                                                <td>&nbsp${sEmail}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <p style="text-align:justify;margin:0 0 40px 0;">
                                Declaró que comprendí la información contenida en esta comunicación y en señal a lo anterior
                                firmo de recibido y enterado.
                            </p>

                            <p style="border-top:1.5px solid #000;width:260px;padding-top:6px;margin:0;">
                                <strong>${sNombre}</strong><br>
                                <strong>C.C. ${sCedula}</strong>
                            </p>

                        </div>
                    `;

                    const htmlPagina3 = `
                        <div style="${STYLE}width:100%;box-sizing:border-box;">

                            <p style="font-weight:bold;text-align:center;letter-spacing:1px;margin:0 0 28px 0;">
                                EL ÁREA DE GESTIÓN DE PERSONAS
                            </p>

                            <p style="text-align:center;letter-spacing:6px;margin:0 0 40px 0;">
                                C E R T I F I C A
                            </p>

                            <p style="text-align:justify;line-height:1.7;margin:0 0 24px 0;">
                                Que, <strong>${sNombre}</strong> ${sIdentif} con cédula de ciudadanía número
                                <strong>${sCedula},</strong> trabajó en la empresa con contrato a término indefinido, desde
                                <strong>${sfechaContratacion}</strong> hasta el <strong>${sfechaBaja}</strong>
                            </p>

                            <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
                                <tr>
                                    <td style="padding:4px 0;font-weight:bold;width:40%;">Ultimo cargo desempeñado:</td>
                                    <td style="padding:4px 0;">${sCargo}</td>
                                </tr>
                                <tr>
                                    <td style="padding:4px 0;font-weight:bold;">Ciudad de trabajo:</td>
                                    <td style="padding:4px 0;">${sCiudadFirma}</td>
                                </tr>
                                <tr>
                                    <td style="padding:4px 0;font-weight:bold;">Salario:</td>
                                    <td style="padding:4px 0;">${sSalario}</td>
                                </tr>
                            </table>

                            <p style="text-align:justify;margin:0 0 70px 0;">
                                La anterior se expide en Ciudad de ${sCiudadFirma} el ${localDate}
                            </p>

                            <div style="text-align:center;">
                                <p style="border-top:1.5px solid #000;width:260px;margin:0 auto;padding-top:6px;">
                                    <strong>${empresaData.repNombre}</strong><br>
                                    <strong>Gestión Personas</strong>
                                </p>
                            </div>

                        </div>
                    `;

                    return [htmlPagina1, htmlPagina2, htmlPagina3];
                }

                // ── Bloques HTML Cyrgo (5 páginas) ───────────────────────────
                function _buildCyrgo() {
                    const htmlPagina1 = `
                        <div style="${STYLE}width:100%;box-sizing:border-box;">

                            <p style="margin:0 0 30px 0;">${sCiudadFirma ? sCiudadFirma + ", " : ""}${localDate}</p>

                            <p style="margin:0;">Señor:</p>
                            <p style="font-weight:bold;margin:0 0 25px 0;">${sNombre}</p>

                            <p style="text-align:justify;margin:0 0 16px 0;">
                                Con referencia al retiro de la empresa, a continuación, se relaciona lista documentos
                                entregados en la fecha:
                            </p>

                            <ol style="margin:0 0 24px 20px;line-height:1.8;">
                                <li>Aprobación para envío de documentación, datos de notificación y pago de liquidación final</li>
                                <li>Certificación laboral</li>
                                <li>Comunicación plazo máximo para realización exámenes de egreso</li>
                                <li>Exámenes médicos post – ocupacionales</li>
                                <li>Paz y salvo de Seguridad social y parafiscales</li>
                                <li>Encuesta de retiro (Debes dar clic en saltar anuncio)</li>
                            </ol>

                            <div style="width:100%;text-align:center;">

                                <img src="${qrBase64}" style="width:160px;height:160px;display:block;margin:0 auto 20px auto;mix-blend-mode:multiply;" />

                                <p style="text-align:left;margin:0 0 40px 0;">Cordialmente,</p>

                                ${firmaBase64 ? `<img src="${firmaBase64}" style="height:60px;width:auto;display:block;margin:0 auto 8px auto;mix-blend-mode:multiply;">` : ""}

                                <p style="font-weight:bold;border-top:1.5px solid #000;width:320px;padding-top:6px;margin:0 auto;">
                                    ${empresaData.repNombre}
                                </p>

                                <p style="font-size:9pt;width:320px;padding-top:2px;margin:0 auto;">
                                    ${empresaData.empresaNombre}
                                </p>

                            </div>

                            </div>

                        </div>
                    `;

                    const htmlPagina2 = `
                        <div style="${STYLE}width:100%;box-sizing:border-box;">

                            <p style="margin:0 0 30px 0;">${sCiudadFirma ? sCiudadFirma + ", " : ""}${localDate}</p>

                            <p style="margin:0;">Señor:</p>
                            <p style="font-weight:bold;margin:0 0 25px 0;">${sNombre}</p>
                            <p style="margin:0 0 16px 0;">${sCiudadFirma}</p>

                            <p style="text-align:justify;margin:0 0 14px 0;">
                                Pensando en su comodidad, tenemos disponible para usted las siguientes opciones (Marque X):
                            </p>

                            <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
                                <tr>
                                    <td style="width:24px;vertical-align:top;font-weight:bold;">1.</td>
                                    <td style="text-align:justify;">
                                        <strong>Envío de documentos de retiro a correo electrónico:</strong> Recibir, revisar y
                                         aprobar a través de su correo electrónico, los documentos de su paquete de egreso.
                                          Una vez dicha documentación de egreso haya sido aprobada por usted, deberá imprimirla,
                                           firmarla en señal de aceptación y enviarla escaneada al correo electrónico
                                            <span style="text-decoration:underline;">nominadiaco@diaco.com.co</span><br><br>
                                        <p style="text-align:center;margin:0;">Acepto______&nbsp;&nbsp;&nbsp;No Acepto ______</p>
                                    </td>
                                </tr>
                            </table>

                            <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
                                <tr>
                                    <td style="width:24px;vertical-align:top;font-weight:bold;">2.</td>
                                    <td style="text-align:justify;">
                                        <strong>Pago de liquidación de prestaciones sociales, por medio de transferencia electrónica:</strong>
                                        Una vez nómina, haya recibido los documentos de egreso firmados en señal de aceptación,
                                        realizaremos el pago de su liquidación final de prestaciones sociales dentro de los tres (3)
                                        días hábiles siguientes, directamente a la cuenta bancaria Davivienda matriculada con la
                                        empresa, por medio de transferencia electrónica.<br><br>
                                        <p style="text-align:center;margin:0;">Acepto______&nbsp;&nbsp;&nbsp;No Acepto ______</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="text-align:justify;margin:0 0 14px 24px;">
                                En caso contrario de no aceptación de los puntos 1 o 2, deberá dirigirse personalmente a las
                                instalaciones de la empresa, para recibir los documentos o reclamar el pago de su liquidación
                                de prestaciones sociales.
                            </p>

                            <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
                                <tr>
                                    <td style="width:24px;vertical-align:top;font-weight:bold;">3.</td>
                                    <td style="text-align:justify;">
                                        <strong>Cesantías años anteriores consignadas en Fondo privado:</strong>
                                        Confirmo que SI ___ NO ___, deseo retirar mis cesantías de años anteriores consignadas
                                        por esta compañía en mi cuenta del Fondo de Cesantías _________________________.
                                        (En caso afirmativo la compañía solicitará al fondo la consignación en su cuenta bancaria
                                        de nómina, en caso negativo puede solicitar a la compañía posteriormente cuando lo requiera
                                        al correo electrónico <span style="text-decoration:underline;">nominadiaco@diaco.com.co</span>).
                                    </td>
                                </tr>
                            </table>

                            <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
                                <tr>
                                    <td style="width:24px;vertical-align:top;font-weight:bold;">4.</td>
                                    <td>
                                        <strong>Datos de notificación:</strong>
                                        <table style="width:100%;border-collapse:collapse;margin-top:8px;">
                                            <tr>
                                                <td style="padding:3px 0;width:55%;">Ciudad de Residencia:</td>
                                                <td>&nbsp${sCiudadResidencia}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:3px 0;">Dirección (incluir el barrio/sector):</td>
                                                <td>&nbsp${sDireccion}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:3px 0;">Teléfono:</td>
                                                <td>&nbsp${sTelefono}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:3px 0;">Correo Electrónico:</td>
                                                <td>&nbsp${sEmail}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <p style="text-align:justify;margin:0 0 40px 24px;">
                                Declaró que comprendí la información contenida en esta comunicación y en señal a lo anterior
                                firmo de recibido y enterado.
                            </p>

                            <p style="border-top:1.5px solid #000;width:260px;padding-top:6px;margin:0;">
                                <strong>${sNombre}</strong><br>
                                C.C. ${sCedula}
                            </p>

                        </div>
                    `;

                    const htmlPagina3 = `
                        <div style="${STYLE}width:100%;box-sizing:border-box;padding-top:70px;">

                            <p style="margin:0 0 50px 0;">${sCiudadFirma ? sCiudadFirma + ", " : ""}${localDate}</p>

                            <p style="font-weight:bold;text-align:center;letter-spacing:1px;margin:0 0 28px 0;">
                                EL ÁREA DE GESTIÓN DE PERSONAS
                            </p>

                            <p style="font-weight:bold;text-align:center;letter-spacing:1px;margin:0 0 28px 0;">
                                HACE CONSTAR
                            </p>

                            <p style="text-align:justify;line-height:1.7;margin:30px 0 20px 0;">
                                Que, <strong>${sNombre}</strong> ${sIdentif} con la cédula de ciudadanía número
                                <strong>${sCedula},</strong> estuvo vinculado(a) con nuestra empresa mediante contrato de trabajo 
                                a término <strong>Indefinido</strong>, prestando sus servicios en el <strong>PV MALAMBO</strong> desde el día 
                                <strong>${sfechaContratacion}</strong> hasta el <strong>${sfechaBaja}.</strong>
                            </p>

                            <p style="text-align:justify;line-height:1.7;margin:0 0 45px 0;">
                                A la fecha de su retiro desempeñaba el cargo de <strong>${sCargo}</strong> con un Salario Básico Mensual de <strong>${sSalario}</strong>.
                            </p>

                            <div style="margin-top:110px;">

                                <p style="margin:0 0 20px 0;">Atentamente,</p>

                                <div style="width:40%;">

                                    ${firmaBase64 ? `<img src="${firmaBase64}" style="height:50px;margin-bottom:4px;display:block;">` : ""}

                                    <div style="font-weight:bold;min-height:18px;">
                                        ${empresaData.repNombre}
                                    </div>
                                    <div style="margin-top:2px;font-weight:bold;">
                                        ${empresaData.empresaNombre}
                                    </div>
                                    <div style="margin-top:2px">
                                        Nit. ${empresaData.nit}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    const htmlPagina4 = `
                    
                        <div style="${STYLE}width:100%;box-sizing:border-box;padding-top:90px;">

                            <p style="margin:0 0 20px 0;">${sCiudadFirma ? sCiudadFirma + ", " : ""}${localDate}</p>

                            <p style="margin:0 0 14px 0;">Señor:</p>
                            <p style="font-weight:bold;margin:0 0 14px 0;">${sNombre}</p>


                            <p style="text-align:justify;line-height:1.7;margin:0 0 24px 0;">
                                Encontrará a continuación la solicitud de servicio para la realización de sus exámenes médicos post – 
                                ocupacionales, deberá hacer uso de este servicio dentro de los cinco (5) días hábiles siguientes a la 
                                fecha de este comunicado, de lo contrario daremos por entendido que no se encuentra interesado (a) 
                                en realizar este trámite
                            </p>

                            <div style="margin-top:100px;">

                                <div style="width:40%;">

                                    <p style="text-align:left;margin:0 0 20px 0;">Cordialmente,</p>

                                        ${firmaBase64 ? `<img src="${firmaBase64}" style="height:50px;margin-bottom:4px;display:block;">` : ""}
                                        <strong>${empresaData.repNombre}</strong>
                                    </p>

                                    <p style="font-size:9pt;width:320px;padding-top:2px;margin:0 auto;">
                                        <strong>${empresaData.empresaNombre}</strong>
                                    </p>

                                </div>
                            
                            </div>

                        </div>

                        </div>
                    `;

                    const htmlPagina5 = `
                        <div style="${STYLE}width:100%;box-sizing:border-box;">

                            <p style="margin:0 0 30px 0;">${sCiudadFirma ? sCiudadFirma + ", " : ""}${localDate}</p>
                            <p style="margin:0;">Señor(a):</p>
                            <p style="font-weight:bold;margin:0;">ZONAMEDICA MR SA S</p>
                            <p style="margin:0;">${sDireccion}</p>
                            <p style="margin:0;">${sCiudadFirma}</p>

                            <p style="text-align:justify;line-height:1.7;margin:60px 0 20px 0;">
                                Apreciados Señores:
                            </p>

                            <p style="text-align:justify;line-height:1.7;margin:0 0 40px 0;">
                                Cordialmente solicito sean practicado el examen médico de retiro de 
                                <strong>${sNombre}</strong> ${sIdentif} con la cédula de ciudadanía número 
                                <strong>${sCedula}</strong>, quien desempeñaba el cargo de <strong>${sCargo}</strong>.
                            </p>

                            <p style="text-align:justify;line-height:1.7;margin:60px 0 24px 0;">
                                Favor facturarlos a nombre de ${empresaData.empresaNombre}, Nit.${empresaData.nit}.
                            </p>

                            <p style="margin:0 0 20px 0;">Atentamente,</p>

                            <div style="width:40%;">
                                ${firmaBase64 ? `<img src="${firmaBase64}" style="height:50px;margin-bottom:4px;display:block;">` : ""}
                                <div style="font-weight:bold;min-height:18px;">${empresaData.repNombre}</div>
                                <div style="margin-top:2px;font-weight:bold;">${empresaData.empresaNombre}</div>
                            </div>

                            <p style="width:90%;text-align:justify;line-height:1.5;margin:40px 0 0 0;">
                                <strong>Nota:</strong> Para la realización de sus exámenes médicos post-ocupacionales, 
                                deberá hacer uso de este servicio dentro de los cinco (5) días hábiles siguientes a la 
                                fecha de este comunicado; de lo contrario, daremos por entendido que no se encuentra 
                                interesado en realizar este trámite.
                            </p>

                        </div>`;

                    return [htmlPagina1, htmlPagina2, htmlPagina3, htmlPagina4, htmlPagina5];
                }


                // ── Render PDF ───────────────────────────────────────────────
                const contentBlocks = isCyrgo ? _buildCyrgo() : _buildDiaco();

                const templateFile = isCyrgo
                    ? "templates/pdf/Kit_Retiro_Cyrgo.pdf"
                    : "templates/pdf/hojaDiaco.pdf";

                const existingPdfBytes = await fetch(templateFile).then(res => res.arrayBuffer());
                const pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
                const [templatePage] = pdfDoc.getPages();
                const { width, height } = templatePage.getSize();
                const templatePageImage = await pdfDoc.embedPage(templatePage);

                for (let pageIndex = 0; pageIndex < contentBlocks.length; pageIndex++) {
                    const blockHtml = contentBlocks[pageIndex];
                    const div = document.createElement("div");
                    div.style.width               = "794px";
                    div.style.padding             = "0px";
                    div.style.marginTop           = "-40px";
                    div.style.backgroundColor     = "transparent";
                    div.style.background          = "none";
                    div.style.fontSize            = "12px";
                    div.style.color               = "#000000";
                    div.style.webkitFontSmoothing = "antialiased";
                    div.style.textRendering       = "geometricPrecision";
                    div.style.boxSizing           = "border-box";
                    div.style.position            = "absolute";
                    div.style.top                 = "-9999px";
                    div.style.left                = "-9999px";
                    div.innerHTML                 = blockHtml;
                    document.body.appendChild(div);

                    const realHeight = div.scrollHeight;

                    const canvas = await html2canvasRef(div, {
                        scale:           4,
                        useCORS:         true,
                        backgroundColor: null,
                        logging:         false,
                        height:          realHeight,
                        windowHeight:    realHeight
                    });
                    const imgData = canvas.toDataURL("image/png");
                    document.body.removeChild(div);

                    const img     = await pdfDoc.embedPng(imgData);
                    const newPage = pdfDoc.addPage([width, height]);
                    newPage.drawPage(templatePageImage);

                    const maxH = height - 100;
                    let imgW = width * 0.95;
                    let imgH = (img.height * imgW) / img.width;

                    if (imgH > maxH) {
                        imgH = maxH;
                        imgW = (img.width * imgH) / img.height;
                    }
                    
                    newPage.drawImage(img, {
                        x:      (width - imgW) / 2,
                        y:      height - imgH - 100,
                        width:  imgW,
                        height: imgH
                    });
                }

                pdfDoc.removePage(0);
                pdfDoc.setTitle(`${user.firstName} ${user.lastName} - Kit de Retiro`);

                const pdfBytes = await pdfDoc.save();
                const blob     = new Blob([pdfBytes], { type: "application/pdf" });
                const fileName = `${user.firstName}_${user.lastName}_Kit_Retiro.pdf`;

                const link = document.createElement("a");
                link.href     = URL.createObjectURL(blob);
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }

            MessageToast.show(
                aUsers.length > 1
                    ? `${aUsers.length} documentos generados correctamente.`
                    : "Documento generado correctamente."
            );

        } catch (error) {
            console.error("Error generando el Kit de Retiro:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    return { onDownloadPDFKitRetiro };
});