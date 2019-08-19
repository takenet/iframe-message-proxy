[![Build Status](https://travis-ci.org/takenet/iframe-message-proxy.svg?branch=master)](https://travis-ci.org/takenet/iframe-message-proxy)

# Iframe Message Proxy

This package is used for [BLiP platform](https://portal.blip.ai) to handle communications between micro frontends, done by iframes throught `postMessages`. Basically, we send a message and wait for response. It is possible because every message sended to parent window throught `IframeMessageProxy` has a cached promise with an ID that is resolved when current window receive a message with the same ID. Jump to **Usage** section to more details.

# Installation

`npm i -S iframe-message-proxy`

# Usage

```typescript
import { IframeMessageProxy } from 'iframe-message-proxy';

IframeMessageProxy.listen(); // Start listen for post messages

// Sending messages
IframeMessageProxy.sendMessage({
  action: 'customAction',
  content: 'Here is my awesome action',
});
```
`sendMessage` method takes an object as param that accept these properties:

| Property | Type | Required | Description |
| -------- | ---- | -------- | ----------- |
| `action` | `string` | `true` | Action sended to parent iframe. By default, is prefixed by `blipEvent:` |
| `content` | `any` | `false` | Actions can have optional contents added
| `caller` | `string` | `false` | Every message has a `caller`. By default, is used child iframe name (passed as attribute on `<iframe name="iframe-name">...`) but you can set a custom caller name too.

By default, `sendMessage` method will send a `postMessage` to parent window and wait for some response, if has one.

```typescript
// Child iframe
const action = await IframeMessageProxy.sendMessage({
  action: 'customAction',
  content: 'Here is my awesome action',
});

// Parent iframe
const iframe = document.getElementById('my-iframe').contentWindow; // Get iframe caller

// Handle received messages
const handleOnReceiveMessage = msgEvt: MessageEvent => {
  /**
   * Assuming that window can receive many postMessage events,
   * there is a tip to filter only messages camed from our library
   */
  const BLIP_EVENT_PREFIX = 'blipEvent:'
  const shouldHandleMessage = msg =>
    Object.keys(msg)
      .find(k => k == 'action' && msg.action.startsWith(BLIP_EVENT_PREFIX));

  if (!msgEvt.data || !message || !shouldHandleMessage(msgEvt.data.message)) {
    return;
  }

  /**
   * Every message has properties "message" and "trackingProperties".
   * "trackingProperties" is used by Iframe Message Proxy to identify
   * which promise will be resolved after send a postMessage, so
   * if you want to send something back to caller, you have to pass
   * trackingProperties received from child iframe.
   */
  const { message, trackingProperties } = msgEvt.data;

  iframe.postMessage({
    response: 'Success!',
    trackingProperties
  }, '*')
}

window.addEventListener('message', handleOnReceiveMessage);
```

## Handling errors

If you want to send an error message to child iframe, you may also add `error` property to response object. In this way, the child iframe will reject the promise instead of resolve them.

```javascript
try {
  doSomethingWrong();
} catch (e) {
  iframe.postMessage({
    error: e.toString(),
    trackingProperties
  }, '*')
}
```

## Configuring

You can also configure defaults by `config` method:

```typescript
IframeMessageProxy.config({
  prefix: 'customPrefix:',
  eventCaller: 'jarvis',
})
```

prefix?: string
  caller?: string
  receiveWindow?: Window
  targetWindow?: Window
  shouldHandleMessage?: ((message: IIdentifiedMessage) => boolean)

| Property | Type | Default | Description |
| -------- | ---- | -------- | ----------- |
| `prefix` | `string` | `blipEvent:` | Action prefix |
| `caller` | `string` | `window.name` | Caller name |
| `receiveWindow` | `Window` | `window` | Window that will receive postMessages responses |
| `targetWindow` | `Window` | `window.parent` | Window that we'll request something |
| `shouldHandleMessage` | `() => boolean` | `undefined` | You can choose what message will be parsed or not by calling a function that takes a `MessageEvent` as argument. `function(evt) { if (!evt.data) return false }`
