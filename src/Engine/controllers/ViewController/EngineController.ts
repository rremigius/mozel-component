import EngineModel from "@/Engine/models/EngineModel";
import Controller, {controller, ControllerActions, ControllerEvents} from "@/Controller";
import {schema} from "mozel";
import SceneController from "@/Engine/controllers/ViewController/SceneController";
import ControllerSlot from "@/Controller/ControllerSlot";
import ControllerModel from "@/ControllerModel";
import CameraController from "@/Engine/controllers/ViewController/ObjectController/CameraController";
import Log from "@/log";
import ViewController from "@/Controller/ViewController";
import {IViewRootSymbol} from "@/IViewRoot";

const log = Log.instance("controller/engine");

export class MarkerDetectedEvent {
	constructor(public id:string, public first:boolean) {}
}
export class FrameEvent {
	constructor(public timestamp:number) {}
}

export class EngineEvents extends ControllerEvents {
	markerDetected = this.$event(MarkerDetectedEvent);
	frame = this.$event(FrameEvent);
}

export class EnginePauseAction {
	constructor() {}
}

export class EngineActions extends ControllerActions {
	pause = this.$action(EnginePauseAction);
}

/**
 * The Engine itself should not be an active part of its own rendering hierarchy, but we can add an EngineController that allows
 * other Controllers to contact the Engine.
 */
export default class EngineController extends Controller {
	static ModelClass = EngineModel;
	model!:EngineModel;

	events:EngineEvents = new EngineEvents();
	actions:EngineActions = new EngineActions();
	log = log;

	@controller(schema(EngineModel).scene, SceneController)
	scene!:ControllerSlot<SceneController>;

	@controller(schema(EngineModel).camera, CameraController)
	camera!:ControllerSlot<CameraController>;

	init(model: ControllerModel) {
		super.init(model);

		// All children should be able to access this EngineController
		this.dependencies.bind<EngineController>(EngineController).toConstantValue(this);
	}
}
