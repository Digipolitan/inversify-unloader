import {AsyncContainerModule, interfaces} from "inversify";
import {UnloaderContainerCallBack} from "./interfaces";

export class AsyncUnloaderContainerModule extends AsyncContainerModule {

    public readonly unload?: UnloaderContainerCallBack;

    constructor(registry: interfaces.AsyncContainerModuleCallBack, unload?: UnloaderContainerCallBack) {
        super(registry);
        this.unload = unload;
    }
}
