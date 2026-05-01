import test from "node:test"
import assert from "node:assert/strict"

import { ActionNames } from "../src/draw/actions.ts"
import { Canvas } from "../src/render/canvas.ts"
import { InvalidActionSequenceError } from "../src/render/errors.ts"

test("renders movement from the bottom-left corner", () => {
    const canvas = new Canvas()
    canvas.requestCanvas({ width: 4, height: 3 })
    canvas.perform([
        { actionName: ActionNames.selectPen, param: 2 },
        { actionName: ActionNames.penDown },
        { actionName: ActionNames.moveEast, reps: 2 },
        { actionName: ActionNames.moveNorth, reps: 2 },
        { actionName: ActionNames.penUp },
    ])

    assert.equal(canvas.render(), [
        "░░░░░░░░",
        "░░░░██░░",
        "██████░░",
    ].join("\n"))
})

test("requires lifting the pen before changing pen type", () => {
    const canvas = new Canvas()
    canvas.requestCanvas({ width: 2, height: 2 })

    assert.throws(
        () => canvas.perform([
            { actionName: ActionNames.penDown },
            { actionName: ActionNames.selectPen, param: 1 },
        ]),
        InvalidActionSequenceError
    )
})
