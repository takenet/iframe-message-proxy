interface IMessagePayload {
  action: string
  content: any
}

interface IIdentifiedMessage {
  message: IMessagePayload
  trackingProperties: ITrackingProperties
}

interface IIframeMessageProxyOptions {
  prefix?: string;
  caller?: string;
  target?: Window;
}

interface ITrackingProperties {
  id: string;
}

export class IframeMessageProxy {
  private defaultBlipEventPrefix = 'blipEvent:'
  private eventPrefix: string;
  private targetWindow: Window;

  constructor(options: IIframeMessageProxyOptions) {
    this.eventPrefix = options.prefix || this.defaultBlipEventPrefix;
    this.targetWindow = options.target || window.parent;
  }

  /**
   * Format sended payload
   */
  private formatPayload(payload: IMessagePayload): IIdentifiedMessage {
    const trackingProperties = this.createTrackingProperties();
    return {
      message: {
        action: `${this.eventPrefix}:${payload.action}`,
        ...payload,
      },
      trackingProperties,
    }
  }

  /**
   * Create tracking properties to be added on every sended messages
   */
  private createTrackingProperties(): ITrackingProperties {
    return {
      id: this.createRandomString()
    }
  }

  /**
   * Utility to generate random sequence of characters used as tracking id for promises.
   */
  private createRandomString(): string {
    return (Math.random() + 1).toString(36).substring(7);
  }

  /**
   * Send message to parent iframe or to specified window
   * @param payload
   * @param element
   */
  public sendMessage(payload: IMessagePayload) {
    const message = this.formatPayload({ ...payload })
    this.targetWindow.postMessage(message, '*')
  }
}
