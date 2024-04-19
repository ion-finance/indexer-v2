import readline from 'readline'

export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
export const waitForKeypress = () => {
  return new Promise((resolve) => {
    console.log('Press any key to continue...')
    rl.once('line', () => resolve(null))
  })
}
