import SceneModel from "@/models/SceneModel";

import Log from "@/log';
import Loading from "@utils/loading";

import SceneController from "@/Controller/SceneController";
import ControllerFactory from "@/Controller/ControllerFactory";
import Err from "@utils/error";
import {Container, inject} from "inversify";
// Make THREE rendering classes available in THREE container
import "./renderers/threejs/all";
import threeContainer from "@/renderers/threejs/inversify";

import {remove} from 'lodash';
import EventBus from "@/EventBus";
import SceneRenderInterface from "@/renderers/common/ObjectRenderInterface/SceneRenderInterface";
import CameraRenderInterface from "@/renderers/common/ObjectRenderInterface/CameraRenderInterface";
import RenderFactory from "@/renderers/RenderFactory";
import RendererInterface from "@/renderers/common/RendererInterface";
import RendererCSS3DInterface from "@/renderers/common/RendererCSS3DInterface";
import ObjectRenderInterface from "@/renderers/common/ObjectRenderInterface";
import LightRenderInterface from "@/renderers/common/ObjectRenderInterface/LightRenderInterface";
import InteractionManagerInterface from "@/renderers/common/InteractionManagerInterface";
import {Event} from "@/Events";
import EventInterface, {EventInterfacer, FireType} from "event-interface-mixin";

const log = Log.instance("Engine");

export type FrameListener = {
	frame:()=>void
};

export default class Engine implements EventInterfacer {
	protected delaySceneStart: boolean = false;

	camera?:CameraRenderInterface<unknown>;
	protected scene?:SceneRenderInterface<unknown>;
	protected renderer?:RendererInterface<unknown>;

	protected css3dRenderer?:RendererInterface<unknown>;
	protected rootObject:ObjectRenderInterface<unknown>;
	protected interactionManager?: InteractionManagerInterface<unknown>;

	protected container: HTMLElement;
	protected xrScene: SceneModel;
	protected eventBus: EventBus;
	private eventInterface = new EventInterface();

	public on = this.eventInterface.getOnMethod();
	public off = this.eventInterface.getOffMethod();

	/**
	 * ControllerFactory to set up the Engine elements. Initialize with default container from Engine/inversify.
	 */
	@inject(ControllerFactory)
	protected xrControllerFactory!:ControllerFactory;

	protected readonly frameListeners:FrameListener[] = [];

	private running:boolean = false;
	private readonly sceneController:SceneController;
	protected readonly renderFactory:RenderFactory;

	private actions:Record<string,(payload?:Event<any>['payload'])=>void> = {};

	readonly loading:Loading = new Loading('Engine');

	private readonly _onResize:()=>void;

	constructor(container:HTMLElement, xrScene:SceneModel){
		this.container = container;
		this.xrScene = xrScene;
		this.eventBus = new EventBus();
		this.renderFactory = this.createRenderFactory();

		this.rootObject = this.createSceneRootObject();

		const diContainer = new Container();

		// Override RenderFactory with the given one
		diContainer.bind<RenderFactory>(RenderFactory).toConstantValue(this.renderFactory);

		this.xrControllerFactory = new ControllerFactory(this, diContainer);

		this.sceneController = this.createSceneController(this.xrScene);
		log.log("Created SceneController", this.sceneController);

		this._onResize = this.onResize.bind(this);
		window.addEventListener('resize', this._onResize);

		this.init(container);
	}

	/**
	 * Initializes the Engine with the given container and sceneGroup.
	 * @param {HTMLElement} container				The container in which to place the rendered content.
	 */
	async init(container:HTMLElement) {
		this.container = container;

		log.info("Initializing Engine");

		this.loading.start('main');
		let {camera, scene, renderer} = await this.initEngine(container);
		this.camera = camera;
		this.scene = scene;
		this.renderer = renderer;
		this.css3dRenderer = this.createCSS3DRenderer(renderer);

		this.attach(container, this.css3dRenderer);

		scene.add(this.rootObject);

		const InteractionManager = this.renderFactory.getConstructor<InteractionManagerInterface<unknown>>("InteractionManagerInterface");
		this.interactionManager = new InteractionManager(camera, scene);

		try {
			await this.sceneController.load();
			this.loading.done("main");
			this.addToSceneRoot(this.sceneController.root);
		} catch(e) {
			log.error("Could not load scene.", e);
			this.loading.error('main', e);
		}
	}

	addToSceneRoot(object:ObjectRenderInterface<unknown>) {
		this.rootObject.add(object);
	}

	createSceneRootObject() {
		const root = this.renderFactory.create<ObjectRenderInterface<unknown>>("ObjectRenderInterface");
		root.setName("Root");
		return root;
	}

	createSceneController(xrScene:SceneModel) {
		try {
			return this.xrControllerFactory.create<SceneController>(SceneController, xrScene, true);
		} catch(err) {
			let originalError = new Err({
				message: err instanceof Err ? "Original cause: " + err.getDeepestError().message : err.message,
				originalError: err
			});
			throw new Err("Could not initialize Engine.", originalError);
		}
	}

	/**
	 * Creates the engine's Camera, Scene and Renderer, and attaches the renderer to the container.
	 * Calls createCamera, createScene and createRenderer. Can be overridden if all three are returned, and the renderer is attached.
	 *
	 * @param {HTMLElement} container				The container to attach the renderer to.
	 * @return {camera:Camera, scene:ObjectInterface, renderer:WebGLRenderer, attached:boolean}
	 */
	async initEngine(container:HTMLElement) {
		let camera = this.createCamera();
		let renderer = this.createRenderer();
		let scene = this.createScene(camera);

		this.attach(container, renderer);

		return {camera, renderer, scene};
	}

	fire(event:string, data?:FireType) {
		this.eventInterface.fire(event, data);
		this.eventBus.fire(event, this, data);
	}

