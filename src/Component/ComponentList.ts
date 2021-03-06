import Component, {ComponentConstructor} from "../Component";
import {isArray, isFunction, isMatch} from 'lodash';
import PropertySync, {PropertySyncEvents} from "../PropertySync";
import {check, Constructor, instanceOf} from "validation-kit";
import ComponentFactory from "../Component/ComponentFactory";
import Mozel, {Collection} from "mozel";
import {CollectionItemAddedEvent, CollectionItemRemovedEvent} from "mozel/dist/Collection";
import {EventEmitter} from "event-interface-mixin";
import Log from "../log";

const log = Log.instance("component-list");

export class ComponentAddedEvent<T extends Component> {
	constructor(public component: T) {}
}
export class ComponentRemovedEvent<T extends Component> {
	constructor(public component: T) {}
}

class ComponentListEvents<C extends Component> extends PropertySyncEvents<C[]> {
	// Using $register for generic type definition on EventEmitter
	add = this.$register(new EventEmitter<ComponentAddedEvent<C>>(ComponentAddedEvent), ComponentAddedEvent.name);
	remove = this.$register(new EventEmitter<ComponentRemovedEvent<C>>(ComponentRemovedEvent), ComponentRemovedEvent.name);
}
type ComponentModel<C extends Component> = C['model'];

export default class ComponentList<C extends Component> extends PropertySync<Collection<ComponentModel<C>>, C[]>{
	ComponentModelClass:Constructor<ComponentModel<C>>;
	ComponentClass:ComponentConstructor<C>;
	factory:ComponentFactory;
	currentCollection?:Collection<ComponentModel<C>>;
	parent:Component;

	get current():C[]{
		return super.current || [] as C[];
	}

	private addedListener = (event:CollectionItemAddedEvent<unknown>) => {
		const model = check<ComponentModel<C>>(event.item, instanceOf(this.ComponentModelClass), this.ComponentModelClass.name, 'model');
		const component = this.factory.resolve<C>(model, this.ComponentClass, !this.isReference);

		if(component && !this.has(component)) {
			this.add(component);
		}
	}
	private removedListener = (event:CollectionItemRemovedEvent<unknown>) => {
		const model = check<ComponentModel<C>>(event.item, instanceOf(this.ComponentModelClass), this.ComponentModelClass.name, 'model');
		const component = this.factory.registry.byGid(model.gid);
		if(component instanceof this.ComponentClass) {
			this.remove(component);
		}
	}

	readonly events = new ComponentListEvents<C>();

	constructor(parent:Component, watchModel:Mozel, path:string, PropertyType:Constructor<ComponentModel<C>>, SyncType:ComponentConstructor<C>, factory:ComponentFactory) {
		super(watchModel, path, Collection, SyncType as any); // TS: we override isSyncType
		this.ComponentModelClass = PropertyType;
		this.ComponentClass = SyncType;
		this.factory = factory;
		this.parent = parent;
	}

	/**
	 * Determines whether all items in the generated list match the required output type.
	 * @param value
	 */
	isSyncType(value: unknown): value is C[] {
		return isArray(value) && !value.find(item => !(item instanceof this.SyncType));
	}

	/**
	 * Generates output values based on the Collection values
	 * @param {Collection} collection
	 * @protected
	 */
	protected modelToComponent(collection?:Collection<ComponentModel<C>>) {
		this.clear();

		// Remove listeners from current collection
		if(this.currentCollection) {
			this.currentCollection.events.added.off(this.addedListener);
			this.currentCollection.events.removed.off(this.removedListener);
		}
		this.currentCollection = collection;
		if(!collection) return []; // because of this, `current` is always defined

		// Add listeners to new collection
		collection.events.added.on(this.addedListener);
		collection.events.removed.on(this.removedListener);

		// Resolve components for each of the models
		const components:C[] = [];
		collection.map((model:ComponentModel<C>) => {
			const component = this.factory.resolve<C>(model, this.ComponentClass, !this.isReference);
			if(component) {
				if(!(component instanceof this.ComponentClass)) {
					log.error(`Could not resolve component for ${model.static.type} (${model.gid})`);
				} else {
					components.push(component as C);
				}
			} else if(!this.isReference) {
				log.error(`Could not resolve component for ${model.static.type} (${model.gid})`);
			}
		});
		if(this.isReference) {
			if(components.length !== collection.length) {
				// Not all components could be resolved, perhaps later
				this.resolvedReference = undefined;
				return [];
			}
			this.resolvedReference = this.currentSource; // will prevent future reference resolving
		}

		// Add one by one to trigger events on ComponentList
		components.forEach(component => this.add(component));

		return components;
	}

