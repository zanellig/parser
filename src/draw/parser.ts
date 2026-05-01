import {
    ActionNameByToken,
    ActionTokens,
} from "./actions.ts"
import type { Action } from "./actions.ts"
import {
    InvalidActionParameterError,
    InvalidActionSyntaxError,
    UnexpectedActionParameterError,
    UnknownActionError,
} from "./errors.ts"
import { Lexer } from "./lexer.ts"
import type { LexicalToken } from "./lexer.ts"
import { isValidNonNegativeInteger, isValidPositiveInteger } from "../shared/numbers.ts"

export class ActionParser {
    #actions: Array<Action> = []

    constructor(lines: Array<string>) {
        const lexer = new Lexer(lines)
        const tokensByLine = this.#groupTokensByLine(lexer.tokens)

        for (const tokens of tokensByLine.values()) {
            this.#actions.push(this.#parseLine(tokens))
        }
    }

    #groupTokensByLine(tokens: Array<LexicalToken>) {
        const tokensByLine = new Map<number, Array<LexicalToken>>()

        for (const token of tokens) {
            const lineTokens = tokensByLine.get(token.line) ?? []
            lineTokens.push(token)
            tokensByLine.set(token.line, lineTokens)
        }

        return tokensByLine
    }

    #parseLine(tokens: Array<LexicalToken>): Action {
        const [actionToken, parameterToken, ...rest] = tokens

        if (!actionToken || actionToken.type !== "ACTION") {
            throw new UnknownActionError(this.#formatTokenError(actionToken, "Expected a valid action token"))
        }

        if (rest.length > 0) {
            throw new InvalidActionSyntaxError(this.#formatTokenError(rest[0], "Unexpected extra token"))
        }

        return this.#mapAction(actionToken, parameterToken)
    }

    #mapAction(actionToken: LexicalToken, parameterToken: LexicalToken | undefined): Action {
        const action = actionToken.value
        switch (action) {
            case ActionTokens.selectPen: {
                const param = this.#readNumberParameter(actionToken, parameterToken, { allowZero: true })
                return { actionName: ActionNameByToken[action], param }
            }
            case ActionTokens.penDown:
            case ActionTokens.penUp:
                if (parameterToken) {
                    throw new UnexpectedActionParameterError(this.#formatTokenError(parameterToken, `Action "${action}" does not accept parameters`))
                }
                return { actionName: ActionNameByToken[action] }
            case ActionTokens.moveNorth:
            case ActionTokens.moveSouth:
            case ActionTokens.moveEast:
            case ActionTokens.moveWest: {
                const reps = this.#readNumberParameter(actionToken, parameterToken)
                return { actionName: ActionNameByToken[action], reps }
            }
            default:
                throw new UnknownActionError(this.#formatTokenError(actionToken, "Expected a valid action token"))
        }
    }

    #readNumberParameter(actionToken: LexicalToken, parameterToken: LexicalToken | undefined, options: { allowZero?: boolean } = {}) {
        const expected = options.allowZero ? "non-negative" : "positive"
        if (!parameterToken || parameterToken.type !== "NUMBER") {
            throw new InvalidActionParameterError(this.#formatTokenError(parameterToken ?? actionToken, `Action "${actionToken.value}" requires a ${expected} integer parameter`))
        }

        const number = Number(parameterToken.value)
        const valid = options.allowZero ? isValidNonNegativeInteger(number) : isValidPositiveInteger(number)
        if (!valid) {
            throw new InvalidActionParameterError(this.#formatTokenError(parameterToken, `Invalid numeric parameter "${parameterToken.value}"`))
        }

        return number
    }

    #formatTokenError(token: LexicalToken | undefined, message: string) {
        if (!token) return message
        return `[ERROR on ${token.line}:${token.column}] ${message}: "${token.value}"`
    }

    get actions() {
        return this.#actions
    }
}
