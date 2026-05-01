import { InvalidParameterError } from "../shared/errors.ts"
import { checkValidPositiveNumberParameter } from "../shared/numbers.ts"

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

export type FlagName = keyof FlagByName
type KnownFlag = FlagByName[FlagName]
type ParsedFlag = KnownFlag | UnknownFlag

export class ArgumentReader {
    #parsed: Array<ParsedFlag> = []
    #ignored: Array<ParsedFlag> = []
    #executablePath = ""
    #scriptPath = ""

    constructor(argv: Array<string>) {
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
                const flag = this.#parseFlag(arg, argv[argi + 1])
                if (this.#parsed.some((value) => value.flagName === flag.flagName)) {
                    this.#ignored.push(flag)
                    continue
                }
                this.#parsed.push(flag)
                if (flag.acceptsParam) {
                    argi++
                }
            }
        }
    }

    #parseFlag(flag: string, parameter: string | undefined): ParsedFlag {
        const numberParameter = Number(parameter)
        switch (flag) {
            case "--path":
            case "--file":
            case "-p":
            case "-f":
                if (typeof parameter !== "string" || !parameter) throw new InvalidParameterError()
                return {
                    flagName: "path",
                    acceptsParam: true,
                    paramType: "string",
                    param: parameter
                }
            case "--width":
            case "-w":
                checkValidPositiveNumberParameter(numberParameter)
                return {
                    flagName: "width",
                    acceptsParam: true,
                    paramType: "number",
                    param: numberParameter
                }
            case "--height":
            case "-h":
                checkValidPositiveNumberParameter(numberParameter)
                return {
                    flagName: "height",
                    acceptsParam: true,
                    paramType: "number",
                    param: numberParameter
                }
            default:
                return {
                    flagName: flag.replaceAll("-", ""),
                    acceptsParam: false,
                }
        }
    }

    get<T extends FlagName>(arg: T): FlagByName[T] | undefined {
        return this.#parsed.find((value): value is FlagByName[T] => value.flagName === arg)
    }
}
