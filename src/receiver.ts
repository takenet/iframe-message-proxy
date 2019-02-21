type CallbackFn = () => any;

export class Receiver {
  public static onReceivePostMessage(fn: CallbackFn) {
    const target = window
    target.addEventListener('message', Receiver.handlePostMessageReceiver(fn))
  }

  public static handlePostMessageReceiver = (fn: any) => (event: MessageEvent) => {
    if (typeof fn === 'function' || fn instanceof Promise) {
      fn.call(Receiver, event.data)
    }
  }
}

