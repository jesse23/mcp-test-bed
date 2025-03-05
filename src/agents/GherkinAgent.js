import { executeGherkinFeature } from '../gherkin-web/gherkin';
import { queryGPT } from '../services/gpt';
import { Agent } from './Agent';

// NOTE: no memory yet, need to be class based later

const SYSTEM_PROMPT = `
# Instructions
- You are a helpful assistant. Try to answer the question in Gherkin format with Given, When, And, Then. Below are the available steps:
\`\`\`
Given I am on the news page
Then I should see the app content
When I click on the "{string}" button
Then I should see the count increase to "{string}"
When I type "{string}" into the fetch news form
When I clear the text input
Then I should see "{string}" displayed in the text value
\`\`\`

- And is used after first When to not repeat the word When.
- For Button we have "Fetch" to fetch news, "Ask GPT Mini" to ask a question to GPT Mini.
- For news source we have "Verge" only. source input is required before hit "Fetch" button.
- First 2 line needs to define "Feature:" and "Scenario"
`;

export class GherkinAgent extends Agent {
  constructor({ onUpdate }) {
    super({ onUpdate });
  }

  async invoke(prompt) {
    try {
      // NOTE: better to have print here too

      // Reasoning
      const fullPrompt = `${SYSTEM_PROMPT}\n\n# Question\n${prompt}`.trim();

      let { message } = await queryGPT({ input: fullPrompt, onUpdate: this.onUpdate });

      let feature = message;
      if (feature.startsWith('```gherkin')) {
        feature = feature.slice(feature.indexOf('\n') + 1);
        // remove the last ```
        feature = feature.slice(0, -3);
      }

      // Manul action confirm 
      const resp = await this.onUpdate({
        step: "ai",
        message: `\nDo you want to execute this?`,
        mode: "append",
        confirm: true,
      });

      // Manual action invoke
      if (resp.message === 'accept') {
        await executeGherkinFeature(feature);
        message += `\n\n(Feature executed)`;
      } else if (resp.message === 'reject') {
        message += `\n\n(User choose to not execute the feature)`;
      } else {
        message += `\n\n(${resp.message}) <- follow up question not supported yet`;
      }



      return {
        step: "ai",
        message,
        isFinal: true,
      };
    } catch (error) {
      console.error('Error in bot flow:', error);
      throw error;
    }
  }
}