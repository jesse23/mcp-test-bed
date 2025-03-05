import './App.css'
import { useState, useEffect } from 'react'
import { AgentWithTools } from './clients/agent-tools.js';
import { MCPClient } from './clients/mcp.js';
import { MCPTools } from "./clients/mcp-tools.js";
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
  const [agent, setAgent] = useState(null)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentInput, setAgentInput] = useState('')
  const [agentResponse, setAgentResponse] = useState('')

  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [mcpClient, setMcpClient] = useState(null)
  const [mcpLoading, setMcpLoading] = useState(false)
  const [mcpResponse, setMcpResponse] = useState('')

  const [source, setSource] = useState('')

  useEffect(() => {
    // Create and initialize MCP Client
    const mcpClient = new MCPClient({ onStatusChange: setConnectionStatus });
    setMcpClient(mcpClient);

    // Create agent with UI update handler
    const handleUpdate = (update) => {
      if (update.type === 'function') {
        setAgentResponse(prev => prev + `\n\nFunction Call:\n\`\`\`json\n${JSON.stringify(update.tools[0], null, 2)}\n\`\`\``);
      } else {
        setAgentResponse(prev => update.mode === 'replace' ? update.message : prev + update.message);
      }
    };

    setAgent(new AgentWithTools(new ToolsAggregator([new BrowserTools(), new MCPTools(mcpClient)]), handleUpdate));

    mcpClient.initialize();

    return () => {
      mcpClient.cleanup();
    };
  }, []);

  const fetchNews = async () => {
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
    if (!agent) {
      setMcpResponse('GPT Manager not initialized');
      return;
    }
    if (!agentInput.trim()) {
      setMcpResponse('Please enter a message for GPT Mini');
      return;
    }

    setAgentLoading(true);
    try {
      const response = await agent.invoke(agentInput);
      // NOTE: this may not be needed after streaming is implemented
      setAgentResponse(response);
    } catch (error) {
      console.error('GPT Mini Error:', error);
      setAgentResponse('Error communicating with GPT Mini');
    } finally {
      setAgentLoading(false);
    }
  }

  return (
    <>
      <h1>MCP Client Example</h1>
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
            onClick={fetchNews}
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
          <div style={{ marginTop: '1rem', height: '300px', overflowY: 'auto' }}>
            <ReactMarkdown>
              {mcpResponse}
            </ReactMarkdown>
          </div>
        )}
      </div>
      <div style={{ marginTop: '1rem', marginBottom: '4rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          type="text"
          value={agentInput}
          onChange={(e) => setAgentInput(e.target.value)}
          placeholder="Ask your questions"
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            flex: 1
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleGPTMiniRequest();
            }
          }}
        />
        <button
          onClick={handleGPTMiniRequest}
          disabled={agentLoading || !agent}
        >
          {agentLoading ? 'Processing...' : 'Ask GPT Mini'}
        </button>
      </div>
      <div style={{ height: '500px', overflowY: 'auto' }}>
        {agentResponse && (
          <div style={{ border: '1px solid #ccc', padding: '1rem' }}>
            <ReactMarkdown>
              {agentResponse}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </>
  )
}

export default App
