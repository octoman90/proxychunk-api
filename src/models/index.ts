import { Pool } from "pg"
import type { QueryResult } from "pg"

const pool = new Pool({
	database: process.env.POSTGRES_DB,
	host: process.env.POSTGRES_HOST,
	password: process.env.POSTGRES_PASSWORD,
	port: process.env.POSTGRES_PORT === undefined ? 5432 : parseInt(process.env.POSTGRES_PORT),
	user: process.env.POSTGRES_USER,
})

export function executeQuery(query: string): Promise<QueryResult<any>> {
	return new Promise((resolve, reject) => {
		pool.query(query, (err: Error, results: QueryResult<any>) => {
			err === undefined ? resolve(results) : reject(err)
		})
	})
}

async function createTable(tableName: string) {
	switch (tableName) {
		case "proxies":
			return executeQuery(
				`create table proxies (
					scheme text,
					address inet,
					port smallint,
					today_checks smallint,
					speed real[],
					uptime real[],
					created_at timestamp,
					updated_at timestamp,
					primary key(scheme, address, port)
				)`
			)

		default:
			throw `Table name ${tableName} is not recognised.`
	}
}

export async function testDatabaseConnection(): Promise<void> {
	return executeQuery("select * from proxies limit 1")
		.then(() => {})
		.catch((error) => {
			switch (error.code) {
				case "ECONNREFUSED":
					console.error(
						`Couldn't connect to PostgreSQL. Is it running and available under ${error.address}:${error.port}?`
					)
					break

				case "28000":
					console.error(`Couldn't access PostgreSQL. Are the username and password correct?`)
					break

				case "3D000":
					console.error(
						`Couldn't access the PostgreSQL database "${process.env.POSTGRES_DB}". Does it exist?`
					)
					break

				case "42P01":
					console.error(`Table "proxies" not found, attempting to fix...`)
					createTable("proxies").then(() => {
						console.log(`Table "proxies" successfully created.`)
					})
					return

				default:
					console.error(JSON.stringify(error))
			}

			process.exit(1)
		})
}
