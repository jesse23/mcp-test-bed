/*
type AgentData = {
  step: string;                    // Current step identifier
  message: string;                 // Main content
  mode: "append" | "replace";      // How to handle content update
  tools: {
    name: string;
    args: Record<string, any>;
  }[]
  confirm?: boddolean;          // Whether needs confirmation before execution
  completed?: boolean;          // Whether the task is completed, if false means it get cancelled
}
 */

export class Agent {
  constructor({
    onUpdate = console.log
  }) {
    this.onUpdate = onUpdate;
  }

  // To be implemented by subclasses
  // TODO: input should follow the AgentData type
  async invoke({ message }) {
    throw new Error(`invoke method must be implemented by subclass - ${message}`);
  }
}

 