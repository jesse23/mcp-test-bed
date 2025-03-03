export class BrowserTools {
  constructor(options = {}) {
    this.options = options;
  }

  async listTools() {
    return [
      {
        type: "function",
        function: {
          name: "window_alert",
          description: "Display an alert dialog with the specified message for notification",
          parameters: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "The message to display in the alert dialog"
              }
            },
            required: ["message"]
          },
          strict: false
        }
      },
      {
        type: "function",
        function: {
          name: "open_window_resize",
          description: "Open a new browser window to specified dimensions",
          parameters: {
            type: "object",
            properties: {
              width: {
                type: "number",
                description: "The desired width of the window in pixels"
              },
              height: {
                type: "number",
                description: "The desired height of the window in pixels"
              }
            },
            required: ["width", "height"]
          },
          strict: false
        }
      }
    ];
  }

  async callTool({ name, arguments: args = {} }) {
    switch (name) {
      case "window_alert":
        window.alert(args.message);
        return {
          content: [
            {
              text: `Alert displayed with message: ${args.message}`
            }
          ]
        };

      case "open_window_resize":
        window.open(window.location.href, "_blank", `width=${args.width},height=${args.height}`);
        return {
          content: [
            {
              text: `Window resized to ${args.width}x${args.height}`
            }
          ]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
} 