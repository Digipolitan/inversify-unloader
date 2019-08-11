import {ContainerModule, interfaces} from 'inversify';
import {UnloaderContainerCallBack} from "./interfaces";

export class UnloaderContainerModule extends ContainerModule  {

    public readonly unload?: UnloaderContainerCallBack;

    constructor(registry: interfaces.ContainerModuleCallBack, unload?: UnloaderContainerCallBack) {
        super(registry);
        this.unload = unload;
    }
}