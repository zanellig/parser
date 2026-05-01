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
    
class InvalidParsedNumber extends Error {}

interface Action extends Object {
    actionName: HumanReadableActions
}

interface RepeateableAction extends Action {
    reps: number
}

interface ParameterizableAction extends Action {
    param: number
}

type Actions = {
    "P":    ParameterizableAction
    "D":    Action
    "N":    RepeateableAction
    "S":    RepeateableAction
    "E":    RepeateableAction
    "W":    RepeateableAction
    "U":    Action
}

enum HumanReadableActions {
    "P" = "select_pen",
    "D" = "pen_down",
    "N" = "move_north",
    "S" = "move_south",
    "E" = "move_east",
    "W" = "move_west",
    "U" = "pen_up"
}

class ActionParser {
    #actions: Array<Actions> = []

    constructor(lines: Array<string>) {
        for (const line of lines) {
            let tokens = line.split("")
            if (tokens.length === 0) continue
            const comment = this.#findComment(tokens)
            if (comment.found) tokens.splice(comment.idx!) // array brutality
            

            console.log(tokens, tokens.length)
        }
    }

    #findComment(tokens: Array<string>) {
        const commentIdx = tokens.findIndex((v) => v === "#")
        const hasComment = commentIdx > -1
        return {idx: hasComment ? commentIdx : null, found: hasComment}
    }

    #parseNumber() {}

    /** Este getter es al pedo por ahora, pero bueno */
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

    const lineParser = new ActionParser(lines)
    
}

main()
