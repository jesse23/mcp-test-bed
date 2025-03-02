import { useState, useEffect, useRef } from 'react'
import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js'
import { createTransport } from '@smithery/sdk/transport.js'
import { OpenAIChatAdapter } from "./adapter.js";
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [mcpResponse, setMcpResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const mcpClientRef = useRef(null)
  const transportRef = useRef(null)

  useEffect(() => {
    const initClient = async () => {
      try {
        // Initialize MCP client if not already done
        if (!mcpClientRef.current) {
          mcpClientRef.current = new MCPClient(
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

        setConnectionStatus('connecting');

        const originalUrl = new URL(import.meta.env.VITE_MCP_SERVER_URL);
        transportRef.current = createTransport(originalUrl, {
          githubPersonalAccessToken: import.meta.env.VITE_MCP_API_KEY
        });
        console.log('Created transport:', transportRef.current);

        await mcpClientRef.current.connect(transportRef.current);
        console.log('Successfully connected to MCP server');
        const tools = await mcpClientRef.current.listTools();
        console.log('Available tools:', tools);
        const prompts = await mcpClientRef.current.listPrompts();
        console.log('Available prompts:', prompts);
        // const prompt = await mcpClientRef.current.getPrompt("news-summary");
        // console.log('Prompt:', prompt);
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Failed to connect to MCP server:', error);
        setConnectionStatus('error');
      }
    };

    initClient();

    return () => {
      if (transportRef.current) {
        transportRef.current.close();
      }
      if (mcpClientRef.current) {
        mcpClientRef.current.complete();
      }
      setConnectionStatus('disconnected');
    };
  }, []);

  const handleMCPRequest = async () => {
    if (connectionStatus !== 'connected' || !mcpClientRef.current) {
      setMcpResponse('Not connected to MCP server');
      return;
    }

    setLoading(true);
    try {
      const response = await mcpClientRef.current.callTool({
        name: "get-daily-news",
        arguments: {}
      });

      setMcpResponse(response.content[0].text);
    } catch (error) {
      console.error('MCP Error:', error);
      setMcpResponse('Error communicating with MCP server');
    } finally {
      setLoading(false);
    }
  }

  const handleGPTMiniRequest = async () => {
    try {
      const openaiAdapter = new OpenAIChatAdapter(mcpClientRef.current);
      const tools = await openaiAdapter.listTools();
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "user", content: "Get today's news" }
          ],
          temperature: 0.7,
          max_tokens: 100,
          tools,
        })
      });
      const data = await response.json();
      console.log('GPT Mini Response:', data);
      if (data.choices[0].message.tool_calls) {
        const toolResult = await openaiAdapter.callTool(data);
        setMcpResponse(toolResult[0].content[0].text);
      } else {
        setMcpResponse(data.choices[0].message.content);
      }
    } catch (error) {
      console.error('GPT Mini Error:', error);
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
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button
          onClick={handleMCPRequest}
          disabled={loading || connectionStatus !== 'connected'}
          style={{ marginLeft: '1rem' }}
        >
          {loading ? 'Asking MCP...' : 'Get Daily News'}
        </button>
        <button
          onClick={handleGPTMiniRequest}
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
