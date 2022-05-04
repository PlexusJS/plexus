import { type } from "os"
import React from "react"
type ListData = {
	key?: string
	type?: string
	optional?: boolean
	description: string
}
export const CollapseContainer = ({ title = "", data = [] }: { title: string; data: ListData[] }) => {
	return (
		<div className="rounded-t-lg rounded-b-md  overflow-hidden flex flex-col bg-slate-800">
			<div className="rounded-md bg-slate-700 p-4 flex justify-between">
				<h6>{title}</h6>
			</div>
			<div className="py-4 px-4">
				<ul>
					{data.map((item, index) => (
						<li className="hover:bg-slate-600 rounded-md px-3 py-2 transition-all duration-200">
							{`${item.key ? item.key : ""}${item.optional ? "?" : ""}`} {item.type && <mark>{`{${item.type.trim()}}`}</mark>}:{" "}
							{item.description}
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}

export default CollapseContainer
