export class RequiredPathFlagError extends Error {
    constructor() {
        super("A draw file path is required. Provide one with --path, --file, -p, or -f.")
    }
}
