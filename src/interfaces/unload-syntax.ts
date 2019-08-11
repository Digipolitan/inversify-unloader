import {UnloadWhenSyntax} from "./unload-when-syntax";

export interface UnloadSyntax<T> {
    usingTask(func: () => void): void;
    fromInjectedValue(func: (value: T) => void): UnloadWhenSyntax<T>;
    fromAllInjected(func: (values: T[]) => void): void;
}