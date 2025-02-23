import { Runware } from "@runware/sdk-js";

class RunwareService {
    // Default model configurations
    static DEFAULT_MODEL = {
        id: "civitai:618692@691639", // FLUX.1 Dev model
        architecture: "flux1d",
        defaultWidth: 1024,
        defaultHeight: 1024,
        defaultSteps: 20,
        defaultScheduler: "DPM++ 2M Karras",
        defaultCFG: 7
    };

    constructor() {
        this.runware = new Runware({
            apiKey: process.env.REACT_APP_RUNWARE_API_KEY,
            shouldReconnect: true,
            globalMaxRetries: 2,
            timeoutDuration: 60000
        });
    }

    async generateImage(params) {
        try {
            await this.runware.ensureConnection();

            const requestParams = {
                taskType: "imageInference",
                taskUUID: crypto.randomUUID(),
                positivePrompt: params.prompt,
                negativePrompt: params.negative_prompt || "",
                width: params.width || RunwareService.DEFAULT_MODEL.defaultWidth,
                height: params.height || RunwareService.DEFAULT_MODEL.defaultHeight,
                model: RunwareService.DEFAULT_MODEL.id,
                numberResults: 1,
                outputFormat: "WEBP",
                outputQuality: 95,
                steps: params.num_inference_steps || RunwareService.DEFAULT_MODEL.defaultSteps,
                CFGScale: params.guidance_scale || RunwareService.DEFAULT_MODEL.defaultCFG,
                scheduler: RunwareService.DEFAULT_MODEL.defaultScheduler,
                checkNSFW: true,
                includeCost: true,
                clipSkip: 2, // Matches your current CLIP_stop_at_last_layers setting
                onPartialImages: params.onProgress
            };

            // Handle image-to-image
            if (params.init_image) {
                requestParams.seedImage = params.init_image;
                requestParams.strength = params.strength || 0.75;
            }

            // Handle LoRAs
            if (params.loras && Object.keys(params.loras).length > 0) {
                requestParams.lora = Object.entries(params.loras).map(([model, weight]) => ({
                    model,
                    weight: parseFloat(weight)
                }));
            }

            // Add ControlNet if needed
            if (params.controlNet) {
                requestParams.controlNet = [{
                    model: "runware:20@1", // SDXL Canny ControlNet
                    guideImage: params.controlNet.guideImage,
                    weight: params.controlNet.weight || 1,
                    startStepPercentage: 0.15,
                    endStepPercentage: 0.85
                }];
            }

            // Add IP-Adapter if needed
            if (params.referenceImage) {
                requestParams.ipAdapters = [{
                    model: "runware:55@2", // IP-Adapter SDXL Plus
                    guideImage: params.referenceImage,
                    weight: params.ipAdapterWeight || 0.8
                }];
            }

            const images = await this.runware.requestImages(requestParams);

            if (!images || !images.length) {
                throw new Error('No image generated');
            }

            return {
                imageUrl: images[0].imageURL,
                imageUUID: images[0].imageUUID,
                nsfw: images[0].NSFWContent,
                cost: images[0].cost
            };

        } catch (error) {
            console.error("Runware generation error:", error);
            throw error;
        }
    }

    async upscaleImage(params) {
        try {
            const response = await this.runware.upscaleGan({
                inputImage: params.image,
                upscaleFactor: 4,
                outputFormat: "WEBP",
                outputQuality: 95,
                includeCost: true
            });

            return {
                imageUrl: response.imageURL,
                imageUUID: response.imageUUID,
                cost: response.cost
            };
        } catch (error) {
            console.error("Runware upscale error:", error);
            throw error;
        }
    }

    async searchModels(params = {}) {
        try {
            const searchParams = {
                taskType: "modelSearch",
                taskUUID: crypto.randomUUID(),
                search: params.search || "",
                category: params.category || "checkpoint",
                architecture: params.architecture || "flux1d",
                limit: params.limit || 20,
                offset: params.offset || 0
            };

            const response = await this.runware.modelSearch(searchParams);
            return response.results;
        } catch (error) {
            console.error("Model search error:", error);
            throw error;
        }
    }

    async enhancePrompt(prompt) {
        try {
            const response = await this.runware.enhancePrompt({
                prompt,
                promptMaxLength: 380,
                promptVersions: 3,
                includeCost: true
            });

            return response;
        } catch (error) {
            console.error("Prompt enhancement error:", error);
            throw error;
        }
    }

    async controlNetPreProcess(params) {
        try {
            const response = await this.runware.controlNetPreProcess({
                inputImage: params.image,
                preProcessorType: params.type || "canny",
                width: params.width || RunwareService.DEFAULT_MODEL.defaultWidth,
                height: params.height || RunwareService.DEFAULT_MODEL.defaultHeight,
                outputFormat: "WEBP",
                lowThresholdCanny: 100,
                highThresholdCanny: 200
            });

            return {
                guideImageUrl: response.guideImageURL,
                guideImageUUID: response.guideImageUUID,
                cost: response.cost
            };
        } catch (error) {
            console.error("ControlNet preprocessing error:", error);
            throw error;
        }
    }

    async removeBackground(params) {
        try {
            const response = await this.runware.removeImageBackground({
                inputImage: params.image,
                outputFormat: "WEBP",
                outputQuality: 95,
                postProcessMask: true
            });

            return {
                imageUrl: response.imageURL,
                imageUUID: response.imageUUID,
                cost: response.cost
            };
        } catch (error) {
            console.error("Background removal error:", error);
            throw error;
        }
    }
}

export const runwareService = new RunwareService();