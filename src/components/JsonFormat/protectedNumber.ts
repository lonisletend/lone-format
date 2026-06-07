export const PROTECTED_NUMBER_KEY = '__protected_number__'

const PROTECTED_NUMBER_MARKER = Symbol('JsonFormatProtectedNumber')

export interface ProtectedNumber {
  [PROTECTED_NUMBER_KEY]: string
  [PROTECTED_NUMBER_MARKER]: true
}

export const createProtectedNumber = (value: string): ProtectedNumber => {
  const protectedNumber = { [PROTECTED_NUMBER_KEY]: value } as ProtectedNumber

  Object.defineProperty(protectedNumber, PROTECTED_NUMBER_MARKER, {
    value: true,
    enumerable: false
  })

  return protectedNumber
}

export const isProtectedNumberObject = (value: any): value is ProtectedNumber => {
  return value !== null &&
         typeof value === 'object' &&
         !Array.isArray(value) &&
         value[PROTECTED_NUMBER_MARKER] === true &&
         PROTECTED_NUMBER_KEY in value &&
         Object.keys(value).length === 1
}

export const getProtectedNumberValue = (value: any): string => {
  return isProtectedNumberObject(value) ? value[PROTECTED_NUMBER_KEY] : ''
}
