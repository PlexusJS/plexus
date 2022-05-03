import React from "react"
export const Badges = () => {
	return (
		<div className="flex gap-2">
			<a href="https://npm.im/@plexusjs/core">
				<img src="https://img.shields.io/npm/dw/@plexusjs/core?style=flat" alt="npm monthly downloads" />
			</a>
			<a href="https://npm.im/@plexusjs/core">
				<img src="https://img.shields.io/npm/dt/@plexusjs/core?style=flat" alt="npm total downloads" />
			</a>

			<img src="https://img.shields.io/bundlephobia/min/@plexusjs/core?style=flat" alt="bundle size" />

			<img src="https://img.shields.io/npm/l/@plexusjs/core?style=flat" alt="License" />
			<img src="https://img.shields.io/npm/v/@plexusjs/core?style=flat" alt="License" />

			<a href="https://discord.gg/kWJ2kVnykH" target="_blank">
				<img src="https://discordapp.com/api/guilds/941858479793123358/embed.png" alt="Join the Plexus Discord" />
			</a>
			<a href="https://twitter.com/plexusjs" target="_blank">
				<img
					src="https://img.shields.io/twitter/follow/plexusjs?color=%09%231DA1F2&logo=Twitter&logoColor=%09%231DA1F2&style=flat"
					alt="Follow Plexus on Twitter"
				/>
			</a>
		</div>
	)
}
