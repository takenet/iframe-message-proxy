interface IMessagePayload {
  action: string
  content: any
}

interface IDeferred {
  resolve: <T>(value?: T | Promise<T>) => void
  reject: <T>(error: T) => void
  promise: Promise<any>
}

interface IDeferredCache {
  [id: string]: IDeferred;
}

interface IIdentifiedMessage {
  message: IMessagePayload
  trackingProperties: ITrackingProperties
}

interface IIframeMessageProxyOptions {
  prefix?: string
  caller?: string
  target?: Window
  shouldHandleMessage?: ((message: IIdentifiedMessage) => boolean)
}

interface ITrackingProperties {
  id: string
}

export class IframeMessageProxy {
  private defaultBlipEventPrefix = 'blipEvent:'
  private eventPrefix: string
  private targetWindow: Window
  private pendingRequestPromises: IDeferredCache = {};
  private handleOnReceiveMessage: (message: MessageEvent) => void;
  private validateMessage: ((message: IIdentifiedMessage) => boolean) | undefined;

  constructor(options: IIframeMessageProxyOptions) {
    this.eventPrefix = options.prefix || this.defaultBlipEventPrefix
    this.targetWindow = options.target || window.parent
    this.validateMessage = options.shouldHandleMessage

    this.handleOnReceiveMessage = this.onReceiveMessage.bind(this)
  }

  /**
   * Format sended payload
   */
  private formatPayload(payload: IMessagePayload): IIdentifiedMessage {
    const trackingProperties = this.createTrackingProperties()
    return {
      message: {
        action: `${this.eventPrefix}:${payload.action}`,
        ...payload
      },
      trackingProperties
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
    return (Math.random() + 1).toString(36).substring(7)
  }

  /**
   * Utility to create a deferred object
   */
  private createDeferred(): IDeferred {
    const deferred: IDeferred = {
      resolve: () => undefined,
      reject: () => undefined,
      promise: new Promise(() => undefined)
    }

    const promise = new Promise((resolve: () => void, reject: () => void) => {
      deferred.resolve = resolve
      deferred.reject = reject
    })

    deferred.promise = promise

    return deferred
  }

  /**
   * Create local cache for deferred promise
   */
  private createPromiseCache(id: string, deferred: IDeferred): void {
    this.pendingRequestPromises[id] = deferred;
  }

  /**
   * Returns true if message should be handled or false if don't
   * @param message
   */
  private shouldHandleMessage(message: MessageEvent): boolean {
    const passDefault = ({ data }: { data: IIdentifiedMessage }): boolean => {
      const evt = data

      return (evt.message
        && evt.trackingProperties
        && evt.trackingProperties.id) ? true : false
    }

    const isHandleable = ({ data }: { data: IIdentifiedMessage}): boolean => {
      if (this.validateMessage) {
        return passDefault({ data }) && this.validateMessage(data)
      }

      return passDefault(message)
    }

    return isHandleable(message)
  }

  /**
   * Handle received messages based on custom rules
   */
  private onReceiveMessage(evt: MessageEvent): any {
    if (!this.shouldHandleMessage(evt)) {
      return;
    }

    const message: IIdentifiedMessage = evt.data

    // Resolve pending promise if received message is a response of message sended previously
    const deferred = this.pendingRequestPromises[message.trackingProperties.id]
    if (deferred) {
      return deferred.resolve(message);
    }
  }

  /**
   * Start to listen message receiver events
   */
  public listen() {
    this.targetWindow.addEventListener('message', this.handleOnReceiveMessage)
  }

  /**
   * Remove event listener that handle messages
   */
  public stopListen() {
    this.targetWindow.removeEventListener('message', this.handleOnReceiveMessage)
  }

  /**
   * Send message to parent iframe or to specified window
   * @param payload
   * @param element
   */
  public sendMessage(payload: IMessagePayload): Promise<any> {
    const message = this.formatPayload({ ...payload })
    const deferred = this.createDeferred();

    this.createPromiseCache(message.trackingProperties.id, deferred);
    this.targetWindow.postMessage(message, '*')

    return deferred.promise
  }
}
