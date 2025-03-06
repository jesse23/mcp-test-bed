import { GherkinAgent } from './GherkinAgent';
import { PlanningAgent } from './PlanningAgent';
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
    this.planningAgent = new PlanningAgent({ tools, onUpdate, toolingAgent: this });
  }

  async invoke({ message: input, onUpdate }) {
    try {
      let respText = '';
      
      const appendUpdate = async (message, mode = "append", confirm = false) => {
        respText += message;
        return await (onUpdate || this.onUpdate)({
          step: "ai",
          message,
          mode,
          confirm,
        });
      };

      if (input.startsWith('@bot ')) {
        const message = input.slice(5);
        return this.gherkinAgent.invoke({ message });
      } else if (input.startsWith('@plan ')) {
        const message = input.slice(6);
        return this.planningAgent.invoke({ message });
      }
      const tools = await this.tools.listTools();

      let { message, tools: [functionCall] } = await queryGPT({
        input,
        tools,
        onUpdate: onUpdate || this.onUpdate
      });

      // Process tool calls or content
      if (functionCall) {
        const resp = await this.onUpdate({
          step: "ai",
          message: `*Agent wants to execute tool* **\`${functionCall.name}\`**.\n\n`,
          mode: "append",
          confirm: true,
        });

        // Manual action invoke
        if (resp.message === 'accept') {
          const { name, arguments: arg } = functionCall;
          const toolResult = await this.tools.callTool({
            name,
            arguments: JSON.parse(arg),
          });
          return {
            step: "ai",
            message: toolResult.content[0].text,
            completed: true,
          };
        } else if (resp.message === 'reject') {
          message += `(User choose to not execute the feature)\n\n`;
        } else {
          message += `(${resp.message}) <- follow up question not supported yet\n\n`;
        }
      }
      return {
        step: "ai",
        message,
        completed: !functionCall,
      };
    } catch (error) {
      console.error('GPT Mini Error:', error);
      throw error;
    }
  }
}
