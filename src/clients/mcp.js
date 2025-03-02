import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { createTransport } from '@smithery/sdk/transport.js'

export class MCPClient {
  constructor({ onStatusChange }) {
    this.client = null;
    this.transport = null;
    this.connectionStatus = 'disconnected';
    this.onStatusChange = onStatusChange;
  }

  #updateStatus(status) {
    this.connectionStatus = status;
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  async initialize() {
    try {
      if (!this.client) {
        this.client = new Client(
          {
            name: "test-mcp-client",
            version: "1.0.0"
          },
          {
            capabilities: {
              prompts: {},
              resources: {},
              tools: {}
            }
          }
        );
      }

      this.#updateStatus('connecting');

      const originalUrl = new URL(import.meta.env.VITE_MCP_SERVER_URL);
      this.transport = createTransport(originalUrl, {
        githubPersonalAccessToken: import.meta.env.VITE_MCP_API_KEY
      });
      console.log('Created transport:', this.transport);

      await this.client.connect(this.transport);
      console.log('Successfully connected to MCP server');
      const tools = await this.client.listTools();
      console.log('Available tools:', tools);
      const prompts = await this.client.listPrompts();
      console.log('Available prompts:', prompts);

      this.#updateStatus('connected');
      return true;
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      this.#updateStatus('error');
      return false;
    }
  }

  async listTools() {
    if (this.connectionStatus !== 'connected' || !this.client) {
      throw new Error('Not connected to MCP server');
    }
    return await this.client.listTools();
  }

  async callTool({name, args = {}}) {
    if (this.connectionStatus !== 'connected' || !this.client) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const response = await this.client.callTool({
        name,
        arguments: args
      });
      return response;
    } catch (error) {
      console.error('MCP Error:', error);
      throw error;
    }
  }

  cleanup() {
    if (this.transport) {
      this.transport.close();
    }
    if (this.client) {
      this.client.complete();
    }
    this.#updateStatus('disconnected');
  }

  getStatus() {
    return this.connectionStatus;
  }
}