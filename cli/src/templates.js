export const moduleTemplate = [
  {
    name: 'states',
    ext: 'js',
    type: 'file',
    content: `import { state, collection, computed } from "@plexusjs/core"
		// Create your stateful instances here
		
		`,
  },
  {
    name: 'index',
    ext: 'js',
    type: 'file',
    content: `// Import your module instances
		import * as actions from "./actions"
		import * as states from "./states"
		import * as api from "./api"
		
		// Export your instances as a module
		export const user = { actions, states, api }
		
		export default user
		
		`,
  },
  {
    name: 'api',
    ext: 'js',
    type: 'file',
    content: `import { api } from "@plexusjs/core"
		
		// You can use the api to make requests to the server at a specific endpoint
		// ex.
		/**
		 * export const userBroker = api("https://api.example.com/path").auth("MySeCrEtToKeN", "bearer")
		 */

		`,
  },
  {
    name: 'actions',
    ext: 'js',
    type: 'file',
    content: `import { action } from "@plexusjs/core"
		// Import your module's resources
		import {  } from "./states"
		import {  } from "./api"
		
		// This action is used to message a friend. It takes in a user id and an optional message. We can take that and process
		// ex.
		/**
		 *	export const doAnAction = action(async ({ onCatch }, aProp) => {
		 *		// If any part of this action throws an error, it will be caught here
		 *		onCatch(console.error)
		 *	
		 *		// do things!
		 *	})
		 */
		`,
  },
]
