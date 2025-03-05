import { invoke as invokeGherkinAgent } from './agent-gherkin';
import { Agent } from './agent';

export class AgentWithTools extends Agent {
  constructor(toolProvider, onUpdate) {
    super(onUpdate || ((update) => console.log('Update:', update)));
    this.toolProvider = toolProvider;
  }

  async invoke(prompt) {
    try {
      if(prompt.startsWith('@bot ')) {
        const question = prompt.slice(5);
        return invokeGherkinAgent(question);
      }
      const tools = await this.toolProvider.listTools();
      
      // Call GPT with streaming
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 100,
          tools,
          stream: true, // Enable streaming
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let toolCalls = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('\nStream complete');
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                fullResponse += content;
                this.onUpdate({
                  step: 'ai',
                  message: content,
                  type: 'markdown',
                  mode: 'append'
                });
              }
              if (parsed.choices[0].delta.tool_calls) {
                toolCalls = parsed.choices[0].delta.tool_calls;
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      console.log('\nGPT Mini Response:', { fullResponse, toolCalls });

      // Process tool calls or content (maintaining original behavior)
      if (toolCalls) {
        const { name, arguments: arg } = toolCalls[0].function;
        const toolResult = await this.toolProvider.callTool({
          name,
          arguments: JSON.parse(arg),
        });
        return toolResult.content[0].text;
      } else {
        return fullResponse;
      }
    } catch (error) {
      console.error('GPT Mini Error:', error);
      throw error;
    }
  }
}
