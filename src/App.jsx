import './App.css'
import { useState, useEffect } from 'react'
import { GPTClient } from './clients/gpt.js';
import { MCPClient } from './clients/mcp.js';
import { MCPOpenAIChatAdapter } from "./clients/adapter.js";
import { ToolsAggregator } from "./clients/aggregator.js";
import { BrowserTools } from "./clients/tools.js";
import ReactMarkdown from 'react-markdown';

import { executeGherkinFeature } from './gherkin-web/gherkin'
import '../test/support/setup'
import '../test/steps/app.steps'

function App() {
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [mcpClient, setMcpClient] = useState(null)
  const [gptClient, setGptClient] = useState(null)
  const [mcpResponse, setMcpResponse] = useState('')
  const [gptInput, setGptInput] = useState('')

  useEffect(() => {
    // Create and initialize MCP Client
    const mcpClient = new MCPClient({ onStatusChange: setConnectionStatus });
    setMcpClient(mcpClient);
    setGptClient(new GPTClient(new ToolsAggregator([new BrowserTools(), new MCPOpenAIChatAdapter(mcpClient)])));

    mcpClient.initialize();

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
      const response = await mcpClient.callTool({ name:'get-daily-news' });
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
    if (!gptInput.trim()) {
      setMcpResponse('Please enter a message for GPT Mini');
      return;
    }

    setLoading(true);
    try {
      const response = await gptClient.callGPTMini(gptInput);
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
      <h2>MCP Client Example</h2>
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
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            value={gptInput}
            onChange={(e) => setGptInput(e.target.value)}
            placeholder="Enter your message for GPT Mini"
            style={{ 
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              flex: 1
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleGPTMiniRequest()}
          />
          <button
            onClick={handleGPTMiniRequest}
            disabled={loading || !gptClient}
          >
            {loading ? 'Processing...' : 'Ask GPT Mini'}
          </button>
        </div>
        {mcpResponse && (
          <div style={{ marginTop: '1rem' }}>
            <ReactMarkdown>
              {mcpResponse}
            </ReactMarkdown>
          </div>
        )}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
