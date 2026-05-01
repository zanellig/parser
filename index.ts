import fs from "fs"
import path from "path"

class InvalidParameterError extends Error {}
class RequiredPathFlagError extends Error {}

interface Flag extends Object {
    flagName: string,
    acceptsParam: boolean,
}

interface ParamFlag extends Flag {
    paramType: string,
    param: string
}

/**
 * Just for shits and giggles
 */
class ArgumentReader {
    #parsed:  Array<Flag | ParamFlag> = []
    #ignored: Array<Flag | ParamFlag> = []
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
    #parseFlag(flag: string, parameter: string): Flag | ParamFlag {
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
                } as ParamFlag
            default:
                return {
                    flagName: flag.replaceAll("-", ""),
                    acceptsParam: false,
                } as Flag
            }
        }
        
        get(arg: string) {
            return this.#parsed.find((v) => v.flagName === arg)
        }
    }

class ParsingError extends Error {}
class InvalidActionParameterError extends ParsingError {}

interface Action extends Object {
    actionName: string
}

class Action implements Action {}

interface RepeateableAction extends Action {
    reps: number
}

class RepeateableAction implements RepeateableAction {}

interface ParameterizableAction extends Action {
    param: number
}

class ParameterizableAction implements ParameterizableAction {}

type Actions = Action | ParameterizableAction | RepeateableAction

// type Actions = {
//     "P":    ParameterizableAction
//     "D":    Action
//     "N":    RepeateableAction
//     "S":    RepeateableAction
//     "E":    RepeateableAction
//     "W":    RepeateableAction
//     "U":    Action
// }

/**
 * Enums in TypeScript are BULLSHIT and I hate them
 */
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

class ActionParser {
    #actions: Array<Actions> = []
    #validActions: Array<TokenActions> = [
        TokenActions.select_pen,
        TokenActions.pen_down,
        TokenActions.move_north,
        TokenActions.move_south,
        TokenActions.move_east,
        TokenActions.move_west,
        TokenActions.pen_up
    ]

    constructor(lines: Array<string>) {
        for (let i = 0; i < lines.length; i++) {
            const cefl = i+1 // current effective line (what shows up in text editors)
            const line = lines[i]
            let tokens = line.split("")
            if (tokens.length === 0) continue
            const comment = this.#findComment(tokens)
            if (comment.found) tokens.splice(comment.idx!) // array brutality

            for (let pointer = 0; pointer < tokens.length; pointer++) {
                if (!this.#validActions.includes(tokens[pointer] as TokenActions)) {
                    continue
                }
                let action
                try {
                    action = this.#mapAction(tokens[pointer], tokens[pointer+2])
                } catch (e) {
                    if (e instanceof InvalidActionParameterError) {
                        console.log(`[line] ${line}`)
                        console.error(`[ERROR on ${cefl}:${pointer}] The parameter "${tokens[pointer+2]}" is not assignable to action "${tokens[pointer]}"`)
                        throw e
                    }
                }
                if (!action) continue // this will never happen, but I don't want to fight the type checker
                this.#actions.push(action)
                break
            }
        }
    }

    #findComment(tokens: Array<string>) {
        const commentIdx = tokens.findIndex((v) => v === "#")
        const hasComment = commentIdx > -1
        return {idx: hasComment ? commentIdx : null, found: hasComment}
    }

    /**
     * @throws { InvalidActionParameterError }
     */
    #mapAction(action: string, nextValidToken: string | undefined): Actions | void {
        const number = Number(nextValidToken)
        switch (action) {
            case "P":
                this.#checkValidNumberParameter(number)
                return { actionName: action, param: number }
            case "D":
            case "U":
                return { actionName: action }
            case "N":
            case "S":
            case "E":
            case "W":
                this.#checkValidNumberParameter(number)
                return { actionName: action, reps: number }
        }
    }

    /**
     * @throws { InvalidActionParameterError }
     */
    #checkValidNumberParameter(np: number) {
        if (
            !np || 
            Number.isNaN(np) || 
            !Number.isFinite(np) || 
            !Number.isSafeInteger(np) ||
            !Number.isInteger(np) ||
            np < 0
        ) throw new InvalidActionParameterError
    }

    get actions() {
        return this.#actions
    }
}

// {action}{space}{number}

async function main() {
    const args = new ArgumentReader(process.argv)
    const pathFlag = args.get("path") as ParamFlag
    if (!pathFlag) throw new RequiredPathFlagError
    const file = fs.readFileSync(
        path.join(
            process.env.PWD,
            pathFlag.param
        ),
        "utf-8"
    )
    const lines = file.split("\n")

    const actionParser = new ActionParser(lines)
    console.log(actionParser.actions)
}

main()
