export const ActionTokens = {
    selectPen: "P",
    penDown: "D",
    moveNorth: "N",
    moveSouth: "S",
    moveEast: "E",
    moveWest: "W",
    penUp: "U",
} as const

export type ActionToken = typeof ActionTokens[keyof typeof ActionTokens]

export const ActionNames = {
    selectPen: "select_pen",
    penDown: "pen_down",
    moveNorth: "move_north",
    moveSouth: "move_south",
    moveEast: "move_east",
    moveWest: "move_west",
    penUp: "pen_up",
} as const

export type ActionName = typeof ActionNames[keyof typeof ActionNames]

export const ActionNameByToken = {
    [ActionTokens.selectPen]: ActionNames.selectPen,
    [ActionTokens.penDown]: ActionNames.penDown,
    [ActionTokens.moveNorth]: ActionNames.moveNorth,
    [ActionTokens.moveSouth]: ActionNames.moveSouth,
    [ActionTokens.moveEast]: ActionNames.moveEast,
    [ActionTokens.moveWest]: ActionNames.moveWest,
    [ActionTokens.penUp]: ActionNames.penUp,
} as const satisfies Record<ActionToken, ActionName>

export type SelectPenAction = {
    actionName: typeof ActionNames.selectPen
    param: number
}

export type PenStateAction = {
    actionName: typeof ActionNames.penDown | typeof ActionNames.penUp
}

export type MoveAction = {
    actionName:
    | typeof ActionNames.moveNorth
    | typeof ActionNames.moveSouth
    | typeof ActionNames.moveEast
    | typeof ActionNames.moveWest
    reps: number
}

export type Action = SelectPenAction | PenStateAction | MoveAction
