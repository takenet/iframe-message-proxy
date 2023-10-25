import { IframeMessageProxy } from '../src'

describe('IframeMessageProxy', () => {
  const iframeName = 'awesome-iframe'
  const iframe = document.createElement('iframe')

  beforeAll(() => {
    iframe.setAttribute('name', iframeName)
    document.body.appendChild(iframe)

    IframeMessageProxy.config({
      receiveWindow: iframe.contentWindow,
      targetWindow: window
    })
  })

  it('sendMessage returns a promise which is resolved if a response with matching id is observed', () => {
    const iframePromise = IframeMessageProxy.sendMessage({ action: 'awesomeAction' })
    const testData = 'solved!'

    if (!iframe?.contentWindow) {
      return
    }

    iframe.contentWindow.postMessage(testData, '*')

    Promise.resolve(iframePromise).then((response) => {
      expect(response).toEqual(testData)
    }).catch((error) => {
      expect(error).toBeFalsy()
    })
  })
})
