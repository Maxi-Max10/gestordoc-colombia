sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    async function onDownloadPDFContratoTrabajo(oController, sButtonId) {
        try {
            await oController._ensurePdfToolkit();
            const PDFLibRef = window.PDFLib || oController._pdfLibRef;
            const html2canvasRef = window.html2canvas || oController._html2canvasRef;

            if (!PDFLibRef || !html2canvasRef) {
                throw new Error("No se pudieron cargar las bibliotecas PDF/Canvas requeridas.");
            }

            const aUsers = oController.getSelectedUsers(); //era oController._getSelectedUsers();
            if (aUsers.length === 0) {
                MessageToast.show("Seleccione al menos un colaborador.");
                return;
            }

            for (let i = 0; i < aUsers.length; i++) {
                const data = aUsers[i];

                if (aUsers.length > 1) {
                    MessageToast.show(`Generando documento ${i + 1} de ${aUsers.length}...`);
                }

                // formateo el salario
                const sueldoFormateado = "RD$ " + Number(data.paycompvalue).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });

                // formateo la fecha de inicio
                const fechaStar = new Date(data.hireDateRaw);
                fechaStar.setDate(fechaStar.getDate() + 1);
                const star = oController.formatDateToWords(fechaStar);

                // formateo la fecha de propuesta
                let textoFechaPropuesta = "COMPLETAR";
                if (data.fechaPropuesta && data.fechaPropuesta !== "COMPLETAR") {
                    const fechaPropuesta = new Date(data.fechaPropuesta);
                    fechaPropuesta.setDate(fechaPropuesta.getDate() + 1);
                    textoFechaPropuesta = oController.formatDateToWords(fechaPropuesta);
                }

                // variables auxiliares
                const secondNameVar = data.secondLastName ? data.secondLastName : " ";
                const marital = data.maritalStatus ? data.maritalStatus : "COMPLETAR";
                const nacionalidadVar = data.country === "101" ? "República Dominicana" : "  ";

                let htmlRaw;

                // verifico tipo de contrato
                if (!data.custom02) {
                    MessageToast.show(`Usuario ${data.firstName} ${data.lastName} sin tipo de contrato definido.`);
                    continue;
                }

                // genero HTML según tipo de colaborador
                if (data.custom02 === "Administrativo" || data.custom02 === "Operativo") {
                    htmlRaw = `
                    <p style="text-align: center;"><b><span style="font-size:11.5pt;font-family:Calibri,sans-serif;"><u>CONTRATO DE TRABAJO POR TIEMPO INDEFINIDO</u></span></b></p>
                    <p><br></p>
                    <p style="text-align: justify;">
                      <span style="background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">ENTRE:</span>
                    </p>
                    <p style="text-align: justify;"><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:#000000;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">METALDOM, S.A.</span>
                    <span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">, sociedad comercial organizada y constituida de conformidad con las leyes de la República Dominicana, con el Registro Nacional de Contribuyentes (RNC) marcado con el número 1-01-00484-3, con su domicilio y asiento social establecido en la Autopista Duarte, Km.22 ½, Parque Industrial Duarte (PID), del municipio Santo Domingo Oeste, provincia Santo Domingo, República Dominicana, debidamente representada por su Director Ejecutivo, señor</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:#000000;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;"> JUAN PABLO GARCÍA BAYCE</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">, uruguayo, mayor de edad, casado, portador del Pasaporte Uruguayo No.D095233, domiciliado y residente en la ciudad de Montevideo, República Oriental del Uruguay y accidentalmente en la ciudad de Santo Domingo, Distrito Nacional, capital de la  República Dominicana, la cual en lo que sigue del presente Contrato se denominará </span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:#000000;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">"METALDOM"</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">, o por su denominación social completa, de una parte; y,</span></p>

                    <p style="text-align: justify;"><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"><strong>${data.firstName} ${data.lastName} ${secondNameVar}, </strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">de nacionalidad<strong> ${data.nationality}</strong></span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, mayor de edad, </span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"><strong>${marital}</strong></span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;">, portador(a) de la Cédula de Identidad y Electoral No. </span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"><strong>${data.nationalId}</strong></span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, domiciliado(a) y residente en </span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">${data.state}</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, República Dominicana, quien en lo que sigue del presente Contrato se denominará </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">"EL(LA) COLABORADOR(A)"</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, o por su nombre completo, de la otra parte.</span></p>
                    <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'> </span></strong></p>
                    <p style="text-align: center;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">QUIENES ANTES DE PACTAR DECLARAN LO SIGUIENTE:</span></strong></p>
                    <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'> </span></strong></p>
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">POR CUANTO: METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> es una empresa cuyo principal objeto es la producción y comercialización de materiales de construcción, especialmente laminación de productos de acero, productos planos, alambres y plásticos, tales como varillas, vigas, planchas y láminas de acero, perfiles, mallas, clavos y grapas, la cual está actualmente interesada en contratar los servicios de un  </span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;"><strong>${data.position || data.title}</strong></span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;">.</span></p>
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">POR CUANTO: EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> es una persona que afirma tener el conocimiento, la formación, la habilidad y la experiencia requerida para desempeñarse como  </span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"><strong>${data.position || data.title}</strong></span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">,</span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> </span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">y está interesada en prestarle sus servicios a </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> conforme a las especificaciones, características, modalidades, términos y condiciones establecidas en el presente Contrato;</span></p>           
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">POR CUANTO: METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, después de haber evaluado las informaciones relacionadas a la experiencia laboral técnica y/o profesional de </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, ha decidido contratarlo(a) para la prestación de los servicios antes descritos;</span></p>
                <!--PAGEBREAK-->
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">POR CUANTO:</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> Ambas partes, de común acuerdo, han expresado y manifestado su intención inequívoca de comprometerse voluntariamente al cumplimiento de las obligaciones que surgen a consecuencia de la firma del presente Contrato, y de hacerlo de buena fe;</span></p>
                    
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">POR TANTO: </span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">Y en el expreso entendido de que el anterior preámbulo forma parte integral del presente Contrato, las partes, libre y voluntariamente,</span></p>
                    <p><br></p>
                    <p style="text-align: center;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">HAN CONVENIDO Y PACTADO LO SIGUIENTE:</span></strong></p>
                    <p><br></p>
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">ARTÍCULO PRIMERO: </span></strong><strong><u><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">Objeto del Contrato y Modalidad de Prestación del Servicio</span></u></strong><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">.- </span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">Por medio del presente documento, </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM </span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">conviene en contratar, como al efecto contrata, a </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, quien acepta, para que provea sus servicios como  </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">${data.position || data.title}</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> de </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, en una relación de dependencia y subordinación, de conformidad con las especificaciones, características, modalidades, términos y condiciones establecidas en el presente Contrato, en los demás documentos que se anexan, que se refieren y/o que forman parte integral del mismo, así como en los procedimientos, políticas y directrices, tanto operacionales como corporativas, que de tiempo en tiempo sean aprobadas y/o aplicadas por </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">.</span></p> 
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">PÁRRAFO I:</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> En el ejercicio de sus funciones, </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> laborará de manera presencial en las instalaciones y centro de trabajo de </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> ubicado en la ciudad o provincia de Provincia Santo Domingo, República Dominicana, ocupando la posición de  </span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"><strong>${data.position || data.title}</strong></span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> del Área o Departamento de </span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">${data.department}</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> de la dirección de </span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">${data.division}</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">. En dicha posición, se reportará directamente al </span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">${data.positionSup || 'supervisor'}</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, siendo la persona que ocupe dicho puesto su supervisor inmediato, al cual puede contactar al teléfono</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> ${data.businessPhone ? data.businessPhone.split('x')[0] : ''} </span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">y/o al correo electrónico</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> ${data.email || ''}</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, para requerir cualquier información relativa al desempeño de sus funciones.</span></p>        
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">PÁRRAFO II:</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> Las responsabilidades que </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> asume al amparo del presente Contrato, son las contenidas en la descripción de puesto anexa a este Contrato, la cual forma parte integral del mismo.</span></p>
              
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">PÁRRAFO III:</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> La descripción de responsabilidades que figura anexa a este Contrato es puramente enunciativa y no limitativa. En consecuencia, </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> estará obligado(a) a proveer cualquier servicio que se relacione con las funciones para las que ha sido contratado(a), sin que implique remuneración adicional a la aquí estipulada. En ese sentido, </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> acepta las variaciones que </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> realice en la descripción de su puesto y/o en la forma o modalidad de prestación del servicio, en interés de mejorar las operaciones de la empresa y la productividad del servicio brindado.</span></p>
                <!--PAGEBREAK-->    
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">PÁRRAFO IV: EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> reconoce, acepta y declara que los términos y condiciones establecidas en el Manual de Ética y Código de Conducta, documentos que le están siendo entregados a </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> por </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> al momento de la firma del presente Contrato, constituyen políticas, lineamientos y reglamentaciones internas de </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> que forman parte integral del presente Contrato, y cuyo contenido y alcance </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> declara conocer, obligándose a cumplir fiel y oportunamente con las disposiciones establecidas en dichos documentos, de la misma forma en que se obliga a cumplir con las disposiciones establecidas en el presente Contrato. Cualquier variación, ajuste, cambio o modificación que de manera unilateral pueda realizar </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> a los referidos documentos, entrará en vigencia inmediatamente y también formará parte integral del presente Contrato.</span></p>
                    
                   
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">PÁRRAFO:</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> Cuando a requerimiento de </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> el presente Contrato se esté ejecutando en la modalidad especial de trabajo a distancia o teletrabajo, aplicarán además las siguientes condiciones:</span></p>
                    
                    <ol style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;">
                        <li>
                            <p style="text-align: justify;">
                                <span>El cumplimiento de la jornada de trabajo por parte de </span>
                                <strong><span>EL(LA) COLABORADOR(A)</span></strong>
                                <span> será supervisado por </span>
                                <strong><span>METALDOM</span></strong>
                                <span> a través del monitoreo de la actividad registrada a través de los equipos, facilidades y herramientas de trabajo asignadas por </span>
                                <strong><span>METALDOM</span></strong>
                                <span> a </span>
                                <strong><span>EL(LA) COLABORADOR(A)</span></strong>
                                <span>, entre las que se incluyen, de manera enunciativa y no limitativa, las computadoras portátiles o laptops, los teléfonos móviles o celulares, el correo electrónico, las conexiones a la red privada virtual (VPN), los sistemas y aplicaciones de mensajería instantánea, y los programas y softwares para llamadas y videoconferencias;</span>
                            </p>
                        </li>
                        <li>
                            <p style="text-align: justify;">
                                <strong><span>METALDOM</span></strong>
                                <span> se reservará en todo momento el derecho de verificar las condiciones del lugar de trabajo de </span>
                                <strong><span>EL(LA) COLABORADOR(A)</span></strong>
                                <span>, tanto al inicio de la implementación de cualquier modalidad de trabajo a distancia o teletrabajo, como durante la ejecución de la misma;</span>
                            </p>
                        </li>
                    </ol>

            <!--PAGEBREAK-->
                    <ol start="3">
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> asignará a </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, en calidad de préstamo a uso o comodato, una computadora portátil o laptop y sus accesorios, en buen estado y óptimas condiciones de uso y funcionamiento, con la configuración de su dirección de correo electrónico corporativo, de sistemas y aplicaciones de mensajería instantánea y de conexión a la red privada virtual (VPN) de </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, y la instalación de los programas y softwares para llamadas y videoconferencias, que le permita realizar su trabajo a distancia o de manera remota. Para los casos que aplique, atendiendo a los distintos niveles de la estructura organizacional y a las políticas establecidas por </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, a </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> se le asignará además un teléfono móvil o celular con las especificaciones que </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> considere apropiadas para que </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> pueda realizar bien su trabajo;</span></p>
                        </li>
                    </ol>
              
                    <ol start="4">
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> asumirá por su cuenta el costo de los equipos, facilidades y herramientas de trabajo descritas anteriormente, que sean asignadas a </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> para el desempeño de sus funciones. </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> no asumirá el costo de ningún otro equipo, facilidad o herramienta de trabajo distinto a los descritos anteriormente;</span></p>
                        </li>
                    </ol>
                    
                    <ol start="5">
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> reconoce que los equipos, facilidades y herramientas de trabajo descritas anteriormente, deben ser utilizados por éste(a) principalmente para las actividades relacionadas directamente con el desempeño de las funciones que les son encomendadas en su calidad de colaborador(a) de </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">. En consecuencia, </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> no deberá permitir el uso de los referidos equipos, facilidades y herramientas de trabajo por parte de terceros;</span></p>
                        </li>
                    </ol>
                
                    <ol start="6">
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> asume por su cuenta, costo y riesgo la responsabilidad de la guarda, conservación y cuidado, como buen padre de familia, de los equipos, facilidades y herramientas de trabajo descritas anteriormente, durante toda la vigencia y duración del presente Contrato y mientras las mismas se encuentren en su posesión, y se compromete a devolverlas a </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, en el mismo buen estado y óptimas condiciones de uso y funcionamiento en que le fueron asignadas, inmediatamente se produzca la terminación del presente Contrato por la causa que fuere;</span></p>
                        </li>
                    </ol>
                    <ol start="7">
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">Siempre que las necesidades de la empresa así lo requieran, y siempre que las condiciones así lo permitan, es decir, que no se haya verificado la ocurrencia de algún evento, situación o circunstancia de caso fortuito o de fuerza mayor, mientras el presente Contrato se esté ejecutando en la modalidad especial de trabajo a distancia o teletrabajo, las partes podrán acordar la posibilidad de que </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> realice su trabajo de manera presencial en las instalaciones y el centro de trabajo de </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, durante uno o varios días, a los fines de evitar la fatiga informática y propiciar la interacción con sus demás compañeros de trabajo;</span></p>
                        </li>
                    </ol>
                    <ol start="8">
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> se compromete a mantener prácticas que promuevan la conciliación de la vida laboral y la vida privada, personal o familiar de </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, ofreciendo a sus colaboradores como propuesta de valor, un ambiente y clima de trabajo saludable, equilibrado y balanceado en términos vida - trabajo;</span></p>
                        </li>
                    </ol>
              <!--PAGEBREAK-->
                    <ol start="9">
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> reconoce y respeta el derecho de desconexión digital que le asiste a </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, que le permite, salvo en casos de emergencias del empleador en relación con el servicio contratado, no contestar requerimientos y/o mensajes de trabajo fuera de su jornada normal y habitual de trabajo. Sin perjuicio de lo anterior, las partes acuerdan que mientras el presente Contrato se esté ejecutando en la modalidad especial de trabajo a distancia o teletrabajo, aplicarán las mismas disposiciones establecidas por el Código de Trabajo de la República Dominicana, en lo que se refiere a las horas extraordinarias de trabajo y a las jornadas diurnas, nocturnas y mixtas;</span></p>
                        </li>
                    </ol>
                
                    <ol start="10">
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM </span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">reconoce que </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> disfrutará de los mismos períodos intermedios de descanso y descansos semanales y de días feriados establecidos por el Código de Trabajo de la República Dominicana; y,</span></p>
                        </li>
                    </ol>
                    <ol start="11">
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> reconoce, acepta y declara haber recibido información y orientación de parte de </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> sobre: i) los requisitos de seguridad e higiene que debe mantener en su lugar y puesto de trabajo; ii) las condiciones necesarias para la prestación del servicio contratado; iii) los riesgos específicos de su trabajo; y, iv) las medidas preventivas necesarias que debe adoptar, en función de las normativas dictadas por la Dirección General de Higiene y Seguridad Industrial (DGHSI) del Ministerio de Trabajo de la República Dominicana. En consecuencia, </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> se compromete y obliga a cumplir en todo momento, de manera fiel y oportuna, con dichas medidas.</span></p>
                        </li>
                    </ol>
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">ARTÍCULO TERCERO: </span></strong><strong><u><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">Jornada de Trabajo</span></u></strong><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">.-</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> La jornada normal de trabajo a que estará sujeta </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> será de hasta cuarenta y cuatro (44) horas por semana, en horario de lunes a jueves de ocho de la mañana (8:00a.m.) a cinco de la tarde (5:00p.m.), y los viernes de ocho de la mañana (8:00a.m.) a cuatro de la tarde (4:00p.m.), en las localidades establecidas por </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">.</span></p>
                    
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">PÁRRAFO I:</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> Sin perjuicio de lo anterior, </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> reconoce, acepta y declara que </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> podrá requerir la prestación de sus servicios en cualquiera de los horarios rotativos descritos más abajo, los cuales serán debidamente notificados a </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> en atención a los servicios prestados por éste(a), y de conformidad con las disposiciones previstas por el Código de Trabajo de la República Dominicana. A saber:</span></p>
              <!--PAGEBREAK-->
                    <p style="text-align: justify;"><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"><u>Colaboradores Operativos</u></span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">:</span></p>
                    <ol>
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">De siete de la mañana (7:00a.m.) a tres de la tarde (3:00p.m.)</span></p>
                        </li>
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">De tres de la tarde (3:00p.m.) a once de la noche (11:00p.m.)</span></p>
                        </li>
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">De once de la noche (11:00p.m.) a siete de la mañana (7:00a.m.)</span></p>
                        </li>
                    </ol>
                    <p style="text-align: justify;"><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"><u>Colaboradores Administrativos</u></span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">:</span></p>
                    <ol>
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">De siete de la mañana (7:00a.m.) a cuatro de la tarde (4:00p.m.)</span></p>
                        </li>
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">De ocho de la mañana (8:00a.m.) a cinco de la tarde (5:00p.m.)</span></p>
                        </li>
                        <li style="list-style-type:lower-roman;font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                            <p style="text-align: justify;"><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">De nueve de la mañana (9:00a.m.) a seis de la tarde (6:00p.m.)</span></p>
                        </li>
                    </ol>
              <p><br></p>
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">PÁRRAFO II:</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> Ha sido convenido por las partes que </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> disfrutará de un período de catorce (14) días laborables por concepto de vacaciones anuales.</span></p>
                    
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">ARTÍCULO CUARTO: </span></strong><strong><u><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">Salario y Compensación</span></u></strong><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">.-</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> Las partes han convenido que como contraprestación del trabajo que </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> realizará a favor de </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, éste(a) devengará un salario de </span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">${data.payCompValueWord} (${sueldoFormateado}),</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> por cada mes de servicio prestado, pagaderos quincenalmente a más tardar los días catorce (14) y veintiocho (28) de cada mes.</span></p>
                   
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">PÁRRAFO I:</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A) </span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">reconoce, acepta y declara que a la suma indicada anteriormente por concepto de salario y compensación, así como a cualquier otra compensación complementaria que le sea otorgada a </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, le serán retenidos y/o deducidos por </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, en su calidad de agente de retención, cualesquiera tipo de impuestos, contribuciones, cotizaciones y otros aportes establecidos por la legislación dominicana, que afecten, graven o puedan gravar en el futuro, la prestación de estos servicios, especialmente aquellos impuestos que se derivan de las rentas o ingresos percibidos por </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">, así como cualquier otro descuento aplicable por deudas contraídas por </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> frente a </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> durante la vigencia de la relación laboral.</span></p>
                    
                     <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">PÁRRAFO II:</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> En adición a la remuneración económica indicada precedentemente, </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> conviene otorgar a </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A) </span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">las compensaciones complementarias que se establecen en la siguiente relación:</span></p>
               <!--PAGEBREAK-->    
                    <div align="left">
                      <table style="border: none; border-collapse: collapse; width: 100%;">
                        <tbody>
                          <tr>
                            <td style="width: 180pt;border: 1pt solid black;padding: 0cm 5.4pt;height: 9.85pt;vertical-align: top;">
                                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Compensación</span></strong></p>
                            </td>
                            <td style="width: 234pt;border-top: 1pt solid black;border-right: 1pt solid black;border-bottom: 1pt solid black;border-image: initial;border-left: none;padding: 0cm 5.4pt;height: 9.85pt;vertical-align: top;">
                                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Importe</span></strong></p>
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 180pt;border-right: 1pt solid black;border-bottom: 1pt solid black;border-left: 1pt solid black;border-image: initial;border-top: none;padding: 0cm 5.4pt;vertical-align: top;">
                                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Subsidio de Almuerzo</span></p>
                            </td>
                            <td style="width: 234pt;border-top: none;border-left: none;border-bottom: 1pt solid black;border-right: 1pt solid black;padding: 0cm 5.4pt;vertical-align: top;">
                                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>90%</span></p>
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 180pt;border-right: 1pt solid black;border-bottom: 1pt solid black;border-left: 1pt solid black;border-image: initial;border-top: none;padding: 0cm 5.4pt;vertical-align: top;">
                                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Subsidio de Transporte</span></p>
                            </td>
                            <td style="width: 234pt;border-top: none;border-left: none;border-bottom: 1pt solid black;border-right: 1pt solid black;padding: 0cm 5.4pt;vertical-align: top;">
                                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Servicio de transporte de acuerdo a rutas</span></p>
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 180pt;border-right: 1pt solid black;border-bottom: 1pt solid black;border-left: 1pt solid black;border-image: initial;border-top: none;padding: 0cm 5.4pt;vertical-align: top;">
                                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Regalía</span></p>
                            </td>
                            <td style="width: 234pt;border-top: none;border-left: none;border-bottom: 1pt solid black;border-right: 1pt solid black;padding: 0cm 5.4pt;vertical-align: top;">
                                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Un salario</span></p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                <p><br></p>
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">PÁRRAFO III:</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> El pago del salario y demás compensaciones de </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">EL(LA) COLABORADOR(A)</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> podrá ser realizado, a elección de </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">,</span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> </span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">mediante la emisión de cheques, depósito en cuentas bancarias o en efectivo. Asimismo, las partes reconocen, aceptan y declaran que los demás aspectos relativos a compensaciones y beneficios se regirán, según el caso, por la oferta formal de empleo realizada por </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">METALDOM</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;"> y aceptada por </span><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">
                    <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
                    <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>ART&Iacute;CULO CUARTO: <u>Vigencia del Contrato</u>.-</span></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;El presente Contrato entra en vigencia en fecha ${star}, independientemente de la fecha de su firma y suscripci&oacute;n, y su duraci&oacute;n ser&aacute; indefinida. Las partes podr&aacute;n variar de com&uacute;n acuerdo la fecha de inicio de labores de <strong>EL(LA) COLABORADOR(A)</strong>.</span></p>
                    <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
                    <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>P&Aacute;RRAFO I:</span></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;En caso de terminaci&oacute;n del contrato de trabajo por la causa que fuere, <strong>EL(LA) COLABORADOR(A)</strong> se obliga a que por un per&iacute;odo no menor de un (1) a&ntilde;o contado a partir de la fecha de la referida terminaci&oacute;n, no inducir&aacute; o intentar&aacute; inducir a ning&uacute;n colaborador de <strong>METALDOM</strong> a terminar su relaci&oacute;n de trabajo, y no incurrir&aacute; ni promover&aacute; ninguna acci&oacute;n en el presente o en el futuro cuyo objeto sea interrumpir, interferir, afectar y/o perjudicar las operaciones de <strong>METALDOM</strong>.</span></p>
                    <!--PAGEBREAK-->
                    <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>ART&Iacute;CULO QUINTO: <u>Responsabilidades de EL(LA) COLABORADOR(A)</u>.- EL(LA) COLABORADOR(A)</span></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;se obliga a desempe&ntilde;ar su trabajo con laboriosidad, cuidado y esmero en la forma, el tiempo y el lugar convenidos, as&iacute; como a dar fiel cumplimiento a todas las disposiciones de las leyes y reglamentos de la autoridad p&uacute;blica y a los sistemas, normas, procedimientos t&eacute;cnicos, administrativos, disciplinarios y de seguridad establecidos por <strong>METALDOM</strong>.</span></p>
                    <p style='margin:0cm;font-size:13px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></strong></p>
                    <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>ART&Iacute;CULO SEXTO: <u>Confidencialidad</u>.-</span></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;<strong>EL(LA) COLABORADOR(A)</strong> acuerda que las informaciones a que tenga acceso o maneje como resultado de las labores acordadas en este Contrato, as&iacute; como cualquier informaci&oacute;n que reciba durante su vigencia relacionada con asuntos t&eacute;cnicos, financieros u operacionales de <strong>METALDOM</strong>, ser&aacute;n tratados con absoluta discreci&oacute;n y no podr&aacute;n ser divulgados a otras firmas u organizaciones, incluyendo a personas amigas, familiares o relacionados.&nbsp;</span></p>
                    <p style='margin:0cm;font-size:13px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
                    <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>P&Aacute;RRAFO:</span></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;Las informaciones que intercambien las partes: (1) Ser&aacute;n tratadas de forma confidencial por <strong>EL(LA) COLABORADOR(A)</strong> y s&oacute;lo ser&aacute;n utilizadas por &eacute;ste(a) para proveer a <strong>METALDOM</strong> los servicios descritos en este Contrato; y, (2) No ser&aacute;n reproducidas o copiadas, total o parcialmente, salvo autorizaci&oacute;n previa, expresa, formal y por escrito de <strong>METALDOM</strong>. Las partes convienen, asimismo, que esta obligaci&oacute;n de confidencialidad se mantendr&aacute; vigente durante la prestaci&oacute;n de los servicios contratados y a&uacute;n se produjere la terminaci&oacute;n del presente Contrato por mutuo acuerdo, desahucio, despido o dimisi&oacute;n, por un per&iacute;odo no menor de dos (2) a&ntilde;os siguientes a la fecha efectiva de la referida terminaci&oacute;n.</span></p>
                    <p style='margin:0cm;font-size:13px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
                    <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>ART&Iacute;CULO S&Eacute;PTIMO: <u>Cambios en el Domicilio</u>.- EL(LA) COLABORADOR(A)</span></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;se obliga a mantener informada a <strong>METALDOM</strong> de los cambios que se produzcan en su domicilio. Mientras no lo haga, ser&aacute;n v&aacute;lidas todas las notificaciones que fueren hechas en el domicilio indicado en el presente Contrato.</span></p>
                    <p style='margin:0cm;font-size:13px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
                    <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>ART&Iacute;CULO OCTAVO: <u>Ley Aplicable</u>.-</span></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;Este Contrato se regir&aacute; bajo las leyes de la Rep&uacute;blica Dominicana y se remite a las disposiciones del derecho laboral dominicano para todo aquello que no haya sido previsto o pactado de manera expresa por las partes.</span></p>
                    <p style='margin:0cm;font-size:13px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></strong></p>
                    <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>HECHO Y FIRMADO</span></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;en cuatro (4) originales de un mismo tenor y efectos, uno (1) para cada una de las partes contratantes, y dos (2) para ser remitidos al Departamento de Trabajo del Ministerio de Trabajo. En el municipio Santo Domingo Oeste, provincia Santo Domingo, Rep&uacute;blica Dominicana, a los ${star}</span></p>

                    <p style='margin:0cm;font-size:15px;font-family:"Times New Roman",serif;'><span style='font-size:15px;font-family:"Calibri",sans-serif;'>&nbsp;</span></p>
                    <p style='margin:0cm;font-size:11px;font-family:"Times New Roman",serif;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Por<strong>&nbsp;METALDOM</strong>:&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;&nbsp; &nbsp; &nbsp;Por<strong>&nbsp;EL(LA) COLABORADOR(A)</strong>:</span></p>
                    <p><br></p>
                    <p style="text-align: justify;"><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">_______________________________</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">&nbsp;</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">&nbsp;</span><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">_______________________________</span></p>
                    <p style="text-align: justify;"><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">JUAN PABLO GARCÍA BAYCE</span></strong><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;">&nbsp; &nbsp;&nbsp;</span></strong><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">&nbsp; &nbsp;&nbsp;</span></strong><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">&nbsp; &nbsp;&nbsp;</span></strong><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">&nbsp; &nbsp;&nbsp;</span></strong><strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;</span></strong><span style="font-size:11.5pt;font-family:Calibri,sans-serif;"><strong>${data.firstName} ${data.lastName} ${secondNameVar}</strong></span></p>
                    <p style="text-align: justify;"><span style="font-size:11.5pt;font-family:Calibri,sans-serif;color:black;">Director Ejecutivo</span></p>
                    <p><br></p>`
                    } else {
            sap.m.MessageToast.show("Usuario/s sin datos");
            return;
          }
          if (sButtonId === "container-gestordoccolombia---View1--wordDataInfo") {
            const header = `
              <html xmlns:o='urn:schemas-microsoft-com:office:office'
                    xmlns:w='urn:schemas-microsoft-com:office:word'
                    xmlns='http://www.w3.org/TR/REC-html40'>
                <head><meta charset='utf-8'><title>Documento Word</title></head><body>`;
            const footer = "</body></html>";
            const fullHTML = header + htmlRaw + footer;
                    
                    const blob = new Blob(['\ufeff', fullHTML], {
                        type: "application/msword"
                    });
                    
                    const fileName = `${data.firstName}_${data.lastName}_Contrato_Trabajo.doc`;
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);

                } else {
                    const contentBlocks = htmlRaw.split("<!--PAGEBREAK-->");
                    const existingPdfBytes = await fetch("pdf/hojaMetaldom.pdf").then(res => res.arrayBuffer());
                    const pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
                    const [templatePage] = pdfDoc.getPages();
                    const { width, height } = templatePage.getSize();
                    const templatePageImage = await pdfDoc.embedPage(templatePage);

                    for (const blockHtml of contentBlocks) {
                        const div = document.createElement("div");
                        div.style.width = "794px";
                        div.style.height = "775px";
                        div.style.padding = "40px";
                        div.style.backgroundColor = "white";
                        div.style.fontSize = "14px";
                        div.style.boxSizing = "border-box";
                        div.style.position = "absolute";
                        div.style.top = "-9999px";
                        div.innerHTML = blockHtml;
                        document.body.appendChild(div);

                        const canvas = await html2canvasRef(div, {
                            scale: 2,
                            useCORS: true
                        });
                        const imgData = canvas.toDataURL("image/png");
                        
                        // Eliminar del DOM
                        document.body.removeChild(div);

                        const img = await pdfDoc.embedPng(imgData);
                        const newPage = pdfDoc.addPage([width, height]);
                        newPage.drawPage(templatePageImage);

                        const imgWidth = width * 0.9;
                        const imgHeight = (img.height * imgWidth) / img.width;

                        newPage.drawImage(img, {
                            x: (width - imgWidth) / 2,
                            y: height - imgHeight - 130,
                            width: imgWidth,
                            height: imgHeight,
                        });
                    }
                    
                    pdfDoc.removePage(0);
                    const pdfBytes = await pdfDoc.save();
                    
                    const fileName = `${data.firstName}_${data.lastName}_Contrato_Trabajo.pdf`;
                    const blob = new Blob([pdfBytes], { type: "application/pdf" });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = fileName;
                    link.click();
                    
                    URL.revokeObjectURL(link.href);
                }
            }

            const mensaje = aUsers.length > 1 
                ? `${aUsers.length} documentos generados correctamente.`
                : "Documento generado correctamente.";
            MessageToast.show(mensaje);

        } catch (error) {
            console.error("Error generando el documento:", error);
            MessageToast.show("Error generando el documento: " + error.message);
        }
    }

    return {
        onDownloadPDFContratoTrabajo
    };
});