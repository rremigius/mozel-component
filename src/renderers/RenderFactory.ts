import {Container, inject, injectable, interfaces, optional} from "inversify";
import Log from "@/log";
import {newableString} from "@/renderers/inversify";
import Newable = interfaces.Newable;
import XRObjectRenderInterface from "@/renderers/common/ObjectRenderInterface";
import XRThreeObject from "@/renderers/threejs/ThreeObject";

const log = Log.instance("RenderFactory");

@injectable()
export default class RenderFactory {

	// If not set in constructor params, will be set in constructor. And readonly, so will always have value.
	readonly diContainer:Container;

	constructor(
		@inject('RenderContainer') @optional() diContainer?:Container,
	) {
		if(!diContainer) {
			this.diContainer = new Container({autoBindInjectable:true});
		} else {
			this.diContainer = diContainer;
		}
	}

	/**
	 * Creates an XRObjectInterface
	 * @param {T} interfaceName
	 * @param {XRThreeObject} [object];
	 */
	create<T extends XRObjectRenderInterface<unknown>>(interfaceName:string):T {
		let container = this.diContainer;
		return container.get<T>(interfaceName);
	}

	get<T>(binding:any):T {
		return this.diContainer.get<T>(binding);
	}

	getConstructor<T>(interfaceName:string):Newable<T> {
		return this.diContainer.get<Newable<T>>(newableString(interfaceName));
	}
}