import EngineModel from "@/Engine/models/EngineModel";
import CameraModel from "@/Engine/models/ObjectModel/CameraModel";
import PlainEngine from "@/Engine/PlainEngine";
import Model3DModel from "@/Engine/models/ObjectModel/Model3DModel";
import EngineModelFactory from "@/Engine/models/EngineModelFactory";

const models = new EngineModelFactory();
const model = models.create(EngineModel, {
	camera: {gid: 'camera'},
	scene: {
		marker: 'data-nft/pinball',
		children: [
			models.create(CameraModel, {gid: 'camera'}),
			models.create(Model3DModel, {
				files: [{url: 'assets/models/vw/model.dae'}]
			})
		]
	}
})
const engine = new PlainEngine(model);

const container = document.getElementById('engine');
if(!container) throw new Error("No element found with id 'engine'.");
engine.attach(container);

(async () => {
	await engine.loading;
	engine.start();
})()