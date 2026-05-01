import test from "node:test"
import assert from "node:assert/strict"

import { ActionNames } from "../src/draw/actions.ts"
import {
    InvalidActionParameterError,
    UnexpectedActionParameterError,
} from "../src/draw/errors.ts"
import { ActionParser } from "../src/draw/parser.ts"

test("parses draw source into actions", () => {
    const parser = new ActionParser([
        "P 2",
        "D",
        "E 4",
        "U"
    ])

    assert.deepEqual(parser.actions, [
        { actionName: ActionNames.selectPen, param: 2 },
        { actionName: ActionNames.penDown },
        { actionName: ActionNames.moveEast, reps: 4 },
        { actionName: ActionNames.penUp },
    ])
})

test("rejects missing movement parameters", () => {
    assert.throws(
        () => new ActionParser(["N"]),
        InvalidActionParameterError
    )
})

test("rejects parameters on pen state actions", () => {
    assert.throws(
        () => new ActionParser(["D 2"]),
        UnexpectedActionParameterError
    )
})
