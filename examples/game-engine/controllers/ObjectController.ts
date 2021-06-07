import {components} from "@/Component";
import ObjectModel from "@examples/game-engine/models/ObjectModel";
import TriggerController from "@examples/game-engine/controllers/TriggerController";
import BehaviourController from "@examples/game-engine/controllers/BehaviourController";
import ComponentList from "@/Component/ComponentList";
import {schema} from "mozel";
import ViewController, {DeselectEvent, SelectEvent, ViewClickEvent} from "@/Controller/ViewController";
import Vector3Model from "@examples/game-engine/models/Vector3Model";
import Vector3 from "@examples/game-engine/views/common/Vector3";
import Log from "@/log";

const log = Log.instance("object-controller");

export default class ObjectController extends ViewController {
	static Model = ObjectModel;
	model!:ObjectModel;

	@components(schema(ObjectController.Model).behaviours, BehaviourController)
	behaviours!:ComponentList<BehaviourController>;

	@components(schema(ObjectController.Model).triggers, TriggerController)
	triggers!:ComponentList<TriggerController>;

	onInit() {
		super.onInit();

		this.triggers.events.add.on(event => event.component.setDefaultController(this));
		this.triggers.events.remove.on(event => event.component.setDefaultController(undefined));

		this.watch(schema(ObjectController.Model).selected, selected => {
			selected ? this.onSelected() : this.onDeselected();
		});
	}

	setPosition(position:Vector3) {
		this.model.position = this.model.$create(Vector3Model, position);
	}

	select(state:boolean = true) {
		this.model.selected = state;
	}

	onClick(event: ViewClickEvent) {
		super.onClick(event);
		if(this.selectable) {
			this.select();
		}
	}

	onSelected() {
		log.info(`${this} selected.`);
		this.events.select.fire(new SelectEvent(this));
		this.eventBus.$fire(new SelectEvent(this));
	}
	onDeselected() {
		log.info(`${this} deselected.`);
		this.events.deselect.fire(new DeselectEvent(this));
		this.eventBus.$fire(new DeselectEvent(this));
	}
}
