import {controllers, injectable} from "@/Controller";
import ControllerModel from "@/ControllerModel";
import ObjectController from "@/Engine/controllers/ObjectController";
import SceneModel from "@/Engine/models/SceneModel";
import TriggerController from "./TriggerController";
import ControllerList from "@/Controller/ControllerList";
import {schema} from "mozel";
import ViewController from "@/Controller/ViewController";
import ISceneView, {ISceneViewSymbol} from "@/Engine/views/common/ISceneView";

@injectable()
export default class SceneController extends ViewController {
	static ModelClass = SceneModel;
	model!:SceneModel;
	viewInterface = ISceneViewSymbol;
	get view() { return super.view as ISceneView };

	@controllers(schema(SceneModel).objects, ObjectController)
	objects!:ControllerList<ObjectController>;
	@controllers(schema(SceneModel).triggers, TriggerController)
	triggers!:ControllerList<TriggerController>;

	init(model:ControllerModel) {
		super.init(model);

		this.objects.events.added.on(event => this.onObjectAdded(event.controller));
		this.objects.events.removed.on(event => this.onObjectRemoved(event.controller));

		this.triggers.events.added.on(event => event.controller.setDefaultController(this));
		this.triggers.events.removed.on(event => event.controller.setDefaultController(undefined));
	}

	onObjectAdded(objectController:ObjectController) {
		this.root.add(objectController.root);
	}

	onObjectRemoved(objectController:ObjectController) {
		this.root.remove(objectController.root);
	}
}
