import {AsyncUnloaderContainerModule} from "./async-unloader-container.module";
import {UnloaderContainerModule} from "./unloader-container.module";
import {Container, interfaces} from "inversify";
import ServiceIdentifier = interfaces.ServiceIdentifier;
import {UnloadSyntax, UnloadWhenSyntax} from "./interfaces";
import {UnloadAsyncSyntax} from "./interfaces/unload-async-syntax";

export class UnloaderContainer extends Container {

    private unloadableMap: Map<ServiceIdentifier<any>, _UnloadSyntax<any>>;

    public constructor(containerOptions?: interfaces.ContainerOptions) {
        super(containerOptions);
        this.unloadableMap = new Map();
    }

    public load(...modules: UnloaderContainerModule[]): void {
        super.load(...modules);
        modules.forEach((module) => {
            if(module.unload !== undefined) {
                module.unload(this.unloadable.bind(this))
            }
        });
    }

    private getServiceIdentifiersFromModules(modules: UnloaderContainerModule[]): Map<ServiceIdentifier<any>, _UnloadSyntax<any>> {
        const serviceIdentifiers = new Map<ServiceIdentifier<any>, _UnloadSyntax<any>>();
        modules.forEach((module) => {
            if(module.unload !== undefined) {
                module.unload((serviceIdentifier) => {
                    const syntax = new _UnloadSyntax(serviceIdentifier);
                    serviceIdentifiers.set(serviceIdentifier, syntax);
                    return syntax;
                });
            }
        });
        return serviceIdentifiers;
    }

    public unload(...modules: UnloaderContainerModule[]): void {
        const toBeRemoved = this.getServiceIdentifiersFromModules(modules);
        const keys = toBeRemoved.keys();
        let it = keys.next();
        while (!it.done) {
            let unloadSyntax = this.unloadableMap.get(it.value);
            if(unloadSyntax !== undefined) {
                unloadSyntax.execSync(this);
                this.unloadableMap.delete(it.value);
            } else {
                unloadSyntax = toBeRemoved.get(it.value);
                if(unloadSyntax !== undefined) {
                    unloadSyntax.execSync(this);
                }
            }
            it = keys.next();
        }
        super.unload(...modules);
    }

    public async unloadAsync(...modules: UnloaderContainerModule[]): Promise<void> {
        const toBeRemoved = this.getServiceIdentifiersFromModules(modules);
        const keys = toBeRemoved.keys();
        let it = keys.next();
        while (!it.done) {
            let unloadSyntax = this.unloadableMap.get(it.value);
            if(unloadSyntax !== undefined) {
                await unloadSyntax.execAsync(this);
                this.unloadableMap.delete(it.value);
            } else {
                unloadSyntax = toBeRemoved.get(it.value);
                if(unloadSyntax !== undefined) {
                    await unloadSyntax.execAsync(this);
                }
            }
            it = keys.next();
        }
        super.unload(...modules);
    }

    public async loadAsync(...modules: AsyncUnloaderContainerModule[]): Promise<void> {
        await super.loadAsync(...modules);
        modules.forEach((module) => {
            if(module.unload !== undefined) {
                module.unload(this.unloadable.bind(this))
            }
        });
    }

    private unloadable<T>(serviceIdentifier: ServiceIdentifier<T>): _UnloadSyntax<T> {
        const syntax = new _UnloadSyntax(serviceIdentifier);
        this.unloadableMap.set(serviceIdentifier, syntax);
        return syntax;
    }

    public unbind(serviceIdentifier: ServiceIdentifier<any>): void {
        const unloadSyntax = this.unloadableMap.get(serviceIdentifier);
        if(unloadSyntax !== undefined) {
            unloadSyntax.execSync(this);
            this.unloadableMap.delete(serviceIdentifier);
        }
        super.unbind(serviceIdentifier);
    }

    public async unbindAsync(serviceIdentifier: ServiceIdentifier<any>): Promise<void> {
        const unloadSyntax = this.unloadableMap.get(serviceIdentifier);
        if(unloadSyntax !== undefined) {
            await unloadSyntax.execAsync(this);
            this.unloadableMap.delete(serviceIdentifier);
        }
        super.unbind(serviceIdentifier);
    }

    public unbindAll(): void {
        const values = this.unloadableMap.values();
        let it = values.next();
        while (!it.done) {
            it.value.execSync(this);
            it = values.next();
        }
        this.unloadableMap.clear();
        super.unbindAll();
    }

    public async unbindAllAsync(): Promise<void> {
        const values = this.unloadableMap.values();
        let it = values.next();
        while (!it.done) {
            await it.value.execAsync(this);
            it = values.next();
        }
        this.unloadableMap.clear();
        super.unbindAll();
    }
}

class _UnloadSyntax<T> implements UnloadSyntax<T>, UnloadAsyncSyntax<T>, UnloadWhenSyntax<T> {

    public readonly identifier: ServiceIdentifier<T>;
    private task?: () => void | Promise<void>;
    private injectedValueTask?: (value: T) => void | Promise<void>;
    private allInjectedTask?: (value: T[]) => void | Promise<void>;
    private isAsync: boolean = false;
    private name?: string | number | symbol;
    private tagName?: string | number | symbol;
    private tagValue?: any;

    public constructor(identifier: ServiceIdentifier<T>) {
        this.identifier = identifier;
    }

    public usingTask(func: () => void): void {
        this.task = func;
    }

    public usingTaskAsync(func: () => Promise<void>): void {
        this.task = func;
        this.isAsync = true;
    }

    public fromInjectedValue(func: (value: T) => void): UnloadWhenSyntax<T> {
        this.injectedValueTask = func;
        return this;
    }

    public fromInjectedValueAsync(func: (value: T) => Promise<void>): UnloadWhenSyntax<T> {
        this.injectedValueTask = func;
        this.isAsync = true;
        return this;
    }

    public fromAllInjected(func: (values: T[]) => void): void {
        this.allInjectedTask = func;
    }

    public fromAllInjectedAsync(func: (values: T[]) => Promise<void>): void {
        this.allInjectedTask = func;
        this.isAsync = true;
    }

    public exec(container: interfaces.Container): any {
        if(this.task !== undefined) {
            return this.task();
        }
        if(this.injectedValueTask !== undefined) {
            if(this.name !== undefined) {
                return this.injectedValueTask(container.getNamed(this.identifier, this.name));
            } else if(this.tagName !== undefined) {
                return this.injectedValueTask(container.getTagged(this.identifier, this.tagName, this.tagValue));
            }
            return this.injectedValueTask(container.get(this.identifier));
        }
        if(this.allInjectedTask !== undefined) {
            return this.allInjectedTask(container.getAll(this.identifier));
        }
    }

    public execSync(container: interfaces.Container): void {
        if(this.isAsync) {
            this.exec(container).catch(console.error);
        } else {
            this.exec(container);
        }
    }

    public execAsync(container: interfaces.Container): Promise<void> {
        return this.exec(container);
    }

    public whenTargetNamed(name: string | number | symbol): void {
        this.name = name;
    }

    public whenTargetTagged(tag: string | number | symbol, value: any): void {
        this.tagName = tag;
        this.tagValue = value;
    }
}
