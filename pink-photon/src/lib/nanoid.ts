import { customAlphabet } from 'nanoid'

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'
const generateId = customAlphabet(alphabet, 20) 

export const nanoid = (length?: number) => {
  if (length && length !== 20) {
    return customAlphabet(alphabet, length)()
  }
  return generateId()
}


