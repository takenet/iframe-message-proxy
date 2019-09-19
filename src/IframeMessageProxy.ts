import { createDeferred, IDeferred } from './utils/promises'
import { randomStr } from './utils/string'

export interface IMessagePayload {
  action: string
  content?: any
  caller?: string,
  fireAndForget?: boolean
}

export interface IDeferredCache {
  [id: string]: IDeferred
}

export interface IIdentifiedMessage {
  message: IMessagePayload
  trackingProperties: ITrackingProperties
}

export interface IIframeMessageProxyOptions {
  prefix?: string
  caller?: string
  receiveWindow?: Window
  targetWindow?: Window
  shouldHandleMessage?: ((message: IIdentifiedMessage) => boolean)
}

export interface ITrackingProperties {
  id: string
}

export class IframeMessageProxy {
  private static defaultBlipEventPrefix = 'blipEvent:'
  private static instance: IframeMessageProxy
  private eventPrefix: string = IframeMessageProxy.defaultBlipEventPrefix
  private receiveWindow: Window = window
  private pendingRequestPromises: IDeferredCache = {}
  private validateMessage:
    | ((message: IIdentifiedMessage) => boolean)
    | undefined
  private eventCaller: string = window.name
  private targetWindow: Window = window.parent
  private handleOnReceiveMessage: (message: MessageEvent) => void

  private constructor() {
    this.handleOnReceiveMessage = this.onReceiveMessage.bind(this)
  }

  /**
   * Format sended payload
   */
  private formatPayload(payload: IMessagePayload): IIdentifiedMessage {
    const trackingProperties = this.createTrackingProperties()

    return {
      message: {
        ...payload,
        action: `${this.eventPrefix}${payload.action}`,
        caller: this.eventCaller
      },
      trackingProperties
    }
  }

  /**
   * Create tracking properties to be added on every sended messages
   */
  private createTrackingProperties(): ITrackingProperties {
    return {
      id: randomStr()
    }
  }

  /**
   * Create local cache for deferred promise
   */
  private createPromiseCache(id: string, deferred: IDeferred): void {
    this.pendingRequestPromises[id] = deferred
  }

  /**
   * Returns true if message should be handled or false if don't
   * @param message
   */
  private shouldHandleMessage(message: MessageEvent): boolean {
    const passDefault = ({ data }: { data: IIdentifiedMessage }): boolean => {
      const evt = data

      return evt.trackingProperties && evt.trackingProperties.id ? true : false
    }

    const isHandleable = ({ data }: { data: IIdentifiedMessage }): boolean => {
      if (this.validateMessage) {
        return passDefault({ data }) && this.validateMessage(data)
      }

      return passDefault(message)
    }

    return isHandleable(message)
  }

  /**
   * Chack if is error response
   * @param message
   */
  private isError(message: any): boolean {
    return message.error
  }

  /**
   * Handle received messages based on custom rules
   */
  private onReceiveMessage(evt: MessageEvent): void {
    if (!this.shouldHandleMessage(evt)) {
      return
    }

    const message = evt.data

    // Resolve pending promise if received message is a response of message sended previously
    const deferred = this.pendingRequestPromises[message.trackingProperties.id]

    if (deferred) {
      if (this.isError(message)) {
        return deferred.reject(message.error)
      }

      return deferred.resolve(message)
    }
  }

  /**
   * Returns a singleton instance of class
   */
  public static getInstance(): IframeMessageProxy {
    if (!IframeMessageProxy.instance) {
      IframeMessageProxy.instance = new IframeMessageProxy()
    }

    return IframeMessageProxy.instance
  }

  /**
   * Initialize proxy with options passed as param
   */
  public config(options?: IIframeMessageProxyOptions): IframeMessageProxy {
    this.eventPrefix = options && options.prefix || IframeMessageProxy.defaultBlipEventPrefix
    this.eventCaller = options && options.caller || window.name
    this.receiveWindow = options && options.receiveWindow || window
    this.targetWindow = options && options.targetWindow || window.parent
    this.validateMessage = options && options.shouldHandleMessage

    return this
  }

  /**
   * Start to listen message receiver events
   */
  public listen(): void {
    this.receiveWindow.addEventListener('message', this.handleOnReceiveMessage)
  }

  /**
   * Remove event listener that handle messages
   */
  public stopListen(): void {
    this.receiveWindow.removeEventListener(
      'message',
      this.handleOnReceiveMessage
    )
  }

  /**
   * Send message to parent iframe or to specified window
   * @param payload
   * @param element
   */
  public sendMessage(payload: IMessagePayload): Promise<any> {
    const message = this.formatPayload(payload)
    const deferred = createDeferred() 

    if (!payload.fireAndForget) {
      this.createPromiseCache(message.trackingProperties.id, deferred)
    }

    this.targetWindow.postMessage(message, '*')

    return deferred.promise
  }
}
