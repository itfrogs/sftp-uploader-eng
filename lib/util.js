import chalk from 'chalk'
import { stdout } from 'single-line-log'

/**
 * Print log
 * @param text content
 * @param type type
 */
const pointLog = (text, type = 'info') => {
  let outputText = text

  switch (type) {
    case 'success':
      outputText = chalk.green(outputText)
    case 'error':
      outputText = chalk.red(outputText)
    case 'link':
      outputText = chalk.blue(outputText)
    case 'info':
      outputText = chalk.cyanBright(outputText)
    default:
      outputText = chalk.cyanBright(outputText)
  }

  console.log(outputText)
}

/**
 * Progress bar
 * @param description Text information at the beginning of the command line
 * ​​@param bar_length Length of the progress bar (unit: characters), default setting is 25
 */
const progressBar = (description = '进度', bar_length = 25) => {
  // 两个基本参数(属性)
  return (opts) => {
    let percent = (opts.completed / opts.total).toFixed(4) // Calculate progress (number of completed subtasks divided by total number)
    let cell_num = Math.floor(percent * bar_length) // Calculate how many █ symbols are needed to make a pattern // Connect the black bars
    let cell = ''
    for (let i = 0; i < cell_num; i++) {
      cell += '█'
    } // Grey strips
    let empty = ''
    for (let i = 0; i < bar_length - cell_num; i++) {
      empty += '░'
    } // Final text splicing
    let cmdText = `  - ${description}: ${cell}${empty} ${(
      100 * percent
    ).toFixed(2)}% (${opts.completed}/${opts.total})` // Output text on a single line
    // stdout(pointLog(cmdText))
    stdout(cmdText)
  }
}

export { pointLog, progressBar }
