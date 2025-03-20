const path = require('path');

module.exports = {
  // Other webpack configurations...
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      // Your custom middleware setup if needed
      return middlewares;
    }
  }
}; 