import Controller from "@/Controller";
import {isArray, isFunction, isMatch, clone} from 'lodash';
import EventInterface from "event-interface-mixin";
import Event from "@/Event";

export default class ControllerList<T extends Controller> {
	protected list:T[];

	public readonly events = {
		added: new Event<T>(),
		removed: new Event<T>()
	}

	constructor(controllers?:T[]) {
		this.list = controllers ? clone(controllers) : [];
	}

	add(controller:T) {
		if(this.has(controller)) {
			// already in list, don't add again
			return;
		}
		this.list.push(controller);
		this.events.added.fire(controller);
	}

	has(controller:T) {
		return !!this.list.find(item => item === controller);
	}

	remove(controller:T|T[]|((controller:T)=>boolean)):number {
		if(isArray(controller)) {
			return controller.reduce((sum:number, item:T) => this.remove(item), 0);
		}
		const check = isFunction(controller) ? controller : (item:Controller) => item === controller;
		let count = 0;
		for(let i = this.list.length-1; i >= 0; i--) {
			let item = this.list[i];
			if(check(item)) {
				this.list.splice(i, 1);
				this.events.removed.fire(item);
			}
		}
		return count;
	}

	each(callback:(controller:T)=>void) {
		this.list.forEach(callback);
	}

	find(predicate:((value:T)=>boolean)|Record<string,unknown>) {
		const check = isFunction(predicate)
			? predicate
			: (candidate:T) => isMatch(candidate, predicate);

		for (const controller of this.list.values()) {
			if(check(controller)) {
				return controller;
			}
		}
	}
}