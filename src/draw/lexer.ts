import { ActionTokens } from "./actions.ts"
import { InvalidActionSyntaxError } from "./errors.ts"

export type LexicalTokenType = "ACTION" | "NUMBER" | "UNKNOWN"

export type LexicalToken = {
    type: LexicalTokenType
    value: string
    line: number
    column: number
}

export class Lexer {
    #tokens: Array<LexicalToken> = []
    #validActions = new Set<string>([
        ActionTokens.selectPen,
        ActionTokens.penDown,
        ActionTokens.moveNorth,
        ActionTokens.moveSouth,
        ActionTokens.moveEast,
        ActionTokens.moveWest,
        ActionTokens.penUp
    ])

    constructor(lines: Array<string>) {
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex]
            const lineNumber = lineIndex + 1
            const commentIndex = line.indexOf("#")
            const source = commentIndex > -1 ? line.slice(0, commentIndex) : line

            if (source.trim().length === 0) continue

            this.#tokenizeLine(source, lineNumber)
        }
    }

    #tokenizeLine(line: string, lineNumber: number) {
        let pointer = 0
        let hasTokensInLine = false

        while (pointer < line.length) {
            const char = line[pointer]

            if (char === " " || char === "\t") {
                if (!hasTokensInLine) {
                    throw new InvalidActionSyntaxError(`Unexpected indentation at ${lineNumber}:${pointer + 1}`)
                }
                pointer++
                continue
            }

            if (this.#isDigit(char)) {
                const start = pointer
                while (pointer < line.length && this.#isDigit(line[pointer])) pointer++
                this.#tokens.push({
                    type: "NUMBER",
                    value: line.slice(start, pointer),
                    line: lineNumber,
                    column: start + 1
                })
                hasTokensInLine = true
                continue
            }

            if (this.#isAlpha(char)) {
                const start = pointer
                while (pointer < line.length && this.#isAlpha(line[pointer])) pointer++
                const value = line.slice(start, pointer)
                this.#tokens.push({
                    type: value.length === 1 && this.#validActions.has(value) ? "ACTION" : "UNKNOWN",
                    value,
                    line: lineNumber,
                    column: start + 1
                })
                hasTokensInLine = true
                continue
            }

            this.#tokens.push({
                type: "UNKNOWN",
                value: char,
                line: lineNumber,
                column: pointer + 1
            })
            hasTokensInLine = true
            pointer++
        }
    }

    #isDigit(value: string) {
        return value >= "0" && value <= "9"
    }

    #isAlpha(value: string) {
        const lower = value.toLowerCase()
        return lower >= "a" && lower <= "z"
    }

    get tokens() {
        return this.#tokens
    }
}
