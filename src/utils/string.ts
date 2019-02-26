/**
 * Utility to generate random sequence of characters used as tracking id for promises.
 */
export const randomStr = (): string => (Math.random() + 1).toString(36).substring(7)
