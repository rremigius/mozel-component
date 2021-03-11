import "reflect-metadata";

import {Container, injectable} from "inversify";
import Controller from "@/Controller";
import Log from "@/log";

const log = Log.instance("Engine/inversify");

/**
 * Default container
 */
let xrControllerContainer = new Container({autoBindInjectable:true});

function bindController(Target:typeof Controller, container:Container) {
	if(!Target.hasOwnProperty('ModelClass') || !Target.ModelClass) {
		log.warn(`${Target.name} has no static ModeClass of its own. Cannot register as injectable Controller.`);
		return;
	}
	container.bind<Controller>(Controller).to(Target).whenTargetNamed(Target.ModelClass.type);
}

/**
 * CLASS decorator factory
 * Registers the class to the default model DI Container, under the class's ModelClass name.
 */
export function injectableController(container?:Container) {
	return function(Target:typeof Controller) {
		if(!container) container = xrControllerContainer;
		injectable()(Target);
		bindController(Target, container);
	};
}

export default xrControllerContainer;