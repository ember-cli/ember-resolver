import { Resolver as ResolverContract } from "@ember/owner";

export default class Resolver {
  static create<T extends typeof Resolver>(this: T, props: Record<string, unknown>): InstanceType<T>;
  static withModules<T extends typeof Resolver>(this: T, modules: Record<string, unknown>): T;
}
export default interface Resolver extends Required<ResolverContract> {
    pluralizedTypes: Record<string, string>;
    addModules(modules: Record<string, unknown>): void;
}


