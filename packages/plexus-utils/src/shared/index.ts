export * from "./itemManipulation"
export function isServer() {
	return typeof process !== "undefined" && process?.release?.name === "node"
}
