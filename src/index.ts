import { EventAction } from './EventActions'
import { IframeMessageProxy } from './IframeMessageProxy'

const instance = IframeMessageProxy.getInstance()
export { instance as IframeMessageProxy, EventAction }
