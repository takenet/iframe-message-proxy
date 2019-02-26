export interface IDeferred {
  resolve: <T>(value?: T | Promise<T>) => void
  reject: <T>(error: T) => void
  promise: Promise<any>
}

/**
 * Utility to create a deferred object
 */
export const createDeferred = (): IDeferred => {
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
