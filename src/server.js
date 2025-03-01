import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from '@socket.io/server';

// Create an MCP server
const mcpServer = new McpServer({
  name: "Demo MCP Server",
  version: "1.0.0"
});

// Add a simple number analysis tool
mcpServer.tool(
  "analyzeNumber",
  { number: z.number() },
  async ({ number }) => {
    const isEven = number % 2 === 0;
    const isPrime = number > 1 && Array.from({ length: Math.floor(Math.sqrt(number)) }, (_, i) => i + 2)
      .every(i => number % i !== 0);
    
    return {
      content: [{
        type: "text",
        text: `The number ${number} is ${isEven ? 'even' : 'odd'}${isPrime ? ' and prime' : ''}.`
      }]
    };
  }
);

// Set up Express server with CORS and Socket.IO
const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('message', async (data) => {
    try {
      const response = await mcpServer.handleMessage(data);
      socket.emit('message', response);
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
const PORT = 8080;
httpServer.listen(PORT, () => {
  console.log(`MCP Server running on http://localhost:${PORT}`);
}); 