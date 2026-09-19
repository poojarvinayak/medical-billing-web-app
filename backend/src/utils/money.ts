const SCALE = 100n
const RATE_SCALE = 10000n

const decimalToScaled = (value: string, scale: bigint): bigint => {
  const text = value.trim()
  if (!/^\d+(\.\d+)?$/.test(text)) throw new Error('Invalid monetary value')
  const [whole = '0', fraction = ''] = text.split('.')
  const fractionDigits = Number(scale === SCALE ? 2 : 4)
  const padded = fraction.padEnd(fractionDigits, '0').slice(0, fractionDigits)
  return BigInt(whole) * scale + BigInt(padded || '0')
}

export const parseMoney = (value: string): bigint => decimalToScaled(value, SCALE)
export const parseRate = (value: number): bigint => decimalToScaled(String(value), RATE_SCALE)

export const roundDivide = (numerator: bigint, denominator: bigint): bigint => {
  if (denominator <= 0n) throw new Error('Invalid division')
  return (numerator + denominator / 2n) / denominator
}

export const multiplyRate = (amountCents: bigint, rate: number): bigint => roundDivide(amountCents * parseRate(rate), 100n * RATE_SCALE)
export const multiplyQuantity = (unitCents: bigint, quantity: number): bigint => unitCents * BigInt(quantity)
export const formatMoney = (amountCents: bigint): string => {
  const sign = amountCents < 0n ? '-' : ''
  const absolute = amountCents < 0n ? -amountCents : amountCents
  return `${sign}${absolute / SCALE}.${(absolute % SCALE).toString().padStart(2, '0')}`
}
