/**
 * 	type User = {
 * 		id: string
 * 	}
 * 	type Departments = {
 * 		id: string
 * 		name: string
 * 		principalId: string
 * 	}
 * 	type Data = {
 * 		deps: Departments[]
 * 		users: User[]
 * 	}
 * 	const myCollection = collection<Data>({
 * 		relations: {
 * 			deps: {
 * 				primaryKey: 'id',
 * 				foreignKeys: { // define `transform functions` for when you access a relation. can return the actual object, or the same id
 * 					principalId: (relations) => relations.user // this new `relations` (1st fn arg) is a formatted version of the current relations config
 * 				}
 * 			},
 * 			users: {
 * 				primaryKey: 'id'
 *
 * 			}
 * 		}
 *
 * 	})
 *
 * 	myCollection.getData(12).relations.departments. 0
 */

// type User = {
// 	id: string
// 	appointmentId: string
// }
// type Appointment = {
// 	id: string
// 	name: string
// 	date: number
// 	userId: string
// }

// const appointments = collection<Appointment>({
// 	primaryKey: "id",
// 	foreignKeys: {
// 		// if the key id a string|number, we look for the one item within the reference. if it is in array, we look for many items within the reference
// 		userId: {
// 			newKey: "user",
// 			reference: () => users, // looks for the id(s) here
// 		},
// 	},
// })
// const users = collection<User>({
// 	primaryKey: "id",
// 	foreignKeys: {
// 		// if the key id a string|number, we look for the one item within the reference. if it is in array, we look for many items within the reference
// 		appointmentId: {
// 			newKey: "appointment",
// 			reference: () => appointments, // looks for the id(s) here
// 		},
// 	},
// })

// users.getData("<USER_ID>").foreign.appointment.date // this returns the date of the appointment? I guess we would need a way to rename things for this exact syntax to work

// users.getData("<USER_ID>").value.appointment // return the object from the appointment collection
/**
 * returns {
	id: string
	name: string
	date: number
	userId: string
}
 */
