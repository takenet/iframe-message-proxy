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

  it('sendMessage returns a promise which is resolved if a response with matching id is observed', async (done) => {
    const iframePromise = IframeMessageProxy.sendMessage({ action: 'awesomeAction' })
    const testData = 'solved!'

    if (!iframe || !iframe.contentWindow) {
      return
    }

    iframe.contentWindow.postMessage(testData, '*')

    const response = await Promise.resolve(iframePromise)
    expect(response).toEqual(testData)
    done()
  })
})
