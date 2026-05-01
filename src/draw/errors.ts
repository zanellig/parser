export class ParsingError extends Error { }
export class InvalidActionParameterError extends ParsingError { }
export class InvalidActionSyntaxError extends ParsingError { }
export class UnknownActionError extends ParsingError { }
export class UnexpectedActionParameterError extends ParsingError { }
