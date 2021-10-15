import { writeFile as wf, readFile as rf, mkdir as mk } from 'fs'
import { promisify } from 'util'

export const writeFile = promisify(wf)
export const readFile = promisify(rf)
export const mkdir = promisify(mk)