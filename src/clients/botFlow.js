import { executeGherkinFeature } from '../gherkin-web/gherkin';

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

export async function executeFlow(prompt) {
  const fullPrompt = `${SYSTEM_PROMPT}\n\n# Question\n${prompt}`.trim();

  try {
    // Get Gherkin steps from GPT
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "user", content: fullPrompt }
          ],
          temperature: 0.7,
          max_tokens: 100,
          // tools,
          // tool_choice: "auto",
        })
      });
    
    if (!response.ok) {
      throw new Error('Failed to get response from GPT');
    }
    
      const data = await response.json();
      console.log('GPT Mini Response:', data);
      const gptContent = data.choices[0].message.content;

      let feature = gptContent;
      if(feature.startsWith('```gherkin')) {
        feature = feature.slice(feature.indexOf('\n') + 1);
        // remove the last ```
        feature = feature.slice(0, -3);
      }
    
    // Execute the Gherkin feature
    await executeGherkinFeature(feature);
    
    return gptContent;
  } catch (error) {
    console.error('Error in bot flow:', error);
    throw error;
  }
}