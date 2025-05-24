const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RentCar API Documentation',
      version: '1.0.0',
      description: 'API documentation for RentCar backend services',
      contact: {
        name: 'RentCar Support',
        email: 'support@rentcar.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js', './models/*.js'] // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs; 