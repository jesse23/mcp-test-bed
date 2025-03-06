import './App.css'
import { useState, useEffect } from 'react'
import { ToolingAgent } from './agents/ToolingAgent.js';
import { MCPClient } from './tools/MCPClient.js';
import { MCPTools } from "./tools/MCPTools.js";
import { CompositeTools } from "./tools/CompositeTools.js";
import { BrowserTools } from "./tools/BrowserTools.js";
import ReactMarkdown from 'react-markdown';
import { useAutoScroll } from './services/hooks.js';
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


function MessageCard({ question, response, onConfirm, showConfirm }) {
  const [confirmInput, setConfirmInput] = useState('');

  return (
    <div style={{ border: '1px dashed #ccc', padding: '1rem', marginBottom: '1rem' }}>
      <div style={{ marginBottom: '0.5rem', color: '#666' }}>
        <strong>Q:</strong> {question}
      </div>
      <ReactMarkdown>
        {response}
      </ReactMarkdown>
      {showConfirm && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && confirmInput.trim()) {
                onConfirm(confirmInput.trim());
                setConfirmInput('');
              }
            }}
            placeholder="Type if you have follow up comments and enter"
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              flex: 1
            }}
          />
          <button
            onClick={() => onConfirm('accept')}
            style={{ padding: '0.5rem 1rem', background: 'rgb(130, 147, 85)', color: 'black', border: 'none', borderRadius: '4px' }}
          >
            Accept
          </button>
          <button
            onClick={() => onConfirm('reject')}
            style={{ padding: '0.5rem 1rem', background: 'rgb(185, 86, 102)', color: 'black', border: 'none', borderRadius: '4px' }}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  const [agent, setAgent] = useState(null)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentInput, setAgentInput] = useState('')
  const [agentHistory, setAgentHistory] = useState([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [confirmRequired, setConfirmRequired] = useState(false)
  const [confirmResolve, setConfirmResolve] = useState(null)

  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [mcpClient, setMcpClient] = useState(null)
  const [mcpLoading, setMcpLoading] = useState(false)
  const [mcpResponse, setMcpResponse] = useState('')

  const [source, setSource] = useState('')

  const chatScrollRef = useAutoScroll([currentResponse, agentHistory.length]);

  useEffect(() => {
    // Create and initialize MCP Client
    const mcpClient = new MCPClient({ onStatusChange: setConnectionStatus });
    setMcpClient(mcpClient);

    // Create agent with UI update handler
    const handleUpdate = async (agentResp) => {
      if (agentResp.confirm) {
        setCurrentResponse(prev => agentResp.mode === 'replace' ? agentResp.message : prev + agentResp.message);
        setConfirmRequired(true);

        // Create a new promise and store its resolve function
        return new Promise((resolve) => {
          setConfirmResolve(() => resolve);
        });
      } else {
        setCurrentResponse(prev => agentResp.mode === 'replace' ? agentResp.message : prev + agentResp.message);
      }
    };

    setAgent(new ToolingAgent({
      tools: new CompositeTools([
        new BrowserTools(),
        new MCPTools(mcpClient)
      ]),
      onUpdate: handleUpdate
    }));

    mcpClient.initialize();

    return () => {
      mcpClient.cleanup();
    };
  }, []);

  const handleConfirm = (value) => {
    setConfirmRequired(false);
    if (confirmResolve) {
      // If value is a string, it's a text response
      // If it's a boolean, it's accept/reject
      confirmResolve({
        message: value,
      });
      setConfirmResolve(null);
    }
  };

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
      setCurrentResponse('GPT Manager not initialized');
      return;
    }
    if (!agentInput.trim()) {
      setCurrentResponse('Please enter a message for GPT Mini');
      return;
    }

    // If there's a current response, add it to history before starting new one
    if (currentResponse && currentQuestion) {
      setAgentHistory(prev => [...prev, {
        input: currentQuestion,
        response: currentResponse,
        timestamp: new Date().toISOString()
      }]);
    }

    setAgentLoading(true);
    setCurrentResponse(''); // Clear current response
    setCurrentQuestion(agentInput); // Store the current question

    try {
      // if agent does not support streaming, we can just await the response
      const agentResp = await agent.invoke({ message: agentInput });
      setCurrentResponse(agentResp.message);
    } catch (error) {
      console.error('GPT Mini Error:', error);
      setCurrentResponse('Error communicating with GPT Mini');
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
          <div style={{ marginTop: '1rem', height: '300px', overflowY: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none', '&::WebkitScrollbar': { display: 'none' } }}>
            <ReactMarkdown>
              {mcpResponse}
            </ReactMarkdown>
          </div>
        )}
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <div ref={chatScrollRef} style={{ height: '500px', overflowY: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none', '&::WebkitScrollbar': { display: 'none' } }}>
          {agentHistory.map((item, index) => (
            <MessageCard key={index} question={item.input} response={item.response} />
          ))}
          {currentResponse && (
            <MessageCard
              question={currentQuestion}
              response={currentResponse}
              showConfirm={confirmRequired}
              onConfirm={handleConfirm}
            />
          )}
        </div>
        <div style={{ marginTop: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
      </div>
    </>
  )
}

export default App
