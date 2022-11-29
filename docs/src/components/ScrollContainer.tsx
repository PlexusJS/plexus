import React from "react"

export const ScrollContainer = ({ children }) => {
	return <div className="flex overflow-auto flex-1 height-full">{children}</div>
}
