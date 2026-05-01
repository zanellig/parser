import fs from "fs"
import path from "path"

class InvalidParameterError extends Error {}
class RequiredPathFlagError extends Error {}

type UnknownFlag = {
    flagName: string
    acceptsParam: false
}

type FlagByName = {
    path: {
        flagName: "path"
        acceptsParam: true
        paramType: "string"
        param: string
    }
    width: {
        flagName: "width"
        acceptsParam: true
        paramType: "number"
        param: number
    }
    height: {
        flagName: "height"
        acceptsParam: true
        paramType: "number"
        param: number
    }
}

type FlagName = keyof FlagByName
type KnownFlag = FlagByName[FlagName]
type ParsedFlag = KnownFlag | UnknownFlag

/**
 * Just for shits and giggles
 */
class ArgumentReader {
    #parsed:  Array<ParsedFlag> = []
    #ignored: Array<ParsedFlag> = []
    #executablePath = ""
    #scriptPath = ""

    constructor (argv: Array<string>) {
        for (let argi = 0; argi < argv.length; argi++) {
            const arg = argv[argi]
            
            if (argi === 0) {
                this.#executablePath = argv[argi]
                continue
            }
            if (argi === 1) {
                this.#scriptPath = argv[argi]
                continue
            }

            if (arg.startsWith("--") || arg.startsWith("-")) {
                const flag = this.#parseFlag(arg, argv[argi+1])
                if (this.#parsed.some((v) => v.flagName === flag.flagName)) {
                    this.#ignored.push(flag)
                    continue
                }
                this.#parsed.push(flag)
                if (flag.acceptsParam) {
                    argi++
                }
                continue
            }
        }
    }

    /**
     * @throws {InvalidParameterError}
     */
    #parseFlag(flag: string, parameter: string | undefined): ParsedFlag {
        const np = Number(parameter)
        switch (flag) {
            case "--path":
            case "--file":
            case "-p":
            case "-f":
                if (typeof parameter !== "string" || !parameter) throw new InvalidParameterError
                return {
                    flagName: "path",
                    acceptsParam: true,
                    paramType: "string",
                    param: parameter
                }
            case "--width":
            case "-w":
                checkValidPositiveNumberParameter(np)
                return {
                    flagName: "width",
                    acceptsParam: true,
                    paramType: "number",
                    param: np
                }
            case "--height":
            case "-h":
                checkValidPositiveNumberParameter(np)
                return {
                    flagName: "height",
                    acceptsParam: true,
                    paramType: "number",
                    param: np
                }
            default:
                return {
                    flagName: flag.replaceAll("-", ""),
                    acceptsParam: false,
                }
            }
        }

    get<T extends FlagName>(arg: T): FlagByName[T] | undefined {
        return this.#parsed.find((v): v is FlagByName[T] => v.flagName === arg)
    }
}

class ParsingError extends Error {}
class InvalidActionParameterError extends ParsingError {}
class InvalidActionSyntaxError extends ParsingError {}
class UnknownActionError extends ParsingError {}
class UnexpectedActionParameterError extends ParsingError {}

interface BaseAction extends Object {
    actionName: string
}

interface RepeateableAction extends BaseAction {
    reps: number
}

interface ParameterizableAction extends BaseAction {
    param: number
}

class ParameterizableAction implements ParameterizableAction {}

type Action = BaseAction | ParameterizableAction | RepeateableAction

// type Actions = {
//     "P":    ParameterizableAction
//     "D":    Action
//     "N":    RepeateableAction
//     "S":    RepeateableAction
//     "E":    RepeateableAction
//     "W":    RepeateableAction
//     "U":    Action
// }

/* Enums in TypeScript are BULLSHIT and I hate them :) */
enum TokenActions {
    "select_pen"    = "P",
    "pen_down"      = "D",
    "move_north"    = "N",
    "move_south"    = "S",
    "move_east"     = "E",
    "move_west"     = "W",
    "pen_up"        = "U",
}

enum HumanReadableActions {
    "P" = "select_pen",
    "D" = "pen_down",
    "N" = "move_north",
    "S" = "move_south",
    "E" = "move_east",
    "W" = "move_west",
    "U" = "pen_up",
}

type LexicalTokenType = "ACTION" | "NUMBER" | "UNKNOWN"

type LexicalToken = {
    type: LexicalTokenType
    value: string
    line: number
    column: number
}

class Lexer {
    #tokens: Array<LexicalToken> = []
    #validActions = new Set<string>([
        TokenActions.select_pen,
        TokenActions.pen_down,
        TokenActions.move_north,
        TokenActions.move_south,
        TokenActions.move_east,
        TokenActions.move_west,
        TokenActions.pen_up
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

class ActionParser {
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

