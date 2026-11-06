const path = require('path');

/**
 * Servicio de Facturación Electrónica en Línea (FEL) para Guatemala.
 * Usa el SDK oficial de Digifact para Node.js.
 */
async function facturarConDigifact(comercio, venta) {
  try {
    // 1. Importar el SDK de Digifact
    // (Usamos import dinámico porque el SDK es un módulo ESM)
    const { DigifactClient } = await import('digifact-sdk');

    // 2. Validar que el comercio tenga su configuración FEL completa
    if (!comercio.nit || !comercio.digifactUser || !comercio.digifactPass) {
      throw new Error('El comercio no tiene configurada su facturación FEL (NIT, Usuario o Contraseña de Digifact).');
    }

    // 3. Crear el cliente de Digifact con las credenciales del COMERCIO
    const client = new DigifactClient({
      taxid: comercio.nit,
      username: comercio.digifactUser,
      password: comercio.digifactPass,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'test',
      seller_name: comercio.razonSocial || comercio.nombre,
      seller_address: comercio.direccionFiscal || comercio.direccion,
    });

    // 4. Preparar los ítems de la venta para el SDK
    const items = venta.items.map(item => ({
      description: item.nombre,
      qty: item.cantidad,
      price: item.precio,
      type: 'Bien'
    }));

    // 5. Determinar el receptor (Consumidor Final o NIT)
    const receptor = venta.clienteNit === 'CF' || !venta.clienteNit
      ? 'CF'
      : { taxid: venta.clienteNit, name: venta.clienteNombre || 'Cliente' };

    // 6. Facturar usando el SDK
    const resultado = await client.invoice(receptor, items);

    // 7. Devolver el resultado (UUID, PDF, HTML, XML)
    return {
      success: true,
      authNumber: resultado.authNumber,
      pdf: resultado.responseData3, // PDF en base64
      html: resultado.responseData2, // HTML en base64
      xml: resultado.responseData1, // XML en base64
      batch: resultado.batch,
      serial: resultado.serial,
      enrolledTimeStamp: resultado.enrolledTimeStamp
    };

  } catch (error) {
    console.error('Error al facturar con Digifact:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al facturar'
    };
  }
}

module.exports = { facturarConDigifact };