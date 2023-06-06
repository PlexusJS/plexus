export interface PackageJson {
	name: string
	version: string
	description?: string
	keywords?: string[]
	homepage?: string
	bugs?: {
		url: string
		email?: string
	}
	license?: string
	author?:
		| string
		| {
				name: string
				email?: string
				url?: string
		  }
	contributors?:
		| string[]
		| {
				name: string
				email?: string
				url?: string
		  }[]
	files?: string[]
	main?: string
	browser?: string
	types?: string
	module?: string
	exports?: {
		[key: string]:
			| string
			| {
					[key: string]: string
			  }
	}
	scripts?: {
		[key: string]: string
	}
	dependencies?: {
		[key: string]: string
	}
	devDependencies?: {
		[key: string]: string
	}
	peerDependencies?: {
		[key: string]: string
	}
	peerDependenciesMeta?: {
		[key: string]: {
			optional?: boolean
		}
	}
	optionalDependencies?: {
		[key: string]: string
	}
	engines?: {
		node?: string
		npm?: string
	}
	os?: string[]
	cpu?: string[]
	private?: boolean
	publishConfig?: {
		access?: 'public' | 'restricted'
		registry?: string
		tag?: string
	}
}
