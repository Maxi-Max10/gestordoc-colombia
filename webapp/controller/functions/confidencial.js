sap.ui.define([
  "sap/m/MessageToast",
  "gestordoccolombia/controller/helpers/pdfGenerator"
], (MessageToast) => {
  "use strict";

  async function onDownloadPDFConfidencialidad(oController, sButtonId) {
    try {
     
      await oController._ensurePdfToolkit();
      const PDFLibRef = window.PDFLib || oController._pdfLibRef;
      const html2canvasRef = window.html2canvas || oController._html2canvasRef;

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

        if (aUsers.length > 1) {
          MessageToast.show(`Generando documento ${i + 1} de ${aUsers.length}...`);
        }

        const segundoNombre = user.secondLastName || "";
        const marital = user.maritalStatus || "COMPLETAR";
        const countryVar = user.country === '101' ? "República Dominicana" : "";

        console.log("Procesando usuario:", user);

        const htmlRaw = `
              <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:center;'><strong><span style='font-family:"Calibri",sans-serif;color:black;'>DECLARACI&Oacute;N JURADA DE CONFIDENCIALIDAD DEL EMPLEADO</span></strong></p>
              <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;'>&nbsp;</span></p>
              <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;'>&nbsp;</span></p>
              <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Yo, <strong>`+ user.firstName + ` ` + user.lastName + ` ` + segundoNombre + `</strong>, de nacionalidad <strong>` + user.nationality + `</strong>, mayor de edad, <strong>` + marital + `</strong>, <span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>portador(a) de la C&eacute;dula de Identidad y Electoral No.</span><strong>` + user.nationalId + `</strong>, domiciliado(a) y residente en <strong>` + user.state + `, ` + countryVar + `</strong>, por medio del presente documento, declaro <span style="color:black;">libre y voluntariamente, bajo la fé del juramento, lo siguiente:</span></span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><u><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'><u>PRIMERO</u></span></u></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>: Que acepto las funciones y reconozco las pol&iacute;ticas y procedimientos de <strong>METALDOM, S.A.</strong>, sociedad comercial organizada y constituida de conformidad con las leyes de la Rep&uacute;blica Dominicana, con el Registro Nacional de Contribuyentes (RNC) marcado con el n&uacute;mero 1-01-00484-3, con su domicilio y asiento social establecido en la Autopista Duarte, Km.22 &frac12;, Parque Industrial Duarte (PID), del municipio Santo Domingo Oeste, provincia Santo Domingo, Rep&uacute;blica Dominicana (en lo adelante, <strong>&ldquo;METALDOM&rdquo;</strong>).</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><u><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'><u>SEGUNDO</u></span></u></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>: Que me comprometo a preservar con car&aacute;cter de confidencialidad y a no divulgar, a terceras personas dentro y fuera de <strong>METALDOM</strong>, las siguientes informaciones clasificadas como Confidencial por <strong>METALDOM</strong>:&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>A. <strong><u>SOBRE LOS CLIENTES</u></strong>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;'>&nbsp;</span></p>
  <ol style="list-style-type: decimal; margin-left: 20px; padding-left: 5px; color:black;">
    <li>
      <p style='margin:0cm; font-size:16px; font-family:"Times New Roman",serif; text-align:justify;'>
        <span style='font-size:15px; font-family:"Calibri",sans-serif;'>
          <strong><em>Información demográfica o legal de los clientes</em></strong>: cualquier información sobre el cliente es <strong>ALTAMENTE CONFIDENCIAL</strong> (nombres de clientes, nombres de sus relacionados o contactos, direcciones, números de teléfonos, celulares, fax, correo electrónico, tipo de actividad u otros).
        </span>
      </p>
    </li>
    <li>
      <p style='margin:0cm; font-size:16px; font-family:"Times New Roman",serif; text-align:justify;'>
        <span style='font-size:15px; font-family:"Calibri",sans-serif;'>
          <strong>Información de cuentas o tipo de negocios del cliente</strong>.
        </span>
      </p>
    </li>
    <li>
      <p style='margin:0cm; font-size:16px; font-family:"Times New Roman",serif; text-align:justify;'>
        <span style='font-size:15px; font-family:"Calibri",sans-serif;'>
          <strong>Información sobre el estado de cuenta del cliente</strong>: monto de(l) producto(s) vendido(s); si hubo alguna concesión o descuento; si el cliente está al día en sus pagos; si tiene atraso en algún pago por cualquier concepto; en caso de tener deuda, el monto; acuerdos de pagos si existen, entre otros.
        </span>
      </p>
    </li>
    <li>
      <p style='margin:0cm; font-size:16px; font-family:"Times New Roman",serif; text-align:justify;'>
        <span style='font-size:15px; font-family:"Calibri",sans-serif;'>
          <strong>TODOS LOS DOCUMENTOS</strong> que tienen la firma de los clientes deben ser tratados como confidenciales: cheques, cartas de correspondencia o instrucciones, e-mails, etc.
        </span>
      </p>
    </li>
  </ol>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>B. <u>SOBRE EL PLAN ESTRAT&Eacute;GICO</u>&nbsp;</span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Toda informaci&oacute;n relacionada con la estrategia del negocio:&nbsp;</span></p>
      <ul style="margin-bottom:0cm;margin-top:0cm;" type="circle">
          <li style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Proyectos</span></li>
          <li style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Objetivos y estrategias&nbsp;</span></li>
          <li style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Fechas en que se cumplir&aacute;n dichas estrategias&nbsp;</span></li>
          <li style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Presupuesto requerido</span></li>
          <li style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Ejecuci&oacute;n del plan</span></li>
      </ul>
      <!--PAGEBREAK-->
  
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>C. <u>SOBRE VENTAS Y MERCADEO</u>&nbsp;</span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <ol style="list-style-type: decimal;margin-left: 3.5px;">
          <li><span style='font-family:"Calibri",sans-serif;font-size:15px;color:black;'>Informaciones sobre estrategias de ventas, segmentaci&oacute;n del mercado, precios, y mix de productos, y volumen de ventas.&nbsp;</span></li>
          <li><span style='font-family:"Calibri",sans-serif;font-size:15px;color:black;'>Pol&iacute;ticas de ventas y cobros.</span></li>
          <li><span style='font-family:"Calibri",sans-serif;font-size:15px;color:black;'>Metas de ventas de los ejecutivos de ventas y remuneraci&oacute;n.&nbsp;</span></li>
          <li><span style='font-family:"Calibri",sans-serif;font-size:15px;color:black;'>Toda la informaci&oacute;n relacionada con el trabajo de Mercadeo: campa&ntilde;as publicitarias de la instituci&oacute;n, eventos relacionados, excepto por las informaciones del conocimiento p&uacute;blico.&nbsp;</span></li>
      </ol>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>D. <u>SOBRE LA ORGANIZACI&Oacute;N</u>&nbsp;</span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><em><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'><u>De los empleados</u></span></em><em><span style='font-size:15px;font-family:"Calibri",sans-serif;'>:<u>&nbsp;</u></span></em></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Informaci&oacute;n personal de los compa&ntilde;eros de trabajo, supervisores, gerentes, directores, en fin, empleados en general: nombres, direcciones, n&uacute;mero de c&eacute;dula, n&uacute;meros de tel&eacute;fonos de domicilio/celular, nombres de familiares cercanos (padres, c&oacute;nyuges, hijos).</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><em><u><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'><span style="text-decoration:none;">&nbsp;</span></span></u></em></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><em><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'><u>De Recursos Humanos</u>:&nbsp;</span></em></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:13.5pt;text-align:justify;text-indent:-13.5pt;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>1. Datos sobre la organizaci&oacute;n: organigramas, nombres de cargos, descripciones de puestos, traslados, promociones, Planes de Carrera, cancelaciones, salarios, carnets de empleados (se recomienda quitarse el carnet al terminar sus labores).&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:13.5pt;text-align:justify;text-indent:-13.5pt;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>2. Toda informaci&oacute;n relacionada con procesos y procedimientos internos.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:13.5pt;text-align:justify;text-indent:-13.5pt;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:13.5pt;text-align:justify;text-indent:-13.5pt;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>E. <u>SOBRE LOS ACCIONISTAS</u>&nbsp;</span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:13.5pt;text-align:justify;text-indent:-13.5pt;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:13.5pt;text-align:justify;text-indent:-13.5pt;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>1. Todos los documentos que tienen la firma de los funcionarios (due&ntilde;os) de <strong>METALDOM</strong> autorizados para la aprobaci&oacute;n de transacciones monetarias o acciones legales deben ser tratados como confidenciales: cheques de administraci&oacute;n, Estados Financieros, cartas de correspondencia, memorandum&rsquo; s internos, contratos, desembolsos, formularios internos, etc.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:13.5pt;text-align:justify;text-indent:-13.5pt;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>2. Todo dato relativo a asuntos personales de los accionistas: incluyendo informaci&oacute;n relacionadas a sus familiares cercanos: padres/c&oacute;nyuge/hijos.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <!--PAGEBREAK-->
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>F. <u>SOBRE LAS FINANZAS</u></span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:13.5pt;text-align:justify;text-indent:-13.5pt;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>1. Toda informaci&oacute;n relacionada con los Presupuestos de <strong>METALDOM</strong>.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:72.0pt;text-align:justify;text-indent:-72.0pt;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>2. Toda informaci&oacute;n relacionada a Estados Financieros.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:13.5pt;text-align:justify;text-indent:-13.5pt;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>3. Toda informaci&oacute;n relacionada a informes o recomendaciones de asesores y auditores en la materia.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:13.5pt;text-align:justify;text-indent:-13.5pt;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>4. Informaciones sobre los Activos Fijos, su ubicaci&oacute;n, costo, y estado; adquisici&oacute;n de nuevas propiedades, remodelaciones, entre otros.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:13.5pt;text-align:justify;text-indent:-13.5pt;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>5. Cheques, registros de cheques.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:13.5pt;text-align:justify;text-indent:-13.5pt;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>6. Cuentas bancarias, entre otros.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>G. <u>SOBRE OPERACIONES&nbsp;</u></span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>1. M&eacute;todos de producci&oacute;n&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>2. Est&aacute;ndares internos&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>3. Informaci&oacute;n de costos de transformaci&oacute;n&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>4. Parametrizaci&oacute;n de la planta&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>5. Capacidades y % utilizaci&oacute;n, etc.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>6. Programas de mantenimiento a equipos, entre otros.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>7. Datos relativos a Generaci&oacute;n&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>H. <u>SOBRE SUPLIDORES, CONTRATISTAS, ASESORES, AUDITORES EXTERNOS O CUALQUIER ENTIDAD QUE PRESTA SERVICIOS &nbsp;METALDOM</u></span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>1. Nombres, direcciones, datos demogr&aacute;ficos.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>2. Tipo de servicio que recibe<strong>&nbsp;METALDOM</strong>.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>3. Precios&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>4. Cotizaciones&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>5. Vol&uacute;menes de facturaci&oacute;n&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>6. Formas de pago&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>7. Contratos firmados entre <strong>METALDOM</strong> y &eacute;stos.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>I. <u>SOBRE INSTALACIONES</u></span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Todas las informaciones sobre las edificaciones y per&iacute;metro de <strong>METALDOM</strong>:&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>1. Instalaciones el&eacute;ctricas o fuentes de energ&iacute;a&nbsp;</span></p>
      
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>2. Instalaciones telef&oacute;nicas&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>3. Fuente de agua&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>4. Equipos de seguridad electr&oacute;nica: controles de acceso, sistemas de alarma contra robo.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>5. Salidas de emergencia&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>6. Tipo de vigilancia&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>7. Planes de contingencia, entre otros.&nbsp;</span></p>
      <!--PAGEBREAK-->
  
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>J. <u>SOBRE TECNOLOG&Iacute;A</u>&nbsp;</span></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>Toda informaci&oacute;n relativa a:&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>1. Informaci&oacute;n sobre los equipos de comunicaci&oacute;n y redes&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>2. Software y hardware&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>3. Proyectos en desarrollo&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>4. Toda informaci&oacute;n contenida en correos electr&oacute;nicos. <em>(Ver otras informaciones en el documento Pol&iacute;ticas de la Gerencia de Tecnolog&iacute;a.)&nbsp;</em></span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>K. CUALQUIER OTRA INFORMACI&Oacute;N</span></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;que <strong>METALDOM</strong> haya identificado como propietaria y confidencial, o que un individuo razonablemente pueda considerar como propietaria y confidencial.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><u><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'><span style="text-decoration:none;">&nbsp;</span></span></u></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><u><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'><u>TERCERO:</u></span></u></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;Que de la misma forma me comprometo a preservar con car&aacute;cter de confidencialidad y a no suministrar a terceras personas dentro y fuera de <strong>METALDOM</strong>, las documentaciones manejadas durante el desempe&ntilde;o de mis funciones que sean de mi conocimiento y manejo y cuya divulgaci&oacute;n podr&iacute;a causar cualquier tipo de perjurio econ&oacute;mico, legal, moral o afectar el desarrollo normal de las operaciones de <strong>METALDOM</strong>; as&iacute; como de informaciones relativas al paquete de compensaci&oacute;n por niveles jer&aacute;rquicos.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><u><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'><span style="text-decoration:none;">&nbsp;</span></span></u></strong></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><u><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'><u>CUARTO:</u></span></u></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;Que reconozco y acuerdo que las informaciones clasificadas como confidencial en este documento y cualquier documentaci&oacute;n de trabajo, son activos valiosos y &uacute;nicos de <strong>METALDOM</strong> y a manera de inducir a <strong>METALDOM</strong> a entrar en este acuerdo convengo y acuerdo durante el periodo de mis funciones, y siguiendo el t&eacute;rmino de la contrataci&oacute;n por cualquier raz&oacute;n, no divulgar directa o indirectamente, ni usar o aplicar cualquier documento, informaci&oacute;n, idea, procedimiento, concepto, m&eacute;todo o t&eacute;cnica obtenido por virtud de la contrataci&oacute;n concerniente al negocio y producto de <strong>METALDOM,</strong> salvo para cumplir con situaciones propias de mi responsabilidad como empleado.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><u><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'><span style="text-decoration:none;">&nbsp;</span></span></u></strong></p>
      
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><u><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'><u>QUINTO:</u></span></u></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;Reconozco que el incumplimiento a la presente declaraci&oacute;n, constituye una violaci&oacute;n a las disposiciones legales vigentes establecidas tanto en el Art. 377 del C&oacute;digo Penal; como el ordinal 7 del Art. 44 del C&oacute;digo de Trabajo; y el Art. 714 del mismo C&oacute;digo, compromete mi responsabilidad frente a <strong>METALDOM</strong>, quien podr&aacute; ejercer las acciones que le confiere la ley para la protecci&oacute;n de sus intereses y en procura de indemnizaci&oacute;n por los da&ntilde;os y perjuicios que le pudieren ser ocasionados por mi persona por el desconocimiento del compromiso que por la presente declaraci&oacute;n asumo.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <!--PAGEBREAK-->
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><strong><u><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'><u>SEXTO:</u></span></u></strong><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;Que reconozco y acuerdo que los convenios aqu&iacute; contenidos son razonables y necesarios para la protecci&oacute;n de <strong>METALDOM</strong>. En el evento de que cualquier convenio de este acuerdo sea quebrantado o no le d&eacute; cumplimiento, <strong>METALDOM</strong> podr&aacute; prescindir de mis funciones en cualquier momento sin mi consentimiento.&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>En el municipio de Santo Domingo Oeste, Provincia Santo Domingo, Rep&uacute;blica Dominicana, a los <strong>`+ oController.formatDateToWords(new Date()) + `</strong></span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>&nbsp;</span></p>
      <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:center;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'>__________________________________</span></p>
              <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:center;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:black;'><strong>`+ user.firstName + ` ` + user.lastName + ` ` + segundoNombre + `</strong></span></p>
                `;
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
          const fileName = `${user.firstName}_${user.lastName}_Confidencialidad.doc`;

          // Crear enlace y forzar descarga
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          const contentBlocks = htmlRaw.split("<!--PAGEBREAK-->");
          const existingPdfBytes = await fetch("pdf/hojaMetaldom.pdf").then(res => res.arrayBuffer());
          const pdfDoc = await PDFLibRef.PDFDocument.load(existingPdfBytes);
          const [templatePage] = pdfDoc.getPages();
          const { width, height } = templatePage.getSize();
          const templatePageImage = await pdfDoc.embedPage(templatePage);

          for (const blockHtml of contentBlocks) {
            const div = document.createElement("div");

            // Simular tamaño de una hoja A4 (aprox 794 x 1123 px a 96dpi)
            div.style.width = "794px";
            div.style.height = "760px";
            div.style.padding = "40px";
            div.style.backgroundColor = "white"; // fondo blanco por si acaso
            div.style.fontSize = "16px"; // o el tamaño que necesites
            div.style.boxSizing = "border-box";
            div.style.position = "absolute";
            div.style.top = "-9999px"; // ocultarlo fuera de pantalla
            div.innerHTML = blockHtml;
            document.body.appendChild(div);

            // Capturar el div
            const canvas = await html2canvasRef(div, {
              scale: 2 // Más calidad
            });
            const imgData = canvas.toDataURL("image/png");
            document.body.removeChild(div);

            const img = await pdfDoc.embedPng(imgData);

            const newPage = pdfDoc.addPage([width, height]);
            newPage.drawPage(templatePageImage);

            const imgWidth = width * 0.9; // 90% del ancho
            const imgHeight = (img.height * imgWidth) / img.width;

            newPage.drawImage(img, {
              x: (width - imgWidth) / 2,
              y: height - imgHeight - 130, // pequeño margen superior
              width: imgWidth,
              height: imgHeight,
            });
          }
          pdfDoc.removePage(0);
          const pdfBytes = await pdfDoc.save();

          const fileName = `${user.firstName}_${user.lastName}_Confidencialidad.pdf`;
          const blob = new Blob([pdfBytes], { type: "application/pdf" });

          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = fileName;

          // Forzar descarga
          document.body.appendChild(link);
          link.click();

          // Limpieza
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);

        }
      }
      MessageToast.show("Documento generado correctamente.");
    } catch (error) {
      console.error("Error generando el documento:", error);
      MessageToast.show("Error generando el documento.");
    }
  }
  return {
    onDownloadPDFConfidencialidad
  };
});