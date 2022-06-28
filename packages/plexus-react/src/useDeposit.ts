import { useEffect, useMemo, useState } from "react"
type DepositControls<T = any> = {
	/**
	 * Edit the value of a key
	 * @param key The key to edit
	 * @param value The value to set
	 */
	edit: (k: keyof T, v: T[keyof T]) => void
	/**
	 * Save the current value in the deposit and call the *onSave* callback
	 */
	save: () => Promise<void>
	/**
	 * Reset the deposit to its initial/original value
	 */
	reset: () => void
	/**
	 * Discard the current edit and call the *onDiscard* callback
	 */
	discard: () => void
	/**
	 * The original value of the deposit
	 */
	original: T
	/**
	 * The current value of the deposit
	 */
	value: T
	/**
	 * The changes made to the deposit (Excludes any unchanged values)
	 */
	changes: Partial<T>
	/**
	 * Are there changes made to the deposit that have not been saved?
	 * @returns{boolean} true if there are changes, false if there are no changes
	 */
	pendingChanges: boolean
	/**
	 * Is there a save in progress? (useful for async saves)
	 * @returns{boolean} true if there is a save in progress, false if there is no save in progress
	 * @example
	 * ```tsx
	 * 	export default function MyComponent(){
	 * 		const { saving, save } = useDeposit({name: 'joe'}, {
	 * 			onSave: async (appliedChanges) => {
	 * 				await new Promise((resolve) => setTimeout(resolve, 1000))
	 * 				console.log("Saved!")
	 * 			}
	 * 		})
	 * 		return <div>
	 * 			<button disabled={saving} onClick={save}>Save</button>
	 * 			<div>{saving ? "Saving..." : "Save"}</div>
	 * 		</div>
	 * 		})
	 * }
	 * ```
	 */
	saving: boolean
}

/**
 * A hook that accepts an original object, then allows you to edit it and run a save callback.
 * @param original - the original value to edit
 * @param settings - The settings of this deposit
 * @param settings.onSave{Function} - A callback function that will be called when the save function is called. NOTE: Must return a boolean indicating whether the save action was successful. NOTE: The param of this function ONLY returns the CHANGES to the original object. Any unchanged properties/values will not be included.
 * @param settings.onEdit{Function} - A callback function that will be called when the edit function is called.
 * @param settings.Discard{Function} - A callback function that will be called when the discard function is called.
 * @param settings.autoSave{number} - The number of milliseconds to wait before saving.
 * @returns
 */
export function useDeposit<T = any>(
	original: T,
	settings: {
		onSave: (updates: Partial<T>) => (boolean | void) | Promise<boolean | void>
		onEdit?: (key: keyof T, value: T[keyof T]) => any | Promise<any>
		onDiscard?: () => void | Promise<void>
		autoSave?: number
	}
): DepositControls<T> {
	// The current value of the deposit
	const [value, setValue] = useState<T>({ ...original })
	// snapshot of the last saved value
	const [snapshot, setSnapshot] = useState<string>("")
	const [pendingChanges, setPC] = useState(false)
	const [saving, setSaving] = useState(false)
	// the changes made to the deposit (Excludes any unchanged values)
	const [changes, setChanges] = useState<Partial<T>>({})
	const [to, setTo] = useState<number | undefined>()

	useEffect(() => {
		const snapNow = JSON.stringify(original)
		const sameText = snapshot === snapNow
		const sameLength = snapNow?.length === snapshot?.length
		const diff = !sameLength && !sameText

		if (diff) {
			setSnapshot(snapNow)
			setValue(original)
		}
	}, [original])

	useEffect(() => {
		const snapNow = JSON.stringify(value)
		const sameText = snapshot === snapNow
		const sameLength = snapNow?.length === snapshot?.length
		setPC(!sameLength && !sameText)
	}, [value, snapshot, changes])

	const edit = (key: keyof T, v: any) => {
		if (settings.autoSave || to) {
			to && clearTimeout(to)
			setTo(undefined)
		}
		setValue((value) => {
			value[key] = v
			try {
				const original = JSON.parse(snapshot)
				const newChanges = { ...changes }
				for (const key in value) {
					if (original[key] !== value[key]) newChanges[key] = value[key]
				}
				setChanges(newChanges)
				if (settings.autoSave) setTo(setTimeout(() => save(newChanges), settings.autoSave) as unknown as number)
			} catch (error) {}
			return value
		})
	}

	useEffect(() => {
		try {
			const orig = JSON.parse(snapshot)
			const newChanges = { ...changes }
			for (const key in value) {
				if (orig[key] !== value[key]) newChanges[key] = value[key]
			}
			setChanges(newChanges)
		} catch (e) {}
	}, [value, snapshot])

	const save = async (withChanges: Partial<T> = {}) => {
		setTo((oto) => {
			clearTimeout(oto)
			return undefined
		})
		setSaving(true)
		const cs = { ...changes, ...withChanges }
		let r = true
		try {
			const result = await settings.onSave(cs)
			r = result === true || result === undefined ? true : false
		} catch (e) {
			r = false
		}
		if (r) {
			setSnapshot(JSON.stringify(cs))
			setChanges({})
		}
		setSaving(false)
	}

	const discard = async () => {
		setTo((oto) => {
			clearTimeout(oto)
			return undefined
		})
		setValue(JSON.parse(snapshot))
		setChanges({})
		await settings.onDiscard?.()
	}

	const reset = async () => {
		const orig = JSON.parse(snapshot)
		setValue(orig)
	}

	const _original = useMemo<T>(() => {
		try {
			return JSON.parse(snapshot)
		} catch (e) {
			return undefined
		}
	}, [snapshot])

	return {
		edit,
		save: async () => await save(),
		reset,
		discard,
		changes,
		original: _original,
		value,
		pendingChanges,
		saving,
	}
}
export default useDeposit
