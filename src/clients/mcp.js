import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js'
import { createTransport } from '@smithery/sdk/transport.js'

export function createMcpClient() {
  let client = null;
  let transport = null;
  let connectionStatus = 'disconnected';
  let onStatusChange = null;

  const updateStatus = (status) => {
    connectionStatus = status;
    if (onStatusChange) {
      onStatusChange(status);
    }
  };

  const initialize = async () => {
    try {
      if (!client) {
        client = new MCPClient(
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

      updateStatus('connecting');

      const originalUrl = new URL(import.meta.env.VITE_MCP_SERVER_URL);
      transport = createTransport(originalUrl, {
        githubPersonalAccessToken: import.meta.env.VITE_MCP_API_KEY
      });
      console.log('Created transport:', transport);

      await client.connect(transport);
      console.log('Successfully connected to MCP server');
      const tools = await client.listTools();
      console.log('Available tools:', tools);
      const prompts = await client.listPrompts();
      console.log('Available prompts:', prompts);

      updateStatus('connected');
      return true;
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      updateStatus('error');
      return false;
    }
  };

  const listTools = async () => {
    if (connectionStatus !== 'connected' || !client) {
      throw new Error('Not connected to MCP server');
    }
    return await client.listTools();
  };

  const callTool = async ({name, args = {}}) => {
    if (connectionStatus !== 'connected' || !client) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const response = await client.callTool({
        name,
        arguments: args
      });
      return response;
    } catch (error) {
      console.error('MCP Error:', error);
      throw error;
    }
  };

  const cleanup = () => {
    if (transport) {
      transport.close();
    }
    if (client) {
      client.complete();
    }
    updateStatus('disconnected');
  };

  return {
    initialize,
    callTool,
    listTools,
    cleanup,
    setStatusChangeCallback: (callback) => {
      onStatusChange = callback;
    },
    getStatus: () => connectionStatus
  };
} 