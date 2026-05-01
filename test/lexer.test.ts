import test from "node:test"
import assert from "node:assert/strict"

import { Lexer } from "../src/draw/lexer.ts"
import { InvalidActionSyntaxError } from "../src/draw/errors.ts"

test("tokenizes draw actions and ignores comments", () => {
    const lexer = new Lexer([
        "P 2   # select pen",
        "",
        "D",
        "E 4"
    ])

    assert.deepEqual(lexer.tokens, [
        { type: "ACTION", value: "P", line: 1, column: 1 },
        { type: "NUMBER", value: "2", line: 1, column: 3 },
        { type: "ACTION", value: "D", line: 3, column: 1 },
        { type: "ACTION", value: "E", line: 4, column: 1 },
        { type: "NUMBER", value: "4", line: 4, column: 3 },
    ])
})

test("rejects leading indentation", () => {
    assert.throws(
        () => new Lexer([" E 2"]),
        InvalidActionSyntaxError
    )
})
