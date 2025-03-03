import { executeFlow } from './botFlow';

export class GPTClient {
  constructor(toolProvider) {
    this.toolProvider = toolProvider; ;
  }

  async callGPTMini(prompt) {
    try {
      if(prompt.startsWith('@bot ')) {
        const question = prompt.slice(5);
        return executeFlow(question);
      }
      const tools = await this.toolProvider.listTools();
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
          // tool_choice: "auto",
        })
      });

      const data = await response.json();
      console.log('GPT Mini Response:', data);

      // only process choice[0]
      if (data.choices[0].message.tool_calls) {
        const { name, arguments: arg } = data.choices[0].message.tool_calls[0].function;
        const toolResult = await this.toolProvider.callTool({
          name,
          arguments: JSON.parse(arg),
        });
        return toolResult.content[0].text;
      } else {
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error('GPT Mini Error:', error);
      throw error;
    }
  }
}