    /**
     * @throws { InvalidActionParameterError }
     */
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

    /**
     * @throws { InvalidActionParameterError }
     */
    #mapAction(actionToken: LexicalToken, parameterToken: LexicalToken | undefined): Action {
        const action = actionToken.value
        switch (action) {
            case "P":
                const param = this.#readNumberParameter(actionToken, parameterToken)
                return { actionName: action, param }
            case "D":
            case "U":
                if (parameterToken) {
                    throw new UnexpectedActionParameterError(this.#formatTokenError(parameterToken, `Action "${action}" does not accept parameters`))
                }
                return { actionName: action }
            case "N":
            case "S":
            case "E":
            case "W":
                const reps = this.#readNumberParameter(actionToken, parameterToken)
                return { actionName: action, reps }
            default:
                throw new UnknownActionError(this.#formatTokenError(actionToken, "Expected a valid action token"))
        }
    }

    #readNumberParameter(actionToken: LexicalToken, parameterToken: LexicalToken | undefined) {
        if (!parameterToken || parameterToken.type !== "NUMBER") {
            throw new InvalidActionParameterError(this.#formatTokenError(parameterToken ?? actionToken, `Action "${actionToken.value}" requires a positive integer parameter`))
        }

        const number = Number(parameterToken.value)
        if (!isValidPositiveInteger(number)) {
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

class InvalidActionSequenceError extends Error {}
class InvalidRequestedDimensionsError extends InvalidParameterError {}

interface Coords2D {
    x: number,
    y: number,
}

interface Dimensions {
    width:  number,
    height: number,
}

type CanvasState = Array<Array<number>>

class CanvasController {
    static #instance: CanvasController | null = null
    #penCoords: Coords2D    =   { x: 0, y: 0 }
    #canvas:    CanvasState =   []
    #dims:      Dimensions  =   { width: 0, height: 0 }

    private constructor() {}
    
    static getInstance() {
        if (CanvasController.#instance === null) {
            CanvasController.#instance = new CanvasController()
        }

        return CanvasController.#instance
    }
    requestCanvas(dimensions: Partial<Dimensions>) {
        const width = Number(dimensions.width ?? dimensions.height)
        const height = Number(dimensions.height ?? dimensions.width)

        try {
            checkValidPositiveNumberParameter(width)
            checkValidPositiveNumberParameter(height)
        } catch (e) {
            if (Number.isNaN(width) && Number.isNaN(height)) throw new InvalidRequestedDimensionsError(`
            Canvas dimensions are required. 
            Please provide them as flags with --width / --height (or their shorthand alternatives).
            `)
            throw new InvalidRequestedDimensionsError(`Requested dimensions "width = ${width}" and "height = ${height}" are invalid.`)
        }
        this.#dims.width    = width
        this.#dims.height   = height
        this.#populateCanvas()
    }

    #populateCanvas() {
        if (this.#canvas.length > 0) return this.#canvas
        let rows = 0
        while (rows < this.#dims.height) {
            const colArr = new Array(this.#dims.width)
            colArr.fill(0)
            this.#canvas.push(colArr)
            rows++
        }
        return this.#canvas
    }
    /** @throws { InvalidActionSequence } */
    perform(actions: Action[]) {}
    performSingle(action: Action) {}
    paint() {
        const pixels = ["░░", "▓▓", "██"]

        for(const row of this.#canvas) {
            let line = ""
            for (const col of row) {
                line += pixels[col] ?? "??"
            }
            console.log(line)
        }
    }
}

/**
 * @throws { InvalidParameterError }
 */
function checkValidPositiveNumberParameter(np: number) {
    if (!isValidPositiveInteger(np)) throw new InvalidParameterError
}

function isValidPositiveInteger(np: number) {
    return (
        Boolean(np) && 
        !Number.isNaN(np) && 
        Number.isFinite(np) && 
        Number.isSafeInteger(np) &&
        Number.isInteger(np) &&
        np > 0
    )
}

async function main() {
    const args = new ArgumentReader(process.argv)
    const pathFlag = args.get("path")
    if (!pathFlag || !pathFlag.acceptsParam || pathFlag.paramType !== "string") {
        throw new RequiredPathFlagError
    }
    const file = fs.readFileSync(
        path.join(
            process.env.PWD!,
            pathFlag.param
        ),
        "utf-8"
    )
    const lines = file.split("\n")

    const actionParser = new ActionParser(lines)
    const actions = actionParser.actions
    // TODO: aca tendria que implementar un CanvasController o algo asi
    const canvas = CanvasController.getInstance()
    const requestedDimensions = {
        width: args.get("width")?.param,
        height: args.get("height")?.param
    }
    canvas.requestCanvas(requestedDimensions)
    canvas.paint()
}

main()
