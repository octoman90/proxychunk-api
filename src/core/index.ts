import { Proxy } from "../models/Proxy"
import { spawn } from "child_process"
import AutoChecker from "./AutoChecker"
import type { ShivaResult } from "../types/ShivaResult"

const shivaParams = ["-json", "-interactive"]

if (!("development" === process.env.NODE_ENV)) {
	shivaParams.push("-skipres")
}

if (process.env.ANY_CERT === "true") {
	shivaParams.push("-skipcert")
}

if (process.env.TIMEOUT !== undefined) {
	shivaParams.push(`-timeout=${process.env.TIMEOUT}`)
}

const shiva = spawn("proxyshiva", shivaParams)

shiva.on("error", (err) => {
	if (err.message.includes("ENOENT")) {
		console.log(
			"Looks like you don't have proxyshiva installed in your system\nRefer to the README file for installation instructions"
		)
	} else {
		console.log("Unknown critical error occured:", err.message)
	}

	process.exit(1)
})

shiva.stdin.setDefaultEncoding("utf-8")

shiva.stdout.on("data", (data) => {
	data.toString()
		.split("\n")
		.forEach((result: string) => {
			try {
				Proxy.fromShiva(JSON.parse(result) as ShivaResult).update()
			} catch {
				// Can be ignored
			}
		})
})

export function createAutochecker(interval: number) {
	return new AutoChecker(shiva, interval)
}
