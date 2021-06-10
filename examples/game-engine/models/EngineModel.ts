import Mozel, {Collection, collection, property, reference, required} from "mozel";
import SceneModel from "@examples/game-engine/models/SceneModel";
import CameraModel from "@examples/game-engine/models/ObjectModel/CameraModel";
import ObjectModel from "@examples/game-engine/models/ObjectModel";

export default class EngineModel extends Mozel {
	static get type() { return 'Engine' };

	@property(SceneModel, {required})
	scene!:SceneModel;

	@property(CameraModel, {reference})
	camera?:CameraModel;

	@collection(ObjectModel, {reference})
	selection!:Collection<ObjectModel>;
}
