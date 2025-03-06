import { Agent } from './Agent';
import { queryGPT } from '../services/gpt';

// NOTE: no memory yet, need to be class based later
// @plan alert me in popup for a short summary for the top 3 news in very short title

const getPlanningPrompt = (goal) => `
# Instructions
- You are a helpful assistant to help me plan to achieve the goal with tools provided.

# Expectation
- The output should be in JSON Array format with executable steps by using tools:
\`\`\`json
[
  {
    "step": "[give_a_step_name]",
    "prompt": "[promp to achieve the step, use "<former_step_name>" it it needs output from former step]",
    "deps": [
      "<former_step_name>"
    ]
  },
]
\`\`\`

- step name should be all lowercase with _ as separator
- if steps get inputs from former steps already, try to avoid to repeatly use former tool, hint that in the prompt
- prompt should be in one sentence
- each step focus on a single task, don't mix multiple tasks in one step

# Goal
${goal}`; 

export class PlanningAgent extends Agent {
  constructor({
    tools,
    onUpdate = console.log,
    toolingAgent
  }) {
    super({ onUpdate });
    this.tools = tools;
    this.toolingAgent = toolingAgent;
  }

  async invoke({ message: input }) {
    try {
      let respText = '';
      
      const appendUpdate = async (message, mode = "append") => {
        respText += message;
        await this.onUpdate({
          step: "ai",
          message,
          mode,
        });
      };

      // Planning start
      await appendUpdate(`Planning...\n\n`);

      const fullPrompt = getPlanningPrompt(input.trim());

      const tools = await this.tools.listTools();
      let { message } = await queryGPT({
        input: fullPrompt,
        tools,
        // onUpdate: this.onUpdate
      });

      message = message.replace(/^```json/, '').replace(/```$/, '');
      await appendUpdate(`Planning completed.\n\n`);

      // Parse the output
      const steps = JSON.parse(message);

      const results = {};
      for (const step of steps) {
        const { step: name, prompt, deps } = step;

        await appendUpdate(`- Executing ${name}...\n\n`);

        const finalPrompt = `
${prompt}
${deps.map(dep => `
# ${dep}
${results[dep]}
  `.trim()).join('\n')}
        `.trim();
        const stepResult = await this.toolingAgent.invoke({ message: finalPrompt, onUpdate: console.log });
        if (!stepResult.completed) {
          break;
        }
        results[name] = stepResult.message;
      }

      await appendUpdate(`Task completed.\n\n`);

      return {
        step: "ai",
        message: respText,
        completed: true,
      };
    } catch (error) {
      console.error('Error in bot flow:', error);
      throw error;
    }
  }
}