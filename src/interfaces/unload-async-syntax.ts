import {UnloadWhenSyntax} from "./index";

export interface UnloadAsyncSyntax<T> {
    usingTaskAsync(func: () => Promise<void>): void;
    fromInjectedValueAsync(func: (value: T) => Promise<void>): UnloadWhenSyntax<T>;
    fromAllInjectedAsync(func: (values: T[]) => Promise<void>): void;
}