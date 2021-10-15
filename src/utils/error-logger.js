export let memo = []

const errorLogger = (...error) => {
    memo.push(error)
}

errorLogger.reset = () => (memo = [])

export { errorLogger }