	registerAction<T extends Event<any>>(name:string, callback:(payload?:T['payload'])=>void) {
		this.actions[name] = callback;
	}

	callAction(action:string, payload?:unknown) {
		if(!(action in this.actions)) {
			log.error(`Unknown action '${action}' in Engine.`);
			return;
		}
		log.log(`Action ${action} called.`);
		this.actions[action].call(this, payload);
	}

	/**
	 * Creates a Camera for use in the Engine.
	 */
	createCamera():CameraRenderInterface<unknown> {
		const camera = this.renderFactory.create<CameraRenderInterface<unknown>>("CameraRenderInterface");
		camera.setPosition({z: 5});

		return camera;
	}

	/**
	 * Creates a Renderer for use in the Engine
	 */
	createRenderer():RendererInterface<unknown> {
		return this.renderFactory.get<RendererInterface<unknown>>("RendererInterface");
	}

	/**
	 * Creates a RenderFactory for use in the Engine and Controllers
	 */
	createRenderFactory() {
		return new RenderFactory(threeContainer);
	}

	createCSS3DRenderer(mainRenderer:RendererInterface<unknown>):RendererCSS3DInterface<unknown> {
		const renderer = this.renderFactory.get<RendererCSS3DInterface<unknown>>("RendererCSS3DInterface");
		renderer.setMainRenderer(mainRenderer);
		return renderer;
	}

	/**
	 * Creates a SceneRenderInterface containing the camera and the sceneGroup.
	 * @param {CameraRenderInterface} camera
	 */
	createScene(camera: CameraRenderInterface<unknown>): SceneRenderInterface<unknown> {
		const scene = this.renderFactory.create<SceneRenderInterface<unknown>>("SceneRenderInterface");

		// Add lights
		const light = this.renderFactory.create<LightRenderInterface<unknown>>("LightRenderInterface");
		scene.add(light);

		// Add camera
		scene.add(camera);

		return scene;
	}

	/**
	 * Attaches the renderers to the container.
	 * @param {HTMLElement} container
	 * @param {RendererInterface} [renderer]								A specific renderer to attach.
	 */
	attach(container:HTMLElement, renderer:RendererInterface<unknown>) {
		this.container = container;

		if(renderer) {
			container.appendChild(renderer.getDOMElement());
		} else {
			if(!this.renderer || !this.css3dRenderer) {
				log.error("Cannot attach renderers. Not initialized.");
				return false;
			}
			container.appendChild(this.css3dRenderer.getDOMElement());
			container.appendChild(this.renderer.getDOMElement() );
		}
	}

	/**
	 * Detaches the (given) renderer from the given container.
	 * @param {WebGLRenderer} [renderer]
	 */
	detach(renderer?: RendererInterface<unknown>) {
		renderer = renderer || this.renderer;
		if(!renderer) return;

		this.container.removeChild(renderer.getDOMElement());
	}

	addFrameListener(frameListener:FrameListener) {
		log.log("Registering frame listener", frameListener);
		this.frameListeners.push(frameListener);
	}
	removeFrameListener(frameListener:FrameListener) {
		log.log("Removing frame listener", frameListener);
		remove(this.frameListeners, (item:FrameListener) => item === frameListener);
	}

	/**
	 * Updates the state of the Scene. Called every animation frame. Override for control over the update loop.
	 * Calls all frame listeners to do their thing
	 */
	frame() {
		this.frameListeners.forEach((listener:FrameListener) => {
			listener.frame();
		});
	}

	/**
	 * Start the Engine and the Scene in it.
	 */
	start() {
		this.onResize();
		this.running = true;
		this.animate();
		if(!this.delaySceneStart) {
			this.startScene();
		}
	}

	/**
	 * Start the Scene.
	 */
	startScene() {
		log.info("Starting Scene.");
		this.sceneController.start();
	}

	enableScene() {
		log.info("Enabling Scene.");
		this.sceneController.enable(true);
	}

	disableScene() {
		log.info("Disabling Scene.");
		this.sceneController.enable(false);
	}

	/**
	 * Stop tracking and rendering.
	 */
	stop() {
		this.running = false;
		this.sceneController.destroy();
	}

	render() {
		if(!this.camera || !this.scene) return;
		if(this.renderer) {
			this.renderer.render(this.scene, this.camera);
		}
		if(this.css3dRenderer) {
			this.css3dRenderer.render(this.scene, this.camera);
		}
	}

	private animate() {
		// run the rendering loop
		this.frame();
		this.render();

		// keep looping
		if(this.running) {
			requestAnimationFrame( this.animate.bind(this) );
		}
	}

	resizeCSS3DRenderer() {
		if(!this.renderer || !this.css3dRenderer) return;

		const size = this.renderer.getSize();
		this.css3dRenderer.setSize(size.width, size.height);

		const source = this.renderer.getDOMElement();
		const target = this.css3dRenderer.getDOMElement();
		target.style.width = source.style.width;
		target.style.height = source.style.height;
		target.style.marginLeft = source.style.marginLeft;
		target.style.marginTop = source.style.marginTop;
	}

	/**
	 * Matches the size and aspect ratio of the renderer and camera with the container.
	 */
	onResize() {
		if(this.renderer && this.container) {
			let height = this.container.clientHeight;
			let width = this.container.clientWidth;

			this.renderer.setSize(width, height);

			if(this.camera) {
				this.camera.setAspectRatio(width / height);
			}

			this.resizeCSS3DRenderer();
		}
	}

	/**
	 * Destroys the engine and frees up memory.
	 */
	destroy() {
		log.info("Destroying Engine");
		window.removeEventListener('resize', this._onResize);

		if (this.interactionManager) {
			this.interactionManager.destroy();
		}

		this.detach();
	}
}