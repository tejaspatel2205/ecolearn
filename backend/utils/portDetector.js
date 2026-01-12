const net = require('net');

/**
 * Check if a port is available by attempting to bind to it
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - True if port is available
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
  });
}

/**
 * Find the next available port starting from a given port
 * @param {number} startPort - Starting port number (default: 3001)
 * @param {number} maxAttempts - Maximum number of ports to try (default: 10)
 * @returns {Promise<number>} - Available port number
 */
async function findAvailablePort(startPort = 3001, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await checkPort(port);
    
    if (available) {
      if (i > 0) {
        console.log(`Port ${startPort} is busy, trying next port...`);
      }
      return port;
    }
    
    // Log if port is busy (only for first few attempts)
    if (i < 3) {
      console.log(`Port ${port} is busy, trying next port...`);
    }
  }
  
  throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts - 1}`);
}

module.exports = { findAvailablePort, checkPort };
