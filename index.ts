import fs from "fs"
import path from "path"

class InvalidParameterError extends Error {}
class RequiredPathFlagError extends Error {}
class RequiredPathError extends Error {}

interface Flag extends Object {
    flagName: string,
    acceptsParam: boolean,
    paramType?: string,
    param?: string
}

/**
 * Just for shits and giggles
 */
class ArgumentReader {
    #parsed: Array<Flag> = []
    #ignored: Array<Flag> = []
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
    #parseFlag(flag: string, parameter: string): Flag {
        switch (flag) {
            case "--path":
            case "--file":
                if (typeof parameter !== "string" || !parameter) throw new InvalidParameterError
                return {
                    flagName: "path",
                    acceptsParam: true,
                    paramType: "string",
                    param: parameter
                }
            default:
                return {
                    flagName: flag.replaceAll("-", ""),
                    acceptsParam: false,
                }
        }
    }

    get(arg: string) {
        return this.#parsed.find((v) => v.flagName === arg)
    }
}


async function main() {
    const args = new ArgumentReader(process.argv)
    const pathFlag = args.get("path")
    if (!pathFlag) throw new RequiredPathFlagError
    if (!pathFlag.param) throw new RequiredPathError
    const file = fs.readFileSync(
        path.join(
            process.env.PWD,
            pathFlag.param
        ),
        {
            encoding: "UTF-8"
        }
    )
}

main()
