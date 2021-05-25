import {DoubleSide, LinearFilter, Mesh, MeshBasicMaterial, PlaneGeometry, VideoTexture} from "three";
import VideoModel from "@/Engine/models/ObjectModel/VideoModel";
import Log from "@/log";
import ThreeObject from "@/Engine/views/threejs/ThreeObject";
import {createVideo} from "@/Engine/views/common/Video";
import {schema} from "mozel";
import VideoController from "@/Engine/controllers/ViewController/ObjectController/VideoController";

const log = Log.instance("three-video");

export default class ThreeVideo extends ThreeObject {
	static ModelClass = VideoModel;
	model!:VideoModel;

	controller!:VideoController;

	video?: HTMLVideoElement;
	videoTexture?: VideoTexture;
	loaded:boolean = false;
	pendingPlay:boolean = false;

	init(model:VideoModel) {
		super.init(model);

		this.controller = this.requireController(VideoController);
		model.$watch(schema(VideoModel).playing, playing => {
			if(playing) this.play();
			else this.pause();
		});
	}

	play() {
		if (this.video && this.loaded) {
			this.video.play();
		} else {
			this.pendingPlay = true;
		}
	}

	pause() {
		if(!this.video) {
			return;
		}
		this.video.pause();
	}

	onVideoReady() {
		if(!this.video) {
			log.error("onVideoReady was called but there is no video.");
			return;
		}
		this.loaded = true;
		if(this.pendingPlay) {
			this.play();
		}
	}

	async load():Promise<void> {
		const model = this.model;
		return new Promise((resolve, reject) => {
			if (!model.file || !model.file.url) {
				const err = new Error("Video has no video file. Cannot load.");
				log.error(err.message);
				reject(err);
				return;
			}

			const url = model.file.url;
			log.log("Loading video", url);

			this.video = createVideo(model.file.url);

			this.video.addEventListener('loadeddata', () => {
				this.onVideoReady();
				resolve();
			});
			this.video.addEventListener('error', (error) => {
				log.error("Could not load video: " + error);
				reject(new Error("Could not load video: " + error));
			});

			const videoTexture = new VideoTexture(this.video);
			videoTexture.minFilter = LinearFilter;
			videoTexture.magFilter = LinearFilter;
			this.videoTexture = videoTexture;

			// Create geometry
			const geometry = new PlaneGeometry( 2.4, 1, 4, 4);
			const material = new MeshBasicMaterial( { map: videoTexture, side: DoubleSide  } );
			const mesh = new Mesh( geometry, material );
			mesh.rotation.x = -Math.PI / 2;

			this.object3D.add(mesh);
		});
	}
}
