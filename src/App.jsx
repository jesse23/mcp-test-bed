import { useState, useEffect } from 'react'
import GPTManager from './clients/gpt.js';
import { MCPClient } from './clients/mcp.js';
import './App.css'

function App() {
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [mcpClient, setMcpClient] = useState(null)
  const [gptClient, setGptClient] = useState(null)
  const [mcpResponse, setMcpResponse] = useState('')

  useEffect(() => {
    // Create and initialize MCP Client
    const mcpClient = new MCPClient({ onStatusChange: setConnectionStatus });
    setMcpClient(mcpClient);
    mcpClient.initialize();

    // Initialize GPT Manager after MCP Client is set up
    setGptClient(new GPTManager(mcpClient));

    // Cleanup on unmount
    return () => {
      mcpClient.cleanup();
    };
  }, []);

  const handleMCPRequest = async () => {
    if (connectionStatus !== 'connected') {
      setMcpResponse('Not connected to MCP server');
      return;
    }

    setLoading(true);
    try {
      const response = await mcpClient.callTool('get-daily-news');
      setMcpResponse(response.content[0].text);
    } catch (error) {
      console.error('MCP Error:', error);
      setMcpResponse('Error communicating with MCP server');
    } finally {
      setLoading(false);
    }
  }

  const handleGPTMiniRequest = async () => {
    if (!gptClient) {
      setMcpResponse('GPT Manager not initialized');
      return;
    }

    setLoading(true);
    try {
      const response = await gptClient.callGPTMini();
      setMcpResponse(response);
    } catch (error) {
      console.error('GPT Mini Error:', error);
      setMcpResponse('Error communicating with GPT Mini');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>MCP Client Example</h1>
      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          Connection Status: <span style={{
            color: connectionStatus === 'connected' ? 'green' :
              connectionStatus === 'connecting' ? 'orange' : 'red'
          }}>{connectionStatus}</span>
        </div>
        <button
          onClick={handleMCPRequest}
          disabled={loading || connectionStatus !== 'connected'}
          style={{ marginLeft: '1rem' }}
        >
          {loading ? 'Asking MCP...' : 'Get Daily News'}
        </button>
        <button
          onClick={handleGPTMiniRequest}
          disabled={loading || !gptClient}
          style={{ marginLeft: '1rem' }}
        >
          Ask GPT Mini
        </button>
        {mcpResponse && (
          <p style={{ marginTop: '1rem' }}>
            MCP says: {mcpResponse}
          </p>
        )}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
