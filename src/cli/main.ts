import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

import { ActionParser } from "../draw/parser.ts"
import { Canvas } from "../render/canvas.ts"
import { ArgumentReader } from "./args.ts"
import { RequiredPathFlagError } from "./errors.ts"

export function run(argv: string[], cwd = process.cwd()) {
    const args = new ArgumentReader(argv)
    const pathFlag = args.get("path")
    if (!pathFlag || !pathFlag.acceptsParam || pathFlag.paramType !== "string") {
        throw new RequiredPathFlagError()
    }

    const file = fs.readFileSync(path.resolve(cwd, pathFlag.param), "utf-8")
    const lines = file.split("\n")

    const actionParser = new ActionParser(lines)
    const canvas = new Canvas()
    const requestedDimensions: { width?: number, height?: number } = {}
    const width = args.get("width")?.param
    const height = args.get("height")?.param
    if (typeof width === "number") requestedDimensions.width = width
    if (typeof height === "number") requestedDimensions.height = height
    canvas.requestCanvas(requestedDimensions)
    canvas.perform(actionParser.actions)

    return canvas.render()
}

function main() {
    console.log(run(process.argv))
}

const currentFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
    main()
}