	/**
	 * Removes all Components from the ComponentList, firing the `remove` event for each.
	 */
	clear() {
		this.resolvedReference = undefined;
		if(!this._current) return;
		for(let i = this._current.length-1; i >= 0; i--) {
			const item = this._current[i];
			if(!this.isReference) item.setParent(undefined);
			this._current.splice(i, 1);
			this.events.remove.fire(new ComponentRemovedEvent(item));
		}
	}

	/**
	 * Add a Component to the ComponentList.
	 * @param {Component} component
	 */
	add(component:C) {
		if(this.has(component)) {
			// already in list, don't add again
			return;
		}
		if(!this.isReference) component.setParent(this.parent);
		this.current.push(component);
		this.events.add.fire(new ComponentAddedEvent(component));
	}

	/**
	 * Checks if the given Component is included in the current list.
	 * @param {Component} component
	 */
	has(component:C) {
		return !!this.current.find(item => item === component);
	}

	/**
	 * Get the Component at the given index.
	 * @param {number} index
	 */
	get(index:number) {
		return this.current[index];
	}

	/**
	 * Removes the given component (if a single Component is provided) or all Components matched by the given callback.
	 * @param {Component|Function} component
	 */
	remove(component:C|C[]|((component:C)=>boolean)):number {
		if(isArray(component)) {
			return component.reduce((sum:number, item:C) => this.remove(item), 0);
		}
		const check = isFunction(component) ? component : (item:Component) => item === component;
		let count = 0;
		for(let i = this.current.length-1; i >= 0; i--) {
			let item = this.current[i];
			if(check(item)) {
				if(!this.isReference) item.setParent(undefined);
				this.current.splice(i, 1);
				this.events.remove.fire(new ComponentRemovedEvent(item));
			}
		}
		return count;
	}

	/**
	 * Calls the given function for each of the Components in the list.
	 * @param {Function} callback
	 */
	each(callback:(component:C, index:number)=>void) {
		this.current.forEach(callback);
	}

	/**
	 * Calls the given function for each of the Components in the list and returns an array of the results.
	 * @param {Function} callback
	 */
	map<T>(callback:(component:C, index:number)=>T):T[] {
		return this.current.map(callback);
	}

	/**
	 * Returns a list of the Components that are matches by the given callback.
	 * @param {Function} callback
	 */
	filter(callback:(component:C, index:number)=>boolean):C[] {
		return this.current.filter(callback);
	}

	/**
	 * Find the first Component matching the given predicate.
	 * @param {Function|object} predicate	If a function is provided, will use the function return value to determine
	 * 										whether a Component is a match.
	 * 										If an object is provided, will check if all keys of the object are equal to
	 * 										the same keys of the Component.
	 */
	find(predicate:((value:C, index:number)=>boolean)|Record<string,unknown>) {
		const check = isFunction(predicate)
			? predicate
			: (candidate:C) => isMatch(candidate, predicate);

		let i = 0;
		for (const component of this.current.values()) {
			if(check(component, i++)) {
				return component;
			}
		}
	}

	/**
	 * Counts the Components in the list.
	 */
	count() {
		return this.current.length;
	}

	/**
	 * Destroys all components in the list, and clears it.
	 */
	destroy() {
		this.current.forEach(component => component.destroy());
		this.clear();
	}
}
