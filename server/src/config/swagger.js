const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dabub Connect (Arba Minch TMS) API',
      version: '1.0.0',
      description: 'API Documentation for the Dabub Connect Transport Management System',
      contact: {
        name: 'API Support',
        email: 'support@semenconnect.et',
      },
    },
    servers: [
      {
        url: 'http://localhost:4002',
        description: 'Local Development Server',
      },
      {
        url: 'https://api.semenconnect.et',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/models/*.js'], // Files containing annotations
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
