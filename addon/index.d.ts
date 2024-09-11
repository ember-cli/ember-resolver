import { Resolver as ResolverContract } from "@ember/owner";

export default class Resolver {
  static create(props: Record<string, unknown>): InstanceType<this>;
  static withModules(modules: Record<string, unknown>): this;
}
export default interface Resolver extends Required<ResolverContract> {
    pluralizedTypes: Record<string, string>;
}
