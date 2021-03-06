import Mozel, {immediate} from "mozel";
import {isString, get} from 'lodash';
import Property, {PropertyType, PropertyValue} from "mozel/dist/Property";
import {check, Constructor, instanceOf} from "validation-kit";
import EventInterface from "event-interface-mixin";
import {callback} from "event-interface-mixin/dist/EventEmitter";

export class ValueChangeEvent<T> {
	constructor(
		public path:string,
		public isReference:boolean,
		public current?:T,
		public old?:T) {}
}

export class PropertySyncEvents<T> extends EventInterface {
	change = this.$event<ValueChangeEvent<T>>(ValueChangeEvent);
}

/**
 * Watches a Model path for changes, does something based on the new value when it changes and fires
 * an event with the new and old constructs.
 */
export default class PropertySync<P extends PropertyValue,T> {
	protected _current?:T;
	get current() {
		return this.getCurrent(true);
	}
	protected currentSource?:P;
	protected resolvedReference?:P;

	events = new PropertySyncEvents<T>();

	model:Mozel;
	path:string;
	readonly PropertyType:PropertyType;
	readonly SyncType:Constructor<T>;

	watching:boolean = false;
	isReference:boolean;

	constructor(watchModel:Mozel, path:string, PropertyType:PropertyType, SyncType:Constructor<T>) {
		this.model = watchModel;
		this.path = path;
		this.PropertyType = PropertyType;
		this.SyncType = SyncType;

		this.isReference = get(watchModel.static.$schema(), path).$reference;
	}

	getCurrent(resolveReference = true) {
		if(this.isReference && resolveReference && this.currentSource && this.currentSource !== this.resolvedReference) {
			this.resolveReferences();
			if(this.currentSource && !this._current) {
				throw new Error(`Could not resolve reference.`);
			}
		}
		return this._current;
	}

	/**
	 * Checks if a value matches the property type defined in this PropertySync.
	 * @param value
	 */
	isPropertyType(value:unknown):value is P {
		return Property.checkType(value, this.PropertyType);
	}

	/**
	 * Checks if a value matches the type of the required output of the PropertySync.
	 * @param value
	 */
	isSyncType(value:unknown):value is T {
		return value instanceof this.SyncType;
	}

	/**
	 * Start watching for changes and generate output from model with any changes, starting with the current value.
	 */
	startWatching() {
		if(this.watching) {
			return;
		}
		this.watching = true;
		this.model.$watch(this.path,({newValue, oldValue, valuePath}) => {
			this.syncFromModel(newValue, valuePath);
		}, {immediate});
	}

	resolveReferences() {
		if(!this.isReference || !this.currentSource) return;

		return this.syncValue(this.currentSource);
	}

	/**
	 * Uses the current model value at the configured path to generate a synced output.
	 */
	sync() {
		const current = this.model.$path(this.path);
		this.syncFromModel(current, this.path);
	}

	private syncFromModel(value:PropertyValue, changePath:string) {
		const path = changePath.split('.');
		const prop = check<string>(path.pop(), isString, "prop");
		const parent = check<Mozel>(this.model.$path(path), instanceOf(Mozel), "parent");
		const property = parent.$property(prop as any);
		if(!property) throw new Error(`Change path does not match any property on ${this.model.constructor.name}: ${changePath}.`);

		if(value !== undefined && !this.isPropertyType(value)) {
			throw new Error("New property value is not of expected type.");
		}

		this.currentSource = value;
		this.syncValue(value as P);
	}

	protected syncValue(value:P) {
		let output = this.modelToComponent(value);

		const old = this.getCurrent(false);
		this._current = output;

		if(old !== output) {
			this.events.change.fire(new ValueChangeEvent<T>(this.path, this.isReference, output, old));
		}
	}

	/**
	 * Register an intialization callback to be called on every new value.
	 * @param callback
	 */
	init(callback:callback<T|undefined>) {
		this.events.change.on(event => {
			callback(event.current);
		});
		return this;
	}

	/**
	 * Register a deinitialization callback to be called on every value before it gets replaced.
	 * @param callback
	 */
	deinit(callback:callback<T|undefined>) {
		this.events.change.on(event => {
			callback(event.old);
		});
		return this;
	}

	/**
	 * Sets the model value
	 * @param {P|undefined} value
	 */
	set(value:any|undefined) {
		return this.model.$set(this.path, value, true);
	}

	/**
	 * Generates an output based on the given value.
	 * @param value
	 * @protected
	 */
	protected modelToComponent(value:P|undefined):T|undefined {
		throw new Error("Not Implemented");
	}
}
