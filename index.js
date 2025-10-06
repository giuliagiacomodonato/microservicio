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
    const moviePeople= await axios.get(`https://jsonplaceholder.typicode.com/posts/1`, {
      // Este endpoint devuelve un JSON con datos estructurados
    });
    
    const moviePrice = await axios.get(`https://jsonplaceholder.typicode.com/users`, {
      // Este endpoint devuelve un array con múltiples items
    });

    // Función para recorrer el array de 3 elementos y convertir a texto "homer, lisa y bart"
    function processItemsToText(data) {
      // Siempre es un array con 3 elementos
      if (Array.isArray(data) && data.length >= 3) {
        const names = data.slice(0, 3).map((item) => {
          return item.name || item.title || item.username || item || 'Sin nombre';
        });
        
        // Formato fijo para 3 elementos: "elemento1, elemento2 y elemento3"
        return `${names[0]}, ${names[1]} y ${names[2]}`;
      }
      
      return 'No hay datos disponibles';
    }
    // Construimos la respuesta con información útil
    const movieInfo = {
      titulo: movieDetails.data.title,
      resumen: movieDetails.data.overview,
      imagenfondo: movieDetails.data.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.data.poster_path}` : null,
      precio: moviePrice.data, // Procesa el array de precios/items
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