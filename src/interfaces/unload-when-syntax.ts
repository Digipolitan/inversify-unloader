export interface UnloadWhenSyntax<T> {
    whenTargetNamed(name: string | number | symbol): void;
    whenTargetTagged(tag: string | number | symbol, value: any): void;
}