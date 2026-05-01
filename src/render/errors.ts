import { InvalidParameterError } from "../shared/errors.ts"

export class InvalidActionSequenceError extends Error { }
export class InvalidRequestedDimensionsError extends InvalidParameterError { }
