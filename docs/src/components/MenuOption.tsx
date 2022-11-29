import React, { ReactNode } from "react"

interface Props {
	children: ReactNode
	left: ReactNode
	right: ReactNode
	href?: string
	linkText?: string
}
const MenuOption = ({ left, right, href = "#", linkText = "" }: Props) => {
	return (
		<div className="flex gap-9 w-full">
			<div className="flex-1 items-start">{left}</div>
			<a className="" href={href}>
				<button>{linkText}</button>
			</a>
		</div>
	)
}

export default MenuOption
