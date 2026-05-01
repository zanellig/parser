import { ActionNames } from "../draw/actions.ts"
import type { Action } from "../draw/actions.ts"
import { InvalidActionParameterError } from "../draw/errors.ts"
import { assertNever } from "../shared/assert.ts"
import { checkValidPositiveNumberParameter, clamp } from "../shared/numbers.ts"
import { InvalidActionSequenceError, InvalidRequestedDimensionsError } from "./errors.ts"
import { PIXELS } from "./pixels.ts"

interface Coords2D {
    x: number
    y: number
}

export interface Dimensions {
    width: number
    height: number
}

type CanvasState = Array<Array<number>>

export class Canvas {
    #canvas: CanvasState = []
    #dims: Dimensions = { width: 0, height: 0 }
    #actionHistory: Action[] = []
    #penCoords: Coords2D = { x: 0, y: 0 }
    #penDown = false
    #penType = 1

    requestCanvas(dimensions: Partial<Dimensions>) {
        const width = Number(dimensions.width ?? dimensions.height)
        const height = Number(dimensions.height ?? dimensions.width)

        try {
            checkValidPositiveNumberParameter(width)
            checkValidPositiveNumberParameter(height)
        } catch (error) {
            if (Number.isNaN(width) && Number.isNaN(height)) {
                throw new InvalidRequestedDimensionsError([
                    "Canvas dimensions are required.",
                    "Please provide them as flags with --width / --height (or their shorthand alternatives)."
                ].join(" "))
            }
            throw new InvalidRequestedDimensionsError(`Requested dimensions "width = ${width}" and "height = ${height}" are invalid.`)
        }

        this.#dims.width = width
        this.#dims.height = height
        this.#penCoords = { x: 0, y: height - 1 }
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

    perform(actions: Action[]) {
        for (const action of actions) {
            this.#performSingle(action)
        }
    }

    #performSingle(action: Action) {
        switch (action.actionName) {
            case ActionNames.selectPen:
                if (action.param < 0 || action.param > PIXELS.length - 1) {
                    throw new InvalidActionParameterError([
                        "The selected pen is not available. Try with the following:",
                        PIXELS.map((value, index) => ` ${index} => ${value}`).join(",")
                    ].join(" "))
                }
                if (this.#penDown) {
                    throw new InvalidActionSequenceError("Pen must be lifted before changing its type.")
                }
                this.#penType = action.param
                this.#saveAction(action)
                return
            case ActionNames.penDown:
                this.#penDown = true
                this.#saveAction(action)
                return
            case ActionNames.penUp:
                this.#penDown = false
                this.#saveAction(action)
                return
            case ActionNames.moveNorth:
                this.#move(0, -1, action.reps)
                this.#saveAction(action)
                return
            case ActionNames.moveSouth:
                this.#move(0, 1, action.reps)
                this.#saveAction(action)
                return
            case ActionNames.moveEast:
                this.#move(1, 0, action.reps)
                this.#saveAction(action)
                return
            case ActionNames.moveWest:
                this.#move(-1, 0, action.reps)
                this.#saveAction(action)
                return
            default:
                assertNever(action)
        }
    }

    #move(dx: number, dy: number, reps: number) {
        const maxX = Math.max(0, this.#dims.width - 1)
        const maxY = Math.max(0, this.#dims.height - 1)

        for (let step = 0; step < reps; step++) {
            if (this.#penDown) {
                const row = this.#canvas[this.#penCoords.y]
                if (row) row[this.#penCoords.x] = this.#penType
            }

            this.#penCoords.x = clamp(this.#penCoords.x + dx, 0, maxX)
            this.#penCoords.y = clamp(this.#penCoords.y + dy, 0, maxY)
        }
    }

    #saveAction(action: Action) {
        if (this.#actionHistory.length > 9) {
            this.#actionHistory.shift()
        }
        this.#actionHistory.push(action)
    }

    render() {
        const lines: string[] = []

        for (const row of this.#canvas) {
            let line = ""
            for (const col of row) {
                line += PIXELS[col] ?? "??"
            }
            lines.push(line)
        }

        return lines.join("\n")
    }
}
