import { GherkinAgent } from './GherkinAgent';
import { Agent } from './Agent';
import { queryGPT } from '../services/gpt';

export class ToolingAgent extends Agent {
  constructor({
    tools,
    onUpdate = console.log
  }) {
    super({ onUpdate });
    this.tools = tools;
    this.gherkinAgent = new GherkinAgent({ onUpdate });
  }

  async invoke(prompt) {
    try {
      if(prompt.startsWith('@bot ')) {
        const question = prompt.slice(5);
        return this.gherkinAgent.invoke(question);
      }
      const tools = await this.tools.listTools();
      
      const { message, tools: [ functionCall ] } = await queryGPT({
        input: prompt,
        tools,
        onUpdate: this.onUpdate
      });

      // Process tool calls or content (maintaining original behavior)
      if (functionCall) {
        const { name, arguments: arg } = functionCall;
        const toolResult = await this.tools.callTool({
          name,
          arguments: JSON.parse(arg),
        });
        return {
          step: "ai",
          message: toolResult.content[0].text,
          isFinal: true,
        };
      } else {
        return {
          step: "ai",
          message,
          isFinal: true,
        };
      }
    } catch (error) {
      console.error('GPT Mini Error:', error);
      throw error;
    }
  }
}
