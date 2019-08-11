import {UnloadSyntax} from "./unload-syntax";
import {interfaces} from "inversify";
import ServiceIdentifier = interfaces.ServiceIdentifier;
import {UnloadAsyncSyntax} from "./unload-async-syntax";

export * from './unload-syntax';
export * from './unload-when-syntax';

type Unload = <T>(serviceIdentifier: ServiceIdentifier<T>) => UnloadSyntax<T> & UnloadAsyncSyntax<T>;

export type UnloaderContainerCallBack = (unload: Unload) => void;