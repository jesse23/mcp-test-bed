import { Agent } from "./Agent.js";

export class ExampleAgent extends Agent {
  async invoke({ message: input }) {
    await this.onUpdate({ step: "start", message: "Processing..." });

    try {
      // Streaming AI response with detailed attributes
      const aiResponse = await this.streamAIResponse(input);
      await this.onUpdate({ step: "ai", message: aiResponse });

      const processedData = this.processData(aiResponse);
      await this.onUpdate({ step: "processing", message: processedData });

      // Use callback to handle confirmation
      const confirmedData = await this.onUpdate({ step: "confirm", message: processedData, type: "start", confirm: true });

      await this.onUpdate(confirmedData);

      return confirmedData;
    } catch (error) {
      await this.onUpdate({ step: "error", message: error.message });
      throw error;
    }
  }

  async streamAIResponse(prompt) {
    const responseChunks = [
      "AI says: ",
      "This is ",
      "a streamed ",
      "response for ",
      prompt,
      "."
    ];

    let fullResponse = "";

    await this.onUpdate({ step: "ai-stream", message: "", type: "start" });

    for (const chunk of responseChunks) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulating delay
      fullResponse += chunk;

      await this.onUpdate({
        step: "ai-stream",
        message: fullResponse,  // Accumulated message so far
        chunk: chunk,           // The latest appended string
      });
    }

    await this.onUpdate({
      step: "ai-stream",
      message: fullResponse,
    });

    return {
      step: "ai-stream",
      message: fullResponse,
    };
  }

  processData(data) {
    return `Processed: ${data.message.toUpperCase()}`;
  }
}

// Example usage
// Only run this example in Node.js environment
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  const agent = new ExampleAgent({
    onUpdate: async (update) => {
      console.log("Update:", JSON.stringify(update));

      if (update.confirm) {
        return new Promise((resolve) => {
          process.stdout.write(`Confirm processed data: ${update.message}\nEnter value (or press Enter to accept): `);

          process.stdin.once("data", (data) => {
            const userInput = data.toString().trim();
            resolve({
              step: "confirm",
              message: userInput || update.message,
            });
            process.stdin.destroy();
          });
        });
      }
    }
  });

  agent.invoke({ message: "Hello" }).then((result) => {
    console.log("Final Result:", result);
  });
}