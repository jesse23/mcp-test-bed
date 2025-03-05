/*
type Update = {
  step: string;                    // Current step identifier
  message: string;                 // Main content
  mode: "append" | "replace";      // How to handle content update
  tools: {
    name: string;
    args: Record<string, any>;
  }[]
  confirm?: boddolean;          // Whether needs confirmation before execution
  isFinal?: boolean;           // Whether this update is final for this step
}
 */

export class Agent {
  constructor({
    onUpdate = console.log
  }) {
    this.onUpdate = onUpdate;
  }

  // To be implemented by subclasses
  async invoke(input) {
    throw new Error(`invoke method must be implemented by subclass - ${input}`);
  }
}

export class ExampleAgent extends Agent {
  async invoke(input) {
    await this.onUpdate({ step: "start", message: "Processing...", type: "start" });
    
    try {
      // Streaming AI response with detailed attributes
      const aiResponse = await this.streamAIResponse(input);
      await this.onUpdate({ step: "ai", message: aiResponse, type: "final", isFinal: true });

      const processedData = this.processData(aiResponse);
      await this.onUpdate({ step: "processing", message: processedData, type: "final", isFinal: true });

      // Use callback to handle confirmation
      const confirmedData = await this.onUpdate({ step: "confirm", message: processedData, type: "start", confirm: true });

      await this.onUpdate(confirmedData);

      return confirmedData;
    } catch (error) {
      await this.onUpdate({ step: "error", message: error.message, type: "error", isFinal: true });
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
        type: "stream",
        isFinal: false,
      });
    }

    await this.onUpdate({
      step: "ai-stream",
      message: fullResponse,
      type: "end",
      isFinal: true,
    });

    return {
      step: "ai-stream",
      message: fullResponse,
      isFinal: true,
    };
  }

  processData(data) {
    return `Processed: ${data.message.toUpperCase()}`;
  }
}

// Example usage
// Only run this example in Node.js environment
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  const agent = new ExampleAgent(async (update) => {
    console.log("Update:", JSON.stringify(update));

    if (update.confirm) {
      return new Promise((resolve) => {
        process.stdout.write(`Confirm processed data: ${update.message}\nEnter value (or press Enter to accept): `);

        process.stdin.once("data", (data) => {
          const userInput = data.toString().trim();
          resolve({
            step: "confirm", 
            message: userInput || update.message,
            isFinal: true,
          });
          process.stdin.destroy();
        });
      });
    }
  });

  agent.invoke("Hello").then((result) => {
    console.log("Final Result:", result);
  });
} 