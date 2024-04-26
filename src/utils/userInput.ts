import readline from 'readline'

export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

export const getInput = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer)
      rl.close()
    })
  })
}
// const userInput = await getInput('Enter event id: ')
// console.log(`You entered: ${userInput}`)
