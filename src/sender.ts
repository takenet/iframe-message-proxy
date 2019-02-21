export type MessagePayload = {
  caller: string
  action: string
}

const BLIP_EVENT_PREFIX = 'blipEvent:';

export const sendMessage = (payload: MessagePayload, element?: Window) => {
  const defineTarget = (): Window | undefined => {
    if (!element && !window.parent) {
      return undefined;
    } else if (element) {
      return element;
    }

    return window.parent;
  }

  const target = defineTarget();

  if (!target) {
    return;
  }

  const message = formatPayload(payload)
  target.postMessage(message, '*')
}

const formatPayload = ({ caller, action }: MessagePayload) => ({
  action: `${BLIP_EVENT_PREFIX}:${action}`,
  caller,
})
