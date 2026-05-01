import { InvalidParameterError } from "./errors.ts"

export function checkValidPositiveNumberParameter(value: number) {
    if (!isValidPositiveInteger(value)) throw new InvalidParameterError()
}

export function isValidPositiveInteger(value: number) {
    return (
        Boolean(value) &&
        !Number.isNaN(value) &&
        Number.isFinite(value) &&
        Number.isSafeInteger(value) &&
        Number.isInteger(value) &&
        value > 0
    )
}

export function isValidNonNegativeInteger(value: number) {
    return (
        !Number.isNaN(value) &&
        Number.isFinite(value) &&
        Number.isSafeInteger(value) &&
        Number.isInteger(value) &&
        value >= 0
    )
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}
