import React, { ReactNode } from 'react'
type ListData = {
	key?: string
	type?: string
	optional?: boolean
	description: ReactNode
}
interface Props {
	title: string
	data: ListData[]
	miniTitle?: string
	showingReturnType?: boolean
}
export const CollapseContainer = ({
	title,
	data = [],
	miniTitle,
	showingReturnType = false,
}: Props) => {
	return (
		<>
			{(miniTitle || showingReturnType) && (
				<div className='pt-3 pb-2 flex justify-between'>
					<small>{showingReturnType ? 'Returns' : miniTitle}</small>
				</div>
			)}
			<div className='rounded-t-lg rounded-b-md  overflow-hidden flex flex-col bg-slate-800 mb-5'>
				{title && (
					<div className='rounded-md bg-slate-700 p-4 flex justify-between'>
						<h6>{title}</h6>
					</div>
				)}
				<div className='py-4 px-4'>
					<ul>
						{data.map((item, index) => (
							<li
								key={`c_${index}`}
								className='hover:bg-slate-600 rounded-md px-3 py-2 transition-all duration-200'
							>
								<mark>
									<span className='text-blue-700'>
										{item.key ? item.key : ''}
										{item.optional ? '?' : ''}
									</span>{' '}
									{item.type && `{${item.type.trim()}}:`}
								</mark>{' '}
								{item.description}
							</li>
						))}
					</ul>
				</div>
			</div>
		</>
	)
}

export default CollapseContainer
