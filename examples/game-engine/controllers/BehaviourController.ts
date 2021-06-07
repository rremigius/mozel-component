import Component, {components} from "@/Component";
import BehaviourModel from "@examples/game-engine/models/BehaviourModel";
import TriggerController from "@examples/game-engine/controllers/TriggerController";
import ComponentList from "@/Component/ComponentList";
import {schema} from "mozel";

export default class BehaviourController extends Component {
	static Model = BehaviourModel;
	model!:BehaviourModel;

	@components(schema(BehaviourModel).triggers, TriggerController)
	triggers!:ComponentList<TriggerController>;

	onInit() {
		super.onInit();
		this.triggers.events.add.on(event => event.component.setDefaultController(this));
		this.triggers.events.remove.on(event => event.component.setDefaultController(undefined));
	}
}
