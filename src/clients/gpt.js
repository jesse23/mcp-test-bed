import { MCPOpenAIChatAdapter } from "./adapter.js";

export class GPTClient {
  constructor(mcpClient) {
    this.adapter = new MCPOpenAIChatAdapter(mcpClient);
  }

  async callGPTMini(prompt) {
    try {
      const tools = await this.adapter.listTools();
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
        })
      });

      const data = await response.json();
      console.log('GPT Mini Response:', data);

      if (data.choices[0].message.tool_calls) {
        const toolResult = await this.adapter.callTool(data);
        return toolResult[0].content[0].text;
      } else {
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error('GPT Mini Error:', error);
      throw error;
    }
  }
}
