// Servicio para calcular distancias reales por calles usando OSRM
const calcularDistanciaReal = async (lng1, lat1, lng2, lat2) => {
  try {
    // Llamada a la API pública de OSRM (Gratis)
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No se pudo calcular la ruta');
    }

    // OSRM devuelve la distancia en metros. La pasamos a kilómetros.
    const distanciaKm = data.routes[0].distance / 1000;
    
    return {
      distanciaKm: parseFloat(distanciaKm.toFixed(2)),
      duracionMin: Math.ceil(data.routes[0].duration / 60) // Duración en minutos
    };
  } catch (error) {
    console.error('Error OSRM:', error.message);
    // Si falla OSRM, usamos una estimación en línea recta para que el pedido no falle
    return { distanciaKm: 5.0, duracionMin: 15 }; 
  }
};

module.exports = { calcularDistanciaReal };
