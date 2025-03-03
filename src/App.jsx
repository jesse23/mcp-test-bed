import './App.css'
import { useState, useEffect } from 'react'
import { GPTClient } from './clients/gpt.js';
import { MCPClient } from './clients/mcp.js';
import { MCPOpenAIChatAdapter } from "./clients/adapter.js";
import { ToolsAggregator } from "./clients/aggregator.js";
import { BrowserTools } from "./clients/tools.js";
import ReactMarkdown from 'react-markdown';

import '../test/support/setup'
import '../test/steps/app.steps'

/*
import { executeGherkinFeature } from './gherkin-web/gherkin'
const testGherkinFeature = async () => {
  const result = await executeGherkinFeature(`
Feature: Fetch News

Scenario: Fetch News
  Given I am on the news page
  When I type "Verge" into the fetch news form
  And I click on the "Fetch" button
  Then I see the news
  `.trim());
  console.log(result)
}
*/

function App() {
  const [mcpLoading, setMcpLoading] = useState(false)
  const [gptLoading, setGptLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [mcpClient, setMcpClient] = useState(null)
  const [gptClient, setGptClient] = useState(null)
  const [mcpResponse, setMcpResponse] = useState('')
  const [gptResponse, setGptResponse] = useState('')
  const [gptInput, setGptInput] = useState('')
  const [source, setSource] = useState('')

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

    setMcpLoading(true);
    try {
      const response = await mcpClient.callTool({ name: 'get-daily-news' });
      setMcpResponse(response.content[0].text);
    } catch (error) {
      console.error('MCP Error:', error);
      setMcpResponse('Error communicating with MCP server');
    } finally {
      setMcpLoading(false);
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

    setGptLoading(true);
    try {
      const response = await gptClient.callGPTMini(gptInput);
      setGptResponse(response);
    } catch (error) {
      console.error('GPT Mini Error:', error);
      setGptResponse('Error communicating with GPT Mini');
    } finally {
      setGptLoading(false);
    }
  }

  return (
    <>
      <h1>MCP Client Example</h1>
      <div style={{ marginTop: '1rem', marginBottom: '4rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          type="text"
          value={gptInput}
          onChange={(e) => setGptInput(e.target.value)}
          placeholder="Ask your questions"
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
          disabled={gptLoading || !gptClient}
        >
          {gptLoading ? 'Processing...' : 'Ask GPT Mini'}
        </button>
      </div>
      {gptResponse && (
        <div style={{ marginTop: '1rem' }}>
          <ReactMarkdown>
            {gptResponse}
          </ReactMarkdown>
        </div>
      )}
      <div className="card">
        <h3>Fetch News</h3>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Input source"
            id="fetch-source"
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              flex: 1
            }}
          />
          <button
            onClick={handleMCPRequest}
            disabled={mcpLoading || connectionStatus !== 'connected'}
            style={{ marginLeft: '1rem' }}
          >
            {mcpLoading ? 'Fetching...' : 'Fetch'}
          </button>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          Connection Status: <span style={{
            color: connectionStatus === 'connected' ? 'green' :
              connectionStatus === 'connecting' ? 'orange' : 'red'
          }}>{connectionStatus}</span>
        </div>
        {mcpResponse && (
          <div style={{ marginTop: '1rem' }}>
            <ReactMarkdown>
              {mcpResponse}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </>
  )
}

export default App
