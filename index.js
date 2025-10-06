require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const TMDB_API_KEY = "62e9afa9b26ec1658e4f7c572663a19b";
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Middleware para parsear JSON
app.use(express.json());


// Endpoint para obtener una película aleatoria (opcionalmente filtrada por género)
app.get('/random-movie', async (req, res) => {
  try {
    const { genre } = req.query; // Obtener el género de los query parameters
    const randomPage = Math.floor(Math.random() * 500) + 1;
    
    let apiUrl = `${TMDB_BASE_URL}/movie/popular`;
    let params = {
      api_key: TMDB_API_KEY,
      page: randomPage,
      language: 'es-ES'
    };

    // Si se especifica un género, usar el endpoint de descubrimiento
    if (genre) {
      apiUrl = `${TMDB_BASE_URL}/discover/movie`;
      params.with_genres = genre;
      params.sort_by = 'popularity.desc';
    }
    
    const response = await axios.get(apiUrl, { params });

    const movies = response.data.results;
    
    if (movies.length === 0) {
      const message = genre ? 
        `No se encontraron películas para el género especificado (ID: ${genre})` : 
        'No se encontraron películas';
      return res.status(404).json({ error: message });
    }

    // Seleccionamos una película aleatoria de la página
    const randomMovie = movies[Math.floor(Math.random() * movies.length)];

    // Obtenemos detalles adicionales de la película
    const movieDetails = await axios.get(`${TMDB_BASE_URL}/movie/${randomMovie.id}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'es-ES'
      }
    });
    const moviePeople= await axios.get(`https://tadw-microservicio-likes-price-dcicflix.onrender.com/random-items`, {
      // Este endpoint devuelve un JSON con datos estructurados
    });

    const moviePrice = await axios.get(`https://tadw-microservicio-likes-price-dcicflix.onrender.com/price`, {
      // Este endpoint devuelve un array con múltiples items
    });

    // Función para recorrer el array de elementos y convertir a texto "Autumn, Jocelyn y Samantha"
    function processItemsToText(data) {
      let itemsArray = [];
      
      // Si es un objeto con propiedad 'items', usar ese array
      if (data && data.items && Array.isArray(data.items)) {
        itemsArray = data.items;
      }
      // Si es un array directamente
      else if (Array.isArray(data)) {
        itemsArray = data;
      }
      
      if (itemsArray.length === 0) {
        return 'No hay datos disponibles';
      }
      
      // Extraer nombres/títulos de los elementos
      const names = itemsArray.map((item) => {
        return item.name || item.title || item.username || item || 'Sin nombre';
      });
      
      // Formatear según la cantidad de elementos
      if (names.length === 1) {
        return names[0];
      } else if (names.length === 2) {
        return `${names[0]} y ${names[1]}`;
      } else if (names.length >= 3) {
        // Para 3 o más elementos: "elemento1, elemento2 y elemento3"
        const lastIndex = Math.min(names.length - 1, 2); // Máximo 3 elementos
        const firstNames = names.slice(0, lastIndex).join(', ');
        return `${firstNames} y ${names[lastIndex]}`;
      }
      
      return 'No hay datos disponibles';
    }
    // Construimos la respuesta con información útil
    const movieInfo = {
      titulo: movieDetails.data.title,
      resumen: movieDetails.data.overview,
      imagenfondo: movieDetails.data.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.data.poster_path}` : null,
      precio: moviePrice.data.price, // Procesa el array de precios/items
      personas: processItemsToText(moviePeople.data) // Procesa los datos de personas
    };

    res.json({
      success: true,
      movie: movieInfo
    });

  } catch (error) {
    console.error('Error al obtener película aleatoria:', error.message);
    
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ 
        error: 'API Key inválida. Por favor configura TMDB_API_KEY en las variables de entorno.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Endpoints disponibles:');
  console.log('  GET / - Información del servidor');
  console.log('  GET /genres - Lista de géneros disponibles');
  console.log('  GET /random-movie - Obtener película aleatoria');
  console.log('  GET /random-movie?genre=ID - Obtener película por género');
  console.log('\nEjemplos:');
  console.log('  http://localhost:3000/random-movie?genre=28 (Acción)');
  console.log('  http://localhost:3000/random-movie?genre=35 (Comedia)');
  console.log('  http://localhost:3000/random-movie?genre=18 (Drama)');
});

module.exports = app;