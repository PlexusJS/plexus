import {EventEmitter} from "./helpers";
import { PlexusInstance } from "./interfaces";

export function _runtime(instance: () => PlexusInstance){
	const _internalStore = {
		_conductor: new EventEmitter()
	}
}